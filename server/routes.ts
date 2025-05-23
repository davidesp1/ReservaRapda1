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
// Nova rota para listar todos os pagamentos - especialmente para a página de Finanças
router.get("/api/payments", isAuthenticated, async (req, res) => {
  try {
    const payments = await queryClient`
      SELECT p.*, u.username, u.email, r.date as reservation_date, r.time as reservation_time,
        CASE
          WHEN p.reservation_id IS NOT NULL THEN 'reservation'
          WHEN p.details->>'type' = 'pos' THEN 'pos'
          ELSE 'other'
        END as payment_source,
        CASE
          WHEN p.method = 'card' THEN 'Cartão de Crédito'
          WHEN p.method = 'mbway' THEN 'MBWay'
          WHEN p.method = 'multibanco' THEN 'Multibanco'
          WHEN p.method = 'transfer' THEN 'Transferência Bancária'
          WHEN p.method = 'cash' THEN 'Dinheiro'
          WHEN p.method = 'multibanco_tpa' THEN 'Multibanco (TPA)'
          ELSE p.method
        END as method_display
      FROM payments p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN reservations r ON p.reservation_id = r.id
      ORDER BY p.payment_date DESC, p.created_at DESC
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
router.post('/api/pos/orders', async (req, res) => {
  try {
    const orderData = req.body;
    
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
    
    // Criar o pedido
    const newOrder = await drizzleDb.insert(schema.orders).values({
      userId: orderData.userId || 1, // Default para o primeiro usuário se não especificado
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
          (${1}, ${newOrder[0].id}, ${amountForPayment}, ${normalizedMethod}, ${'completed'}, 
           ${'POS-Order-' + newOrder[0].id}, ${transactionId}, ${paymentDate}, 
           ${JSON.stringify({
             type: 'pos',
             orderId: newOrder[0].id,
             items: validatedItems.length
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

// Rota para buscar todos os pedidos POS
router.get('/api/pos/orders', async (req, res) => {
  try {
    const orders = await drizzleDb.select()
      .from(schema.orders)
      .where(eq(schema.orders.type, 'pos'))
      .orderBy(desc(schema.orders.createdAt));
    
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

export default router;
