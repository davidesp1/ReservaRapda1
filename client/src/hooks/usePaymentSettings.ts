import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

export type PaymentSettings = {
  id?: number;
  eupago_api_key: string | null;
  enabled_methods: string[];
  created_at?: string;
  updated_at?: string;
};

export type PaymentSettingsHook = {
  settings: PaymentSettings | null;
  isLoading: boolean;
  error: string | null;
  updateSettings: (newSettings: Partial<PaymentSettings>) => Promise<void>;
  hasValidApiKey: boolean;
};

/**
 * Hook personalizado para gerenciar configurações de pagamento com Supabase Realtime
 * 
 * Funcionalidades:
 * - Carrega configurações iniciais do banco
 * - Escuta mudanças em tempo real
 * - Valida API Key automaticamente
 * - Fornece função para atualizar configurações
 */
export function usePaymentSettings(): PaymentSettingsHook {
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar configurações do banco
  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 [usePaymentSettings] Iniciando requisição...');
      
      const response = await fetch('/api/payment-settings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include' // Importante para incluir cookies de sessão
      });
      
      console.log('🔍 [usePaymentSettings] Response status:', response.status);
      console.log('🔍 [usePaymentSettings] Response ok:', response.ok);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Não autenticado - Faça login como administrador');
        }
        if (response.status === 403) {
          throw new Error('Acesso negado - Apenas administradores podem acessar');
        }
        throw new Error(`Erro HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ [usePaymentSettings] Dados recebidos:', data);
      
      setSettings(data);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('❌ [usePaymentSettings] Erro:', errorMessage);
      setError(errorMessage);
      setSettings(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Polling para simular realtime (alternativa mais simples)
  const setupPolling = () => {
    const interval = setInterval(() => {
      fetchSettings();
    }, 5000); // Atualizar a cada 5 segundos
    
    return interval;
  };

  // Função para atualizar configurações
  const updateSettings = async (newSettings: Partial<PaymentSettings>) => {
    try {
      console.log('💾 [usePaymentSettings] Salvando:', newSettings);

      const dataToSave = {
        eupago_api_key: newSettings.eupago_api_key?.trim() || '',
        enabled_methods: newSettings.enabled_methods || []
      };

      const response = await fetch('/api/payment-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(dataToSave)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
        throw new Error(errorData.message || `Erro HTTP ${response.status}`);
      }
      
      const updatedSettings = await response.json();
      console.log('✅ [usePaymentSettings] Salvo com sucesso:', updatedSettings);
      
      // Atualizar estado local
      setSettings(updatedSettings);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar configurações';
      console.error('❌ [usePaymentSettings] Erro ao salvar:', errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Validar se a API Key é válida
  const hasValidApiKey = Boolean(
    settings?.eupago_api_key && 
    settings.eupago_api_key.trim().length > 0
  );

  // Carregar configurações na inicialização
  useEffect(() => {
    console.log('🚀 [usePaymentSettings] Hook inicializando...');
    fetchSettings();
  }, []);

  // Polling simples para atualizações (opcional)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading) {
        fetchSettings();
      }
    }, 30000); // Atualizar a cada 30 segundos

    return () => clearInterval(interval);
  }, [isLoading]);

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    hasValidApiKey
  };
}