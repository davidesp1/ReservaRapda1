import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { pt } from 'date-fns/locale';
import { BarChart, AreaChart } from '@/components/admin/Charts';
import { Download, Filter, Search, ChevronDown, Calendar, Euro } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PAYMENT_METHODS, PAYMENT_STATUS } from '@/constants';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

const Finance: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const [_, setLocation] = useLocation();
  const [currentTab, setCurrentTab] = useState('payments');
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Fetch payments
  const { data: payments, isLoading: paymentsLoading } = useQuery<any>({
    queryKey: ['/api/payments'],
    enabled: isAuthenticated && isAdmin,
  });

  // Filter payments based on search, date range, status, and method
  const filteredPayments = React.useMemo(() => {
    if (!payments) return [];
    
    return payments.filter((payment: any) => {
      const searchLower = searchText.toLowerCase();
      const matchesSearch = 
        payment.transactionId?.toLowerCase().includes(searchLower) ||
        payment.reservationId.toString().includes(searchLower);
      
      // Date range filter
      const paymentDate = payment.paymentDate ? new Date(payment.paymentDate) : null;
      const matchesDateRange = paymentDate ? 
        (!dateRange.from || paymentDate >= dateRange.from) && 
        (!dateRange.to || paymentDate <= dateRange.to) : true;
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
      
      // Method filter
      const matchesMethod = methodFilter === 'all' || payment.method === methodFilter;
      
      return matchesSearch && matchesDateRange && matchesStatus && matchesMethod;
    });
  }, [payments, searchText, dateRange, statusFilter, methodFilter]);

  // Calculate totals
  const totals = React.useMemo(() => {
    if (!payments) return {
      totalRevenue: 0,
      completedPayments: 0,
      pendingPayments: 0,
      failedPayments: 0
    };
    
    const completed = payments.filter((p: any) => p.status === 'completed');
    const pending = payments.filter((p: any) => p.status === 'pending');
    const failed = payments.filter((p: any) => p.status === 'failed');
    
    const totalRevenue = completed.reduce((sum: number, p: any) => sum + p.amount, 0);
    
    return {
      totalRevenue,
      completedPayments: completed.length,
      pendingPayments: pending.length,
      failedPayments: failed.length
    };
  }, [payments]);

  // Generate chart data
  const revenueByDay = React.useMemo(() => {
    if (!payments) return [];
    
    const paymentsByDay: Record<string, number> = {};
    
    payments
      .filter((p: any) => p.status === 'completed' && p.paymentDate)
      .forEach((p: any) => {
        const date = format(new Date(p.paymentDate), 'yyyy-MM-dd');
        paymentsByDay[date] = (paymentsByDay[date] || 0) + p.amount;
      });
    
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      return {
        date,
        amount: paymentsByDay[date] || 0
      };
    }).reverse();
    
    return last30Days;
  }, [payments]);

  // Generate payment method distribution data
  const paymentsByMethod = React.useMemo(() => {
    if (!payments) return [];
    
    const methodTotals: Record<string, number> = {};
    
    payments
      .filter((p: any) => p.status === 'completed')
      .forEach((p: any) => {
        methodTotals[p.method] = (methodTotals[p.method] || 0) + 1;
      });
    
    return Object.entries(methodTotals).map(([method, count]) => {
      const methodInfo = PAYMENT_METHODS.find(m => m.id === method) || { name: method, id: method };
      return {
        label: methodInfo.name,
        value: count
      };
    });
  }, [payments]);

  // Format price to display as currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(price / 100);
  };

  // Format date range for display
  const formatDateRange = () => {
    if (!dateRange.from) return t('AllTime');
    
    if (!dateRange.to) {
      return `${format(dateRange.from, 'PPP', { locale: pt })} - ${t('Present')}`;
    }
    
    return `${format(dateRange.from, 'PPP', { locale: pt })} - ${format(dateRange.to, 'PPP', { locale: pt })}`;
  };

  // Handle date presets
  const handleDatePreset = (preset: string) => {
    const today = new Date();
    
    switch (preset) {
      case 'today':
        setDateRange({ from: today, to: today });
        break;
      case 'yesterday':
        const yesterday = subDays(today, 1);
        setDateRange({ from: yesterday, to: yesterday });
        break;
      case 'last7days':
        setDateRange({ from: subDays(today, 6), to: today });
        break;
      case 'last30days':
        setDateRange({ from: subDays(today, 29), to: today });
        break;
      case 'thisMonth':
        setDateRange({ from: startOfMonth(today), to: today });
        break;
      case 'lastMonth':
        const lastMonthStart = startOfMonth(subDays(startOfMonth(today), 1));
        const lastMonthEnd = endOfMonth(lastMonthStart);
        setDateRange({ from: lastMonthStart, to: lastMonthEnd });
        break;
      case 'allTime':
        setDateRange({ from: undefined, to: undefined });
        break;
      default:
        break;
    }
    
    setIsDatePickerOpen(false);
  };

  if (paymentsLoading) {
    return (
      <AdminLayout title={t('Finance')}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={t('Finance')}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-montserrat font-bold">{t('Finance')}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('TotalRevenue')}</p>
                <h3 className="text-2xl font-bold text-green-700 mt-1">{formatPrice(totals.totalRevenue)}</h3>
              </div>
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <Euro className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <div className="text-2xl font-bold text-green-600">{totals.completedPayments}</div>
              <p className="text-gray-500 mt-2">{t('CompletedPayments')}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <div className="text-2xl font-bold text-yellow-600">{totals.pendingPayments}</div>
              <p className="text-gray-500 mt-2">{t('PendingPayments')}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <div className="text-2xl font-bold text-red-600">{totals.failedPayments}</div>
              <p className="text-gray-500 mt-2">{t('FailedPayments')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue={currentTab} onValueChange={setCurrentTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="payments">{t('Payments')}</TabsTrigger>
          <TabsTrigger value="analytics">{t('Analytics')}</TabsTrigger>
        </TabsList>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>{t('PaymentHistory')}</CardTitle>
              <CardDescription>{t('ManageAndTrackPayments')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder={t('SearchTransactionId')}
                    className="pl-10"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                </div>
                
                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start w-full md:w-auto">
                      <Calendar className="mr-2 h-4 w-4" />
                      {formatDateRange()}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="grid grid-cols-2 gap-2 p-2">
                      <div>
                        <div className="pb-4 pt-2 px-4 font-medium text-sm">
                          {t('DatePresets')}
                        </div>
                        <div className="space-y-2 px-2">
                          {[
                            { id: 'today', label: t('Today') },
                            { id: 'yesterday', label: t('Yesterday') },
                            { id: 'last7days', label: t('Last7Days') },
                            { id: 'last30days', label: t('Last30Days') },
                            { id: 'thisMonth', label: t('ThisMonth') },
                            { id: 'lastMonth', label: t('LastMonth') },
                            { id: 'allTime', label: t('AllTime') },
                          ].map((preset) => (
                            <Button
                              key={preset.id}
                              variant="ghost"
                              className="w-full justify-start text-sm font-normal"
                              onClick={() => handleDatePreset(preset.id)}
                            >
                              {preset.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div className="border-l">
                        <div className="pb-4 pt-2 px-4 font-medium text-sm">
                          {t('CustomRange')}
                        </div>
                        <CalendarComponent
                          mode="range"
                          selected={{ 
                            from: dateRange.from || undefined, 
                            to: dateRange.to || undefined 
                          }}
                          onSelect={(range) => setDateRange({
                            from: range?.from,
                            to: range?.to
                          })}
                          numberOfMonths={1}
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="md:w-[150px]">
                    <SelectValue placeholder={t('Status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('AllStatus')}</SelectItem>
                    {PAYMENT_STATUS.map((status) => (
                      <SelectItem key={status.id} value={status.id}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select
                  value={methodFilter}
                  onValueChange={setMethodFilter}
                >
                  <SelectTrigger className="md:w-[150px]">
                    <SelectValue placeholder={t('Method')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('AllMethods')}</SelectItem>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  {t('Export')}
                </Button>
              </div>

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('Date')}</TableHead>
                      <TableHead>{t('TransactionId')}</TableHead>
                      <TableHead>{t('ReservationId')}</TableHead>
                      <TableHead>{t('Amount')}</TableHead>
                      <TableHead>{t('Method')}</TableHead>
                      <TableHead>{t('Status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.length > 0 ? (
                      filteredPayments.map((payment: any) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            {payment.paymentDate ? format(new Date(payment.paymentDate), 'dd/MM/yyyy HH:mm') : '-'}
                          </TableCell>
                          <TableCell className="font-medium">
                            {payment.transactionId || '-'}
                          </TableCell>
                          <TableCell>
                            #{payment.reservationId}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatPrice(payment.amount)}
                          </TableCell>
                          <TableCell>
                            {PAYMENT_METHODS.find(m => m.id === payment.method)?.name || payment.method}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                payment.status === 'completed' ? 'success' : 
                                payment.status === 'pending' ? 'warning' : 
                                payment.status === 'failed' ? 'destructive' : 
                                'default'
                              }
                            >
                              {PAYMENT_STATUS.find(s => s.id === payment.status)?.name || payment.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                          {searchText || statusFilter !== 'all' || methodFilter !== 'all' ? 
                            t('NoPaymentsFound') : 
                            t('NoPayments')
                          }
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('RevenueOverTime')}</CardTitle>
                <CardDescription>{t('Last30DaysRevenue')}</CardDescription>
              </CardHeader>
              <CardContent>
                <AreaChart 
                  data={revenueByDay} 
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
                  data={paymentsByMethod}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">{t('SuccessRate')}</h3>
                  <div className="text-3xl font-bold text-green-600">
                    {payments && payments.length > 0 ? 
                      `${((totals.completedPayments / payments.length) * 100).toFixed(1)}%` : 
                      '0%'
                    }
                  </div>
                  <p className="text-gray-500 mt-2">
                    {t('SuccessfulTransactions')}: {totals.completedPayments}
                  </p>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">{t('AverageTransaction')}</h3>
                  <div className="text-3xl font-bold text-brasil-blue">
                    {totals.completedPayments > 0 ? 
                      formatPrice(totals.totalRevenue / totals.completedPayments) : 
                      formatPrice(0)
                    }
                  </div>
                  <p className="text-gray-500 mt-2">
                    {t('PerTransaction')}
                  </p>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">{t('PendingValue')}</h3>
                  <div className="text-3xl font-bold text-yellow-600">
                    {formatPrice(
                      payments?.filter((p: any) => p.status === 'pending')
                        .reduce((sum: number, p: any) => sum + p.amount, 0) || 0
                    )}
                  </div>
                  <p className="text-gray-500 mt-2">
                    {t('AwaitingProcessing')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default Finance;
