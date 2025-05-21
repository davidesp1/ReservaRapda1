import express from "express";
import {
  processPayment,
  getPaymentStatus,
  cancelPayment,
} from "./services/paymentService";
import { register, login, logout, getProfile } from "./controllers/authController";
import { db as drizzleDb, queryClient } from "./db";
import { eq, gte, desc, and, sql } from "drizzle-orm";
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
    const { name, description, price, categoryId, featured, imageUrl } = req.body;
    
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
      INSERT INTO menu_items (name, description, price, category_id, featured, image_url)
      VALUES (
        ${name}, 
        ${description || null}, 
        ${parseInt(price)}, 
        ${parseInt(categoryId)}, 
        ${featured || false}, 
        ${imageUrl || null}
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
    const { name, description, price, categoryId, featured, imageUrl } = req.body;
    
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
      UPDATE menu_items
      SET 
        name = ${name},
        description = ${description || null},
        price = ${parseInt(price)},
        category_id = ${parseInt(categoryId)},
        featured = ${featured || false},
        image_url = ${imageUrl || null}
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

// Rota para reservas
router.get("/api/reservations", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    const reservations = await queryClient`
      SELECT r.*, t.number as table_number, t.capacity as table_capacity
      FROM reservations r
      JOIN tables t ON r.table_id = t.id
      WHERE r.user_id = ${userId}
      ORDER BY r.date DESC
    `;
    
    res.json(reservations);
  } catch (err: any) {
    console.error("Erro ao buscar reservas:", err);
    res.status(500).json({ error: err.message });
  }
});

// Rota para processamento de pagamentos
router.post("/api/payments/process", isAuthenticated, async (req, res) => {
  try {
    const { method, amount, phone, cardholderName, cardNumber, expiryDate, cvv } = req.body;
    
    console.log(`Recebida solicitação de pagamento - Método: ${method}, Valor: ${amount}€`);
    
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
        result = await processPayment('multibanco', amount);
      } else if (method === 'mbway') {
        result = await processPayment('mbway', amount, phone);
      } else if (method === 'card') {
        // Para cartão, apenas geramos uma referência aqui, o redirecionamento acontece no front-end
        result = await processPayment('card', amount);
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
    const result = await getPaymentStatus(reference);
    res.json(result);
  } catch (err: any) {
    console.error("Erro ao verificar status do pagamento:", err);
    res.status(500).json({ error: err.message });
  }
});

// Rota para cancelar pagamento
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
    
    // Buscar dados dos itens do menu para garantir preços corretos
    const itemIds = orderData.items.map((item: any) => item.menuItemId);
    const menuItems = await drizzleDb.select().from(schema.menuItems).where(
      sql`id IN (${itemIds.join(',')})`
    );
    
    // Mapear items com preços reais do banco de dados
    const validatedItems = orderData.items.map((item: any) => {
      const menuItem = menuItems.find((mi) => mi.id === item.menuItemId);
      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
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
    
    res.status(201).json(newOrder[0]);
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
router.get("/api/settings/payments", async (req, res) => {
  try {
    // Buscar todas as configurações da categoria 'payments'
    const paymentSettings = await drizzleDb.select()
      .from(schema.settings)
      .where(eq(schema.settings.category, 'payments'));
    
    // Transformar o array de configurações em um objeto mais fácil de usar
    const settingsObject: Record<string, string> = {};
    paymentSettings.forEach(setting => {
      settingsObject[setting.key] = setting.value || '';
    });
    
    res.json(settingsObject);
  } catch (err: any) {
    console.error("Erro ao buscar configurações de pagamento:", err);
    res.status(500).json({ error: err.message });
  }
});

router.put("/api/settings/payments", isAuthenticated, async (req, res) => {
  try {
    const settings = req.body;
    
    // Validar se o usuário é admin antes de permitir alterações
    const userId = req.session.userId;
    
    const userResult = await queryClient`
      SELECT role FROM users WHERE id = ${userId}
    `;
    
    const user = userResult[0];
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Apenas administradores podem alterar configurações" });
    }
    
    // Processar cada configuração
    const results = [];
    
    for (const [key, value] of Object.entries(settings)) {
      // Verificar se a configuração já existe
      const existingSetting = await drizzleDb.select()
        .from(schema.settings)
        .where(and(
          eq(schema.settings.category, 'payments'),
          eq(schema.settings.key, key)
        ))
        .limit(1);
      
      if (existingSetting.length > 0) {
        // Atualizar configuração existente
        const updated = await drizzleDb
          .update(schema.settings)
          .set({ 
            value: String(value),
            updatedAt: new Date()
          })
          .where(eq(schema.settings.id, existingSetting[0].id))
          .returning();
        
        results.push(updated[0]);
      } else {
        // Criar nova configuração
        const inserted = await drizzleDb
          .insert(schema.settings)
          .values({
            category: 'payments',
            key: key,
            value: String(value),
          })
          .returning();
        
        results.push(inserted[0]);
      }
    }
    
    res.json({ message: "Configurações de pagamento atualizadas com sucesso", settings: results });
  } catch (err: any) {
    console.error("Erro ao atualizar configurações de pagamento:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
