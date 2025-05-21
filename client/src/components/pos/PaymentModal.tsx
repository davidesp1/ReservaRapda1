import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/utils';

type PaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete: (paymentMethod: string) => void;
  total: number;
  isAdminMode: boolean;
};

export default function PaymentModal({
  isOpen,
  onClose,
  onPaymentComplete,
  total,
  isAdminMode
}: PaymentModalProps) {
  const { t } = useTranslation();
  const [selectedMethod, setSelectedMethod] = useState<string>('card');
  const [mbwayPhone, setMbwayPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Carregar configurações de pagamento
  const { data: paymentSettings } = useQuery({
    queryKey: ['/api/settings/payment'],
  });
  
  // Lista de métodos de pagamento habilitados
  const enabledMethods = paymentSettings?.enabledPaymentMethods || {
    card: true,
    mbway: true,
    multibanco: true,
    bankTransfer: true,
    cash: isAdminMode // cash só disponível em modo admin
  };
  
  // Filtrar métodos não habilitados
  const availableMethods = Object.entries(enabledMethods)
    .filter(([method, enabled]) => {
      // Se for dinheiro, só mostrar se for admin
      if (method === 'cash') {
        return enabled && isAdminMode;
      }
      return enabled;
    })
    .map(([method]) => method);
  
  // Selecionar o primeiro método disponível por padrão
  useEffect(() => {
    if (availableMethods.length > 0 && !availableMethods.includes(selectedMethod)) {
      setSelectedMethod(availableMethods[0]);
    }
  }, [availableMethods, selectedMethod]);

  // Validar telefone MBWay
  const isMbwayPhoneValid = () => {
    return /^9\d{8}$/.test(mbwayPhone);
  };

  // Processar pagamento
  const handleProcessPayment = async () => {
    if (selectedMethod === 'mbway' && !isMbwayPhoneValid()) {
      return;
    }

    setIsProcessing(true);
    
    // Simular processamento
    setTimeout(() => {
      setIsProcessing(false);
      onPaymentComplete(selectedMethod);
    }, 1500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('payment.title')}</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-center font-bold text-xl mb-4">
            {t('payment.amount')}: {formatCurrency(total)}
          </p>
          
          <Tabs value={selectedMethod} className="w-full">
            <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 w-full">
              {availableMethods.includes('card') && (
                <TabsTrigger value="card" onClick={() => setSelectedMethod('card')}>
                  {t('paymentMethods.card')}
                </TabsTrigger>
              )}
              
              {availableMethods.includes('mbway') && (
                <TabsTrigger value="mbway" onClick={() => setSelectedMethod('mbway')}>
                  {t('paymentMethods.mbway')}
                </TabsTrigger>
              )}
              
              {availableMethods.includes('multibanco') && (
                <TabsTrigger value="multibanco" onClick={() => setSelectedMethod('multibanco')}>
                  {t('paymentMethods.multibanco')}
                </TabsTrigger>
              )}
              
              {availableMethods.includes('bankTransfer') && (
                <TabsTrigger value="bankTransfer" onClick={() => setSelectedMethod('bankTransfer')}>
                  {t('paymentMethods.bankTransfer')}
                </TabsTrigger>
              )}
              
              {availableMethods.includes('cash') && (
                <TabsTrigger value="cash" onClick={() => setSelectedMethod('cash')}>
                  {t('paymentMethods.cash')}
                </TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="card" className="mt-4">
              <div className="space-y-4">
                <p>{t('payment.cardDescription')}</p>
                <Button 
                  className="w-full" 
                  onClick={handleProcessPayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      {t('payment.processing')}
                    </span>
                  ) : (
                    t('payment.payWithCard')
                  )}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="mbway" className="mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block font-medium">
                    {t('payment.mbwayPhone')}
                  </label>
                  <Input
                    type="tel"
                    placeholder="9XXXXXXXX"
                    value={mbwayPhone}
                    onChange={(e) => setMbwayPhone(e.target.value)}
                    className={!isMbwayPhoneValid() && mbwayPhone ? "border-red-500" : ""}
                  />
                  {!isMbwayPhoneValid() && mbwayPhone && (
                    <p className="text-sm text-red-500">
                      {t('payment.invalidPhone')}
                    </p>
                  )}
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={handleProcessPayment}
                  disabled={!isMbwayPhoneValid() || isProcessing}
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      {t('payment.processing')}
                    </span>
                  ) : (
                    t('payment.payWithMbway')
                  )}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="multibanco" className="mt-4">
              <div className="space-y-4">
                <p>{t('payment.multibancoDescription')}</p>
                <Button 
                  className="w-full" 
                  onClick={handleProcessPayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      {t('payment.processing')}
                    </span>
                  ) : (
                    t('payment.payWithMultibanco')
                  )}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="bankTransfer" className="mt-4">
              <div className="space-y-4">
                <p>{t('payment.bankTransferDescription')}</p>
                <div className="bg-gray-100 p-3 rounded">
                  <p className="font-medium">{t('payment.bankDetails')}</p>
                  <p>IBAN: PT50 0000 0000 0000 0000 0000 0</p>
                  <p>{t('payment.reference')}: OQD-{Date.now().toString().substring(8)}</p>
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleProcessPayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      {t('payment.processing')}
                    </span>
                  ) : (
                    t('payment.confirmBankTransfer')
                  )}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="cash" className="mt-4">
              <div className="space-y-4">
                <p>{t('payment.cashDescription')}</p>
                <Button 
                  className="w-full" 
                  onClick={handleProcessPayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      {t('payment.processing')}
                    </span>
                  ) : (
                    t('payment.confirmCashPayment')
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}