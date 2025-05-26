import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Helmet } from 'react-helmet';
import { ChefHat, CreditCard, User, Clock, Euro } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SaleByCollaborator {
  orderId: number;
  totalAmount: number;
  paymentMethod: string;
  orderTime: string;
  collaboratorId: number | null;
  collaboratorName: string | null;
  collaboratorUsername: string | null;
}

const CollaboratorSales: React.FC = () => {
  const { t } = useTranslation();

  const { data: salesData, isLoading, error } = useQuery({
    queryKey: ['/api/sales/by-collaborator'],
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });

  const formatPrice = (price: number) => {
    return (price / 100).toLocaleString('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    });
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: { [key: string]: string } = {
      cash: 'Dinheiro',
      card: 'Cartão',
      mbway: 'MBWay',
      multibanco: 'Multibanco',
      transfer: 'Transferência',
    };
    return methods[method] || method;
  };

  const getPaymentMethodColor = (method: string) => {
    const colors: { [key: string]: string } = {
      cash: 'bg-green-100 text-green-800',
      card: 'bg-blue-100 text-blue-800',
      mbway: 'bg-purple-100 text-purple-800',
      multibanco: 'bg-orange-100 text-orange-800',
      transfer: 'bg-gray-100 text-gray-800',
    };
    return colors[method] || 'bg-gray-100 text-gray-800';
  };

  // Agrupar vendas por colaborador
  const salesByCollaborator = salesData?.reduce((acc: any, sale: SaleByCollaborator) => {
    const key = sale.collaboratorId ? `${sale.collaboratorId}` : 'admin';
    if (!acc[key]) {
      acc[key] = {
        collaboratorId: sale.collaboratorId,
        collaboratorName: sale.collaboratorName || 'Admin/Sistema',
        collaboratorUsername: sale.collaboratorUsername || 'admin',
        sales: [],
        totalSales: 0,
        totalAmount: 0,
      };
    }
    acc[key].sales.push(sale);
    acc[key].totalSales += 1;
    acc[key].totalAmount += sale.totalAmount;
    return acc;
  }, {}) || {};

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brasil-blue"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Erro ao carregar dados de vendas</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Helmet>
        <title>Vendas por Colaborador - Opa que delicia</title>
        <meta name="description" content="Relatório de vendas realizadas por colaboradores" />
      </Helmet>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Vendas por Colaborador</h1>
        <p className="text-gray-600">Acompanhe o desempenho de vendas de cada colaborador</p>
      </div>

      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {salesData?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              vendas registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(salesData?.reduce((sum: number, sale: SaleByCollaborator) => sum + sale.totalAmount, 0) || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              valor total vendido
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Colaboradores Ativos</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(salesByCollaborator).length}
            </div>
            <p className="text-xs text-muted-foreground">
              colaboradores venderam
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Colaboradores e suas Vendas */}
      <div className="space-y-6">
        {Object.values(salesByCollaborator).map((collaborator: any) => (
          <Card key={collaborator.collaboratorId || 'admin'} className="overflow-hidden">
            <CardHeader className="bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-brasil-blue rounded-full flex items-center justify-center">
                    {collaborator.collaboratorId ? (
                      <ChefHat className="w-5 h-5 text-white" />
                    ) : (
                      <User className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {collaborator.collaboratorName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      @{collaborator.collaboratorUsername}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-brasil-blue">
                    {formatPrice(collaborator.totalAmount)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {collaborator.totalSales} vendas
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                <div className="divide-y divide-gray-200">
                  {collaborator.sales.map((sale: SaleByCollaborator) => (
                    <div key={sale.orderId} className="p-4 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600">
                            #{sale.orderId}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {formatPrice(sale.totalAmount)}
                          </p>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Clock className="w-3 h-3" />
                            <span>
                              {format(new Date(sale.orderTime), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge 
                        className={`${getPaymentMethodColor(sale.paymentMethod)} border-0`}
                      >
                        {getPaymentMethodLabel(sale.paymentMethod)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {salesData?.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <ChefHat className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma venda encontrada
            </h3>
            <p className="text-gray-600">
              Quando os colaboradores realizarem vendas, elas aparecerão aqui.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CollaboratorSales;