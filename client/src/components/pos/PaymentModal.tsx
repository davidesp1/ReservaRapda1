import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Radio, RadioGroup } from '@/components/ui/radio-group';
import { FaCreditCard, FaMobileAlt, FaUniversity, FaMoneyBillWave } from 'react-icons/fa';
import { SiMultibanco } from 'react-icons/si';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onPaymentComplete: (method: string) => void;
}

interface PaymentSettings {
  eupagoApiKey: string;
  enabledPaymentMethods: {
    card: boolean;
    mbway: boolean;
    multibanco: boolean;
    bankTransfer: boolean;
    cash: boolean;
  };
}

export default function PaymentModal({ isOpen, onClose, total, onPaymentComplete }: PaymentModalProps) {
  const { t } = useTranslation();
  const [paymentMethod, setPaymentMethod] = useState<string>('card');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  // Buscar configurações de pagamento
  const { data: settings = {} as PaymentSettings } = useQuery<PaymentSettings>({
    queryKey: ['/api/settings/payment'],
  });

  // Resetar estado ao abrir modal
  useEffect(() => {
    if (isOpen) {
      setPaymentMethod('card');
      setPhoneNumber('');
      setIsProcessing(false);
    }
  }, [isOpen]);

  // Definir método de pagamento padrão (primeiro método disponível)
  useEffect(() => {
    if (settings.enabledPaymentMethods) {
      const methods = [
        { id: 'card', enabled: settings.enabledPaymentMethods.card },
        { id: 'mbway', enabled: settings.enabledPaymentMethods.mbway },
        { id: 'multibanco', enabled: settings.enabledPaymentMethods.multibanco },
        { id: 'bankTransfer', enabled: settings.enabledPaymentMethods.bankTransfer },
        { id: 'cash', enabled: settings.enabledPaymentMethods.cash }
      ];
      
      const firstEnabled = methods.find(m => m.enabled);
      if (firstEnabled) {
        setPaymentMethod(firstEnabled.id);
      }
    }
  }, [settings]);

  // Processar pagamento
  const handleProcessPayment = async () => {
    // Validação para MBWay
    if (paymentMethod === 'mbway' && (!phoneNumber || phoneNumber.length < 9)) {
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Simulação de processamento
      await new Promise(resolve => setTimeout(resolve, 1500));
      onPaymentComplete(paymentMethod);
    } finally {
      setIsProcessing(false);
    }
  };

  const formattedTotal = (total / 100).toLocaleString('pt-BR', { 
    style: 'currency', 
    currency: 'EUR' 
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('ProcessPayment')}</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="mb-6 text-center">
            <Label>{t('TotalAmount')}</Label>
            <p className="text-2xl font-bold text-primary">{formattedTotal}</p>
          </div>
          
          <div className="space-y-4">
            <Label>{t('SelectPaymentMethod')}</Label>
            
            <RadioGroup 
              value={paymentMethod} 
              onValueChange={setPaymentMethod}
              className="grid grid-cols-1 gap-4"
            >
              {/* Cartão de Crédito/Débito */}
              {settings.enabledPaymentMethods?.card && (
                <Label 
                  htmlFor="card" 
                  className={`flex items-center p-3 cursor-pointer border rounded-lg ${paymentMethod === 'card' ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                >
                  <Radio value="card" id="card" className="sr-only" />
                  <FaCreditCard className="w-5 h-5 mr-3" />
                  <div className="flex-1">
                    <div className="font-medium">{t('Card')}</div>
                    <div className="text-sm text-gray-500">{t('ProcessedByEuPago')}</div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border ${paymentMethod === 'card' ? 'border-primary' : 'border-gray-300'} flex items-center justify-center`}>
                    {paymentMethod === 'card' && <div className="w-3 h-3 bg-primary rounded-full" />}
                  </div>
                </Label>
              )}
              
              {/* MBWay */}
              {settings.enabledPaymentMethods?.mbway && (
                <Label 
                  htmlFor="mbway" 
                  className={`flex items-center p-3 cursor-pointer border rounded-lg ${paymentMethod === 'mbway' ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                >
                  <Radio value="mbway" id="mbway" className="sr-only" />
                  <FaMobileAlt className="w-5 h-5 mr-3" />
                  <div className="flex-1">
                    <div className="font-medium">MBWay</div>
                    <div className="text-sm text-gray-500">{t('ProcessedByEuPago')}</div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border ${paymentMethod === 'mbway' ? 'border-primary' : 'border-gray-300'} flex items-center justify-center`}>
                    {paymentMethod === 'mbway' && <div className="w-3 h-3 bg-primary rounded-full" />}
                  </div>
                </Label>
              )}
              
              {/* Multibanco */}
              {settings.enabledPaymentMethods?.multibanco && (
                <Label 
                  htmlFor="multibanco" 
                  className={`flex items-center p-3 cursor-pointer border rounded-lg ${paymentMethod === 'multibanco' ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                >
                  <Radio value="multibanco" id="multibanco" className="sr-only" />
                  <SiMultibanco className="w-5 h-5 mr-3" />
                  <div className="flex-1">
                    <div className="font-medium">Multibanco</div>
                    <div className="text-sm text-gray-500">{t('ProcessedByEuPago')}</div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border ${paymentMethod === 'multibanco' ? 'border-primary' : 'border-gray-300'} flex items-center justify-center`}>
                    {paymentMethod === 'multibanco' && <div className="w-3 h-3 bg-primary rounded-full" />}
                  </div>
                </Label>
              )}
              
              {/* Transferência Bancária */}
              {settings.enabledPaymentMethods?.bankTransfer && (
                <Label 
                  htmlFor="bankTransfer" 
                  className={`flex items-center p-3 cursor-pointer border rounded-lg ${paymentMethod === 'bankTransfer' ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                >
                  <Radio value="bankTransfer" id="bankTransfer" className="sr-only" />
                  <FaUniversity className="w-5 h-5 mr-3" />
                  <div className="flex-1">
                    <div className="font-medium">{t('BankTransfer')}</div>
                    <div className="text-sm text-gray-500">{t('ManualVerification')}</div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border ${paymentMethod === 'bankTransfer' ? 'border-primary' : 'border-gray-300'} flex items-center justify-center`}>
                    {paymentMethod === 'bankTransfer' && <div className="w-3 h-3 bg-primary rounded-full" />}
                  </div>
                </Label>
              )}
              
              {/* Dinheiro (apenas para Admin/POS) */}
              {settings.enabledPaymentMethods?.cash && (
                <Label 
                  htmlFor="cash" 
                  className={`flex items-center p-3 cursor-pointer border rounded-lg ${paymentMethod === 'cash' ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                >
                  <Radio value="cash" id="cash" className="sr-only" />
                  <FaMoneyBillWave className="w-5 h-5 mr-3" />
                  <div className="flex-1">
                    <div className="font-medium">{t('Cash')}</div>
                    <div className="text-sm text-gray-500">{t('PaidAtRestaurant')}</div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border ${paymentMethod === 'cash' ? 'border-primary' : 'border-gray-300'} flex items-center justify-center`}>
                    {paymentMethod === 'cash' && <div className="w-3 h-3 bg-primary rounded-full" />}
                  </div>
                </Label>
              )}
            </RadioGroup>
            
            {/* Campo de telefone para MBWay */}
            {paymentMethod === 'mbway' && (
              <div className="mt-4">
                <Label htmlFor="phone">{t('PhoneNumber')}</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="9XXXXXXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('MBWayInstructions')}
                </p>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button
            type="button" 
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
          >
            {t('Cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleProcessPayment}
            disabled={isProcessing || (paymentMethod === 'mbway' && (!phoneNumber || phoneNumber.length < 9))}
            className="min-w-[100px]"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('Processing')}
              </span>
            ) : (
              t('Pay')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}