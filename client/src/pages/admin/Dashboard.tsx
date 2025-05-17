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

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isAdmin } = useAuth();
  const salesChartRef = useRef<HTMLCanvasElement>(null);
  const categoryChartRef = useRef<HTMLCanvasElement>(null);
  
  // Fetch dashboard stats - usando dados mockados para visualização
  const { data: dashboardStats, isLoading: statsLoading } = useQuery<any>({
    queryKey: ['/api/stats/dashboard'],
    enabled: isAuthenticated && isAdmin,
  });
  
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Chart && salesChartRef.current && categoryChartRef.current) {
      // Renderização dos gráficos usando Chart.js
      const salesCtx = salesChartRef.current.getContext('2d');
      const categoryCtx = categoryChartRef.current.getContext('2d');
      
      if (salesCtx && categoryCtx) {
        // Sales Chart
        new window.Chart(salesCtx, {
          type: 'bar',
          data: {
            labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
            datasets: [{
              label: 'Faturamento (R$)',
              data: [3200, 2800, 4100, 3700, 5200, 6500, 4289],
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
        new window.Chart(categoryCtx, {
          type: 'doughnut',
          data: {
            labels: ['Pratos Principais', 'Bebidas', 'Sobremesas', 'Entradas'],
            datasets: [{
              data: [45, 25, 15, 15],
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

  return (
    <AdminLayout title={t('Dashboard')}>
      {/* Metrics Cards */}
      <div id="metrics-cards" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-brasil-green">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium">{t('TodayRevenue')}</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">R$ 4.289,00</p>
              <div className="flex items-center mt-2 text-sm">
                <FaArrowUp className="text-brasil-green mr-1" />
                <span className="text-brasil-green font-medium">12%</span>
                <span className="text-gray-500 ml-1">{t('vs_last_week')}</span>
              </div>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <FaDollarSign className="text-brasil-green text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-brasil-blue">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium">{t('TodayReservations')}</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">42</p>
              <div className="flex items-center mt-2 text-sm">
                <FaArrowUp className="text-brasil-green mr-1" />
                <span className="text-brasil-green font-medium">8%</span>
                <span className="text-gray-500 ml-1">{t('vs_yesterday')}</span>
              </div>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <FaCalendarCheck className="text-brasil-blue text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-brasil-yellow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium">{t('CurrentOccupancy')}</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">78%</p>
              <div className="flex items-center mt-2 text-sm">
                <FaArrowDown className="text-brasil-red mr-1" />
                <span className="text-brasil-red font-medium">3%</span>
                <span className="text-gray-500 ml-1">{t('vs_weekly_average')}</span>
              </div>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <FaChair className="text-brasil-yellow text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-brasil-red">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium">{t('NewCustomers')}</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">16</p>
              <div className="flex items-center mt-2 text-sm">
                <FaArrowUp className="text-brasil-green mr-1" />
                <span className="text-brasil-green font-medium">25%</span>
                <span className="text-gray-500 ml-1">{t('vs_last_week')}</span>
              </div>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <FaUserPlus className="text-brasil-red text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div id="charts-section" className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div id="sales-chart" className="bg-white rounded-xl shadow-md p-6 lg:col-span-2">
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

        <div id="category-chart" className="bg-white rounded-xl shadow-md p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-800 font-montserrat">{t('SalesByCategory')}</h2>
            <p className="text-sm text-gray-500">{t('ThisMonth')}</p>
          </div>
          <div className="h-56">
            <canvas ref={categoryChartRef}></canvas>
          </div>
        </div>
      </div>

      {/* Recent Reservations */}
      <div id="recent-reservations" className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 font-montserrat">{t('RecentReservations')}</h2>
            <p className="text-sm text-gray-500">{t('LastReservations')}</p>
          </div>
          <button className="text-sm text-brasil-blue hover:underline">{t('ViewAll')}</button>
        </div>

        <div className="overflow-x-auto">
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
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3">#4721</td>
                <td className="px-4 py-3">João Silva</td>
                <td className="px-4 py-3">17/05/2025</td>
                <td className="px-4 py-3">19:30</td>
                <td className="px-4 py-3">4</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                    {t('Confirmed')}
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3">#4720</td>
                <td className="px-4 py-3">Maria Santos</td>
                <td className="px-4 py-3">17/05/2025</td>
                <td className="px-4 py-3">20:00</td>
                <td className="px-4 py-3">2</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                    {t('Arrived')}
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3">#4719</td>
                <td className="px-4 py-3">Carlos Oliveira</td>
                <td className="px-4 py-3">17/05/2025</td>
                <td className="px-4 py-3">18:45</td>
                <td className="px-4 py-3">6</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                    {t('Pending')}
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3">#4718</td>
                <td className="px-4 py-3">Ana Pereira</td>
                <td className="px-4 py-3">17/05/2025</td>
                <td className="px-4 py-3">19:00</td>
                <td className="px-4 py-3">3</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                    {t('Confirmed')}
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3">#4717</td>
                <td className="px-4 py-3">Pedro Costa</td>
                <td className="px-4 py-3">17/05/2025</td>
                <td className="px-4 py-3">20:30</td>
                <td className="px-4 py-3">5</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                    {t('Cancelled')}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
