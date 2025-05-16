import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export default function PaymentSuccess() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();

  useEffect(() => {
    // You could implement a payment verification here if needed
  }, []);

  return (
    <div className="container max-w-md mx-auto py-10">
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