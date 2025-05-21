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
    
    // Verificar se o usuário é admin
    const userResult = await queryClient`
      SELECT role FROM users WHERE id = ${userId}
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
    
    // Converter os valores para certeza de tipo
    // Se não houver API key, forçar métodos de pagamento EuPago como false
    const cardValue = hasApiKey ? settings.acceptCard === true : false;
    const mbwayValue = hasApiKey ? settings.acceptMBWay === true : false;
    const multibancoValue = hasApiKey ? settings.acceptMultibanco === true : false;
    
    // Métodos que não dependem da API key do EuPago
    const bankTransferValue = settings.acceptBankTransfer === true;
    const cashValue = settings.acceptCash === true;
    
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
