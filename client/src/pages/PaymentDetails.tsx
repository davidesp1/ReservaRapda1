import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CopyIcon, CheckIcon, Building, BanknoteIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import CustomerLayout from '@/components/layouts/CustomerLayout';

export default function PaymentDetails() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const paymentId = parseInt(params.id);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Fetch payment details
  const { data: payment, isLoading: paymentLoading, error } = useQuery({
    queryKey: ['/api/payments', paymentId],
    enabled: isAuthenticated && !!paymentId,
    queryFn: async () => {
      const response = await fetch(`/api/payments/${paymentId}`, {
        credentials: 'include' // Importante para enviar cookies de autenticação
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch payment details');
      }
      return response.json();
    },
  });

  // Handle copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: t('CopiedToClipboard'),
      description: `${label} ${t('CopiedToClipboard')}`,
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount / 100);
  };

  if (isLoading || paymentLoading) {
    return (
      <CustomerLayout title={t('PaymentDetails')}>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </CustomerLayout>
    );
  }

  if (error) {
    return (
      <CustomerLayout title={t('Error')}>
        <div className="container max-w-4xl mx-auto py-10">
          <Card>
            <CardHeader>
              <CardTitle>{t('PaymentError')}</CardTitle>
              <CardDescription>{String(error)}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{t('AuthenticationRequired')}</p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button onClick={() => navigate('/reservations')}>{t('BackToReservations')}</Button>
              <Button variant="default" onClick={() => window.location.reload()}>
                {t('TryAgain')}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </CustomerLayout>
    );
  }

  if (!payment) {
    return (
      <CustomerLayout title={t('PaymentNotFound')}>
        <div className="container max-w-4xl mx-auto py-10">
          <Card>
            <CardHeader>
              <CardTitle>{t('PaymentNotFound')}</CardTitle>
              <CardDescription>{t('PaymentNotFoundDescription')}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => navigate('/reservations')}>{t('BackToReservations')}</Button>
            </CardFooter>
          </Card>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout title={t('PaymentDetails')}>
      <h1 className="text-3xl font-montserrat font-bold mb-6">{t('PaymentDetails')}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{t('PaymentDetails')}</CardTitle>
          <CardDescription>
            {t('PaymentMethod')}: {payment.method === 'multibanco' 
              ? t('Multibanco') 
              : payment.method === 'mbway' 
                ? 'MBWay' 
                : payment.method === 'transfer' 
                  ? t('BankTransfer') 
                  : t('Card')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="font-medium">{t('Amount')}</div>
            <div className="text-xl font-bold">{formatCurrency(payment.amount)}</div>
          </div>

          <Separator />

          {payment.method === 'multibanco' && payment.eupagoDetails && (
            <div className="space-y-4">
              <div className="flex items-center justify-center mb-4">
                <BanknoteIcon className="h-16 w-16 text-blue-600" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">{t('Entity')}</div>
                  <div className="flex items-center justify-between p-3 bg-gray-100 rounded-md">
                    <span className="font-mono text-lg font-bold">{payment.eupagoDetails.entity}</span>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => copyToClipboard(payment.eupagoDetails.entity, t('Entity'))}
                    >
                      <CopyIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground mb-1">{t('Reference')}</div>
                  <div className="flex items-center justify-between p-3 bg-gray-100 rounded-md">
                    <span className="font-mono text-lg font-bold">{payment.eupagoDetails.reference}</span>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => copyToClipboard(payment.eupagoDetails.reference, t('Reference'))}
                    >
                      <CopyIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="text-sm bg-yellow-50 p-4 rounded-md border border-yellow-200">
                <p className="font-medium text-yellow-800 mb-2">{t('ImportantInformation')}</p>
                <ul className="list-disc pl-5 space-y-1 text-yellow-700">
                  <li>{t('MultibancoInstruction1')}</li>
                  <li>{t('MultibancoInstruction2')}</li>
                  <li>{t('ValidFor')} 5 {t('Days')}</li>
                </ul>
              </div>
            </div>
          )}

          {payment.method === 'transfer' && payment.eupagoDetails && (
            <div className="space-y-4">
              <div className="flex items-center justify-center mb-4">
                <Building className="h-16 w-16 text-green-600" />
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">{t('BankName')}</div>
                  <div className="p-3 bg-gray-100 rounded-md font-medium">
                    {payment.eupagoDetails.bankName || "Banco Comercial Português"}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground mb-1">{t('IBAN')}</div>
                  <div className="flex items-center justify-between p-3 bg-gray-100 rounded-md">
                    <span className="font-mono text-sm font-bold">{payment.eupagoDetails.iban || "PT50000000000000000000000"}</span>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => copyToClipboard(payment.eupagoDetails.iban || "PT50000000000000000000000", 'IBAN')}
                    >
                      <CopyIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground mb-1">{t('Reference')}</div>
                  <div className="flex items-center justify-between p-3 bg-gray-100 rounded-md">
                    <span className="font-mono text-lg font-bold">{payment.eupagoDetails.reference}</span>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => copyToClipboard(payment.eupagoDetails.reference, t('Reference'))}
                    >
                      <CopyIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="text-sm bg-yellow-50 p-4 rounded-md border border-yellow-200">
                <p className="font-medium text-yellow-800 mb-2">{t('ImportantInformation')}</p>
                <ul className="list-disc pl-5 space-y-1 text-yellow-700">
                  <li>{t('TransferInstruction1')}</li>
                  <li>{t('TransferInstruction2')}</li>
                  <li>{t('ValidFor')} 5 {t('Days')}</li>
                </ul>
              </div>
            </div>
          )}

          {payment.method === 'mbway' && (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center">
                <CheckIcon className="h-16 w-16 text-green-500" />
              </div>
              <h3 className="text-xl font-bold">{t('MBWayPaymentInitiated')}</h3>
              <p>{t('CheckYourMobilePhone')}</p>
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">{t('Status')}</div>
            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              payment.status === 'completed' 
                ? 'bg-green-100 text-green-800' 
                : payment.status === 'pending' 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-red-100 text-red-800'
            }`}>
              {payment.status === 'completed' 
                ? t('Completed') 
                : payment.status === 'pending' 
                  ? t('Pending') 
                  : t('Failed')}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => navigate('/reservations')}>
            {t('BackToReservations')}
          </Button>
          
          <Button variant="default" onClick={() => window.location.reload()}>
            {t('RefreshStatus')}
          </Button>
        </CardFooter>
      </Card>
    </CustomerLayout>
  );
}