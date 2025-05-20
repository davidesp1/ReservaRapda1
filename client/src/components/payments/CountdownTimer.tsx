import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';
import { useCancelPayment } from '@/hooks/usePayment';
import { useToast } from '@/hooks/use-toast';

interface CountdownTimerProps {
  expirationDate: string;
  reference?: string;
  onExpire: () => void;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  expirationDate,
  reference,
  onExpire
}) => {
  const { t } = useTranslation();
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const cancelPaymentMutation = useCancelPayment();
  const { toast } = useToast();

  useEffect(() => {
    if (!expirationDate) return;
    
    const calculateRemainingTime = () => {
      const now = new Date();
      const expiration = new Date(expirationDate);
      const diff = Math.max(0, expiration.getTime() - now.getTime());
      
      setRemainingTime(diff);
      
      // Se o tempo expirou, cancelar o pagamento automaticamente
      if (diff <= 0 && reference) {
        clearInterval(interval);
        
        cancelPaymentMutation.mutate(reference, {
          onSuccess: () => {
            toast({
              title: t('PaymentCancelled'),
              description: t('PaymentExpired'),
              variant: 'destructive'
            });
            onExpire();
          }
        });
      }
    };
    
    // Calcula imediatamente e depois a cada segundo
    calculateRemainingTime();
    const interval = setInterval(calculateRemainingTime, 1000);
    
    return () => clearInterval(interval);
  }, [expirationDate, reference, cancelPaymentMutation, toast, onExpire, t]);

  // Formata o tempo restante
  const hours = Math.floor(remainingTime / (1000 * 60 * 60));
  const minutes = Math.floor((remainingTime / (1000 * 60)) % 60);
  const seconds = Math.floor((remainingTime / 1000) % 60);
  
  return (
    <div className="flex items-center justify-center bg-gray-100 p-3 rounded-lg mb-4">
      <Clock className="text-brasil-blue mr-2 h-5 w-5" />
      <div className="font-medium">
        {remainingTime > 0 ? (
          <span>
            {t('ExpiresIn')}: 
            <span className="ml-2 font-bold">
              {String(hours).padStart(2, '0')}:
              {String(minutes).padStart(2, '0')}:
              {String(seconds).padStart(2, '0')}
            </span>
          </span>
        ) : (
          <span className="text-red-500">{t('PaymentExpired')}</span>
        )}
      </div>
    </div>
  );
};

export default CountdownTimer;