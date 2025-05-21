import express from 'express';
import { storage } from '../storage';
import { updatePaymentSettingsSchema } from '@shared/schema';
import { zodMiddleware } from '../middleware/zod';

const router = express.Router();

// Rota para obter as configurações de pagamento
router.get('/api/settings/payment', async (req, res) => {
  try {
    // Buscar configurações de pagamento
    const paymentSettings = await storage.getPaymentSettings();
    
    // Se não existir nenhuma configuração, retornar valores padrão
    if (!paymentSettings) {
      return res.json({
        eupagoApiKey: '',
        enabledPaymentMethods: {
          card: true,
          mbway: true,
          multibanco: true,
          bankTransfer: true,
          cash: true
        }
      });
    }
    
    // Transformar o formato do banco para o formato da API
    const response = {
      eupagoApiKey: paymentSettings.eupagoApiKey,
      enabledPaymentMethods: {
        card: paymentSettings.enableCard,
        mbway: paymentSettings.enableMbway,
        multibanco: paymentSettings.enableMultibanco,
        bankTransfer: paymentSettings.enableBankTransfer,
        cash: paymentSettings.enableCash
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar configurações de pagamento:', error);
    res.status(500).json({ message: 'Erro ao buscar configurações de pagamento' });
  }
});

// Middleware de validação com Zod
const validatePaymentSettings = zodMiddleware(updatePaymentSettingsSchema);

// Rota para atualizar as configurações de pagamento
router.put('/api/settings/payment', validatePaymentSettings, async (req, res) => {
  try {
    const { eupagoApiKey, enabledPaymentMethods } = req.body;
    
    // Verificar se o usuário é admin
    const user = req.user as any;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem atualizar configurações.' });
    }
    
    // Transformar para o formato do banco de dados
    const paymentSettingsData = {
      eupagoApiKey,
      enableCard: enabledPaymentMethods.card,
      enableMbway: enabledPaymentMethods.mbway,
      enableMultibanco: enabledPaymentMethods.multibanco,
      enableBankTransfer: enabledPaymentMethods.bankTransfer,
      enableCash: enabledPaymentMethods.cash
    };
    
    // Atualizar ou criar as configurações
    const updatedSettings = await storage.updatePaymentSettings(paymentSettingsData);
    
    res.json({
      success: true,
      message: 'Configurações de pagamento atualizadas com sucesso',
      data: {
        eupagoApiKey: updatedSettings.eupagoApiKey,
        enabledPaymentMethods: {
          card: updatedSettings.enableCard,
          mbway: updatedSettings.enableMbway,
          multibanco: updatedSettings.enableMultibanco,
          bankTransfer: updatedSettings.enableBankTransfer,
          cash: updatedSettings.enableCash
        }
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar configurações de pagamento:', error);
    res.status(500).json({ message: 'Erro ao atualizar configurações de pagamento' });
  }
});

export default router;