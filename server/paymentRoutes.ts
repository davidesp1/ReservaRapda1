import express from "express";
import { queryClient } from "./db";

interface PaymentSettings {
  id?: number;
  eupago_api_key: string | null;
  enabled_methods: string[];
}

// Middleware de autenticação
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Não autenticado" });
  }
  next();
};

// Middleware para admin
const requireAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Não autenticado" });
  }
  
  try {
    const user = await queryClient`SELECT role FROM users WHERE id = ${req.session.userId}`;
    if (user.length === 0 || user[0].role !== 'admin') {
      return res.status(403).json({ message: "Acesso negado - Apenas administradores" });
    }
    next();
  } catch (error) {
    console.error('Erro ao verificar permissões admin:', error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
};

export function registerPaymentRoutes(app: express.Application) {
  console.log('🔧 Registrando rotas de configuração de pagamento...');

  // GET - Buscar configurações de pagamento
  app.get('/api/payment-settings', requireAdmin, async (req, res) => {
    try {
      console.log('🔍 [GET /api/payment-settings] Iniciando busca...');
      
      const result = await queryClient`
        SELECT * FROM payment_settings 
        ORDER BY id DESC 
        LIMIT 1
      `;
      
      console.log('🔍 [GET /api/payment-settings] Resultado da query:', result);
      
      if (result.length > 0) {
        const settings = result[0];
        
        // Converter campos booleanos para array de métodos habilitados
        const enabledMethods = [];
        if (settings.enable_card) enabledMethods.push('card');
        if (settings.enable_mbway) enabledMethods.push('mbway');
        if (settings.enable_multibanco) enabledMethods.push('multibanco');
        if (settings.enable_bank_transfer) enabledMethods.push('transfer');
        if (settings.enable_cash) enabledMethods.push('cash');
        if (settings.enable_multibanco_tpa) enabledMethods.push('multibanco_tpa');
        
        const response: PaymentSettings = {
          id: settings.id,
          eupago_api_key: settings.eupago_api_key,
          enabled_methods: enabledMethods
        };
        
        console.log('✅ [GET /api/payment-settings] Resposta formatada:', response);
        res.json(response);
      } else {
        console.log('ℹ️ [GET /api/payment-settings] Nenhuma configuração encontrada');
        const response: PaymentSettings = {
          eupago_api_key: null,
          enabled_methods: []
        };
        res.json(response);
      }
    } catch (error) {
      console.error('❌ [GET /api/payment-settings] Erro:', error);
      res.status(500).json({ 
        message: 'Erro ao buscar configurações de pagamento',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  // POST - Salvar configurações de pagamento
  app.post('/api/payment-settings', requireAdmin, async (req, res) => {
    try {
      console.log('💾 [POST /api/payment-settings] Dados recebidos:', req.body);
      
      const { eupago_api_key, enabled_methods } = req.body;
      
      // Validações
      if (!eupago_api_key || typeof eupago_api_key !== 'string' || eupago_api_key.trim() === '') {
        return res.status(400).json({ message: 'API Key da Eupago é obrigatória' });
      }

      if (!Array.isArray(enabled_methods)) {
        return res.status(400).json({ message: 'enabled_methods deve ser um array' });
      }

      // Converter array para campos booleanos
      const enable_card = enabled_methods.includes('card');
      const enable_mbway = enabled_methods.includes('mbway');
      const enable_multibanco = enabled_methods.includes('multibanco');
      const enable_bank_transfer = enabled_methods.includes('transfer');
      const enable_cash = enabled_methods.includes('cash');
      const enable_multibanco_tpa = enabled_methods.includes('multibanco_tpa');

      console.log('💾 [POST /api/payment-settings] Flags convertidos:', {
        enable_card, enable_mbway, enable_multibanco, 
        enable_bank_transfer, enable_cash, enable_multibanco_tpa
      });

      // Verificar se já existe configuração
      const existing = await queryClient`SELECT id FROM payment_settings LIMIT 1`;
      
      if (existing.length > 0) {
        // Atualizar configuração existente
        console.log('🔄 [POST /api/payment-settings] Atualizando configuração existente...');
        
        const result = await queryClient`
          UPDATE payment_settings SET 
            eupago_api_key = ${eupago_api_key},
            enable_card = ${enable_card},
            enable_mbway = ${enable_mbway},
            enable_multibanco = ${enable_multibanco},
            enable_bank_transfer = ${enable_bank_transfer},
            enable_cash = ${enable_cash},
            enable_multibanco_tpa = ${enable_multibanco_tpa},
            updated_at = NOW()
          WHERE id = ${existing[0].id}
          RETURNING *
        `;
        
        console.log('✅ [POST /api/payment-settings] Configuração atualizada:', result[0]);
        
        const response: PaymentSettings = {
          id: result[0].id,
          eupago_api_key: result[0].eupago_api_key,
          enabled_methods: enabled_methods
        };
        
        res.json(response);
      } else {
        // Criar nova configuração
        console.log('➕ [POST /api/payment-settings] Criando nova configuração...');
        
        const result = await queryClient`
          INSERT INTO payment_settings (
            eupago_api_key, enable_card, enable_mbway, enable_multibanco,
            enable_bank_transfer, enable_cash, enable_multibanco_tpa, 
            currency, tax_rate, require_prepayment, prepayment_amount, 
            show_prices_with_tax, updated_at
          ) VALUES (
            ${eupago_api_key}, ${enable_card}, ${enable_mbway}, ${enable_multibanco},
            ${enable_bank_transfer}, ${enable_cash}, ${enable_multibanco_tpa},
            'EUR', 23, false, 0, true, NOW()
          ) RETURNING *
        `;
        
        console.log('✅ [POST /api/payment-settings] Nova configuração criada:', result[0]);
        
        const response: PaymentSettings = {
          id: result[0].id,
          eupago_api_key: result[0].eupago_api_key,
          enabled_methods: enabled_methods
        };
        
        res.json(response);
      }
    } catch (error) {
      console.error('❌ [POST /api/payment-settings] Erro:', error);
      res.status(500).json({ 
        message: 'Erro ao salvar configurações de pagamento',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  console.log('✅ Rotas de configuração de pagamento registradas com sucesso!');
}