import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  FaChartLine, FaCalendarCheck, FaChair, 
  FaUserPlus, FaDollarSign, FaArrowUp, FaArrowDown 
} from 'react-icons/fa';
import AdminLayout from '@/components/layouts/AdminLayout';
import Chart from 'chart.js/auto';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isAdmin } = useAuth();
  const [_, setLocation] = useLocation();
  const salesChartRef = useRef<HTMLCanvasElement>(null);
  const categoryChartRef = useRef<HTMLCanvasElement>(null);
  
  // Fetch dashboard stats - usando dados reais do banco de dados
  const { data: dashboardStats, isLoading: statsLoading } = useQuery<any>({
    queryKey: ['/api/stats/dashboard'],
    enabled: isAuthenticated && isAdmin,
  });
  
  useEffect(() => {
    let salesChartInstance: Chart | undefined;
    let categoryChartInstance: Chart | undefined;
    
    if (salesChartRef.current && categoryChartRef.current) {
      // Renderização dos gráficos usando Chart.js
      const salesCtx = salesChartRef.current.getContext('2d');
      const categoryCtx = categoryChartRef.current.getContext('2d');
      
      if (salesCtx && categoryCtx) {
        // Sales Chart
        salesChartInstance = new Chart(salesCtx, {
          type: 'bar',
          data: {
            labels: dashboardStats?.salesData?.labels || ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
            datasets: [{
              label: 'Faturamento (€)',
              data: dashboardStats?.salesData?.values || [0, 0, 0, 0, 0, 0, 0],
              backgroundColor: '#002776', // Brazil Blue
              borderWidth: 0,
              borderRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function(value: any) {
                    return 'R$ ' + value;
                  }
                }
              },
              x: {
                grid: {
                  display: false
                }
              }
            }
          }
        });

        // Category Chart
        categoryChartInstance = new Chart(categoryCtx, {
          type: 'doughnut',
          data: {
            labels: dashboardStats?.categoryData?.labels || ['Pratos Principais', 'Bebidas', 'Sobremesas', 'Entradas'],
            datasets: [{
              data: dashboardStats?.categoryData?.values || [0, 0, 0, 0],
              backgroundColor: [
                '#002776', // Brazil Blue
                '#009c3b', // Brazil Green
                '#ffdf00', // Brazil Yellow
                '#c8102e'  // Brazil Red
              ],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  boxWidth: 12,
                  padding: 15
                }
              }
            },
            cutout: '65%'
          }
        });
      }
    }
    
    // Cleanup function
    return () => {
      if (salesChartInstance) {
        salesChartInstance.destroy();
      }
      if (categoryChartInstance) {
        categoryChartInstance.destroy();
      }
    };
  }, [statsLoading]);

  if (statsLoading) {
    return (
      <AdminLayout title={t('Dashboard')}>
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-80 bg-gray-200 rounded-xl lg:col-span-2"></div>
            <div className="h-80 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Desktop Layout Components
  const DesktopMetricsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div 
        className="bg-white rounded-xl shadow-md p-6 border-t-4 border-brasil-green cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => setLocation('/admin/finance')}
      >
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500 font-medium">{t('TodayRevenue')}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">
              {dashboardStats?.todayRevenue ? `€ ${dashboardStats.todayRevenue.toFixed(2)}` : '€ 0,00'}
            </p>
            <div className="flex items-center mt-2 text-sm">
              {dashboardStats?.revenueChange > 0 ? (
                <>
                  <FaArrowUp className="text-brasil-green mr-1" />
                  <span className="text-brasil-green font-medium">{dashboardStats?.revenueChange || 0}%</span>
                </>
              ) : (
                <>
                  <FaArrowDown className="text-brasil-red mr-1" />
                  <span className="text-brasil-red font-medium">{Math.abs(dashboardStats?.revenueChange || 0)}%</span>
                </>
              )}
              <span className="text-gray-500 ml-1">{t('vs_last_week')}</span>
            </div>
          </div>
          <div className="bg-green-100 p-3 rounded-lg">
            <FaDollarSign className="text-brasil-green text-xl" />
          </div>
        </div>
      </div>

      <div 
        className="bg-white rounded-xl shadow-md p-6 border-t-4 border-brasil-blue cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => setLocation('/admin/reservations')}
      >
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500 font-medium">{t('TodayReservations')}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{dashboardStats?.todayReservations || 0}</p>
            <div className="flex items-center mt-2 text-sm">
              {dashboardStats?.reservationsChange > 0 ? (
                <>
                  <FaArrowUp className="text-brasil-green mr-1" />
                  <span className="text-brasil-green font-medium">{dashboardStats?.reservationsChange || 0}%</span>
                </>
              ) : (
                <>
                  <FaArrowDown className="text-brasil-red mr-1" />
                  <span className="text-brasil-red font-medium">{Math.abs(dashboardStats?.reservationsChange || 0)}%</span>
                </>
              )}
              <span className="text-gray-500 ml-1">{t('vs_yesterday')}</span>
            </div>
          </div>
          <div className="bg-blue-100 p-3 rounded-lg">
            <FaCalendarCheck className="text-brasil-blue text-xl" />
          </div>
        </div>
      </div>

      <div 
        className="bg-white rounded-xl shadow-md p-6 border-t-4 border-brasil-yellow cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => setLocation('/admin/tables')}
      >
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500 font-medium">{t('CurrentOccupancy')}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{dashboardStats?.currentOccupancy || 0}%</p>
            <div className="flex items-center mt-2 text-sm">
              {dashboardStats?.occupancyChange > 0 ? (
                <>
                  <FaArrowUp className="text-brasil-green mr-1" />
                  <span className="text-brasil-green font-medium">{dashboardStats?.occupancyChange || 0}%</span>
                </>
              ) : (
                <>
                  <FaArrowDown className="text-brasil-red mr-1" />
                  <span className="text-brasil-red font-medium">{Math.abs(dashboardStats?.occupancyChange || 0)}%</span>
                </>
              )}
              <span className="text-gray-500 ml-1">{t('vs_weekly_average')}</span>
            </div>
          </div>
          <div className="bg-yellow-100 p-3 rounded-lg">
            <FaChair className="text-brasil-yellow text-xl" />
          </div>
        </div>
      </div>

      <div 
        className="bg-white rounded-xl shadow-md p-6 border-t-4 border-brasil-red cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => setLocation('/admin/customers')}
      >
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500 font-medium">{t('NewCustomers')}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{dashboardStats?.newCustomers || 0}</p>
            <div className="flex items-center mt-2 text-sm">
              {dashboardStats?.customerChange > 0 ? (
                <>
                  <FaArrowUp className="text-brasil-green mr-1" />
                  <span className="text-brasil-green font-medium">{dashboardStats?.customerChange || 0}%</span>
                </>
              ) : (
                <>
                  <FaArrowDown className="text-brasil-red mr-1" />
                  <span className="text-brasil-red font-medium">{Math.abs(dashboardStats?.customerChange || 0)}%</span>
                </>
              )}
              <span className="text-gray-500 ml-1">{t('vs_last_week')}</span>
            </div>
          </div>
          <div className="bg-red-100 p-3 rounded-lg">
            <FaUserPlus className="text-brasil-red text-xl" />
          </div>
        </div>
      </div>
    </div>
  );

  const DesktopCharts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <div className="bg-white rounded-xl shadow-md p-6 lg:col-span-2">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800 font-montserrat">{t('WeeklyRevenue')}</h2>
          <div className="flex space-x-2">
            <button className="px-3 py-1 text-sm bg-gray-100 rounded-md text-gray-600 hover:bg-gray-200">{t('Day')}</button>
            <button className="px-3 py-1 text-sm bg-brasil-blue rounded-md text-white">{t('Week')}</button>
            <button className="px-3 py-1 text-sm bg-gray-100 rounded-md text-gray-600 hover:bg-gray-200">{t('Month')}</button>
          </div>
        </div>
        <div className="h-64">
          <canvas ref={salesChartRef}></canvas>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800 font-montserrat">{t('SalesByCategory')}</h2>
          <p className="text-sm text-gray-500">{t('ThisMonth')}</p>
        </div>
        <div className="h-56">
          <canvas ref={categoryChartRef}></canvas>
        </div>
      </div>
    </div>
  );

  // Fetch recent reservations
  const { data: recentReservations = [], isLoading: reservationsLoading } = useQuery<any[]>({
    queryKey: ['/api/reservations', { limit: 5 }],
    enabled: isAuthenticated && isAdmin,
  });
  
  const DesktopReservationsTable = () => {
    // Format date from ISO string to readable format
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    };

    // Format time from ISO string to readable format
    const formatTime = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Get status badge class based on reservation status
    const getStatusClass = (status: string) => {
      switch(status) {
        case 'confirmed':
          return 'bg-green-100 text-green-800';
        case 'pending':
          return 'bg-yellow-100 text-yellow-800';
        case 'cancelled':
          return 'bg-gray-100 text-gray-800';
        case 'completed':
          return 'bg-blue-100 text-blue-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    // Get translated status text
    const getStatusText = (status: string) => {
      switch(status) {
        case 'confirmed':
          return t('Confirmed');
        case 'pending':
          return t('Pending');
        case 'cancelled':
          return t('Cancelled');
        case 'completed':
          return t('Completed');
        default:
          return status;
      }
    };

    return (
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 font-montserrat">{t('RecentReservations')}</h2>
            <p className="text-sm text-gray-500">{t('LastReservations')}</p>
          </div>
          <button 
            className="text-sm text-brasil-blue hover:underline"
            onClick={() => setLocation('/admin/reservations')}
          >
            {t('ViewAll')}
          </button>
        </div>

        <div className="overflow-x-auto">
          {reservationsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brasil-blue"></div>
            </div>
          ) : (
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">{t('Id')}</th>
                  <th className="px-4 py-3">{t('Client')}</th>
                  <th className="px-4 py-3">{t('Date')}</th>
                  <th className="px-4 py-3">{t('Time')}</th>
                  <th className="px-4 py-3">{t('Guests')}</th>
                  <th className="px-4 py-3">{t('Status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentReservations.length > 0 ? (
                  recentReservations.map((reservation: any) => (
                    <tr key={reservation.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setLocation(`/admin/reservations/${reservation.id}`)}>
                      <td className="px-4 py-3">#{reservation.id}</td>
                      <td className="px-4 py-3">{reservation.userName || 'Cliente ' + reservation.id}</td>
                      <td className="px-4 py-3">{formatDate(reservation.date)}</td>
                      <td className="px-4 py-3">{formatTime(reservation.date)}</td>
                      <td className="px-4 py-3">{reservation.partySize}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusClass(reservation.status)}`}>
                          {getStatusText(reservation.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                      {t('NoReservationsFound')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  };

  // Mobile Layout Components
  const MobileMetricsCards = () => (
    <section className="px-4 py-2">
      <div className="grid grid-cols-2 gap-3">
        <div 
          className="bg-white rounded-lg shadow p-3 cursor-pointer active:bg-gray-50"
          onClick={() => setLocation('/admin/finance')}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-500">{t('TodayRevenue')}</p>
              <h3 className="text-lg font-bold">R$ {dashboardStats?.todayRevenue || 0}</h3>
              <p className={`text-xs ${dashboardStats?.revenueChange > 0 ? 'text-brasil-green' : 'text-brasil-red'} flex items-center`}>
                {dashboardStats?.revenueChange > 0 ? (
                  <FaArrowUp className="mr-1" />
                ) : (
                  <FaArrowDown className="mr-1" />
                )}
                {Math.abs(dashboardStats?.revenueChange || 0)}%
              </p>
            </div>
            <div className="bg-blue-100 p-2 rounded-full">
              <FaDollarSign className="text-brasil-blue" />
            </div>
          </div>
        </div>
        
        <div 
          className="bg-white rounded-lg shadow p-3 cursor-pointer active:bg-gray-50"
          onClick={() => setLocation('/admin/reservations')}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-500">{t('TodayReservations')}</p>
              <h3 className="text-lg font-bold">{dashboardStats?.todayReservations || 0}</h3>
              <p className={`text-xs ${dashboardStats?.reservationsChange > 0 ? 'text-brasil-green' : 'text-brasil-red'} flex items-center`}>
                {dashboardStats?.reservationsChange > 0 ? (
                  <FaArrowUp className="mr-1" />
                ) : (
                  <FaArrowDown className="mr-1" />
                )}
                {Math.abs(dashboardStats?.reservationsChange || 0)}%
              </p>
            </div>
            <div className="bg-green-100 p-2 rounded-full">
              <FaCalendarCheck className="text-brasil-green" />
            </div>
          </div>
        </div>
        
        <div 
          className="bg-white rounded-lg shadow p-3 cursor-pointer active:bg-gray-50"
          onClick={() => setLocation('/admin/tables')}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-500">{t('CurrentOccupancy')}</p>
              <h3 className="text-lg font-bold">{dashboardStats?.currentOccupancy || 0}%</h3>
              <p className={`text-xs ${dashboardStats?.occupancyChange > 0 ? 'text-brasil-green' : 'text-brasil-red'} flex items-center`}>
                {dashboardStats?.occupancyChange > 0 ? (
                  <FaArrowUp className="mr-1" />
                ) : (
                  <FaArrowDown className="mr-1" />
                )}
                {Math.abs(dashboardStats?.occupancyChange || 0)}%
              </p>
            </div>
            <div className="bg-yellow-100 p-2 rounded-full">
              <FaChair className="text-brasil-yellow" />
            </div>
          </div>
        </div>
        
        <div 
          className="bg-white rounded-lg shadow p-3 cursor-pointer active:bg-gray-50"
          onClick={() => setLocation('/admin/customers')}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-500">{t('NewCustomers')}</p>
              <h3 className="text-lg font-bold">{dashboardStats?.newCustomers || 0}</h3>
              <p className={`text-xs ${dashboardStats?.customerChange > 0 ? 'text-brasil-green' : 'text-brasil-red'} flex items-center`}>
                {dashboardStats?.customerChange > 0 ? (
                  <FaArrowUp className="mr-1" />
                ) : (
                  <FaArrowDown className="mr-1" />
                )}
                {Math.abs(dashboardStats?.customerChange || 0)}%
              </p>
            </div>
            <div className="bg-red-100 p-2 rounded-full">
              <FaUserPlus className="text-brasil-red" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const MobilePerformanceChart = () => (
    <section className="px-4 py-3">
      <div className="bg-white rounded-lg shadow p-3">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">{t('Performance')}</h3>
          <select className="text-xs bg-gray-100 rounded px-2 py-1 border border-gray-200">
            <option>{t('Last7Days')}</option>
            <option>{t('Last30Days')}</option>
            <option>{t('ThisYear')}</option>
          </select>
        </div>
        <div className="h-[200px]">
          <canvas ref={salesChartRef}></canvas>
        </div>
      </div>
    </section>
  );

  const MobileAlertsSection = () => {
    // Dados de alertas dinâmicos que futuramente podem vir do servidor
    const alerts = [
      {
        id: 1,
        type: 'warning',
        title: t('LowInventory'),
        message: t('LowInventoryItems'),
        time: '30 ' + t('Minutes') + ' ' + t('ago'),
        icon: <FaChair className="text-brasil-red" />,
        color: 'border-brasil-red',
        bgColor: 'bg-red-100'
      },
      {
        id: 2,
        type: 'info',
        title: t('VIPReservation'),
        message: t('VIPConfirmedTonight'),
        time: '2 ' + t('HoursUnit') + ' ' + t('ago'),
        icon: <FaCalendarCheck className="text-brasil-yellow" />,
        color: 'border-brasil-yellow',
        bgColor: 'bg-yellow-100'
      }
    ];
    
    return (
      <section className="px-4 py-2">
        <h3 className="font-semibold mb-2">{t('AlertsNotifications')}</h3>
        <div className="space-y-3">
          {alerts.map(alert => (
            <div key={alert.id} className={`bg-white rounded-lg shadow p-3 border-l-4 ${alert.color}`}>
              <div className="flex items-start">
                <div className={`${alert.bgColor} p-2 rounded-full mr-3`}>
                  {alert.icon}
                </div>
                <div>
                  <h4 className="font-medium text-sm">{alert.title}</h4>
                  <p className="text-xs text-gray-600">{alert.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{alert.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };

  const MobileRecentReservations = () => {
    // Format date from ISO string to readable format
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    };

    // Format time from ISO string to readable format
    const formatTime = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Get status badge class based on reservation status
    const getStatusClass = (status: string) => {
      switch(status) {
        case 'confirmed':
          return 'bg-green-100 text-green-800';
        case 'pending':
          return 'bg-yellow-100 text-yellow-800';
        case 'cancelled':
          return 'bg-gray-100 text-gray-800';
        case 'completed':
          return 'bg-blue-100 text-blue-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    // Get translated status text
    const getStatusText = (status: string) => {
      switch(status) {
        case 'confirmed':
          return t('Confirmed');
        case 'pending':
          return t('Pending');
        case 'cancelled':
          return t('Cancelled');
        case 'completed':
          return t('Completed');
        default:
          return status;
      }
    };
    
    return (
      <section className="px-4 py-2 mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold">{t('TodaysReservations')}</h3>
          <span 
            className="text-brasil-blue text-sm cursor-pointer"
            onClick={() => setLocation('/admin/reservations')}
          >
            {t('ViewAll')}
          </span>
        </div>
        
        <div className="space-y-3">
          {reservationsLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-brasil-blue"></div>
            </div>
          ) : recentReservations && recentReservations.length > 0 ? (
            recentReservations.slice(0, 3).map((reservation: any) => (
              <div 
                key={reservation.id} 
                className="bg-white rounded-lg shadow p-3 cursor-pointer active:bg-gray-50"
                onClick={() => setLocation(`/admin/reservations/${reservation.id}`)}
              >
                <div className="flex justify-between mb-1">
                  <span className="font-medium">#{reservation.id}</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusClass(reservation.status)}`}>
                    {getStatusText(reservation.status)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{reservation.userName || t('Guest')}</span>
                  <span>{formatTime(reservation.date)} • {reservation.partySize} {t('people')}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow p-4 text-center text-gray-500">
              {t('NoReservationsToday')}
            </div>
          )}
        </div>
      </section>
    );
  };

  return (
    <AdminLayout title={t('Dashboard')}>
      {/* Desktop Layout */}
      <div className="hidden md:block">
        <DesktopMetricsCards />
        <DesktopCharts />
        <DesktopReservationsTable />
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        <MobileMetricsCards />
        <MobilePerformanceChart />
        <MobileAlertsSection />
        <MobileRecentReservations />
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
