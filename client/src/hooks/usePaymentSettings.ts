import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

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
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);

  // Função para buscar configurações do banco
  const fetchSettings = async () => {
    try {
      console.log('🔍 [usePaymentSettings] Carregando configurações...');
      
      const { data, error } = await supabase
        .from('payment_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('❌ [usePaymentSettings] Erro ao carregar:', error);
        throw error;
      }

      if (data && data.length > 0) {
        const currentSettings = data[0];
        console.log('✅ [usePaymentSettings] Configurações carregadas:', currentSettings);
        
        setSettings({
          id: currentSettings.id,
          eupago_api_key: currentSettings.eupago_api_key,
          enabled_methods: currentSettings.enabled_methods || [],
          created_at: currentSettings.created_at,
          updated_at: currentSettings.updated_at
        });
      } else {
        console.log('ℹ️ [usePaymentSettings] Nenhuma configuração encontrada');
        setSettings({
          eupago_api_key: null,
          enabled_methods: []
        });
      }
      
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('❌ [usePaymentSettings] Erro na busca:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Configurar Realtime subscription
  const setupRealtimeSubscription = () => {
    try {
      console.log('🔴 [usePaymentSettings] Configurando subscription Realtime...');
      
      const channel = supabase
        .channel('payment_settings_changes')
        .on(
          'postgres_changes',
          {
            event: '*', // INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'payment_settings'
          },
          (payload) => {
            console.log('🔄 [usePaymentSettings] Mudança detectada:', payload);
            
            switch (payload.eventType) {
              case 'INSERT':
              case 'UPDATE':
                if (payload.new) {
                  console.log('✅ [usePaymentSettings] Atualizando configurações via Realtime');
                  setSettings({
                    id: payload.new.id,
                    eupago_api_key: payload.new.eupago_api_key,
                    enabled_methods: payload.new.enabled_methods || [],
                    created_at: payload.new.created_at,
                    updated_at: payload.new.updated_at
                  });
                }
                break;
              case 'DELETE':
                console.log('🗑️ [usePaymentSettings] Configuração deletada via Realtime');
                setSettings({
                  eupago_api_key: null,
                  enabled_methods: []
                });
                break;
            }
          }
        )
        .subscribe((status) => {
          console.log(`📡 [usePaymentSettings] Status da subscription: ${status}`);
        });

      setRealtimeChannel(channel);
      return channel;
    } catch (err) {
      console.error('❌ [usePaymentSettings] Erro ao configurar Realtime:', err);
      return null;
    }
  };

  // Função para atualizar configurações
  const updateSettings = async (newSettings: Partial<PaymentSettings>) => {
    try {
      console.log('💾 [usePaymentSettings] Salvando configurações:', newSettings);

      const dataToSave = {
        eupago_api_key: newSettings.eupago_api_key?.trim() || null,
        enabled_methods: newSettings.enabled_methods || [],
        updated_at: new Date().toISOString()
      };

      let result;
      
      if (settings?.id) {
        // Update existente
        result = await supabase
          .from('payment_settings')
          .update(dataToSave)
          .eq('id', settings.id)
          .select();
      } else {
        // Insert novo
        result = await supabase
          .from('payment_settings')
          .insert([{
            ...dataToSave,
            created_at: new Date().toISOString()
          }])
          .select();
      }

      const { data, error } = result;

      if (error) {
        console.error('❌ [usePaymentSettings] Erro ao salvar:', error);
        throw error;
      }

      console.log('✅ [usePaymentSettings] Configurações salvas com sucesso:', data);
      
      // O Realtime irá atualizar automaticamente o estado
      // Mas atualizamos localmente para feedback imediato
      if (data && data.length > 0) {
        setSettings(prev => ({
          ...prev,
          ...data[0]
        }));
      }
      
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

  // Efeito para carregar configurações iniciais e configurar Realtime
  useEffect(() => {
    let mounted = true;
    let channel: RealtimeChannel | null = null;

    const initialize = async () => {
      if (!mounted) return;
      
      // Carregar configurações iniciais
      await fetchSettings();
      
      if (!mounted) return;
      
      // Configurar subscription Realtime
      channel = setupRealtimeSubscription();
    };

    initialize();

    // Cleanup function
    return () => {
      mounted = false;
      if (channel) {
        console.log('🧹 [usePaymentSettings] Limpando subscription Realtime');
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      if (realtimeChannel) {
        console.log('🧹 [usePaymentSettings] Cleanup final da subscription');
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [realtimeChannel]);

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    hasValidApiKey
  };
}