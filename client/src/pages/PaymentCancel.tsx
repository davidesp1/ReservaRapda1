import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

export default function PaymentCancel() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();

  return (
    <div className="container max-w-md mx-auto py-10">
      <Card>
        <CardHeader>
          <div className="flex justify-center mb-4">
            <XCircle className="h-16 w-16 text-red-500" />
          </div>
          <CardTitle className="text-center">{t('PaymentCancelled')}</CardTitle>
          <CardDescription className="text-center">
            {t('PaymentCancelledDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">{t('NoChargesMade')}</p>
          <p className="text-sm text-muted-foreground">
            {t('TryAgainInstructions')}
          </p>
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => navigate('/reservations')}>
            {t('ViewReservations')}
          </Button>
          <Button onClick={() => navigate("/reservations")}>
            {t('TryAgain')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}