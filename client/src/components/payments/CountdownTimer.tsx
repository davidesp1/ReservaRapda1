import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, AlertTriangle } from 'lucide-react';
import { useCancelPayment } from '@/hooks/usePayment';
import { useToast } from '@/hooks/use-toast';

interface CountdownTimerProps {
  expirationDate: string;
  reference: string;
  onExpire?: () => void;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ expirationDate, reference, onExpire }) => {
  const { t } = useTranslation();
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const cancelPaymentMutation = useCancelPayment();
  const { toast } = useToast();

  useEffect(() => {
    if (!expirationDate) return;
    
    const calculateRemainingTime = () => {
      const now = new Date();
      const expiration = new Date(expirationDate);
      const diff = Math.max(0, expiration.getTime() - now.getTime());
      
      setRemainingTime(diff);
      
      // Se o tempo expirou
      if (diff <= 0 && !isExpired) {
        setIsExpired(true);
        handleExpiration();
      }
    };
    
    // Calcula imediatamente e depois a cada segundo
    calculateRemainingTime();
    const interval = setInterval(calculateRemainingTime, 1000);
    
    return () => clearInterval(interval);
  }, [expirationDate, isExpired]);

  const handleExpiration = () => {
    if (reference) {
      cancelPaymentMutation.mutate(reference, {
        onSuccess: () => {
          toast({
            title: t('PaymentCancelled'),
            description: t('PaymentExpired'),
            variant: 'destructive'
          });
          
          if (onExpire) {
            onExpire();
          }
        }
      });
    }
  };

  // Formata o tempo restante
  const formatTime = () => {
    const hours = Math.floor(remainingTime / (1000 * 60 * 60));
    const minutes = Math.floor((remainingTime / (1000 * 60)) % 60);
    const seconds = Math.floor((remainingTime / 1000) % 60);
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };
  
  return (
    <div className={`flex items-center justify-center ${isExpired ? 'bg-red-100' : 'bg-gray-100'} p-3 rounded-lg mb-4`}>
      {isExpired ? (
        <>
          <AlertTriangle className="text-red-500 mr-2 h-5 w-5" />
          <div className="font-medium text-red-500">{t('PaymentExpired')}</div>
        </>
      ) : (
        <>
          <Clock className="text-brasil-blue mr-2 h-5 w-5" />
          <div className="font-medium">
            {t('ExpiresIn')}: 
            <span className="ml-2 font-bold">{formatTime()}</span>
          </div>
        </>
      )}
    </div>
  );
};

export default CountdownTimer;