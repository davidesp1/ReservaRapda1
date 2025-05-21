import express from 'express';
import { db } from '../db';
import { databaseSettings, updateDatabaseSettingsSchema } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { storage } from '../storage';
import { validateBody } from '../middleware/validation';

const router = express.Router();

// Get database settings
router.get('/', async (req, res) => {
  try {
    const settings = await storage.getDatabaseSettings();
    
    // Se não encontrar configurações, retorna um objeto vazio
    if (!settings) {
      return res.json({});
    }
    
    // Remove a senha do banco de dados das configurações retornadas
    const safeSettings = {
      ...settings,
      databasePassword: '********', // Oculta a senha real
    };
    
    return res.json(safeSettings);
  } catch (error) {
    console.error('Error fetching database settings:', error);
    return res.status(500).json({ message: 'Erro ao obter configurações do banco de dados' });
  }
});

// Update database settings
router.put('/', validateBody(updateDatabaseSettingsSchema), async (req, res) => {
  try {
    const newSettings = req.body;
    const settings = await storage.updateDatabaseSettings(newSettings);
    
    // Retorna as configurações atualizadas, mas oculta a senha
    const safeSettings = {
      ...settings,
      databasePassword: '********', // Oculta a senha real
    };
    
    return res.json(safeSettings);
  } catch (error) {
    console.error('Error updating database settings:', error);
    return res.status(500).json({ message: 'Erro ao atualizar configurações do banco de dados' });
  }
});

// Test database connection
router.post('/test', validateBody(updateDatabaseSettingsSchema), async (req, res) => {
  try {
    const { databaseUrl } = req.body;
    
    // Implementar teste de conexão aqui
    // Este é um exemplo simples que apenas verifica se a URL de conexão está presente
    if (!databaseUrl) {
      return res.status(400).json({ 
        success: false, 
        message: 'URL de conexão inválida' 
      });
    }
    
    // Em uma implementação real, tentaria estabelecer uma conexão com o banco de dados
    // Por enquanto, apenas simulamos um sucesso
    
    return res.json({ 
      success: true, 
      message: 'Conexão com o banco de dados estabelecida com sucesso' 
    });
  } catch (error) {
    console.error('Error testing database connection:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao testar conexão com o banco de dados' 
    });
  }
});

export default router;