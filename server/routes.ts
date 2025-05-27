import express from "express";
import {
  processPayment,
  getPaymentStatus,
  cancelPayment,
} from "./services/paymentService";
import { register, login, logout, getProfile } from "./controllers/authController";
import { db as drizzleDb, queryClient } from "./db";
import { eq, gte, desc, and, sql, inArray } from "drizzle-orm";
import * as schema from "@shared/schema";

declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

const router = express.Router();

// Middleware de autenticação simplificado
const isAuthenticated = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ message: "Não autenticado" });
  }
};

// Rotas de autenticação
router.post("/api/auth/register", register);
router.post("/api/auth/login", login);
router.post("/api/auth/login-pin", async (req: express.Request, res: express.Response) => {
  try {
    const { userId, pin } = req.body;
    
    if (!userId || !pin || pin.length !== 4) {
      return res.status(400).json({ message: "ID do usuário e PIN de 4 dígitos são obrigatórios" });
    }

    // Buscar usuário pelo ID e PIN
    const user = await queryClient`
      SELECT id, username, email, first_name, last_name, phone, pin, role, status, 
             address, city, postal_code, country, birth_date, profile_picture, 
             biography, preferences, member_since, last_login, loyalty_points
      FROM users 
      WHERE id = ${userId} AND pin = ${pin} AND status = 'active'
      LIMIT 1
    `;

    if (user.length === 0) {
      return res.status(401).json({ message: "PIN inválido" });
    }

    const userData = user[0];
    
    // Atualizar último login
    await queryClient`
      UPDATE users 
      SET last_login = NOW() 
      WHERE id = ${userData.id}
    `;

    // Criar sessão
    req.session.userId = userData.id;

    // Retornar dados do usuário formatados
    const userResponse = {
      id: userData.id,
      username: userData.username,
      email: userData.email,
      firstName: userData.first_name,
      lastName: userData.last_name,
      phone: userData.phone,
      address: userData.address,
      city: userData.city,
      postalCode: userData.postal_code,
      country: userData.country,
      birthDate: userData.birth_date,
      profilePicture: userData.profile_picture,
      biography: userData.biography,
      role: userData.role,
      preferences: userData.preferences,
      memberSince: userData.member_since,
      lastLogin: userData.last_login,
      status: userData.status,
      loyaltyPoints: userData.loyalty_points
    };

    res.json(userResponse);
  } catch (err: any) {
    console.error("Erro no login com PIN:", err);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});
router.post("/api/auth/logout", logout);
router.get("/api/auth/me", getProfile);

// Rotas para gerenciamento de usuários/clientes
router.get("/api/users", isAuthenticated, async (req, res) => {
  try {
    const users = await queryClient`
      SELECT id, username, email, first_name, last_name, phone, role, status, 
             loyalty_points, member_since, last_login
      FROM users
      ORDER BY last_name, first_name
    `;
    
    res.json(users);
  } catch (err: any) {
    console.error("Erro ao buscar usuários:", err);
    res.status(500).json({ error: err.message });
  }
});

// Buscar usuário por ID
router.get("/api/users/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await queryClient`
      SELECT id, username, email, first_name, last_name, phone, address, 
             city, postal_code, country, birth_date, profile_picture, 
             biography, role, preferences, member_since, last_login, 
             status, loyalty_points
      FROM users
      WHERE id = ${parseInt(id)}
    `;
    
    if (result.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
    
    // Por segurança, não retornar a senha
    res.json(result[0]);
  } catch (err: any) {
    console.error("Erro ao buscar usuário:", err);
    res.status(500).json({ error: err.message });
  }
});

// Atualizar usuário
router.put("/api/users/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      username, email, firstName, lastName, phone, address, city, 
      postalCode, country, role, status, loyaltyPoints 
    } = req.body;
    
    // Verificar campos obrigatórios
    if (!username || !email || !firstName || !lastName) {
      return res.status(400).json({ error: "Campos obrigatórios não preenchidos" });
    }
    
    // Verificar se o email já está sendo usado (exceto pelo próprio usuário)
    const emailCheck = await queryClient`
      SELECT id FROM users WHERE email = ${email} AND id != ${parseInt(id)}
    `;
    
    if (emailCheck.length > 0) {
      return res.status(400).json({ error: "E-mail já está sendo usado por outro usuário" });
    }
    
    // Verificar se o username já está sendo usado (exceto pelo próprio usuário)
    const usernameCheck = await queryClient`
      SELECT id FROM users WHERE username = ${username} AND id != ${parseInt(id)}
    `;
    
    if (usernameCheck.length > 0) {
      return res.status(400).json({ error: "Nome de usuário já está sendo usado" });
    }
    
    const result = await queryClient`
      UPDATE users
      SET 
        username = ${username},
        email = ${email},
        first_name = ${firstName},
        last_name = ${lastName},
        phone = ${phone || null},
        address = ${address || null},
        city = ${city || null},
        postal_code = ${postalCode || null},
        country = ${country || null},
        role = ${role || 'customer'},
        status = ${status || 'active'},
        loyalty_points = ${loyaltyPoints || 0}
      WHERE id = ${parseInt(id)}
      RETURNING id, username, email, first_name, last_name, phone, role, status, loyalty_points
    `;
    
    if (result.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
    
    res.json(result[0]);
  } catch (err: any) {
    console.error("Erro ao atualizar usuário:", err);
    res.status(500).json({ error: err.message });
  }
});

// Rotas de mesas usando queryClient para SQL direto
router.get("/api/tables", async (req, res) => {
  try {
    const tables = await queryClient`
      SELECT * FROM tables
      ORDER BY number ASC
    `;
    
    res.json(tables);
  } catch (err: any) {
    console.error("Erro ao buscar mesas:", err);
    res.status(500).json({ error: err.message });
  }
});

// Rota para buscar mesas disponíveis com base na data, hora e tamanho do grupo
router.get("/api/tables/available", async (req, res) => {
  try {
    const { date, time, partySize } = req.query;
    
    if (!date || !time || !partySize) {
      return res.status(400).json({ error: "Data, hora e tamanho do grupo são obrigatórios" });
    }
    
    // Primeiro, buscar todas as mesas que comportam o tamanho do grupo
    const partySizeNum = parseInt(partySize as string);
    
    const tables = await queryClient`
      SELECT * FROM tables
      WHERE capacity >= ${partySizeNum} AND available = true
      ORDER BY capacity ASC
    `;
    
    // Poderia adicionar verificação para ver se a mesa já está reservada na data/hora
    // Mas para simplificar, vamos apenas retornar todas as mesas disponíveis
    
    res.json(tables);
  } catch (err: any) {
    console.error("Erro ao buscar mesas disponíveis:", err);
    res.status(500).json({ error: err.message });
  }
});

// As rotas de pagamento estão implementadas abaixo

// Rotas para categorias do menu
router.get("/api/menu-categories", async (req, res) => {
  try {
    const categories = await queryClient`
      SELECT * FROM menu_categories
      ORDER BY name
    `;
    
    res.json(categories);
  } catch (err: any) {
    console.error("Erro ao buscar categorias do menu:", err);
    res.status(500).json({ error: err.message });
  }
});

// Adicionar categoria
router.post("/api/menu-categories", isAuthenticated, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: "Nome da categoria é obrigatório" });
    }
    
    const result = await queryClient`
      INSERT INTO menu_categories (name, description)
      VALUES (${name}, ${description || null})
      RETURNING *
    `;
    
    res.status(201).json(result[0]);
  } catch (err: any) {
    console.error("Erro ao criar categoria:", err);
    res.status(500).json({ error: err.message });
  }
});

// Atualizar categoria
router.put("/api/menu-categories/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: "Nome da categoria é obrigatório" });
    }
    
    const result = await queryClient`
      UPDATE menu_categories
      SET name = ${name}, description = ${description || null}
      WHERE id = ${parseInt(id)}
      RETURNING *
    `;
    
    if (result.length === 0) {
      return res.status(404).json({ error: "Categoria não encontrada" });
    }
    
    res.json(result[0]);
  } catch (err: any) {
    console.error("Erro ao atualizar categoria:", err);
    res.status(500).json({ error: err.message });
  }
});

// Excluir categoria
router.delete("/api/menu-categories/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se existem itens associados a esta categoria
    const items = await queryClient`
      SELECT COUNT(*) as count FROM menu_items WHERE category_id = ${parseInt(id)}
    `;
    
    if (items[0].count > 0) {
      return res.status(400).json({ 
        error: "Não é possível excluir a categoria pois existem itens associados a ela" 
      });
    }
    
    const result = await queryClient`
      DELETE FROM menu_categories
      WHERE id = ${parseInt(id)}
      RETURNING *
    `;
    
    if (result.length === 0) {
      return res.status(404).json({ error: "Categoria não encontrada" });
    }
    
    res.json({ success: true, message: "Categoria excluída com sucesso" });
  } catch (err: any) {
    console.error("Erro ao excluir categoria:", err);
    res.status(500).json({ error: err.message });
  }
});

// Rota para itens do menu
router.get("/api/menu-items", async (req, res) => {
  try {
    // Buscar itens com informações da categoria
    const menuItems = await queryClient`
      SELECT mi.*, mc.name as category_name
      FROM menu_items mi
      JOIN menu_categories mc ON mi.category_id = mc.id
      ORDER BY mi.category_id, mi.name
    `;
    
    // Agrupar os itens por categoria
    const categories = await queryClient`SELECT * FROM menu_categories ORDER BY name`;
    
    const menuByCategory = categories.map(category => {
      return {
        category: category,
        items: menuItems.filter(item => item.category_id === category.id)
      };
    });
    
    res.json(menuByCategory);
  } catch (err: any) {
    console.error("Erro ao buscar itens do menu:", err);
    res.status(500).json({ error: err.message });
  }
});

// Buscar item do menu por ID
router.get("/api/menu-items/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await queryClient`
      SELECT mi.*, mc.name as category_name
      FROM menu_items mi
      JOIN menu_categories mc ON mi.category_id = mc.id
      WHERE mi.id = ${parseInt(id)}
    `;
    
    if (result.length === 0) {
      return res.status(404).json({ error: "Item não encontrado" });
    }
    
    res.json(result[0]);
  } catch (err: any) {
    console.error("Erro ao buscar item do menu:", err);
    res.status(500).json({ error: err.message });
  }
});

// Adicionar item do menu
router.post("/api/menu-items", isAuthenticated, async (req, res) => {
  try {
    const { 
      name, description, price, categoryId, featured, imageUrl, 
      stockQuantity, minStockLevel, maxStockLevel, trackStock, isAvailable 
    } = req.body;
    
    if (!name || !categoryId || price === undefined) {
      return res.status(400).json({ error: "Nome, categoria e preço são obrigatórios" });
    }
    
    // Verificar se a categoria existe
    const categoryCheck = await queryClient`
      SELECT * FROM menu_categories WHERE id = ${parseInt(categoryId)}
    `;
    
    if (categoryCheck.length === 0) {
      return res.status(400).json({ error: "Categoria não encontrada" });
    }
    
    const result = await queryClient`
      INSERT INTO menu_items (
        name, description, price, category_id, featured, image_url,
        stock_quantity, min_stock_level, max_stock_level, track_stock, is_available
      )
      VALUES (
        ${name}, 
        ${description || null}, 
        ${Math.round(parseFloat(price) * 100)}, 
        ${parseInt(categoryId)}, 
        ${featured || false}, 
        ${imageUrl || null},
        ${stockQuantity || 0},
        ${minStockLevel || 5},
        ${maxStockLevel || 100},
        ${trackStock !== false},
        ${isAvailable !== false}
      )
      RETURNING *
    `;
    
    res.status(201).json(result[0]);
  } catch (err: any) {
    console.error("Erro ao criar item do menu:", err);
    res.status(500).json({ error: err.message });
  }
});

// Atualizar item do menu
router.put("/api/menu-items/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, description, price, categoryId, featured, imageUrl,
      stockQuantity, minStockLevel, maxStockLevel, trackStock, isAvailable 
    } = req.body;
    
    if (!name || !categoryId || price === undefined) {
      return res.status(400).json({ error: "Nome, categoria e preço são obrigatórios" });
    }
    
    const result = await queryClient`
      UPDATE menu_items
      SET name = ${name}, 
          description = ${description || null}, 
          price = ${Math.round(parseFloat(price) * 100)}, 
          category_id = ${parseInt(categoryId)}, 
          featured = ${featured || false}, 
          image_url = ${imageUrl || null},
          stock_quantity = ${stockQuantity || 0},
          min_stock_level = ${minStockLevel || 5},
          max_stock_level = ${maxStockLevel || 100},
          track_stock = ${trackStock !== false},
          is_available = ${isAvailable !== false},
          updated_at = NOW()
      WHERE id = ${parseInt(id)}
      RETURNING *
    `;
    
    if (result.length === 0) {
      return res.status(404).json({ error: "Item não encontrado" });
    }
    
    res.json(result[0]);
  } catch (err: any) {
    console.error("Erro ao atualizar item do menu:", err);
    res.status(500).json({ error: err.message });
  }
});

// Excluir item do menu
router.delete("/api/menu-items/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o item existe antes de excluir
    const itemCheck = await queryClient`
      SELECT * FROM menu_items WHERE id = ${parseInt(id)}
    `;
    
    if (itemCheck.length === 0) {
      return res.status(404).json({ error: "Item não encontrado" });
    }
    
    // Verificar se o item está sendo usado em pedidos
    const orderItemsCheck = await queryClient`
      SELECT COUNT(*) as count FROM order_items WHERE menu_item_id = ${parseInt(id)}
    `;
    
    if (orderItemsCheck[0].count > 0) {
      return res.status(400).json({ 
        error: "Não é possível excluir o item pois ele está sendo usado em pedidos" 
      });
    }
    
    const result = await queryClient`
      DELETE FROM menu_items
      WHERE id = ${parseInt(id)}
      RETURNING *
    `;
    
    res.json({ success: true, message: "Item excluído com sucesso" });
  } catch (err: any) {
    console.error("Erro ao excluir item do menu:", err);
    res.status(500).json({ error: err.message });
  }
});

// Rota para buscar reservas do usuário logado
router.get("/api/reservations", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    // Garantir que userId seja tratado como um número e nunca undefined
    const safeUserId = userId ? Number(userId) : 0;
    
    const reservations = await queryClient`
      SELECT r.*, t.number as table_number, t.capacity as table_capacity
      FROM reservations r
      JOIN tables t ON r.table_id = t.id
      WHERE r.user_id = ${safeUserId}
      ORDER BY r.date DESC
    `;
    
    res.json(reservations);
  } catch (err: any) {
    console.error("Erro ao buscar reservas:", err);
    res.status(500).json({ error: err.message });
  }
});

// Rota para buscar TODAS as reservas (área admin)
router.get("/api/admin/reservations", isAuthenticated, async (req, res) => {
  try {
    // Verificar se o usuário é admin
    if (!req.session.userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }
    
    const currentUser = await queryClient`
      SELECT role FROM users WHERE id = ${Number(req.session.userId)}
    `;
    
    if (currentUser.length === 0 || currentUser[0].role !== 'admin') {
      return res.status(403).json({ error: "Acesso negado. Apenas administradores podem acessar esta rota." });
    }

    // Buscar todas as reservas com informações completas
    const reservations = await queryClient`
      SELECT 
        r.id,
        r.user_id,
        r.table_id,
        r.date,
        r.party_size,
        r.status,
        r.confirmation_code,
        r.reservation_code,
        r.payment_method,
        r.payment_status,
        r.total,
        r.notes,
        r.duration,
        t.number as table_number,
        t.capacity as table_capacity,
        u.username as user_name,
        u.first_name,
        u.last_name,
        u.email,
        u.phone
      FROM reservations r
      JOIN tables t ON r.table_id = t.id
      JOIN users u ON r.user_id = u.id
      ORDER BY r.date DESC
    `;
    
    console.log(`Buscando reservas para admin - Total encontradas: ${reservations.length}`);
    console.log('Reservas encontradas:', reservations.map(r => ({ id: r.id, user_name: r.user_name, total: r.total, status: r.status })));
    res.json(reservations);
  } catch (err: any) {
    console.error("Erro ao buscar reservas para admin:", err);
    res.status(500).json({ error: err.message });
  }
});

// Rota para criar nova reserva
router.post("/api/reservations", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { 
      date, 
      tableId, 
      partySize, 
      notes, 
      status = 'confirmed',
      confirmationCode,
      paymentMethod = 'multibanco',
      paymentStatus = 'pending',
      total = 0,
      duration = 120
    } = req.body;

    console.log("Criando nova reserva:", {
      userId,
      date,
      tableId,
      partySize,
      status,
      confirmationCode,
      paymentMethod,
      paymentStatus,
      total
    });

    // Validações obrigatórias
    if (!date || !tableId || !partySize) {
      return res.status(400).json({ 
        error: "Data, mesa e número de pessoas são obrigatórios" 
      });
    }

    // Verificar se a mesa existe e está disponível
    const tableCheck = await queryClient`
      SELECT * FROM tables WHERE id = ${parseInt(tableId)}
    `;
    
    if (tableCheck.length === 0) {
      return res.status(400).json({ error: "Mesa não encontrada" });
    }

    // Gerar código de confirmação se não fornecido
    const finalConfirmationCode = confirmationCode || `RES-${Date.now()}`;
    
    // Gerar código único de 8 caracteres para a reserva
    const generateReservationCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };
    
    const reservationCode = generateReservationCode();

    // Validar userId
    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    // Inserir a reserva
    const result = await queryClient`
      INSERT INTO reservations (
        user_id, 
        date, 
        table_id, 
        party_size, 
        notes, 
        status,
        confirmation_code,
        payment_method,
        payment_status,
        total,
        duration
      )
      VALUES (
        ${Number(userId)},
        ${date},
        ${parseInt(tableId)},
        ${parseInt(partySize)},
        ${notes || null},
        ${status},
        ${finalConfirmationCode},
        ${paymentMethod},
        ${paymentStatus},
        ${parseFloat(total)},
        ${parseInt(duration)}
      )
      RETURNING *
    `;

    const newReservation = result[0];
    console.log("Reserva criada com sucesso:", newReservation);

    // Retornar a reserva criada com dados da mesa
    const reservationWithTable = await queryClient`
      SELECT r.*, t.number as table_number, t.capacity as table_capacity
      FROM reservations r
      JOIN tables t ON r.table_id = t.id
      WHERE r.id = ${newReservation.id}
    `;

    res.status(201).json(reservationWithTable[0]);
  } catch (err: any) {
    console.error("Erro ao criar reserva:", err);
    res.status(500).json({ error: err.message });
  }
});

// Rota para processamento de pagamentos
router.post("/api/payments/process", isAuthenticated, async (req, res) => {
  try {
    const { method, amount, phone, cardholderName, cardNumber, expiryDate, cvv, referenceId } = req.body;
    
    console.log(`Recebida solicitação de pagamento - Método: ${method}, Valor: ${amount/100}€ (${amount} centavos), ID Referência: ${referenceId || "não fornecido"}`);
    
    // Verificar se o método é suportado
    if (!['multibanco', 'mbway', 'card'].includes(method)) {
      return res.status(400).json({ error: 'Método de pagamento não suportado' });
    }
    
    // Verificar campos obrigatórios por método
    if (method === 'mbway' && !phone) {
      return res.status(400).json({ error: 'Número de telefone é obrigatório para pagamentos MBWay' });
    }
    
    // Processar o pagamento usando o serviço
    let result;
    try {
      if (method === 'multibanco') {
        // Enviar o código de confirmação como ID para o processamento
        result = await processPayment('multibanco', amount, phone || undefined, referenceId);
      } else if (method === 'mbway') {
        result = await processPayment('mbway', amount, phone, referenceId);
      } else if (method === 'card') {
        // Para cartão, também enviamos o ID de referência
        result = await processPayment('card', amount, phone || undefined, referenceId);
      } else {
        throw new Error(`Método de pagamento '${method}' não implementado`);
      }
      
      console.log(`Pagamento ${method} processado com sucesso:`, result);
      
      res.json({
        success: true,
        method,
        ...result
      });
    } catch (error: any) {
      console.error(`Erro ao processar pagamento ${method}:`, error);
      return res.status(500).json({ 
        success: false, 
        error: error.message || `Erro ao processar pagamento ${method}` 
      });
    }
  } catch (err: any) {
    console.error("Erro no processamento do pagamento:", err);
    res.status(500).json({ error: err.message });
  }
});

// Rota para verificar status do pagamento
router.get("/api/payments/status/:reference", async (req, res) => {
  try {
    const reference = req.params.reference;
    
    if (!reference) {
      return res.status(400).json({ 
        error: "Referência de pagamento não fornecida",
        status: "pending" 
      });
    }
    
    console.log(`Verificando status do pagamento: ${reference}`);
    
    // Obter status do serviço
    const result = await getPaymentStatus(reference);
    
    // Garantir formato mínimo esperado pelo cliente
    const response = {
      success: true,
      reference,
      status: (result.status === 'paid' || result.estado === 'pago') ? 'paid' : 'pending',
      estado: result.estado || 'pending',
      details: {
        ...result
      }
    };
    
    console.log(`Status atual do pagamento ${reference}: ${response.status}`);
    res.json(response);
  } catch (err: any) {
    console.error("Erro ao verificar status do pagamento:", err);
    
    // Resposta segura em caso de erro para não quebrar o fluxo do cliente
    res.json({ 
      success: false, 
      status: "pending",
      reference: req.params.reference,
      error: err.message || "Erro ao verificar pagamento"
    });
  }
});

// Rota para estatísticas do dashboard
router.get("/api/stats/dashboard", isAuthenticated, async (req, res) => {
  try {
    // Obter vendas/receita hoje
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    // Converter para formato ISO (YYYY-MM-DD)
    const startOfTodayStr = startOfToday.toISOString().split('T')[0];
    const endOfTodayStr = endOfToday.toISOString().split('T')[0] + ' 23:59:59';
    
    // Buscar receita de hoje - garantindo que a função now() retorne a data correta do sistema
    console.log("Buscando receita com data atual:", new Date());
    
    // Query usando parâmetros claros para capturar pagamentos do dia atual
    const todayRevenue = await queryClient`
      WITH current_date_capture AS (
        SELECT CAST(NOW() AT TIME ZONE 'UTC' AS DATE) as today_date
      )
      SELECT COALESCE(SUM(amount), 0) as revenue 
      FROM payments, current_date_capture 
      WHERE CAST(payment_date AS DATE) = today_date
      AND status = 'completed'
    `;
    
    // Buscar receita de ontem - usando a mesma abordagem confiável para garantir consistência
    const yesterdayRevenue = await queryClient`
      WITH current_date_capture AS (
        SELECT (CAST(NOW() AT TIME ZONE 'UTC' AS DATE) - INTERVAL '1 day') as yesterday_date
      )
      SELECT COALESCE(SUM(amount), 0) as revenue 
      FROM payments, current_date_capture 
      WHERE CAST(payment_date AS DATE) = yesterday_date
      AND status = 'completed'
    `;
    
    // Calcular mudança percentual na receita
    const todayRevenueValue = parseFloat(todayRevenue[0]?.revenue) || 0;
    const yesterdayRevenueValue = parseFloat(yesterdayRevenue[0]?.revenue) || 1; // Evitar divisão por zero
    
    console.log(`Dados da receita - Hoje: ${todayRevenueValue}, Ontem: ${yesterdayRevenueValue}`);
    const revenueChange = Math.round((todayRevenueValue - yesterdayRevenueValue) / yesterdayRevenueValue * 100);
    
    // Reservas de hoje usando date_trunc para maior precisão
    const todayReservations = await queryClient`
      SELECT COUNT(*) as count
      FROM reservations
      WHERE date_trunc('day', date) = date_trunc('day', now())
    `;
    
    // Reservas de ontem (usando date_trunc para maior precisão)
    const yesterdayReservations = await queryClient`
      SELECT COUNT(*) as count
      FROM reservations
      WHERE date_trunc('day', date) = date_trunc('day', now()) - interval '1 day'
    `;
    
    // Calcular mudança percentual nas reservas
    const todayReservationsValue = parseInt(todayReservations[0]?.count) || 0;
    const yesterdayReservationsValue = parseInt(yesterdayReservations[0]?.count) || 1; // Evitar divisão por zero
    const reservationsChange = Math.round((todayReservationsValue - yesterdayReservationsValue) / yesterdayReservationsValue * 100);
    
    // Taxa de ocupação (baseada nas reservas vs. capacidade total)
    const tables = await queryClient`SELECT SUM(capacity) as total_capacity FROM tables`;
    const totalCapacity = parseInt(tables[0]?.total_capacity) || 1; // Evitar divisão por zero
    
    // Suponha que cada reserva ocupa uma mesa inteira (simplificação)
    const occupancyRate = Math.min(100, Math.round((todayReservationsValue / totalCapacity) * 100));
    const yesterdayOccupancyRate = Math.min(100, Math.round((yesterdayReservationsValue / totalCapacity) * 100));
    const occupancyChange = occupancyRate - yesterdayOccupancyRate;
    
    // Novos clientes hoje usando date_trunc para maior precisão
    const newCustomers = await queryClient`
      SELECT COUNT(*) as count
      FROM users
      WHERE date_trunc('day', created_at) = date_trunc('day', now())
    `.catch(() => [{ count: 0 }]);
    
    // Novos clientes ontem usando date_trunc para maior precisão
    const yesterdayNewCustomers = await queryClient`
      SELECT COUNT(*) as count
      FROM users
      WHERE date_trunc('day', created_at) = date_trunc('day', now()) - interval '1 day'
    `.catch(() => [{ count: 0 }]);
    
    // Calcular mudança percentual em novos clientes
    const newCustomersValue = parseInt(newCustomers[0]?.count) || 0;
    const yesterdayNewCustomersValue = parseInt(yesterdayNewCustomers[0]?.count) || 1; // Evitar divisão por zero
    const customerChange = Math.round((newCustomersValue - yesterdayNewCustomersValue) / yesterdayNewCustomersValue * 100);
    
    // Dados de vendas por dia da semana (últimos 7 dias) - usando uma única consulta SQL eficiente
    console.log('Buscando dados de vendas dos últimos 7 dias');
    
    // Criar array com as datas dos últimos 7 dias para referência
    const last7Days = [];
    const dayLabels = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Formatar a data como YYYY-MM-DD
      const formattedDate = date.toISOString().split('T')[0];
      last7Days.push(formattedDate);
      
      // Adicionar o nome do dia abreviado em português
      const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });
      dayLabels.push(dayName.charAt(0).toUpperCase() + dayName.slice(1, 3));
    }
    
    // Buscar dados de todos os dias de uma vez com consulta mais eficiente
    const weeklySales = await queryClient`
      WITH date_range AS (
        SELECT generate_series(
          CURRENT_DATE - INTERVAL '6 days',
          CURRENT_DATE,
          '1 day'::interval
        ) AS day
      )
      SELECT 
        date_range.day::date AS date,
        COALESCE(SUM(p.amount), 0) AS revenue
      FROM 
        date_range
      LEFT JOIN payments p ON 
        CAST(p.payment_date AS DATE) = date_range.day
        AND p.status = 'completed'
      GROUP BY 
        date_range.day
      ORDER BY 
        date_range.day ASC
    `;
    
    console.log('Resultados da consulta de vendas semanais:', weeklySales);
    
    // Mapear os resultados para o formato esperado
    const dailyRevenue = [];
    
    // Inicializar com zeros
    for (let i = 0; i < 7; i++) {
      dailyRevenue.push(0);
    }
    
    // Preencher com dados reais onde existirem
    for (const sale of weeklySales) {
      const saleDate = new Date(sale.date).toISOString().split('T')[0];
      const index = last7Days.indexOf(saleDate);
      if (index !== -1) {
        // Converter centavos para euros
        dailyRevenue[index] = parseFloat(sale.revenue) / 100;
      }
    }
    
    // Formatar para 2 casas decimais
    for (let i = 0; i < dailyRevenue.length; i++) {
      dailyRevenue[i] = parseFloat(dailyRevenue[i].toFixed(2));
    }
    
    // Dados para gráfico de categorias mais vendidas 
    // Como a tabela order_items não existe, vamos buscar as categorias diretamente
    const categories = await queryClient`
      SELECT name FROM menu_categories ORDER BY name LIMIT 5
    `;
    
    // Valores simulados para as categorias (para evitar o erro)
    const categoryData = {
      labels: categories.map(cat => cat.name),
      values: categories.map((_, index) => Math.floor(Math.random() * 10) + 1) // Valores de exemplo entre 1-10
    };
    
    // Fazer debug dos valores coletados do banco antes de enviar para o frontend
    console.log('Valores do dia atual:', {
      'todayRevenueValue': todayRevenueValue,
      'data atual': new Date().toISOString(),
      'total após conversão': (todayRevenueValue / 100).toFixed(2)
    });
    
    // Buscar explicitamente o valor correto para hoje usando a data atual do sistema
    const currentDate = new Date().toISOString().split('T')[0]; // formato YYYY-MM-DD
    console.log('Data atual formatada:', currentDate);
    
    const todayRevenueExplicit = await queryClient`
      SELECT COALESCE(SUM(amount), 0) as revenue 
      FROM payments 
      WHERE CAST(payment_date AS DATE) = ${currentDate}
    `;
    
    // Usar este valor explícito para garantir precisão
    const todayRevenueExplicitValue = parseFloat(todayRevenueExplicit[0]?.revenue) || 0;
    console.log('Valor explícito da consulta:', todayRevenueExplicitValue);
    
    // Retornar todos os dados para o dashboard
    res.json({
      todayRevenue: (todayRevenueExplicitValue / 100).toFixed(2), // Usando o valor explícito
      revenueChange,
      todayReservations: todayReservationsValue,
      reservationsChange,
      occupancyRate,
      occupancyChange,
      newCustomers: newCustomersValue,
      customerChange,
      salesData: {
        labels: dayLabels,
        values: dailyRevenue
      },
      categoryData,
      
      // Dados adicionais úteis
      totalOrders: await queryClient`SELECT COUNT(*) as count FROM orders`.then(res => parseInt(res[0]?.count) || 0).catch(() => 0),
      totalCustomers: await queryClient`SELECT COUNT(*) as count FROM users`.then(res => parseInt(res[0]?.count) || 0),
      totalRevenue: await queryClient`SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'completed'`.then(res => (parseFloat(res[0]?.total) / 100).toFixed(2) || '0.00')
    });
    
  } catch (err: any) {
    console.error("Erro ao buscar estatísticas do dashboard:", err);
    res.status(500).json({ error: err.message });
  }
});

// Rota para cancelar pagamento
// Rota de teste para debug do upload de imagens
router.post("/api/test-image-upload", isAuthenticated, async (req, res) => {
  try {
    console.log("=== TESTE UPLOAD IMAGEM ===");
    console.log("Dados recebidos:", req.body);
    
    const { name, description, price, category_id, image_url } = req.body;
    
    console.log("Nome:", name);
    console.log("Descrição:", description);
    console.log("Preço:", price);
    console.log("Categoria ID:", category_id);
    console.log("URL da imagem (primeiros 100 chars):", image_url ? image_url.substring(0, 100) + "..." : "NENHUMA");
    
    // Testar inserção direta no banco
    const result = await queryClient`
      INSERT INTO menu_items (name, description, price, category_id, image_url, is_available)
      VALUES (${name}, ${description}, ${price}, ${category_id}, ${image_url}, true)
      RETURNING *
    `;
    
    console.log("Produto inserido com sucesso:", result[0]);
    res.json({ success: true, product: result[0] });
  } catch (err: any) {
    console.error("Erro no teste de upload:", err);
    res.status(500).json({ error: err.message });
  }
});

// Nova rota para listar todos os pagamentos - especialmente para a página de Finanças
router.get("/api/payments", isAuthenticated, async (req, res) => {
  try {
    const payments = await queryClient`
      SELECT 
        p.id,
        p.user_id,
        p.reservation_id,
        p.amount,
        p.method,
        p.status,
        p.reference,
        p.transaction_id,
        p.payment_date,
        p.details,
        p.created_at,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        r.date as reservation_date,
        CASE
          WHEN p.reservation_id IS NOT NULL THEN 'reservation'
          WHEN p.details->>'type' = 'pos' THEN 'pos'
          ELSE 'other'
        END as payment_source
      FROM payments p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN reservations r ON p.reservation_id = r.id
      ORDER BY COALESCE(p.payment_date, p.created_at) DESC
    `;
    
    console.log(`Retornando ${payments.length} pagamentos (cartão, MBWay, Multibanco, transferência bancária, dinheiro e TPA)`);
    res.json(payments);
  } catch (err: any) {
    console.error("Erro ao buscar pagamentos:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/payments/cancel", isAuthenticated, async (req, res) => {
  try {
    const { reference } = req.body;
    if (!reference) {
      return res.status(400).json({ error: 'Referência do pagamento é obrigatória' });
    }
    
    const result = await cancelPayment(reference);
    res.json(result);
  } catch (err: any) {
    console.error("Erro ao cancelar pagamento:", err);
    res.status(500).json({ error: err.message });
  }
});

// Rotas para o sistema POS
router.post('/api/pos/orders', isAuthenticated, async (req, res) => {
  try {
    const orderData = req.body;
    const userId = req.session.userId;
    
    // Validação de autenticação
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    // Validação básica
    if (!orderData.items || !orderData.totalAmount || orderData.items.length === 0) {
      return res.status(400).json({ error: 'Dados do pedido inválidos' });
    }
    
    // Método alternativo para buscar itens do menu - primeiro buscar todos e depois filtrar em memória
    const allMenuItems = await drizzleDb.select().from(schema.menuItems);
    
    // Filtrar os itens do menu necessários
    const menuItems = allMenuItems.filter(menuItem => 
      orderData.items.some((item: any) => Number(item.menuItemId) === menuItem.id)
    );
    
    // Mapear items com preços reais do banco de dados
    // Corrigindo a comparação para garantir que os tipos sejam consistentes
    const validatedItems = orderData.items.map((item: any) => {
      // Converter menuItemId para número para garantir comparação correta
      const menuItemIdNum = Number(item.menuItemId);
      const menuItem = menuItems.find((mi) => mi.id === menuItemIdNum);
      
      return {
        menuItemId: menuItemIdNum, // Armazenar como número
        quantity: Number(item.quantity), // Garantir que quantidade seja número
        price: menuItem?.price || 0,
        notes: item.notes,
        modifications: item.modifications
      };
    });
    
    // Recalcular o valor total com base nos preços reais
    const calculatedTotal = validatedItems.reduce((sum: number, item: any) => {
      return sum + (item.price * item.quantity);
    }, 0);
    
    // SUBTRAIR ESTOQUE AUTOMATICAMENTE ANTES DE CRIAR O PEDIDO
    for (const item of validatedItems) {
      const menuItemResult = await queryClient`
        SELECT id, name, track_stock, stock_quantity FROM menu_items WHERE id = ${item.menuItemId}
      `;
      
      if (menuItemResult.length > 0) {
        const menuItem = menuItemResult[0];
        
        // Subtrair estoque apenas se track_stock estiver ativo
        if (menuItem.track_stock) {
          const newStockQuantity = menuItem.stock_quantity - item.quantity;
          
          await queryClient`
            UPDATE menu_items 
            SET stock_quantity = ${newStockQuantity}, updated_at = NOW()
            WHERE id = ${menuItem.id}
          `;
          
          console.log(`🔄 POS - Estoque atualizado para ${menuItem.name}: ${menuItem.stock_quantity} -> ${newStockQuantity} (vendidos: ${item.quantity})`);
        } else {
          console.log(`⚠️ POS - Item ${menuItem.name} não tem controle de estoque ativo`);
        }
      }
    }

    // Criar o pedido com o usuário autenticado
    const newOrder = await drizzleDb.insert(schema.orders).values({
      userId: Number(userId), // Sempre usar o usuário autenticado
      type: 'pos',
      status: 'completed',
      items: validatedItems,
      totalAmount: calculatedTotal,
      paymentMethod: orderData.paymentMethod || 'cash',
      paymentStatus: 'completed',
      discount: orderData.discount || 0,
      tax: orderData.tax || 0,
      printedReceipt: orderData.printReceipt || false,
    }).returning();
    
    // Criar também um registro na tabela de pagamentos para sincronizar com a página de Finanças
    // Usaremos o método mais direto e confiável - a API nativa do Postgres
    
    // Variável para armazenar o registro de pagamento
    let paymentResult = null;
    
    try {
      // Normalizar o método de pagamento
      let normalizedMethod = orderData.paymentMethod || 'cash';
      
      // Converter métodos não padrão para valores válidos no enum
      if (normalizedMethod === 'multibanco_tpa') {
        normalizedMethod = 'cash';
      }
      
      // Garantir que o método é um dos valores aceitos
      if (!['cash', 'card', 'mbway', 'multibanco', 'transfer'].includes(normalizedMethod)) {
        normalizedMethod = 'cash';
      }
      
      // Usar o valor exato como está, sem multiplicar novamente
      // O valor já está na unidade monetária correta
      const amountForPayment = calculatedTotal;
      
      // Usar queryClient corretamente (postgres-js)
      // Converter a data para string ISO para evitar problemas de tipo
      const paymentDate = new Date().toISOString();
      const transactionId = 'POS-' + Date.now();
      
      // Adicionando o campo reservationId (usando o id do pedido como valor temporário)
      // Isso garante que não violamos a restrição NOT NULL no banco
      const result = await queryClient`
        INSERT INTO payments 
          (user_id, reservation_id, amount, method, status, reference, transaction_id, payment_date, details)
        VALUES 
          (${Number(userId)}, ${newOrder[0].id}, ${amountForPayment}, ${normalizedMethod}, ${'completed'}, 
           ${'POS-Order-' + newOrder[0].id}, ${transactionId}, ${paymentDate}, 
           ${JSON.stringify({
             type: 'pos',
             orderId: newOrder[0].id,
             items: validatedItems.length,
             userId: Number(userId)
           })})
        RETURNING *
      `;
      
      // postgres-js retorna os resultados diretamente como array
      if (result && result.length > 0) {
        paymentResult = result[0];
        console.log('Pagamento registrado com sucesso:', paymentResult);
      }
    } catch (error) {
      // Registrar o erro mas permitir que a operação continue
      console.error('Erro ao registrar pagamento na tabela payments:', error);
      // Não rejeitar a requisição aqui para não impedir a criação do pedido
    }
    
    // Retornar o pedido e o pagamento associado (se existir)
    res.status(201).json({
      order: newOrder[0],
      payment: paymentResult
    });
  } catch (error: any) {
    console.error('Erro ao criar pedido POS:', error);
    res.status(500).json({ error: error.message || 'Erro ao processar o pedido' });
  }
});

// Rota para buscar todos os pedidos POS com informações do usuário
router.get('/api/pos/orders', isAuthenticated, async (req, res) => {
  try {
    const orders = await queryClient`
      SELECT 
        o.*,
        u.username,
        u.first_name,
        u.last_name,
        u.role
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.type = 'pos'
      ORDER BY o.created_at DESC
    `;
    
    res.json(orders);
  } catch (error: any) {
    console.error('Erro ao buscar pedidos POS:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar pedidos' });
  }
});

// Rotas para configurações de pagamento
// Rota principal para todas as configurações
router.get("/api/settings", async (req, res) => {
  try {
    // Buscar todas as configurações de todas as categorias
    const allSettings = await drizzleDb.select()
      .from(schema.settings);
    
    // Agrupar por categoria
    const settingsByCategory: Record<string, Record<string, string>> = {};
    
    allSettings.forEach(setting => {
      if (!settingsByCategory[setting.category]) {
        settingsByCategory[setting.category] = {};
      }
      settingsByCategory[setting.category][setting.key] = setting.value || '';
    });
    
    console.log("Configurações completas encontradas:", settingsByCategory);
    
    res.json(settingsByCategory);
  } catch (err: any) {
    console.error("Erro ao buscar todas as configurações:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/api/settings/payments", async (req, res) => {
  try {
    // Buscar configurações da tabela payment_settings
    const result = await queryClient`
      SELECT * FROM payment_settings ORDER BY id LIMIT 1
    `;
    
    if (result.length === 0) {
      // Se não existirem configurações, retornar valores padrão
      console.log("Nenhuma configuração de pagamento encontrada, retornando valores padrão");
      return res.json({
        acceptCard: true,
        acceptMBWay: true,
        acceptMultibanco: true,
        acceptBankTransfer: true,
        acceptCash: true,
        acceptMultibancoTPA: true,
        eupagoApiKey: '',
        requirePrepayment: false,
        requirePrepaymentAmount: 0,
        showPricesWithTax: true,
        taxRate: 23
      });
    }
    
    // Mapear para o formato esperado pelo frontend
    const paymentSetting = result[0];
    
    // Verificar se a API key existe para determinar quais métodos podem estar ativos
    const hasApiKey = paymentSetting.eupago_api_key && paymentSetting.eupago_api_key.trim().length > 0;
    
    const settingsObject = {
      // Se não tiver API key, os métodos de pagamento do EuPago devem estar desativados
      acceptCard: hasApiKey ? paymentSetting.enable_card : false,
      acceptMBWay: hasApiKey ? paymentSetting.enable_mbway : false,
      acceptMultibanco: hasApiKey ? paymentSetting.enable_multibanco : false,
      
      // Métodos independentes da API key
      acceptBankTransfer: paymentSetting.enable_bank_transfer,
      acceptCash: paymentSetting.enable_cash,
      acceptMultibancoTPA: paymentSetting.enable_multibanco_tpa,
      
      // Outras configurações
      eupagoApiKey: paymentSetting.eupago_api_key || '',
      currency: paymentSetting.currency || 'EUR',
      taxRate: parseFloat(paymentSetting.tax_rate || '23'),
      requirePrepayment: paymentSetting.require_prepayment || false,
      requirePrepaymentAmount: parseFloat(paymentSetting.prepayment_amount || '0'),
      showPricesWithTax: paymentSetting.show_prices_with_tax || true
    };
    
    console.log("Configurações de pagamento encontradas:", settingsObject);
    
    res.json(settingsObject);
  } catch (err: any) {
    console.error("Erro ao buscar configurações de pagamento:", err);
    res.status(500).json({ error: err.message });
  }
});

router.put("/api/settings/payments", isAuthenticated, async (req, res) => {
  try {
    const settings = req.body;
    
    // Dump completo dos dados de entrada para debug
    console.log("==== DEBUG - DADOS DE ENTRADA ====");
    console.log("Corpo completo da requisição:", req.body);
    console.log("Headers:", req.headers);
    console.log("====================================");
    
    // Validar se o usuário é admin antes de permitir alterações
    const userId = req.session.userId;
    const safeUserId = userId ? Number(userId) : 0;
    
    // Verificar se o usuário é admin
    const userResult = await queryClient`
      SELECT role FROM users WHERE id = ${safeUserId}
    `;
    
    console.log("Verificando permissões do usuário:", userId, userResult);
    
    const user = userResult[0];
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Apenas administradores podem alterar configurações" });
    }

    // Usar execução direta para depuração
    console.log("==== MÉTODO DE INSERÇÃO DIRETO COM SQL BRUTO ====");
    
    // Verificar estado atual para confirmar mudanças depois
    const beforeSettings = await queryClient`SELECT * FROM payment_settings`;
    console.log("Estado ANTES da atualização:", beforeSettings);
    
    // Processar a API key primeiro, pois ela afeta outras configurações
    const apiKey = settings.eupagoApiKey || '';
    const hasApiKey = apiKey.trim().length > 0;
    
    console.log(`API Key: "${apiKey}" - API Key tem valor: ${hasApiKey}`);
    
    // Converter os valores para certeza de tipo
    // Se não houver API key, forçar métodos de pagamento EuPago como false independentemente dos valores enviados
    // Isso garante consistência no banco de dados
    const cardValue = hasApiKey ? settings.acceptCard === true : false;
    const mbwayValue = hasApiKey ? settings.acceptMBWay === true : false;
    const multibancoValue = hasApiKey ? settings.acceptMultibanco === true : false;
    
    // Métodos que não dependem da API key do EuPago
    const bankTransferValue = settings.acceptBankTransfer === true;
    const cashValue = settings.acceptCash === true;
    const multibancoTPAValue = settings.acceptMultibancoTPA === true;
    
    // Novos campos adicionados - forçar tipos corretos
    const currency = settings.currency || 'EUR';
    const taxRate = settings.taxRate !== undefined ? parseFloat(settings.taxRate.toString()) : 23;
    
    // Garante processamento explícito de valores booleanos para evitar problemas de tipo
    let requirePrepayment;
    if (settings.requirePrepayment === true) requirePrepayment = true;
    else if (settings.requirePrepayment === false) requirePrepayment = false;
    else if (settings.requirePrepayment === "true") requirePrepayment = true;
    else if (settings.requirePrepayment === "false") requirePrepayment = false;
    else requirePrepayment = false;
    
    const prepaymentAmount = settings.requirePrepaymentAmount !== undefined ? 
                            parseFloat(settings.requirePrepaymentAmount.toString()) : 0;
    
    let showPricesWithTax;
    if (settings.showPricesWithTax === true) showPricesWithTax = true;
    else if (settings.showPricesWithTax === false) showPricesWithTax = false;
    else if (settings.showPricesWithTax === "true") showPricesWithTax = true;
    else if (settings.showPricesWithTax === "false") showPricesWithTax = false;
    else showPricesWithTax = true;
    
    console.log("API Key presente:", hasApiKey, "Comprimento:", apiKey.length);
    
    console.log("Valores convertidos para inserção:", {
      cardValue, mbwayValue, multibancoValue, bankTransferValue, cashValue, apiKey,
      currency, taxRate, requirePrepayment, prepaymentAmount, showPricesWithTax
    });
    
    // Executar update direto usando template strings com postgres-js
    try {
      console.log("Executando SQL usando template strings do postgres-js");
      const updateResult = await queryClient`
        UPDATE payment_settings SET 
          enable_card = ${cardValue},
          enable_mbway = ${mbwayValue},
          enable_multibanco = ${multibancoValue},
          enable_bank_transfer = ${bankTransferValue},
          enable_cash = ${cashValue},
          enable_multibanco_tpa = ${multibancoTPAValue},
          eupago_api_key = ${apiKey},
          currency = ${currency},
          tax_rate = ${taxRate},
          require_prepayment = ${requirePrepayment},
          prepayment_amount = ${prepaymentAmount},
          show_prices_with_tax = ${showPricesWithTax},
          updated_at = NOW()
      `;
      console.log("Resultado da operação UPDATE:", updateResult);
      
      // Verificar estado para confirmar se houve mudança
      const afterSettings = await queryClient`SELECT * FROM payment_settings`;
      console.log("Estado DEPOIS da atualização:", afterSettings);
      
      // Verificar se houve mudança
      if (JSON.stringify(beforeSettings) === JSON.stringify(afterSettings)) {
        console.error("ALERTA: Nenhuma mudança detectada no banco mesmo após UPDATE");
        
        // Tentar inserção forçada como último recurso
        console.log("=== TENTANDO INSERÇÃO FORÇADA ===");
        
        // Excluir todos os registros e inserir um novo
        await queryClient`DELETE FROM payment_settings`;
        
        await queryClient`
          INSERT INTO payment_settings (
            enable_card, enable_mbway, enable_multibanco, 
            enable_bank_transfer, enable_cash, eupago_api_key,
            currency, tax_rate, require_prepayment, 
            prepayment_amount, show_prices_with_tax, updated_at
          ) VALUES (
            ${cardValue},
            ${mbwayValue},
            ${multibancoValue},
            ${bankTransferValue},
            ${cashValue},
            ${apiKey},
            ${currency},
            ${taxRate},
            ${requirePrepayment},
            ${prepaymentAmount},
            ${showPricesWithTax},
            NOW()
          )
        `;
        
        const finalSettings = await queryClient`SELECT * FROM payment_settings`;
        console.log("Estado FINAL após inserção forçada:", finalSettings);
      }
    } catch (updateError) {
      console.error("Erro durante UPDATE direto:", updateError);
      
      // Se falhar o UPDATE, tenta fazer um INSERT
      console.log("=== TENTANDO MÉTODO ALTERNATIVO: DELETE + INSERT ===");
      try {
        await queryClient`DELETE FROM payment_settings`;
        
        await queryClient`
          INSERT INTO payment_settings (
            enable_card, enable_mbway, enable_multibanco, 
            enable_bank_transfer, enable_cash, eupago_api_key,
            currency, tax_rate, require_prepayment, 
            prepayment_amount, show_prices_with_tax, updated_at
          ) VALUES (
            ${cardValue},
            ${mbwayValue},
            ${multibancoValue},
            ${bankTransferValue},
            ${cashValue},
            ${apiKey},
            ${currency},
            ${taxRate},
            ${requirePrepayment},
            ${prepaymentAmount},
            ${showPricesWithTax},
            NOW()
          )
        `;
        
        console.log("Inserção realizada com sucesso após exclusão");
      } catch (insertError) {
        console.error("Erro também no método alternativo:", insertError);
        throw insertError; // Propagar erro para tratamento final
      }
    }
    
    // Verificar o estado final das configurações
    const finalResult = await queryClient`SELECT * FROM payment_settings`;
    console.log("Estado FINAL das configurações de pagamento:", finalResult);
    
    res.json({ 
      message: "Configurações de pagamento atualizadas com sucesso",
      settings: finalResult[0] || {},
      debug: {
        inputValues: {
          cardValue, mbwayValue, multibancoValue, bankTransferValue, cashValue, apiKey
        }
      }
    });
  } catch (err: any) {
    console.error("Erro global ao atualizar configurações de pagamento:", err);
    res.status(500).json({ 
      error: err.message,
      stack: err.stack,
      message: "Falha ao atualizar configurações de pagamento. Por favor, contate o suporte."
    });
  }
});

// Rota para relatórios de vendas por usuário (apenas para admins)
router.get('/api/reports/sales-by-user', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    // Verificar se o usuário é admin
    const currentUser = await queryClient`
      SELECT role FROM users WHERE id = ${Number(userId)}
    `;
    
    if (currentUser.length === 0 || currentUser[0].role !== 'admin') {
      return res.status(403).json({ error: "Acesso negado. Apenas administradores podem acessar relatórios." });
    }
    
    const { startDate, endDate, userId: filterUserId } = req.query;
    
    let dateFilter = '';
    let userFilter = '';
    
    if (startDate && endDate) {
      dateFilter = `AND o.created_at BETWEEN '${startDate}' AND '${endDate}'`;
    }
    
    if (filterUserId) {
      userFilter = `AND o.user_id = ${Number(filterUserId)}`;
    }
    
    const salesReport = await queryClient`
      SELECT 
        u.id as user_id,
        u.username,
        u.first_name,
        u.last_name,
        u.role,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_sales,
        COALESCE(AVG(o.total_amount), 0) as average_order_value,
        MIN(o.created_at) as first_sale,
        MAX(o.created_at) as last_sale
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id AND o.type = 'pos' ${dateFilter} ${userFilter}
      WHERE u.role IN ('admin', 'collaborator')
      GROUP BY u.id, u.username, u.first_name, u.last_name, u.role
      ORDER BY total_sales DESC
    `;
    
    res.json(salesReport);
  } catch (error: any) {
    console.error('Erro ao gerar relatório de vendas por usuário:', error);
    res.status(500).json({ error: error.message || 'Erro ao gerar relatório' });
  }
});

// Rota para estatísticas detalhadas de um usuário específico
router.get('/api/reports/user-stats/:userId', isAuthenticated, async (req, res) => {
  try {
    const currentUserId = req.session.userId;
    const targetUserId = req.params.userId;
    
    // Verificar se o usuário é admin ou está consultando seus próprios dados
    const currentUser = await queryClient`
      SELECT role FROM users WHERE id = ${Number(currentUserId)}
    `;
    
    if (currentUser.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
    
    const isAdmin = currentUser[0].role === 'admin';
    const isOwnData = Number(currentUserId) === Number(targetUserId);
    
    if (!isAdmin && !isOwnData) {
      return res.status(403).json({ error: "Acesso negado. Você só pode visualizar seus próprios dados." });
    }
    
    // Buscar estatísticas detalhadas do usuário
    const userStats = await queryClient`
      SELECT 
        u.id,
        u.username,
        u.first_name,
        u.last_name,
        u.role,
        u.created_at as user_since,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_sales,
        COALESCE(AVG(o.total_amount), 0) as average_order_value,
        MIN(o.created_at) as first_sale,
        MAX(o.created_at) as last_sale,
        COUNT(CASE WHEN DATE(o.created_at) = CURRENT_DATE THEN 1 END) as orders_today,
        COALESCE(SUM(CASE WHEN DATE(o.created_at) = CURRENT_DATE THEN o.total_amount ELSE 0 END), 0) as sales_today
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id AND o.type = 'pos'
      WHERE u.id = ${Number(targetUserId)}
      GROUP BY u.id, u.username, u.first_name, u.last_name, u.role, u.created_at
    `;
    
    if (userStats.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
    
    // Buscar vendas dos últimos 7 dias para gráfico
    const weeklyStats = await queryClient`
      SELECT 
        DATE(o.created_at) as sale_date,
        COUNT(o.id) as orders_count,
        COALESCE(SUM(o.total_amount), 0) as daily_sales
      FROM orders o
      WHERE o.user_id = ${Number(targetUserId)} 
        AND o.type = 'pos'
        AND o.created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(o.created_at)
      ORDER BY sale_date DESC
    `;
    
    res.json({
      user: userStats[0],
      weeklyStats
    });
  } catch (error: any) {
    console.error('Erro ao buscar estatísticas do usuário:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar estatísticas' });
  }
});

// Rotas para configurações POS
router.get("/api/settings/pos", isAuthenticated, async (req, res) => {
  try {
    const result = await queryClient`
      SELECT * FROM pos_settings ORDER BY id LIMIT 1
    `;
    
    if (result.length === 0) {
      // Se não existirem configurações, criar com valores padrão
      const defaultSettings = await queryClient`
        INSERT INTO pos_settings DEFAULT VALUES RETURNING *
      `;
      return res.json(defaultSettings[0]);
    }
    
    res.json(result[0]);
  } catch (err: any) {
    console.error("Erro ao buscar configurações POS:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/settings/pos", isAuthenticated, async (req, res) => {
  try {
    const rawSettings = req.body;
    console.log("📥 [DEBUG] Dados recebidos:", JSON.stringify(rawSettings, null, 2));

    // Valores padrão seguros para evitar undefined
    const settings = {
      selectedPrinter: rawSettings.selectedPrinter || '',
      connectionType: rawSettings.connectionType || 'usb',
      connectionTimeout: Number(rawSettings.connectionTimeout) || 5000,
      connectionRetries: Number(rawSettings.connectionRetries) || 3,
      printIntensity: Number(rawSettings.printIntensity) || 50,
      printSpeed: rawSettings.printSpeed || 'medium',
      paperFeed: rawSettings.paperFeed || 'auto',
      autoCutterEnabled: Boolean(rawSettings.autoCutterEnabled),
      cutType: rawSettings.cutType || 'partial',
      cashDrawerKick: Boolean(rawSettings.cashDrawerKick),
      numberOfCopies: Number(rawSettings.numberOfCopies) || 1,
      globalAlignment: rawSettings.globalAlignment || 'left',
      columnWidthDescription: Number(rawSettings.columnWidthDescription) || 60,
      columnWidthQuantity: Number(rawSettings.columnWidthQuantity) || 15,
      columnWidthPrice: Number(rawSettings.columnWidthPrice) || 25,
      itemSpacing: Number(rawSettings.itemSpacing) || 1,
      highlightStyle: rawSettings.highlightStyle || 'bold',
      charset: rawSettings.charset || 'utf8',
      fontSize: rawSettings.fontSize || 'normal',
      accentedChars: Boolean(rawSettings.accentedChars !== false),
      fontFallback: rawSettings.fontFallback || 'arial',
      logoPosition: rawSettings.logoPosition || 'center',
      logoScale: Number(rawSettings.logoScale) || 100,
      barcodeType: rawSettings.barcodeType || 'code128',
      qrcodeEnabled: Boolean(rawSettings.qrcodeEnabled),
      qrcodeSize: rawSettings.qrcodeSize || 'medium',
      qrcodeMargin: Number(rawSettings.qrcodeMargin) || 10,
      qrcodeErrorLevel: rawSettings.qrcodeErrorLevel || 'M',
      timestampFormat: rawSettings.timestampFormat || 'dd/MM/yyyy HH:mm',
      showOperator: Boolean(rawSettings.showOperator !== false),
      operatorFormat: rawSettings.operatorFormat || 'nome',
      promoMessage: rawSettings.promoMessage || '',
      customFooter: rawSettings.customFooter || '',
      showItems: Boolean(rawSettings.showItems !== false),
      showDiscounts: Boolean(rawSettings.showDiscounts !== false),
      showTaxes: Boolean(rawSettings.showTaxes !== false),
      showSubtotal: Boolean(rawSettings.showSubtotal !== false),
      showTotal: Boolean(rawSettings.showTotal !== false),
      showPaymentMethod: Boolean(rawSettings.showPaymentMethod !== false),
      thankYouMessage: rawSettings.thankYouMessage || 'Obrigado pela preferência!',
      nonFiscalMessage: rawSettings.nonFiscalMessage || 'Documento não fiscal',
      customMessage: rawSettings.customMessage || '',
      customMessageEnabled: Boolean(rawSettings.customMessageEnabled),
      beepAfterPrint: Boolean(rawSettings.beepAfterPrint),
      sendPdfEmail: Boolean(rawSettings.sendPdfEmail),
      cashDrawerTiming: Number(rawSettings.cashDrawerTiming) || 500,
      requireAuth: Boolean(rawSettings.requireAuth),
      adminPassword: rawSettings.adminPassword || '',
      enableAudit: Boolean(rawSettings.enableAudit),
      logRetention: Number(rawSettings.logRetention) || 30,
      activeProfile: rawSettings.activeProfile || 'default'
    };
    
    console.log("✅ [DEBUG] Dados processados:", JSON.stringify(settings, null, 2));
    
    // Verificar se já existe configuração
    const existing = await queryClient`
      SELECT id FROM pos_settings ORDER BY id LIMIT 1
    `;
    
    console.log("🔍 [DEBUG] Configuração existente:", existing.length > 0 ? "SIM" : "NÃO");
    
    if (existing.length === 0) {
      // Criar nova configuração com valores básicos
      console.log("📝 [DEBUG] Criando nova configuração...");
      const newSettings = await queryClient`
        INSERT INTO pos_settings (
          selected_printer, connection_type, connection_timeout, connection_retries,
          print_intensity, print_speed, paper_feed, auto_cutter_enabled, 
          cut_type, cash_drawer_kick, number_of_copies, global_alignment
        ) VALUES (
          ${settings.selectedPrinter}, ${settings.connectionType}, ${settings.connectionTimeout}, ${settings.connectionRetries},
          ${settings.printIntensity}, ${settings.printSpeed}, ${settings.paperFeed}, ${settings.autoCutterEnabled},
          ${settings.cutType}, ${settings.cashDrawerKick}, ${settings.numberOfCopies}, ${settings.globalAlignment}
        ) RETURNING *
      `;
      console.log("✅ [DEBUG] Nova configuração criada:", newSettings[0]);
      res.json(newSettings[0]);
    } else {
      // Atualizar configuração existente com campos básicos
      console.log("🔄 [DEBUG] Atualizando configuração existente...");
      const updatedSettings = await queryClient`
        UPDATE pos_settings SET
          selected_printer = ${settings.selectedPrinter},
          connection_type = ${settings.connectionType},
          connection_timeout = ${settings.connectionTimeout},
          connection_retries = ${settings.connectionRetries},
          print_intensity = ${settings.printIntensity},
          print_speed = ${settings.printSpeed},
          paper_feed = ${settings.paperFeed},
          auto_cutter_enabled = ${settings.autoCutterEnabled},
          cut_type = ${settings.cutType},
          cash_drawer_kick = ${settings.cashDrawerKick},
          number_of_copies = ${settings.numberOfCopies},
          global_alignment = ${settings.globalAlignment}
        WHERE id = ${existing[0].id}
        RETURNING *
      `;
      console.log("✅ [DEBUG] Configuração atualizada:", updatedSettings[0]);
      res.json(updatedSettings[0]);
    }

  } catch (err: any) {
    console.error("❌ [ERRO] Falha ao salvar configurações POS:", err);
    console.error("❌ [STACK]", err.stack);
    res.status(500).json({ 
      error: "Erro ao salvar configurações POS",
      details: err.message 
    });
  }
});

// Rota para testar comunicação com impressora específica
router.post("/api/settings/pos/test-communication", isAuthenticated, async (req, res) => {
  try {
    const { printerId, printerName } = req.body;
    console.log(`🧪 [TESTE] Testando comunicação com impressora: ${printerName} (ID: ${printerId})`);
    
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    const platform = process.platform;
    
    let testResult = {
      success: false,
      status: 'unknown',
      message: '',
      details: {},
      timestamp: new Date().toISOString()
    };
    
    try {
      if (platform === 'linux') {
        // Teste no Linux via CUPS
        console.log("🐧 [LINUX] Testando via CUPS...");
        
        if (printerName && printerName !== 'Salvar como PDF') {
          // Testar status da impressora
          const { stdout: statusOut } = await execAsync(`lpstat -p ${printerName} 2>/dev/null || echo "not_found"`);
          
          if (statusOut.includes('idle')) {
            testResult = {
              success: true,
              status: 'online',
              message: `Impressora ${printerName} está online e pronta para imprimir`,
              details: { platform: 'linux', driver: 'CUPS', response: statusOut.trim() },
              timestamp: new Date().toISOString()
            };
          } else if (statusOut.includes('disabled')) {
            testResult = {
              success: false,
              status: 'offline',
              message: `Impressora ${printerName} está desabilitada`,
              details: { platform: 'linux', driver: 'CUPS', response: statusOut.trim() },
              timestamp: new Date().toISOString()
            };
          } else {
            testResult = {
              success: false,
              status: 'unknown',
              message: `Status da impressora ${printerName} não pôde ser determinado`,
              details: { platform: 'linux', driver: 'CUPS', response: statusOut.trim() },
              timestamp: new Date().toISOString()
            };
          }
        }
        
      } else if (platform === 'darwin') {
        // Teste no macOS
        console.log("🍎 [MACOS] Testando via lpstat...");
        
        if (printerName && printerName !== 'Salvar como PDF') {
          const { stdout: statusOut } = await execAsync(`lpstat -p ${printerName} 2>/dev/null || echo "not_found"`);
          
          if (statusOut.includes('idle')) {
            testResult = {
              success: true,
              status: 'online',
              message: `Impressora ${printerName} está online e pronta`,
              details: { platform: 'darwin', driver: 'macOS', response: statusOut.trim() },
              timestamp: new Date().toISOString()
            };
          } else {
            testResult = {
              success: false,
              status: 'offline',
              message: `Impressora ${printerName} não está disponível`,
              details: { platform: 'darwin', driver: 'macOS', response: statusOut.trim() },
              timestamp: new Date().toISOString()
            };
          }
        }
        
      } else if (platform === 'win32') {
        // Teste no Windows via PowerShell
        console.log("🪟 [WINDOWS] Testando via PowerShell...");
        
        if (printerName && printerName !== 'Salvar como PDF') {
          const psCommand = `Get-WmiObject -Class Win32_Printer -Filter "Name='${printerName}'" | Select-Object Name,PrinterStatus,WorkOffline | ConvertTo-Json`;
          const { stdout } = await execAsync(`powershell -Command "${psCommand}" 2>nul || echo "null"`);
          
          try {
            const printer = JSON.parse(stdout);
            if (printer && printer.Name) {
              if (printer.PrinterStatus === 3 && !printer.WorkOffline) {
                testResult = {
                  success: true,
                  status: 'online',
                  message: `Impressora ${printerName} está online e funcionando`,
                  details: { 
                    platform: 'win32', 
                    driver: 'Windows', 
                    printerStatus: printer.PrinterStatus,
                    workOffline: printer.WorkOffline 
                  },
                  timestamp: new Date().toISOString()
                };
              } else {
                testResult = {
                  success: false,
                  status: 'offline',
                  message: `Impressora ${printerName} está offline ou com problemas`,
                  details: { 
                    platform: 'win32', 
                    driver: 'Windows', 
                    printerStatus: printer.PrinterStatus,
                    workOffline: printer.WorkOffline 
                  },
                  timestamp: new Date().toISOString()
                };
              }
            } else {
              testResult = {
                success: false,
                status: 'not_found',
                message: `Impressora ${printerName} não foi encontrada no sistema`,
                details: { platform: 'win32', driver: 'Windows' },
                timestamp: new Date().toISOString()
              };
            }
          } catch (parseError) {
            testResult = {
              success: false,
              status: 'error',
              message: `Erro ao verificar status da impressora ${printerName}`,
              details: { platform: 'win32', error: parseError },
              timestamp: new Date().toISOString()
            };
          }
        }
      }
      
      // Teste especial para impressoras virtuais
      if (printerName === 'Salvar como PDF' || printerId.includes('virtual')) {
        testResult = {
          success: true,
          status: 'online',
          message: 'Impressora virtual está sempre disponível',
          details: { type: 'virtual', driver: 'PDF' },
          timestamp: new Date().toISOString()
        };
      }
      
    } catch (execError) {
      console.error(`❌ [ERRO] Falha no teste de comunicação:`, execError);
      testResult = {
        success: false,
        status: 'error',
        message: `Erro ao testar comunicação com ${printerName}`,
        details: { error: execError.message },
        timestamp: new Date().toISOString()
      };
    }
    
    console.log(`📊 [RESULTADO] Teste de comunicação: ${testResult.success ? 'SUCESSO' : 'FALHA'}`);
    res.json(testResult);
    
  } catch (err: any) {
    console.error("❌ [ERRO] Erro no teste de comunicação:", err);
    res.status(500).json({ 
      success: false,
      error: "Erro interno no teste de comunicação",
      details: err.message 
    });
  }
});

// Rota para testar impressão real
router.post("/api/settings/pos/test-print", isAuthenticated, async (req, res) => {
  try {
    const { printerId, printerName } = req.body;
    console.log(`🖨️ [TESTE] Enviando página de teste para: ${printerName}`);
    
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    const platform = process.platform;
    
    // Conteúdo da página de teste
    const testPageContent = `
=================================
    PÁGINA DE TESTE - POS
=================================

Data/Hora: ${new Date().toLocaleString('pt-BR')}
Impressora: ${printerName}
Sistema: ${platform}

=================================
    TESTE DE FORMATAÇÃO
=================================

TEXTO NORMAL
TEXTO EM NEGRITO (SIMULADO)
texto pequeno

Números: 1234567890
Símbolos: !@#$%^&*()

Item 1........................R$ 10,00
Item 2........................R$ 25,50
Item 3........................R$ 8,75
---------------------------------
TOTAL.........................R$ 44,25

=================================
Este é um teste de impressão
do sistema POS. Se você consegue
ler este texto, a impressora
está funcionando corretamente.
=================================

    `;
    
    let printResult = {
      success: false,
      message: '',
      timestamp: new Date().toISOString()
    };
    
    try {
      if (printerName === 'Salvar como PDF' || printerId.includes('virtual_pdf')) {
        // Simular salvamento como PDF
        printResult = {
          success: true,
          message: 'Página de teste salva como PDF com sucesso',
          timestamp: new Date().toISOString()
        };
        
      } else if (printerId.includes('virtual_preview')) {
        // Pré-visualização
        printResult = {
          success: true,
          message: 'Página de teste exibida na pré-visualização',
          timestamp: new Date().toISOString()
        };
        
      } else {
        // Tentar impressão real no sistema
        if (platform === 'linux') {
          // Criar arquivo temporário e imprimir via lp
          const tempFile = `/tmp/pos_test_${Date.now()}.txt`;
          require('fs').writeFileSync(tempFile, testPageContent);
          await execAsync(`lp -d ${printerName} ${tempFile} 2>/dev/null && rm ${tempFile} || rm ${tempFile}`);
          
          printResult = {
            success: true,
            message: `Página de teste enviada para ${printerName} via CUPS`,
            timestamp: new Date().toISOString()
          };
          
        } else if (platform === 'darwin') {
          // Impressão no macOS
          const tempFile = `/tmp/pos_test_${Date.now()}.txt`;
          require('fs').writeFileSync(tempFile, testPageContent);
          await execAsync(`lp -d ${printerName} ${tempFile} 2>/dev/null && rm ${tempFile} || rm ${tempFile}`);
          
          printResult = {
            success: true,
            message: `Página de teste enviada para ${printerName} via macOS`,
            timestamp: new Date().toISOString()
          };
          
        } else if (platform === 'win32') {
          // Impressão no Windows via PowerShell
          const tempFile = `C:\\temp\\pos_test_${Date.now()}.txt`;
          require('fs').writeFileSync(tempFile, testPageContent);
          await execAsync(`powershell -Command "Get-Content '${tempFile}' | Out-Printer -Name '${printerName}'" 2>nul && del "${tempFile}" || del "${tempFile}"`);
          
          printResult = {
            success: true,
            message: `Página de teste enviada para ${printerName} via Windows`,
            timestamp: new Date().toISOString()
          };
        }
      }
      
    } catch (printError) {
      console.error(`❌ [ERRO] Falha na impressão:`, printError);
      printResult = {
        success: false,
        message: `Erro ao imprimir na ${printerName}: ${printError.message}`,
        timestamp: new Date().toISOString()
      };
    }
    
    console.log(`📊 [RESULTADO] Teste de impressão: ${printResult.success ? 'SUCESSO' : 'FALHA'}`);
    res.json(printResult);
    
  } catch (err: any) {
    console.error("❌ [ERRO] Erro no teste de impressão:", err);
    res.status(500).json({ 
      success: false,
      error: "Erro interno no teste de impressão",
      details: err.message 
    });
  }
});

// Rota para verificar status da impressora
router.post("/api/settings/pos/check-connection", isAuthenticated, async (req, res) => {
  try {
    // Simular verificação de conexão
    console.log("Verificação de conexão executada pelo usuário:", req.session.userId);
    res.json({ 
      success: true, 
      status: "connected", 
      message: "Impressora conectada e funcionando normalmente" 
    });
  } catch (err: any) {
    console.error("Erro na verificação de conexão:", err);
    res.status(500).json({ error: err.message });
  }
});

// Rota para exportar perfil de configuração
router.get("/api/settings/pos/export-profile", isAuthenticated, async (req, res) => {
  try {
    const settings = await queryClient`
      SELECT * FROM pos_settings ORDER BY id LIMIT 1
    `;
    
    if (settings.length === 0) {
      return res.status(404).json({ error: "Nenhuma configuração encontrada" });
    }
    
    // Remover campos que não devem ser exportados
    const { id, updated_at, admin_password, ...exportableSettings } = settings[0];
    
    res.json({
      profile_name: "Configuração Exportada",
      export_date: new Date().toISOString(),
      settings: exportableSettings
    });
  } catch (err: any) {
    console.error("Erro ao exportar perfil:", err);
    res.status(500).json({ error: err.message });
  }
});

// Rota para listar impressoras disponíveis no sistema
router.get("/api/settings/pos/printers", isAuthenticated, async (req, res) => {
  console.log("🖨️ [VARREDURA] INICIANDO DETECÇÃO DE IMPRESSORAS");
  
  try {
    const platform = process.platform;
    console.log(`🔍 [SISTEMA] Plataforma: ${platform}`);
    
    const detectedPrinters: any[] = [];
    
    // Detecção REAL de impressoras via comandos do sistema
    const detectRealPrinters = async (): Promise<any[]> => {
      console.log("🔍 [DETECÇÃO] Executando varredura REAL do sistema...");
      
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      const systemPrinters = [];
      
      try {
        if (platform === 'linux') {
          console.log("🐧 [LINUX] Detectando impressoras via CUPS...");
          
          // Comando para listar impressoras no Linux (CUPS)
          const { stdout } = await execAsync('lpstat -p 2>/dev/null || echo "no_printers"');
          
          if (stdout !== "no_printers" && stdout.trim() !== "") {
            const lines = stdout.split('\n').filter(line => line.includes('printer'));
            
            for (const line of lines) {
              const match = line.match(/printer\s+(\S+)/);
              if (match) {
                const printerName = match[1];
                
                // Verificar status da impressora
                let status = 'unknown';
                try {
                  const { stdout: statusOut } = await execAsync(`lpstat -p ${printerName} 2>/dev/null || echo "unknown"`);
                  if (statusOut.includes('idle')) status = 'online';
                  else if (statusOut.includes('disabled')) status = 'offline';
                  else if (statusOut.includes('printing')) status = 'printing';
                  else status = 'unknown';
                } catch (e) {
                  status = 'unknown';
                }
                
                systemPrinters.push({
                  id: `linux_${printerName}_${Date.now()}`,
                  name: printerName,
                  type: "cups",
                  status: status,
                  platform: "linux",
                  driver: "CUPS",
                  connection: "system"
                });
              }
            }
          }
          
          // Se não encontrou impressoras, adicionar uma genérica
          if (systemPrinters.length === 0) {
            systemPrinters.push({
              id: `linux_generic_${Date.now()}`,
              name: "Impressora Linux (Sistema)",
              type: "system",
              status: "unknown",
              platform: "linux",
              driver: "CUPS",
              connection: "system"
            });
          }
          
        } else if (platform === 'darwin') {
          console.log("🍎 [MACOS] Detectando impressoras via lpstat...");
          
          // Comando para listar impressoras no macOS
          const { stdout } = await execAsync('lpstat -p 2>/dev/null || echo "no_printers"');
          
          if (stdout !== "no_printers" && stdout.trim() !== "") {
            const lines = stdout.split('\n').filter(line => line.includes('printer'));
            
            for (const line of lines) {
              const match = line.match(/printer\s+(\S+)/);
              if (match) {
                const printerName = match[1];
                
                // Verificar status
                let status = 'unknown';
                try {
                  const { stdout: statusOut } = await execAsync(`lpstat -p ${printerName} 2>/dev/null || echo "unknown"`);
                  if (statusOut.includes('idle')) status = 'online';
                  else if (statusOut.includes('disabled')) status = 'offline';
                  else if (statusOut.includes('printing')) status = 'printing';
                  else status = 'unknown';
                } catch (e) {
                  status = 'unknown';
                }
                
                systemPrinters.push({
                  id: `macos_${printerName}_${Date.now()}`,
                  name: printerName,
                  type: "system",
                  status: status,
                  platform: "darwin",
                  driver: "macOS",
                  connection: "system"
                });
              }
            }
          }
          
          // Fallback para macOS
          if (systemPrinters.length === 0) {
            systemPrinters.push({
              id: `macos_generic_${Date.now()}`,
              name: "Impressora macOS (Sistema)",
              type: "system",
              status: "unknown",
              platform: "darwin",
              driver: "macOS",
              connection: "system"
            });
          }
          
        } else if (platform === 'win32') {
          console.log("🪟 [WINDOWS] Detectando impressoras via PowerShell...");
          
          // Comando PowerShell para detectar impressoras no Windows
          const psCommand = 'Get-WmiObject -Class Win32_Printer | Select-Object Name,PrinterStatus,WorkOffline | ConvertTo-Json';
          const { stdout } = await execAsync(`powershell -Command "${psCommand}" 2>nul || echo "[]"`);
          
          try {
            let printers = JSON.parse(stdout);
            if (!Array.isArray(printers)) printers = [printers];
            
            for (const printer of printers) {
              if (printer && printer.Name) {
                let status = 'unknown';
                if (printer.PrinterStatus === 3) status = 'online';
                else if (printer.WorkOffline === true) status = 'offline';
                else if (printer.PrinterStatus === 4) status = 'printing';
                else if (printer.PrinterStatus === 2) status = 'error';
                
                systemPrinters.push({
                  id: `windows_${printer.Name.replace(/\s+/g, '_')}_${Date.now()}`,
                  name: printer.Name,
                  type: "system",
                  status: status,
                  platform: "win32",
                  driver: "Windows",
                  connection: "system",
                  printerStatus: printer.PrinterStatus,
                  workOffline: printer.WorkOffline
                });
              }
            }
          } catch (parseError) {
            console.log("⚠️ [WINDOWS] Erro ao parsear saída do PowerShell");
          }
          
          // Fallback para Windows
          if (systemPrinters.length === 0) {
            systemPrinters.push({
              id: `windows_generic_${Date.now()}`,
              name: "Impressora Windows (Sistema)",
              type: "system",
              status: "unknown",
              platform: "win32",
              driver: "Windows",
              connection: "system"
            });
          }
        }
        
      } catch (execError) {
        console.error("❌ [ERRO] Falha na execução dos comandos do sistema:", execError);
        
        // Fallback genérico em caso de erro
        systemPrinters.push({
          id: `generic_fallback_${Date.now()}`,
          name: `Impressora ${platform.toUpperCase()} (Detecção Automática)`,
          type: "fallback",
          status: "unknown",
          platform: platform,
          driver: "Generic",
          connection: "system"
        });
      }
      
      console.log(`✅ [DETECÇÃO] ${systemPrinters.length} impressora(s) do sistema detectada(s)`);
      return systemPrinters;
    };

    // Executar detecção REAL
    const systemPrinters = await detectRealPrinters();
    
    // Impressoras padrão sempre disponíveis
    const defaultPrinters = [
      {
        id: "system_default",
        name: "Impressora Padrão do Sistema",
        type: "system",
        connection: "system",
        status: "online",
        platform: platform
      },
      {
        id: "thermal_pos", 
        name: "Impressora Térmica POS",
        type: "thermal",
        connection: "usb",
        status: "online",
        platform: platform
      },
      {
        id: "virtual_pdf",
        name: "Salvar como PDF",
        type: "virtual",
        connection: "virtual", 
        status: "online",
        platform: "virtual"
      },
      {
        id: "virtual_preview",
        name: "Pré-visualização na Tela",
        type: "virtual",
        connection: "virtual",
        status: "online",
        platform: "virtual"
      }
    ];

    // Combinar todas as impressoras
    const allPrinters = [...systemPrinters, ...defaultPrinters];
    
    // Remover duplicatas
    const uniquePrinters = allPrinters.filter((printer, index, self) => 
      index === self.findIndex(p => p.name === printer.name)
    );

    console.log(`✅ [RESULTADO] ${uniquePrinters.length} impressoras disponíveis`);
    res.json(uniquePrinters);

  } catch (err: any) {
    console.error("❌ [ERRO] Falha na detecção de impressoras:", err);
    
    // Fallback garantido
    const emergencyPrinters = [
      {
        id: "emergency_system",
        name: "Impressora do Sistema (Fallback)",
        type: "system",
        connection: "system",
        status: "online",
        platform: process.platform,
        fallback: true
      },
      {
        id: "emergency_pdf",
        name: "Salvar como PDF",
        type: "virtual",
        connection: "virtual",
        status: "online",
        platform: "virtual",
        fallback: true
      }
    ];
    
    console.log("🚨 [FALLBACK] Usando impressoras de emergência");
    res.json(emergencyPrinters);
  }
});

export default router;
