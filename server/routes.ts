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
import databaseSettingsRouter from "./routes/databaseSettings";

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

// Rota para categorias do menu
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

// Rotas para configurações do banco de dados
router.use("/api/database-settings", isAuthenticated, databaseSettingsRouter);

export default router;
