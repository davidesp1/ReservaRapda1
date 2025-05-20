import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreditCard, Smartphone, Landmark, Clock } from 'lucide-react';
import { useCancelPayment } from '@/hooks/usePayment';
import { useToast } from '@/hooks/use-toast';

// Componente para mostrar o contador regressivo
const CountdownDisplay = ({ expirationDate, onExpire }: { expirationDate: string, onExpire: () => void }) => {
  const { t } = useTranslation();
  const [remainingTime, setRemainingTime] = useState<number>(0);

  useEffect(() => {
    if (!expirationDate) return;
    
    const calculateRemainingTime = () => {
      const now = new Date();
      const expiration = new Date(expirationDate);
      const diff = Math.max(0, expiration.getTime() - now.getTime());
      
      setRemainingTime(diff);
      
      // Se o tempo expirou
      if (diff <= 0) {
        clearInterval(interval);
        onExpire();
      }
    };
    
    // Calcula imediatamente e depois a cada segundo
    calculateRemainingTime();
    const interval = setInterval(calculateRemainingTime, 1000);
    
    return () => clearInterval(interval);
  }, [expirationDate, onExpire]);

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

interface PaymentDetails {
  entity?: string;
  reference?: string;
  expirationDate?: string;
  phone?: string;
  status?: string;
}

interface PaymentDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentMethod: string;
  paymentDetails?: PaymentDetails;
  paymentUrl?: string;
  total: number;
  onConfirm: () => void;
}

const PaymentDetailsModal: React.FC<PaymentDetailsModalProps> = ({
  open,
  onOpenChange,
  paymentMethod,
  paymentDetails,
  paymentUrl,
  total,
  onConfirm
}) => {
  const { t } = useTranslation();
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const cancelPaymentMutation = useCancelPayment();
  const { toast } = useToast();
  
  // Calcula e atualiza o tempo restante para expiração
  useEffect(() => {
    if (!open || paymentMethod !== 'multibanco' || !paymentDetails?.expirationDate) return;
    
    const calculateRemainingTime = () => {
      const now = new Date();
      const expiration = new Date(paymentDetails.expirationDate || '');
      const diff = Math.max(0, expiration.getTime() - now.getTime());
      
      setRemainingTime(diff);
      
      // Se o tempo expirou, cancelar o pagamento automaticamente
      if (diff <= 0 && paymentDetails.reference) {
        cancelPaymentMutation.mutate(paymentDetails.reference, {
          onSuccess: () => {
            toast({
              title: t('PaymentCancelled'),
              description: t('PaymentExpired'),
              variant: 'destructive'
            });
            onOpenChange(false);
          }
        });
      }
    };
    
    // Calcula imediatamente e depois a cada segundo
    calculateRemainingTime();
    const interval = setInterval(calculateRemainingTime, 1000);
    
    return () => clearInterval(interval);
  }, [open, paymentMethod, paymentDetails, cancelPaymentMutation, toast, onOpenChange, t]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('PaymentInformation')}</DialogTitle>
          <DialogDescription>
            {paymentMethod === 'multibanco' && t('MultibancoPaymentDescription')}
            {paymentMethod === 'mbway' && t('MBWayPaymentDescription')}
            {paymentMethod === 'card' && t('CardPaymentDescription')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 my-4">
          {/* Ícone do método de pagamento */}
          <div className="flex items-center mb-4">
            <div className="bg-brasil-blue/10 p-3 rounded-full mr-3">
              {paymentMethod === 'multibanco' && <Landmark className="h-5 w-5 text-brasil-blue" />}
              {paymentMethod === 'mbway' && <Smartphone className="h-5 w-5 text-brasil-blue" />}
              {paymentMethod === 'card' && <CreditCard className="h-5 w-5 text-brasil-blue" />}
            </div>
            <div className="font-medium text-lg">
              {paymentMethod === 'multibanco' && t('Multibanco')}
              {paymentMethod === 'mbway' && t('MBWay')}
              {paymentMethod === 'card' && t('CreditCard')}
            </div>
          </div>
          
          {/* Detalhes de pagamento Multibanco */}
          {paymentMethod === 'multibanco' && paymentDetails && (
            <div className="space-y-4">
              {/* Contador regressivo */}
              <div className="flex items-center justify-center bg-gray-100 p-3 rounded-lg mb-4">
                <Clock className="text-brasil-blue mr-2 h-5 w-5" />
                <div className="font-medium">
                  {remainingTime > 0 ? (
                    <span>
                      {t('ExpiresIn')}: 
                      <span className="ml-2 font-bold">
                        {String(Math.floor(remainingTime / (1000 * 60 * 60))).padStart(2, '0')}:
                        {String(Math.floor((remainingTime / (1000 * 60)) % 60)).padStart(2, '0')}:
                        {String(Math.floor((remainingTime / 1000) % 60)).padStart(2, '0')}
                      </span>
                    </span>
                  ) : (
                    <span className="text-red-500">{t('PaymentExpired')}</span>
                  )}
                </div>
              </div>
              
              {/* Status de pagamento */}
              <div className="text-center mb-4">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                  paymentDetails.status === 'pago' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {paymentDetails.status === 'pago' ? t('Paid') : t('Pending')}
                </span>
              </div>
              
              {/* QR Code (simulado) */}
              <div className="flex justify-center mb-4">
                <div className="bg-white border border-gray-200 p-3 rounded">
                  <div className="w-32 h-32 bg-gray-200 flex items-center justify-center">
                    <div className="text-center text-sm text-gray-500">QR Code</div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between">
                <span className="font-medium">{t('Entity')}:</span>
                <span className="font-bold">{paymentDetails.entity || '11111'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">{t('Reference')}:</span>
                <span className="font-bold">{paymentDetails.reference || '999 999 999'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">{t('Amount')}:</span>
                <span className="font-bold">€{Number(total).toLocaleString('pt-PT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              
              {/* Código de barras (simulado) */}
              <div className="mt-4 border-t pt-4">
                <div className="w-full h-12 bg-gray-200 flex items-center justify-center">
                  <div className="text-center text-sm text-gray-500">{t('Barcode')}</div>
                </div>
              </div>
            </div>
          )}
          
          {/* Detalhes de pagamento MBWay */}
          {paymentMethod === 'mbway' && paymentDetails && (
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="font-medium">{t('PhoneNumber')}:</span>
                <span className="font-bold">{paymentDetails.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">{t('Amount')}:</span>
                <span className="font-bold">€{Number(total).toLocaleString('pt-PT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              <div className="text-center text-sm text-gray-600 mt-2">
                {t('CheckYourPhoneForMBWayNotification')}
              </div>
            </div>
          )}
          
          {/* Detalhes de pagamento com Cartão */}
          {paymentMethod === 'card' && (
            <div className="space-y-4 text-center">
              <div className="text-sm text-gray-600">
                {t('RedirectedToPaymentPage')}
              </div>
              {(paymentUrl || paymentDetails?.reference) && (
                <Button
                  className="w-full bg-brasil-blue hover:bg-blue-700"
                  onClick={() => {
                    // Se temos uma URL de pagamento direta, usamos ela
                    if (paymentUrl) {
                      window.open(paymentUrl, '_blank');
                    } 
                    // Caso contrário, construímos a URL baseada na referência
                    else if (paymentDetails?.reference) {
                      const baseUrl = 'https://sandbox.eupago.pt/clientes/rest_api';
                      const url = `${baseUrl}/pagamento?ref=${paymentDetails.reference}`;
                      window.open(url, '_blank');
                    }
                  }}
                >
                  {t('OpenPaymentPage')}
                </Button>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter className="flex sm:justify-between">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            {t('Cancel')}
          </Button>
          <Button 
            className="bg-brasil-green hover:bg-green-700 text-white"
            onClick={onConfirm}
          >
            {t('ConfirmPayment')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDetailsModal;