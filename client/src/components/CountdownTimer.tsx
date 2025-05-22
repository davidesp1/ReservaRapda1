import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { differenceInSeconds } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';

export interface CountdownTimerProps {
  expiryTime?: string; // Tempo de expiração no formato ISO
  endDate?: string;    // Data final no formato ISO
  reference?: string;  // Referência do pagamento para verificação
  onExpire?: () => void; // Função a ser chamada quando expirar
  expirationDate?: string; // Data de expiração no formato ISO
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
  expiryTime, 
  endDate, 
  reference,
  onExpire,
  expirationDate
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [timeRemaining, setTimeRemaining] = useState<{ hours: number, minutes: number, seconds: number }>({
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [isExpired, setIsExpired] = useState(false);
  
  // Verificar o status do pagamento a cada 10 segundos
  useEffect(() => {
    if (!reference) return;
    
    // Função para verificar o status
    const checkPaymentStatus = async () => {
      try {
        const response = await apiRequest('GET', `/api/payments/status/${reference}`);
        const data = await response.json();
        
        console.log('Status de pagamento:', data);
        
        // Se o pagamento foi confirmado, atualizar a UI
        if (data.status === 'paid' || data.estado === 'pago') {
          toast({
            title: t('PaymentConfirmed'),
            description: t('YourPaymentHasBeenConfirmed'),
          });
          
          // Invalidar as consultas para atualizar os dados
          queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
          
          // Se houver callback, chamar
          if (onExpire) {
            onExpire();
          }
        }
      } catch (error) {
        console.error('Erro ao verificar status do pagamento:', error);
      }
    };
    
    // Verificar o status imediatamente
    checkPaymentStatus();
    
    // Configurar intervalo para verificar a cada 10 segundos
    const interval = setInterval(checkPaymentStatus, 10000);
    
    // Limpar intervalo quando o componente for desmontado
    return () => clearInterval(interval);
  }, [reference, toast, t, onExpire]);
  
  // Calcular o tempo restante
  useEffect(() => {
    // Usar expirationDate se fornecido, ou endDate como fallback
    const finalDate = expirationDate || endDate || expiryTime;
    
    if (!finalDate) {
      console.error('Nenhuma data de expiração fornecida para o CountdownTimer');
      return;
    }
    
    const endTime = new Date(finalDate);
    
    const updateTimer = () => {
      const now = new Date();
      const diff = differenceInSeconds(endTime, now);
      
      if (diff <= 0) {
        setIsExpired(true);
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0 });
        
        // Se houver um callback para expiração, chamar
        if (onExpire) {
          onExpire();
        }
        return;
      }
      
      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;
      
      setTimeRemaining({ hours, minutes, seconds });
    };
    
    // Atualizar imediatamente
    updateTimer();
    
    // Atualizar a cada segundo
    const timerId = setInterval(updateTimer, 1000);
    
    return () => clearInterval(timerId);
  }, [expiryTime, endDate, expirationDate, onExpire]);
  
  // Formatar para exibição com leading zeros
  const formatTime = (time: number) => time.toString().padStart(2, '0');
  
  return (
    <div className="text-center">
      <h3 className="font-medium text-gray-800 mb-2">{t('RemainingTime')}</h3>
      {isExpired ? (
        <div className="text-red-600 font-bold">{t('Expired')}</div>
      ) : (
        <div className="text-2xl font-mono font-bold text-gray-800">
          {formatTime(timeRemaining.hours)}:{formatTime(timeRemaining.minutes)}:{formatTime(timeRemaining.seconds)}
        </div>
      )}
    </div>
  );
};

export default CountdownTimer;