import React from 'react';
import { useTranslation } from 'react-i18next';
import { format, subDays } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';

interface AnalyticsProps {
  revenueData: any[];
  paymentMethodData: any[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function FinanceAnalytics({ revenueData, paymentMethodData }: AnalyticsProps) {
  const { t } = useTranslation();

  // Format price to display as currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(price / 100);
  };

  // Get last 7 days data
  const last7DaysData = React.useMemo(() => {
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const date = subDays(now, 6 - i);
      const formattedDate = format(date, 'dd/MM');
      const existingData = revenueData.find(
        (item) => format(new Date(item.date), 'dd/MM') === formattedDate
      );
      
      return {
        date: formattedDate,
        amount: existingData ? existingData.amount : 0,
      };
    });
  }, [revenueData]);

  // Custom tooltip for revenue chart
  const RevenueTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-md">
          <p className="font-medium">{label}</p>
          <p className="text-green-600">{formatPrice(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for payment methods chart
  const PaymentMethodTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-md">
          <p className="font-medium">{payload[0].name}</p>
          <p>{payload[0].value} {t('Payments')}</p>
          <p className="text-gray-600 text-sm">
            {Math.round(payload[0].payload.percentage * 100)}% {t('ofTotal')}
          </p>
        </div>
      );
    }
    return null;
  };

  // Format payment method data with percentages
  const paymentMethodDataWithPercentage = React.useMemo(() => {
    const total = paymentMethodData.reduce((sum, item) => sum + item.value, 0);
    return paymentMethodData.map(item => ({
      ...item,
      percentage: total > 0 ? item.value / total : 0
    }));
  }, [paymentMethodData]);

  return (
    <div className="space-y-6">
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardHeader>
          <CardTitle>{t('RevenueOverTime')}</CardTitle>
          <CardDescription>{t('Last7DaysRevenue')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={last7DaysData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" />
                <YAxis 
                  tickFormatter={(value) => formatPrice(value)}
                  width={80}
                />
                <Tooltip content={<RevenueTooltip />} />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardHeader>
          <CardTitle>{t('PaymentMethodDistribution')}</CardTitle>
          <CardDescription>{t('CompletedPaymentsByMethod')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentMethodDataWithPercentage}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="label"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {paymentMethodDataWithPercentage.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PaymentMethodTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}