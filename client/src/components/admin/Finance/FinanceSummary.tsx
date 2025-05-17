import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Euro, CreditCard, Clock, AlertCircle } from 'lucide-react';

interface FinanceSummaryProps {
  totalRevenue: number;
  completedPayments: number;
  pendingPayments: number;
  failedPayments: number;
}

export default function FinanceSummary({ 
  totalRevenue, 
  completedPayments, 
  pendingPayments, 
  failedPayments 
}: FinanceSummaryProps) {
  const { t } = useTranslation();

  // Format price to display as currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(price / 100);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <Card className="bg-green-50 hover:shadow-md transition-shadow duration-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('TotalRevenue')}</p>
              <h3 className="text-2xl font-bold text-green-700 mt-1">{formatPrice(totalRevenue)}</h3>
            </div>
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <Euro className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('CompletedPayments')}</p>
              <h3 className="text-2xl font-bold text-blue-600 mt-1">{completedPayments}</h3>
            </div>
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('PendingPayments')}</p>
              <h3 className="text-2xl font-bold text-yellow-600 mt-1">{pendingPayments}</h3>
            </div>
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('FailedPayments')}</p>
              <h3 className="text-2xl font-bold text-red-600 mt-1">{failedPayments}</h3>
            </div>
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}