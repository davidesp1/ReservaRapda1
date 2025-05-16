import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CreditCard, Smartphone, Building, BanknoteIcon, LoaderCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useLocation } from 'wouter';

interface PaymentMethodSelectorProps {
  reservationId: number;
  amount: number;
  onPaymentProcessed?: (paymentInfo: any) => void;
}

export default function PaymentMethodSelector({ reservationId, amount, onPaymentProcessed }: PaymentMethodSelectorProps) {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('card');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Payment mutation
  const paymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      const response = await apiRequest('POST', `/api/reservations/${reservationId}/payments`, paymentData);
      return response.json();
    },
    onSuccess: (data) => {
      if (onPaymentProcessed) {
        onPaymentProcessed(data);
      }

      toast({
        title: t('PaymentInitiated'),
        description: t('PaymentInitiatedDescription'),
      });

      // Handle different payment methods
      if (data.eupagoDetails) {
        if (data.method === 'card' && data.eupagoDetails.paymentUrl) {
          // Redirect to card payment page
          window.location.href = data.eupagoDetails.paymentUrl;
        } else if (data.method === 'mbway') {
          // Show MBWay notification
          toast({
            title: t('MBWayPaymentInitiated'),
            description: t('CheckYourMobilePhone'),
          });
        } else if (data.method === 'multibanco') {
          // Navigate to reference details page with payment info
          navigate(`/payment-details/${data.id}`);
        } else if (data.method === 'transfer') {
          // Navigate to reference details page with payment info
          navigate(`/payment-details/${data.id}`);
        }
      }
    },
    onError: (error: any) => {
      setError(error.message || t('PaymentProcessingError'));
      toast({
        title: t('PaymentError'),
        description: error.message || t('PaymentProcessingError'),
        variant: 'destructive',
      });
    }
  });

  const handleCardPayment = () => {
    paymentMutation.mutate({
      method: 'card',
      amount,
      returnUrl: `${window.location.origin}/payment-success`,
      cancelUrl: `${window.location.origin}/payment-cancel`,
    });
  };

  const handleMbwayPayment = () => {
    if (!phoneNumber || phoneNumber.length < 9) {
      setError(t('ValidPhoneNumberRequired'));
      return;
    }

    // Format phone number to match required format (9xxxxxxxx)
    const formattedPhone = phoneNumber.startsWith('9') 
      ? phoneNumber 
      : phoneNumber.startsWith('+351') 
        ? phoneNumber.substring(4) 
        : phoneNumber.startsWith('00351') 
          ? phoneNumber.substring(5) 
          : phoneNumber;

    paymentMutation.mutate({
      method: 'mbway',
      amount,
      phoneNumber: formattedPhone,
    });
  };

  const handleMultibancoPayment = () => {
    paymentMutation.mutate({
      method: 'multibanco',
      amount,
    });
  };

  const handleTransferPayment = () => {
    paymentMutation.mutate({
      method: 'transfer',
      amount,
    });
  };

  // Format amount to show in Euros
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount / 100);
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>{t('SelectPaymentMethod')}</CardTitle>
        <CardDescription>
          {t('PaymentAmount')}: <strong>{formatCurrency(amount)}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('Error')}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="card" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="card">
              <CreditCard className="h-4 w-4 mr-2" /> {t('Card')}
            </TabsTrigger>
            <TabsTrigger value="mbway">
              <Smartphone className="h-4 w-4 mr-2" /> MBWay
            </TabsTrigger>
            <TabsTrigger value="multibanco">
              <BanknoteIcon className="h-4 w-4 mr-2" /> {t('Multibanco')}
            </TabsTrigger>
            <TabsTrigger value="transfer">
              <Building className="h-4 w-4 mr-2" /> {t('Transfer')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="card" className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t('CardPaymentRedirect')}</p>
            </div>
          </TabsContent>

          <TabsContent value="mbway" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">{t('PhoneNumber')}</Label>
              <Input
                id="phone"
                placeholder="9XXXXXXXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{t('MBWayInstructions')}</p>
            </div>
          </TabsContent>

          <TabsContent value="multibanco" className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t('MultibancoInstructions')}</p>
            </div>
          </TabsContent>

          <TabsContent value="transfer" className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t('TransferInstructions')}</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => navigate('/reservations')}>
          {t('Cancel')}
        </Button>
        <Button 
          onClick={() => {
            if (activeTab === 'card') handleCardPayment();
            else if (activeTab === 'mbway') handleMbwayPayment();
            else if (activeTab === 'multibanco') handleMultibancoPayment();
            else if (activeTab === 'transfer') handleTransferPayment();
          }}
          disabled={paymentMutation.isPending}
        >
          {paymentMutation.isPending ? (
            <>
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              {t('Processing')}
            </>
          ) : (
            t('Pay')
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}