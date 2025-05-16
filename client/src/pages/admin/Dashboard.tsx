import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardStats from '@/components/admin/DashboardStats';
import { BarChart, AreaChart, PieChart } from '@/components/admin/Charts';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { UsersRound, CalendarDays, AlertOctagon, EuroIcon } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const [_, setLocation] = useLocation();
  
  // Fetch dashboard stats
  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/stats/dashboard'],
    enabled: isAuthenticated && isAdmin,
  });
  
  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      setLocation('/');
    }
  }, [isAuthenticated, isAdmin, isLoading, setLocation]);
  
  if (statsLoading) {
    return (
      <div className="p-6 h-full">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-gray-200 rounded"></div>
            <div className="h-80 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount / 100);
  };

  return (
    <div className="p-6 h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-montserrat font-bold">{t('Dashboard')}</h1>
        <p className="text-gray-500">{format(new Date(), 'PPP')}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {dashboardStats && (
          <>
            <DashboardStats
              title={t('TodayReservations')}
              value={dashboardStats.todayReservations}
              icon={<CalendarDays className="h-5 w-5" />}
              trend="up"
              trendValue="12%"
              colorClass="text-brasil-green"
              bgColorClass="bg-brasil-green/10"
            />
            
            <DashboardStats
              title={t('CancelledReservations')}
              value={dashboardStats.cancelledReservations}
              icon={<AlertOctagon className="h-5 w-5" />}
              trend="down"
              trendValue="3%"
              colorClass="text-brasil-red"
              bgColorClass="bg-brasil-red/10"
            />
            
            <DashboardStats
              title={t('TotalCustomers')}
              value={dashboardStats.customerCount}
              icon={<UsersRound className="h-5 w-5" />}
              trend="up"
              trendValue="8%"
              colorClass="text-brasil-blue"
              bgColorClass="bg-brasil-blue/10"
            />
            
            <DashboardStats
              title={t('DailyRevenue')}
              value={formatCurrency(dashboardStats.dailyRevenue)}
              icon={<EuroIcon className="h-5 w-5" />}
              trend="up"
              trendValue="15%"
              colorClass="text-brasil-yellow"
              bgColorClass="bg-brasil-yellow/10"
            />
          </>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {dashboardStats && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>{t('WeeklyReservations')}</CardTitle>
                <CardDescription>{t('LastSevenDays')}</CardDescription>
              </CardHeader>
              <CardContent>
                <BarChart 
                  data={dashboardStats.reservationsByDay} 
                  xKey="date" 
                  yKey="count" 
                  xLabel={t('Date')} 
                  yLabel={t('Reservations')} 
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t('DailyRevenue')}</CardTitle>
                <CardDescription>{t('LastSevenDays')}</CardDescription>
              </CardHeader>
              <CardContent>
                <AreaChart 
                  data={dashboardStats.revenueByDay} 
                  xKey="date" 
                  yKey="amount" 
                  xLabel={t('Date')} 
                  yLabel={t('Revenue')} 
                  formatY={(value) => formatCurrency(value)}
                />
              </CardContent>
            </Card>
          </>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {dashboardStats && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>{t('PopularItems')}</CardTitle>
                <CardDescription>{t('MostOrderedItems')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <PieChart 
                    data={dashboardStats.popularItems.map((item: any) => ({
                      label: item.name,
                      value: item.count
                    }))} 
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>{t('PendingPayments')}</CardTitle>
                <CardDescription>{t('PaymentsAwaitingProcessing')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('Reservation')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('Customer')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('Amount')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('Status')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {dashboardStats.pendingPayments > 0 ? (
                        Array.from({ length: Math.min(5, dashboardStats.pendingPayments) }).map((_, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">#1234{index + 1}</div>
                              <div className="text-xs text-gray-500">01/06/2025</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm text-gray-900">Cliente {index + 1}</div>
                              <div className="text-xs text-gray-500">cliente{index + 1}@example.com</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{formatCurrency((index + 1) * 2500)}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                {t('Pending')}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                            {t('NoPaymentsToProcess')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
