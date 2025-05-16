import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import CustomerLayout from '@/components/layouts/CustomerLayout';

export default function PaymentSuccess() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brasil-green"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <CustomerLayout title={t('PaymentSuccessful')}>
      <div className="max-w-md mx-auto">
        <Card>
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-center">{t('PaymentSuccessful')}</CardTitle>
          <CardDescription className="text-center">
            {t('PaymentSuccessfulDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">{t('ThankYouForYourOrder')}</p>
          <p className="text-sm text-muted-foreground">
            {t('ReservationConfirmationInfo')}
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={() => navigate('/reservations')}>
            {t('ViewReservations')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}