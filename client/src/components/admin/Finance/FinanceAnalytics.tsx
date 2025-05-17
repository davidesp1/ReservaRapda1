import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart,
  BarChart
} from '@/components/ui/charts';

interface AnalyticsProps {
  revenueData: any[];
  paymentMethodData: any[];
}

export default function FinanceAnalytics({ revenueData, paymentMethodData }: AnalyticsProps) {
  const { t } = useTranslation();

  // Format price to display as currency
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(price / 100);
  };

  // Calculate total and average metrics
  const totalRevenue = revenueData.reduce((sum, day) => sum + day.amount, 0);
  const averageRevenuePerDay = revenueData.length > 0 ? totalRevenue / revenueData.length : 0;
  const totalTransactions = paymentMethodData.reduce((sum, method) => sum + method.value, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('RevenueOverTime')}</CardTitle>
            <CardDescription>{t('Last30DaysRevenue')}</CardDescription>
          </CardHeader>
          <CardContent>
            <AreaChart 
              data={revenueData} 
              xKey="date" 
              yKey="amount" 
              xLabel={t('Date')} 
              yLabel={t('Revenue')} 
              areaColor="#009c3b"
              formatY={(value) => formatPrice(value)}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>{t('PaymentMethods')}</CardTitle>
            <CardDescription>{t('PaymentMethodDistribution')}</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              data={paymentMethodData}
              xKey="label"
              yKey="value"
              xLabel={t('Method')}
              yLabel={t('Count')}
              barColor="#ffdf00"
            />
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('PaymentStatistics')}</CardTitle>
          <CardDescription>{t('PaymentAnalytics')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500">{t('TotalRevenue')}</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {formatPrice(totalRevenue)}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500">{t('AverageRevenue')}</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {formatPrice(averageRevenuePerDay)}
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500">{t('TotalTransactions')}</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {totalTransactions}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500">{t('HighestDayRevenue')}</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {formatPrice(Math.max(...revenueData.map(day => day.amount)))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}