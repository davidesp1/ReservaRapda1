import express from 'express';
import { storage } from '../storage';
import { validateBody } from '../middleware/validation';
import { updateDatabaseSettingsSchema } from '@shared/schema';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

/**
 * Obter as configurações do banco de dados
 */
router.get('/', async (req, res) => {
  try {
    const settings = await storage.getDatabaseSettings();
    
    // Por segurança, não enviar senhas para o frontend
    const safeSettings = settings ? {
      ...settings,
      supabaseKey: settings.supabaseKey ? '••••••••' : '',
      databasePassword: settings.databasePassword ? '••••••••' : ''
    } : null;
    
    res.json(safeSettings);
  } catch (error: any) {
    console.error('Erro ao buscar configurações do banco de dados:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Atualizar as configurações do banco de dados
 */
router.post('/', validateBody(updateDatabaseSettingsSchema), async (req, res) => {
  try {
    const updatedSettings = await storage.updateDatabaseSettings(req.body);
    
    // Por segurança, não enviar senhas para o frontend
    const safeSettings = {
      ...updatedSettings,
      supabaseKey: updatedSettings.supabaseKey ? '••••••••' : '',
      databasePassword: updatedSettings.databasePassword ? '••••••••' : ''
    };
    
    res.json(safeSettings);
  } catch (error: any) {
    console.error('Erro ao atualizar configurações do banco de dados:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;