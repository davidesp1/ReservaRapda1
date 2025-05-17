import React from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, CreditCard, Clock, XCircle } from 'lucide-react';

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

  const summaryItems = [
    {
      title: t('TotalRevenue'),
      value: formatPrice(totalRevenue),
      icon: TrendingUp,
      color: 'bg-green-50 text-green-600',
      iconColor: 'bg-green-100'
    },
    {
      title: t('CompletedPayments'),
      value: completedPayments,
      icon: CreditCard,
      color: 'bg-blue-50 text-blue-600',
      iconColor: 'bg-blue-100'
    },
    {
      title: t('PendingPayments'),
      value: pendingPayments,
      icon: Clock,
      color: 'bg-yellow-50 text-yellow-600',
      iconColor: 'bg-yellow-100'
    },
    {
      title: t('FailedPayments'),
      value: failedPayments,
      icon: XCircle,
      color: 'bg-red-50 text-red-600',
      iconColor: 'bg-red-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {summaryItems.map((item, index) => (
        <div key={index} className={`${item.color} p-4 rounded-lg flex items-center`}>
          <div className={`${item.iconColor} p-3 rounded-md mr-4`}>
            <item.icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium">{item.title}</p>
            <p className="text-2xl font-bold mt-1">{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}