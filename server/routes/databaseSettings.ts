import express from 'express';
import { storage } from '../storage';
import { validateBody } from '../middleware/validation';
import { updateDatabaseSettingsSchema } from '@shared/schema';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import postgres from 'postgres';

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

/**
 * Testar a conexão com o banco de dados
 */
router.post('/test', validateBody(updateDatabaseSettingsSchema), async (req, res) => {
  try {
    const { 
      supabaseUrl, 
      supabaseKey, 
      databaseUrl, 
      databaseHost, 
      databasePort, 
      databaseName, 
      databaseUser, 
      databasePassword 
    } = req.body;

    // Validação básica das entradas
    if (!supabaseUrl || !supabaseKey) {
      return res.status(400).json({
        success: false,
        message: 'URL e chave do Supabase são obrigatórios'
      });
    }

    // Teste da conexão com o Supabase
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase.from('users').select('count').limit(1);
      
      if (error) {
        throw new Error(`Erro na conexão com Supabase: ${error.message}`);
      }
    } catch (supabaseError: any) {
      console.error('Erro ao testar conexão com Supabase:', supabaseError);
      return res.status(400).json({
        success: false,
        message: `Falha na conexão com Supabase: ${supabaseError.message}`
      });
    }

    // Teste da conexão direta com o PostgreSQL
    try {
      const sql = postgres(databaseUrl, {
        host: databaseHost,
        port: parseInt(databasePort),
        database: databaseName,
        username: databaseUser,
        password: databasePassword,
        ssl: true,
        max: 1, // Usar apenas uma conexão para o teste
        idle_timeout: 10, // Fechar conexão após 10 segundos de inatividade
        connect_timeout: 10, // Timeout de conexão de 10 segundos
      });

      // Testa a conexão com uma query simples
      await sql`SELECT 1 as test`;
      await sql.end();
    } catch (pgError: any) {
      console.error('Erro ao testar conexão direta com PostgreSQL:', pgError);
      return res.status(400).json({
        success: false,
        message: `Falha na conexão direta com PostgreSQL: ${pgError.message}`
      });
    }

    // Todos os testes passaram
    return res.json({
      success: true,
      message: 'Conexão com o banco de dados testada com sucesso!'
    });
  } catch (error: any) {
    console.error('Erro ao testar conexão com banco de dados:', error);
    res.status(500).json({
      success: false,
      message: `Erro inesperado: ${error.message}`
    });
  }
});

export default router;