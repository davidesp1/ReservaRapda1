import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PaymentStatusMonitorProps {
  reference?: string;
  initialStatus?: 'pending' | 'paid';
  onStatusChange?: (status: 'pending' | 'paid') => void;
}

const PaymentStatusMonitor: React.FC<PaymentStatusMonitorProps> = ({
  reference,
  initialStatus = 'pending',
  onStatusChange
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [status, setStatus] = useState<'pending' | 'paid'>(initialStatus);
  const [loading, setLoading] = useState(false);
  const [nextCheck, setNextCheck] = useState(10);
  
  // Atualizar a UI quando o status mudar
  useEffect(() => {
    if (onStatusChange && status !== initialStatus) {
      onStatusChange(status);
    }
  }, [status, initialStatus, onStatusChange]);
  
  // Verificador automático a cada 10 segundos
  useEffect(() => {
    // Se já está pago ou não tem referência, não verificar
    if (status === 'paid' || !reference) return;
    
    console.log(`[Monitor] Iniciando monitoramento do pagamento: ${reference}`);
    
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
          setLoading(false);
          return;
        }
        
        // Processar resposta com tratamento para JSON inválido
        let data;
        try {
          const text = await response.text();
          // Verificar se é um JSON válido antes de parsear
          if (text.trim().startsWith('{') && text.includes('}')) {
            data = JSON.parse(text);
          } else {
            console.warn(`[Monitor] Resposta não é JSON válido: ${text.substring(0, 100)}`);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error('[Monitor] Erro ao parsear resposta:', e);
          setLoading(false);
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
            description: t('YourPaymentHasBeenConfirmed')
          });
        }
        
        setLoading(false);
      } catch (error) {
        console.error('[Monitor] Erro ao verificar status:', error);
        setLoading(false);
      }
    };
    
    // Verificar imediatamente
    checkStatus();
    
    // Configurar contador regressivo para próxima verificação
    const countdownInterval = setInterval(() => {
      setNextCheck(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          // Resetar para 10 segundos
          setTimeout(() => setNextCheck(10), 100);
          // Verificar novamente
          checkStatus();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Limpar ao desmontar
    return () => {
      clearInterval(countdownInterval);
    };
  }, [reference, status, t, toast]);
  
  // Verificação manual
  const checkNow = async () => {
    if (!reference) return;
    
    try {
      setLoading(true);
      setNextCheck(10);
      
      const response = await fetch(`/api/payments/status/${reference}`);
      
      if (!response.ok) {
        toast({
          title: t('Error'),
          description: t('CouldNotVerifyPayment'),
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
      
      // Tratamento seguro para JSON possivelmente inválido
      let data;
      try {
        const text = await response.text();
        // Verificar se a resposta começa e termina com chaves (JSON)
        if (text.trim().startsWith('{') && text.includes('}')) {
          data = JSON.parse(text);
        } else {
          toast({
            title: t('Error'),
            description: t('InvalidResponseFormat'),
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
      } catch (e) {
        toast({
          title: t('Error'),
          description: t('CouldNotProcessResponse'),
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
      
      if (data.status === 'paid' || data.estado === 'pago') {
        setStatus('paid');
        
        toast({
          title: t('PaymentConfirmed'),
          description: t('YourPaymentHasBeenConfirmed')
        });
      } else {
        toast({
          title: t('PaymentPending'),
          description: t('PaymentNotYetConfirmed')
        });
      }
    } catch (error) {
      console.error('[Monitor] Erro na verificação manual:', error);
      
      toast({
        title: t('Error'),
        description: t('CheckFailed'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col items-center space-y-3">
      <div className="text-center">
        <h3 className="font-semibold text-gray-800">{t('PaymentStatus')}</h3>
        
        {status === 'paid' ? (
          <div className="flex items-center justify-center mt-2 text-green-600">
            <CheckCircle className="mr-2 h-5 w-5" />
            <span>{t('Confirmed')}</span>
          </div>
        ) : (
          <div className="flex items-center justify-center mt-2 text-yellow-600">
            <AlertCircle className="mr-2 h-5 w-5" />
            <span>{t('Pending')}</span>
          </div>
        )}
      </div>
      
      {status === 'pending' && (
        <div className="flex flex-col items-center">
          <div className="text-sm text-gray-500 mb-2">
            {t('NextCheck')}: {nextCheck}s
          </div>
          
          <Button 
            size="sm"
            variant="outline"
            onClick={checkNow}
            disabled={loading}
            className="flex items-center"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <></>
            )}
            {t('CheckNow')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default PaymentStatusMonitor;