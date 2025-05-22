import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, AlertTriangle, Clock } from 'lucide-react';
import { queryClient } from '@/lib/queryClient';

interface PaymentStatusMonitorProps {
  reference: string;
  initialStatus?: 'pending' | 'paid' | 'failed';
  onStatusChange?: (status: 'pending' | 'paid' | 'failed') => void;
}

const PaymentStatusMonitor: React.FC<PaymentStatusMonitorProps> = ({
  reference,
  initialStatus = 'pending',
  onStatusChange
}) => {
  const [status, setStatus] = useState<'pending' | 'paid' | 'failed'>(initialStatus);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (!reference || status === 'paid') return;

    console.log(`Monitorando pagamento com referência: ${reference}`);

    // Função para verificar o status atual
    const checkPaymentStatus = async () => {
      if (isChecking) return;
      
      try {
        setIsChecking(true);
        setError(null);
        
        console.log(`Verificando status do pagamento: ${reference}`);
        const response = await fetch(`/api/payments/status/${reference}`);
        
        if (!response.ok) {
          console.warn(`Erro na verificação de status: ${response.status}`);
          setError(`Erro ao verificar status (${response.status})`);
          setIsChecking(false);
          return;
        }
        
        // Primeiro obter o texto da resposta para validar
        let responseText = '';
        try {
          responseText = await response.text();
          
          // Verificar se o texto parece HTML
          if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
            console.warn('Resposta inválida recebida (HTML)');
            setError('Formato de resposta inválido');
            setIsChecking(false);
            return;
          }
          
          // Verificar se parece JSON antes de parsear
          if (!responseText.trim().startsWith('{')) {
            console.warn('Resposta não é um JSON válido');
            setError('Formato de resposta inválido');
            setIsChecking(false);
            return;
          }
          
          // Agora sim, parsear como JSON
          const data = JSON.parse(responseText);
          console.log('Status do pagamento:', data);
          
          // Verificar status
          if (data.status === 'paid' || data.estado === 'pago') {
            console.log('✅ Pagamento confirmado!');
            setStatus('paid');
            
            // Notificar componente pai
            if (onStatusChange) {
              onStatusChange('paid');
            }
            
            // Atualizar cache
            queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
          }
        } catch (error) {
          console.error('Erro ao processar resposta:', error);
          setError('Erro ao processar resposta');
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error);
        setError('Erro na comunicação');
      } finally {
        setIsChecking(false);
      }
    };
    
    // Verificar imediatamente
    checkPaymentStatus();
    
    // Configurar verificação periódica a cada 10 segundos
    const interval = setInterval(checkPaymentStatus, 10000);
    
    return () => clearInterval(interval);
  }, [reference, status, onStatusChange, isChecking]);
  
  // Se o pagamento foi confirmado
  if (status === 'paid') {
    return (
      <div className="flex flex-col items-center p-3 space-y-2 bg-green-50 rounded-md">
        <Check className="w-6 h-6 text-green-600" />
        <p className="font-medium text-green-800">{t('PaymentConfirmed')}</p>
        <p className="text-sm text-green-600">{t('ThankYouForYourPayment')}</p>
      </div>
    );
  }
  
  // Se houver erro
  if (error) {
    return (
      <div className="flex flex-col items-center p-3 space-y-2 bg-yellow-50 rounded-md">
        <AlertTriangle className="w-6 h-6 text-yellow-600" />
        <p className="font-medium text-yellow-800">{t('VerificationError')}</p>
        <p className="text-xs text-yellow-600">{error}</p>
        <button 
          onClick={() => setError(null)}
          className="px-3 py-1 text-xs text-yellow-600 border border-yellow-300 rounded hover:bg-yellow-100"
        >
          {t('TryAgain')}
        </button>
      </div>
    );
  }
  
  // Status padrão: pendente
  return (
    <div className="flex flex-col items-center p-3 space-y-2 bg-blue-50 rounded-md">
      <Clock className="w-6 h-6 text-blue-600" />
      <p className="font-medium text-blue-800">
        {t('WaitingForPayment')}
        {isChecking && (
          <span className="ml-2 inline-block w-3 h-3 border-2 border-t-transparent border-blue-500 rounded-full animate-spin"></span>
        )}
      </p>
      <p className="text-xs text-blue-600">{t('VerifyingAutomatically')}</p>
    </div>
  );
};

export default PaymentStatusMonitor;