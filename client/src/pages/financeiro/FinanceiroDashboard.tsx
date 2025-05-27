import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  CreditCard,
  Calendar,
  BarChart3,
  Users,
  ArrowLeft
} from 'lucide-react';
import { Helmet } from 'react-helmet';

const FinanceiroDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isFinanceiro, isLoading, user } = useAuth();
  const [_, setLocation] = useLocation();
  
  // Redirect to home if not authenticated or not financeiro
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isFinanceiro)) {
      setLocation('/');
    }
  }, [isAuthenticated, isFinanceiro, isLoading, setLocation]);

  // Fetch dashboard stats
  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/stats/dashboard'],
    enabled: isAuthenticated && isFinanceiro,
  });

  // Fetch payments data
  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['/api/payments'],
    enabled: isAuthenticated && isFinanceiro,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brasil-green"></div>
      </div>
    );
  }
  
  if (!isAuthenticated || !isFinanceiro) {
    return null;
  }

  const formatCurrency = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'EUR'
    }).format(numValue);
  };

  const todayRevenue = dashboardStats?.todayRevenue ? parseFloat(dashboardStats.todayRevenue) : 0;
  const revenueChange = dashboardStats?.revenueChange || 0;
  const totalCustomers = dashboardStats?.totalCustomers || 0;
  const pendingPayments = paymentsData?.filter((payment: any) => payment.status === 'pending').length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Dashboard Financeiro - Sistema Restaurante</title>
        <meta name="description" content="Dashboard financeiro do sistema de gestão de restaurante" />
      </Helmet>

      <div className="p-4 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <Button
                variant="ghost"
                onClick={() => setLocation('/financeiro/profile')}
                className="mb-4 p-0 h-auto text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Perfil
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard Financeiro</h1>
              <p className="mt-1 text-sm text-gray-500">
                Visão geral das finanças do restaurante
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Logado como</p>
              <p className="font-medium">{user?.firstName} {user?.lastName}</p>
              <Badge variant="secondary" className="text-xs">
                <DollarSign className="w-3 h-3 mr-1" />
                Financeiro
              </Badge>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Today's Revenue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita de Hoje</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? (
                  <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  formatCurrency(todayRevenue)
                )}
              </div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                {revenueChange >= 0 ? (
                  <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-1 text-red-600" />
                )}
                <span className={revenueChange >= 0 ? "text-green-600" : "text-red-600"}>
                  {revenueChange > 0 ? '+' : ''}{revenueChange}%
                </span>
                <span className="ml-1">em relação a ontem</span>
              </p>
            </CardContent>
          </Card>

          {/* Total Customers */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? (
                  <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  totalCustomers
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Clientes registrados
              </p>
            </CardContent>
          </Card>

          {/* Pending Payments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagamentos Pendentes</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {paymentsLoading ? (
                  <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  pendingPayments
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Aguardando confirmação
              </p>
            </CardContent>
          </Card>

          {/* This Month */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? (
                  <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  formatCurrency(dashboardStats?.monthlyRevenue || 0)
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Receita mensal
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setLocation('/admin/finance')}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Ver Receitas
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setLocation('/admin/finance')}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pagamentos
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setLocation('/admin/finance')}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Relatórios
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setLocation('/admin/finance')}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Finanças Completas
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumo de Pagamentos</CardTitle>
            </CardHeader>
            <CardContent>
              {paymentsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pendentes:</span>
                    <Badge variant="outline">{pendingPayments}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Concluídos hoje:</span>
                    <Badge variant="secondary">
                      {paymentsData?.filter((p: any) => 
                        p.status === 'completed' && 
                        new Date(p.paymentDate).toDateString() === new Date().toDateString()
                      ).length || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total de pagamentos:</span>
                    <Badge>{paymentsData?.length || 0}</Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex space-x-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {paymentsData?.slice(0, 5).map((payment: any) => (
                  <div key={payment.id} className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Pagamento {formatCurrency(payment.amount / 100)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {payment.method} - {new Date(payment.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Badge 
                      variant={payment.status === 'completed' ? 'default' : 'secondary'}
                    >
                      {payment.status === 'completed' ? 'Concluído' : 
                       payment.status === 'pending' ? 'Pendente' : 'Falhou'}
                    </Badge>
                  </div>
                )) || (
                  <p className="text-gray-500 text-center py-4">
                    Nenhuma atividade recente encontrada
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinanceiroDashboard;