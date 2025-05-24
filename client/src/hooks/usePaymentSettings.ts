import { useState, useEffect } from 'react';
import { apiRequest, queryClient } from '@/lib/queryClient';

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
    try {
      console.log('🔍 [usePaymentSettings] Carregando configurações...');
      
      const response = await apiRequest('GET', '/api/payment-settings');
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ [usePaymentSettings] Configurações carregadas:', data);
      
      setSettings(data);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('❌ [usePaymentSettings] Erro na busca:', errorMessage);
      setError(errorMessage);
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
      console.log('💾 [usePaymentSettings] Salvando configurações:', newSettings);

      const dataToSave = {
        eupago_api_key: newSettings.eupago_api_key?.trim() || '',
        enabled_methods: newSettings.enabled_methods || []
      };

      const response = await apiRequest('POST', '/api/payment-settings', dataToSave);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao salvar configurações');
      }
      
      const updatedSettings = await response.json();
      console.log('✅ [usePaymentSettings] Configurações salvas com sucesso:', updatedSettings);
      
      // Atualizar estado local imediatamente
      setSettings(updatedSettings);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar configurações';
      console.error('❌ [usePaymentSettings] Erro na atualização:', errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Validar se a API Key é válida
  const hasValidApiKey = Boolean(
    settings?.eupago_api_key && 
    settings.eupago_api_key.trim().length > 0
  );

  // Efeito para carregar configurações iniciais e configurar polling
  useEffect(() => {
    let mounted = true;
    let pollingInterval: NodeJS.Timeout | null = null;

    const initialize = async () => {
      if (!mounted) return;
      
      // Carregar configurações iniciais
      await fetchSettings();
      
      if (!mounted) return;
      
      // Configurar polling para atualizações
      pollingInterval = setupPolling();
    };

    initialize();

    // Cleanup function
    return () => {
      mounted = false;
      if (pollingInterval) {
        console.log('🧹 [usePaymentSettings] Limpando polling');
        clearInterval(pollingInterval);
      }
    };
  }, []);

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    hasValidApiKey
  };
}