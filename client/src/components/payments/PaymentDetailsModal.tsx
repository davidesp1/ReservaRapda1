import React from 'react';
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
import { CreditCard, Smartphone, Landmark } from 'lucide-react';

interface PaymentDetails {
  entity?: string;
  reference?: string;
  expirationDate?: string;
  phone?: string;
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
              {paymentDetails.expirationDate && (
                <div className="flex justify-between">
                  <span className="font-medium">{t('ExpirationDate')}:</span>
                  <span>{new Date(paymentDetails.expirationDate).toLocaleDateString()}</span>
                </div>
              )}
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