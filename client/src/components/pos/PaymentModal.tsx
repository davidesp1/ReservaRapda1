import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';
import CardDetailsForm from '@/components/payments/CardDetailsForm';
import MBWayForm from '@/components/payments/MBWayForm';
import { paymentMethodEnum } from '@shared/schema';
type PaymentMethod = typeof paymentMethodEnum.enumValues[number];

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (paymentId: number) => void;
  totalAmount: number;
  reservationId?: number;
  userId: number;
}

export default function PaymentModal({
  isOpen,
  onClose,
  onPaymentSuccess,
  totalAmount,
  reservationId,
  userId
}: PaymentModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [enabledMethods, setEnabledMethods] = useState({
    card: true,
    mbway: true,
    multibanco: true,
    bankTransfer: true,
    cash: true
  });
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardholderName: '',
    expiryDate: '',
    cvv: ''
  });

  // Fetch payment settings to determine enabled payment methods
  useEffect(() => {
    const fetchPaymentSettings = async () => {
      try {
        const response = await apiRequest('GET', '/api/settings/payment');
        const data = await response.json();
        
        if (data) {
          setEnabledMethods({
            card: data.enableCard,
            mbway: data.enableMbway,
            multibanco: data.enableMultibanco,
            bankTransfer: data.enableBankTransfer,
            cash: data.enableCash
          });
        }
      } catch (error) {
        console.error("Error fetching payment settings:", error);
      }
    };

    fetchPaymentSettings();
  }, []);

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      const paymentData = {
        method: paymentMethod,
        amount: totalAmount,
        userId,
        reservationId: reservationId || null,
        details: getPaymentDetails(),
      };

      // Make payment request
      const response = await apiRequest('POST', '/api/payments', paymentData);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Payment failed');
      }
      
      const data = await response.json();
      
      toast({
        title: t('payment.success'),
        description: t('payment.successDescription'),
      });
      
      onPaymentSuccess(data.id);
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: t('payment.failed'),
        description: error.message || t('payment.failedDescription'),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getPaymentDetails = () => {
    switch (paymentMethod) {
      case 'mbway':
        return { phoneNumber };
      case 'card':
        return cardDetails;
      default:
        return {};
    }
  };

  const handleCardDetailsChange = (details) => {
    setCardDetails(details);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('pos.paymentTitle')}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="paymentMethod">{t('payment.method')}</Label>
            <Select
              value={paymentMethod}
              onValueChange={(value: PaymentMethod) => setPaymentMethod(value)}
            >
              <SelectTrigger id="paymentMethod">
                <SelectValue placeholder={t('payment.selectMethod')} />
              </SelectTrigger>
              <SelectContent>
                {enabledMethods.cash && (
                  <SelectItem value="cash">{t('payment.methods.cash')}</SelectItem>
                )}
                {enabledMethods.card && (
                  <SelectItem value="card">{t('payment.methods.card')}</SelectItem>
                )}
                {enabledMethods.mbway && (
                  <SelectItem value="mbway">{t('payment.methods.mbway')}</SelectItem>
                )}
                {enabledMethods.multibanco && (
                  <SelectItem value="multibanco">{t('payment.methods.multibanco')}</SelectItem>
                )}
                {enabledMethods.bankTransfer && (
                  <SelectItem value="bankTransfer">{t('payment.methods.bankTransfer')}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <div className="font-medium">{t('payment.totalAmount')}</div>
            <div className="text-2xl font-bold">€{(totalAmount / 100).toFixed(2)}</div>
          </div>

          {paymentMethod === 'mbway' && (
            <MBWayForm 
              phoneNumber={phoneNumber}
              setPhoneNumber={setPhoneNumber}
            />
          )}

          {paymentMethod === 'card' && (
            <CardDetailsForm 
              onChange={handleCardDetailsChange}
              cardDetails={cardDetails}
            />
          )}

          {paymentMethod === 'multibanco' && (
            <div className="text-sm text-gray-500">
              {t('payment.multibancoInfo')}
            </div>
          )}

          {paymentMethod === 'bankTransfer' && (
            <div className="text-sm text-gray-500">
              {t('payment.bankTransferInfo')}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handlePayment} disabled={isProcessing}>
            {isProcessing ? t('payment.processing') : t('payment.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}