import React from 'react';
import FinanceLayout from '@/components/layouts/FinanceLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, Calendar, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';

interface DashboardStats {
  todayRevenue: string;
  revenueChange: string;
  weeklyData: Array<{ date: string; revenue: number }>;
  totalReservations: number;
}

export default function FinanceDashboard() {
  const [_, setLocation] = useLocation();

  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['/api/stats/dashboard'],
    staleTime: 30000,
  });

  if (isLoading) {
    return (
      <FinanceLayout title="Painel Financeiro">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </FinanceLayout>
    );
  }

  if (error) {
    return (
      <FinanceLayout title="Painel Financeiro">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">Erro ao carregar dados financeiros</p>
          </CardContent>
        </Card>
      </FinanceLayout>
    );
  }

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(numValue);
  };

  return (
    <FinanceLayout title="Painel Financeiro">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita de Hoje</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.todayRevenue ? formatCurrency(stats.todayRevenue) : '€0,00'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.revenueChange || '+0%'} em relação a ontem
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Semanal</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.weeklyData 
                ? formatCurrency(stats.weeklyData.reduce((acc, day) => acc + day.revenue, 0))
                : '€0,00'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Últimos 7 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reservas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalReservations || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Reservas ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Relatórios</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => setLocation('/admin/finance')}
            >
              Ver Detalhes
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Receita dos Últimos 7 Dias</CardTitle>
            <CardDescription>
              Evolução diária da receita
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.weeklyData && stats.weeklyData.length > 0 ? (
              <div className="space-y-2">
                {stats.weeklyData.map((day, index) => (
                  <div key={index} className="flex justify-between items-center p-2 rounded bg-gray-50">
                    <span className="text-sm">{new Date(day.date).toLocaleDateString('pt-PT')}</span>
                    <span className="font-medium">{formatCurrency(day.revenue)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhum dado disponível</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acesso Rápido</CardTitle>
            <CardDescription>
              Ferramentas financeiras principais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setLocation('/admin/finance')}
            >
              <FileText className="mr-2 h-4 w-4" />
              Relatórios Detalhados
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setLocation('/financeiro/profile')}
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Configurações Financeiras
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Resumo Financeiro</CardTitle>
          <CardDescription>
            Informações importantes sobre o desempenho financeiro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded">
              <h3 className="font-semibold text-lg">Receita Média Diária</h3>
              <p className="text-2xl font-bold text-brasil-green">
                {stats?.weeklyData 
                  ? formatCurrency(stats.weeklyData.reduce((acc, day) => acc + day.revenue, 0) / 7)
                  : '€0,00'
                }
              </p>
            </div>
            <div className="text-center p-4 border rounded">
              <h3 className="font-semibold text-lg">Melhor Dia</h3>
              <p className="text-2xl font-bold text-brasil-blue">
                {stats?.weeklyData 
                  ? formatCurrency(Math.max(...stats.weeklyData.map(d => d.revenue)))
                  : '€0,00'
                }
              </p>
            </div>
            <div className="text-center p-4 border rounded">
              <h3 className="font-semibold text-lg">Total Semanal</h3>
              <p className="text-2xl font-bold text-gray-700">
                {stats?.weeklyData 
                  ? formatCurrency(stats.weeklyData.reduce((acc, day) => acc + day.revenue, 0))
                  : '€0,00'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </FinanceLayout>
  );
}