import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

/**
 * Hook para monitorar o status de pagamento automaticamente
 * @param reference Referência de pagamento para consultar
 * @param initialStatus Status inicial do pagamento
 * @returns Estado atual do pagamento e funções para gerenciá-lo
 */
export function usePaymentStatus(reference: string | undefined, initialStatus: 'pending' | 'paid' = 'pending') {
  const [status, setStatus] = useState<'pending' | 'paid'>(initialStatus);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const { toast } = useToast();
  
  // Efeito para verificar status a cada 10 segundos
  useEffect(() => {
    // Se não houver referência, não fazer nada
    if (!reference) return;
    
    // Se já está pago, não precisa verificar
    if (status === 'paid') return;
    
    console.log(`[Monitor] Iniciando monitoramento de pagamento: ${reference}`);
    
    // Função para verificar o status
    const checkStatus = async () => {
      try {
        setLoading(true);
        
        // Buscar status atualizado
        const response = await fetch(`/api/payments/status/${reference}`);
        
        // Tratar erro de resposta
        if (!response.ok) {
          const text = await response.text();
          console.warn(`[Monitor] Erro ao verificar status: ${text.substring(0, 100)}`);
          return;
        }
        
        // Processar resposta com tratamento para JSON inválido
        let data;
        try {
          const text = await response.text();
          // Verificar se é um JSON válido antes de parsear
          if (text.trim().startsWith('{') && text.trim().endsWith('}')) {
            data = JSON.parse(text);
          } else {
            console.warn(`[Monitor] Resposta não é JSON válido: ${text.substring(0, 100)}`);
            return;
          }
        } catch (e) {
          console.error('[Monitor] Erro ao parsear resposta:', e);
          return;
        }
        
        console.log(`[Monitor] Status atual: ${data.status || data.estado || 'desconhecido'}`);
        
        // Verificar se pagamento foi confirmado
        if (data.status === 'paid' || data.estado === 'pago') {
          console.log('[Monitor] Pagamento confirmado!');
          
          // Atualizar estado local
          setStatus('paid');
          
          // Notificar usuário
          toast({
            title: t('PaymentConfirmed'),
            description: t('PaymentConfirmedDescription')
          });
          
          // Atualizar dados no cache
          queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
        }
      } catch (error) {
        console.error('[Monitor] Erro ao verificar status:', error);
      } finally {
        setLoading(false);
      }
    };
    
    // Verificar imediatamente
    checkStatus();
    
    // Configurar verificação periódica
    const interval = setInterval(checkStatus, 10000);
    
    // Limpar ao desmontar
    return () => clearInterval(interval);
  }, [reference, status, t, toast]);
  
  // Função para forçar verificação manual
  const checkNow = async () => {
    // Implementação similar à verificação automática
    // mas sem configurar intervalo
    if (!reference) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/payments/status/${reference}`);
      
      if (!response.ok) {
        const text = await response.text();
        console.warn(`Erro ao verificar status: ${text.substring(0, 100)}`);
        return;
      }
      
      let data;
      try {
        const text = await response.text();
        if (text.trim().startsWith('{') && text.trim().endsWith('}')) {
          data = JSON.parse(text);
        } else {
          console.warn(`Resposta não é JSON válido: ${text.substring(0, 100)}`);
          return;
        }
      } catch (e) {
        console.error('Erro ao parsear resposta:', e);
        return;
      }
      
      if (data.status === 'paid' || data.estado === 'pago') {
        setStatus('paid');
        
        toast({
          title: t('PaymentConfirmed'),
          description: t('PaymentConfirmedDescription')
        });
        
        queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
      } else {
        toast({
          title: t('PaymentPending'),
          description: t('PaymentPendingDescription')
        });
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      
      toast({
        title: t('Error'),
        description: t('PaymentStatusCheckError'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  return {
    status,
    loading,
    checkNow,
    isPaid: status === 'paid'
  };
}