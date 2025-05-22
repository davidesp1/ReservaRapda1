import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { differenceInSeconds } from 'date-fns';
import { Check, Clock } from 'lucide-react';
import { queryClient } from '@/lib/queryClient';

interface CountdownTimerProps {
  endTime?: string;
  reference?: string;
  paymentStatus?: 'pending' | 'paid';
  onStatusChange?: (status: 'pending' | 'paid') => void;
}

const FixedCountdownTimer: React.FC<CountdownTimerProps> = ({ 
  endTime, 
  reference,
  paymentStatus = 'pending',
  onStatusChange 
}) => {
  const { t } = useTranslation();
  const [timeRemaining, setTimeRemaining] = useState<{ hours: number, minutes: number, seconds: number }>({
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [isExpired, setIsExpired] = useState(false);
  const [status, setStatus] = useState<'pending' | 'paid'>(paymentStatus);
  const [isLoading, setIsLoading] = useState(false);
  
  // Verificar o status de pagamento
  useEffect(() => {
    if (!reference || status === 'paid') return;
    
    console.log(`Configurando verificação automática para pagamento: ${reference}`);
    
    // Função para verificar o status
    const checkStatus = async () => {
      try {
        setIsLoading(true);
        console.log(`Verificando status do pagamento: ${reference}`);
        
        const response = await fetch(`/api/payments/status/${reference}`);
        
        if (!response.ok) {
          console.warn(`Erro na verificação de status: ${response.status}`);
          setIsLoading(false);
          return;
        }
        
        let responseText;
        try {
          responseText = await response.text();
          
          // Verificar se é um JSON válido antes de parsear
          if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
            console.warn('Resposta HTML recebida, não é um JSON válido');
            setIsLoading(false);
            return;
          }
          
          // Tentar parsear somente se o texto parece ser JSON
          if (!responseText.trim().startsWith('{')) {
            console.warn('Resposta não é um JSON válido');
            setIsLoading(false);
            return;
          }
          
          const data = JSON.parse(responseText);
          console.log('Status recebido:', data);
          
          // Verificar se o pagamento foi confirmado
          if (data.status === 'paid' || data.estado === 'pago') {
            console.log('Pagamento confirmado!');
            setStatus('paid');
            
            // Notificar o componente pai se houver callback
            if (onStatusChange) {
              onStatusChange('paid');
            }
            
            // Atualizar dados em cache
            queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
          }
        } catch (error) {
          console.error('Erro ao processar resposta:', error);
        } finally {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error);
        setIsLoading(false);
      }
    };
    
    // Verificar imediatamente
    checkStatus();
    
    // Configurar verificação periódica a cada 10 segundos
    const interval = setInterval(checkStatus, 10000);
    
    // Limpar ao desmontar
    return () => clearInterval(interval);
  }, [reference, status, onStatusChange]);
  
  // Atualizar o contador regressivo
  useEffect(() => {
    if (!endTime) {
      // Se não há tempo definido, usar 72 horas a partir de agora (padrão para Multibanco)
      const defaultDate = new Date();
      defaultDate.setHours(defaultDate.getHours() + 72);
      endTime = defaultDate.toISOString();
    }
    
    const targetTime = new Date(endTime);
    
    const updateTimer = () => {
      const now = new Date();
      const diffInSeconds = differenceInSeconds(targetTime, now);
      
      if (diffInSeconds <= 0) {
        setIsExpired(true);
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      
      const hours = Math.floor(diffInSeconds / 3600);
      const minutes = Math.floor((diffInSeconds % 3600) / 60);
      const seconds = diffInSeconds % 60;
      
      setTimeRemaining({ hours, minutes, seconds });
    };
    
    updateTimer();
    const timerId = setInterval(updateTimer, 1000);
    
    return () => clearInterval(timerId);
  }, [endTime]);
  
  // Formatar números com zeros à esquerda
  const formatTime = (num: number) => num.toString().padStart(2, '0');
  
  // Se o pagamento foi confirmado, mostrar mensagem de sucesso
  if (status === 'paid') {
    return (
      <div className="flex flex-col items-center space-y-2 bg-green-50 p-3 rounded-md">
        <Check className="text-green-600 w-6 h-6" />
        <div className="text-green-800 font-medium">{t('PaymentConfirmed')}</div>
        <div className="text-green-600 text-sm">{t('ThankYouForYourPayment')}</div>
      </div>
    );
  }
  
  return (
    <div className="text-center space-y-1">
      <div className="font-medium flex items-center justify-center gap-1">
        <Clock className="w-4 h-4 text-yellow-600" />
        <span>{t('RemainingTime')}</span>
        {isLoading && (
          <span className="inline-block w-3 h-3 border-2 border-t-transparent border-yellow-500 rounded-full animate-spin ml-2"></span>
        )}
      </div>
      
      {isExpired ? (
        <div className="text-red-600 font-bold">{t('Expired')}</div>
      ) : (
        <div className="text-2xl font-mono font-semibold">
          {formatTime(timeRemaining.hours)}:{formatTime(timeRemaining.minutes)}:{formatTime(timeRemaining.seconds)}
        </div>
      )}
      
      <div className="text-xs text-gray-500">
        {t('VerifyingPaymentPeriodically')}
      </div>
    </div>
  );
};

export default FixedCountdownTimer;