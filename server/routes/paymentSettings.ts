import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { validate } from '../middleware/validate';
import { updatePaymentSettingsSchema } from '@shared/schema';

const router = Router();

/**
 * GET /api/settings/payment
 * Obter configurações de pagamento
 */
router.get('/', async (req, res) => {
  try {
    const settings = await storage.getPaymentSettings();
    
    if (!settings) {
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
    
    return res.json({
      eupagoApiKey: settings.eupagoApiKey,
      enabledPaymentMethods: {
        card: settings.enableCard,
        mbway: settings.enableMbway,
        multibanco: settings.enableMultibanco,
        bankTransfer: settings.enableBankTransfer,
        cash: settings.enableCash
      }
    });
  } catch (error) {
    console.error('Erro ao obter configurações de pagamento:', error);
    res.status(500).json({ message: 'Erro ao obter configurações de pagamento' });
  }
});

/**
 * POST /api/settings/payment
 * Salvar configurações de pagamento
 */
router.post('/', validate(updatePaymentSettingsSchema), async (req, res) => {
  try {
    const { eupagoApiKey, enabledPaymentMethods } = req.body;
    
    const settings = await storage.upsertPaymentSettings({
      eupagoApiKey,
      enableCard: enabledPaymentMethods.card,
      enableMbway: enabledPaymentMethods.mbway,
      enableMultibanco: enabledPaymentMethods.multibanco,
      enableBankTransfer: enabledPaymentMethods.bankTransfer,
      enableCash: enabledPaymentMethods.cash
    });
    
    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Erro ao salvar configurações de pagamento:', error);
    res.status(500).json({ message: 'Erro ao salvar configurações de pagamento' });
  }
});

/**
 * POST /api/settings/payment/test
 * Testar conexão com API EuPago
 */
router.post('/test', validate(z.object({ apiKey: z.string() })), async (req, res) => {
  try {
    const { apiKey } = req.body;
    
    // Implementação simples para teste - em produção usaria o cliente real EuPago
    // Considerar mover para um serviço dedicado em produção
    if (!apiKey) {
      return res.status(400).json({ message: 'Chave de API não fornecida' });
    }
    
    // Simular teste de conexão - esta parte seria substituída pela chamada real à API
    const isValid = apiKey.length >= 8;
    
    if (!isValid) {
      return res.status(400).json({ message: 'Chave de API inválida' });
    }
    
    // Em um caso real, faríamos uma chamada à API para verificar a validade da chave
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao testar conexão com EuPago:', error);
    res.status(500).json({ message: 'Erro ao testar conexão com EuPago' });
  }
});

export default router;