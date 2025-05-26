import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Helmet } from 'react-helmet';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  XCircle,
  Download,
  Filter,
  Search,
  CreditCard,
  Banknote,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import AdminSidebar from '@/components/admin/Sidebar';
import AdminNavbar from '@/components/admin/Navbar';

interface Payment {
  id: number;
  amount: number;
  method: string;
  status: string;
  reference: string;
  transaction_id: string;
  payment_date: string;
  username: string;
  first_name: string;
  last_name: string;
  payment_source: string;
}

const Finances = () => {
  const [activeTab, setActiveTab] = useState('pagamentos');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const queryClient = useQueryClient();

  // Buscar dados de pagamentos
  const { data: paymentsData = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['/api/payments'],
    refetchInterval: 5000
  });

  const payments: Payment[] = Array.isArray(paymentsData) ? paymentsData : [];

  // Configurar realtime do Supabase
  useEffect(() => {
    const channel = supabase
      .channel('payments-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'payments' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Filtrar pagamentos
  const filteredPayments = payments.filter((payment: Payment) => {
    const matchesSearch = !searchQuery || 
      payment.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.transaction_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${payment.first_name} ${payment.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.username.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || payment.method === methodFilter;
    
    let matchesDateRange = true;
    if (startDate && endDate) {
      const paymentDate = new Date(payment.payment_date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      matchesDateRange = paymentDate >= start && paymentDate <= end;
    }
    
    return matchesSearch && matchesStatus && matchesMethod && matchesDateRange;
  });

  const formatCurrency = (amount: number) => {
    return (amount / 100).toLocaleString('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT');
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'card':
        return <CreditCard className="w-4 h-4" />;
      case 'cash':
        return <Banknote className="w-4 h-4" />;
      case 'mbway':
        return <Smartphone className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'card':
        return 'Cartão';
      case 'cash':
        return 'Dinheiro';
      case 'mbway':
        return 'MBWay';
      case 'multibanco':
        return 'Multibanco';
      default:
        return method;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Concluído</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falha</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Calcular métricas
  const metrics = {
    totalRevenue: payments.reduce((sum, p) => sum + p.amount, 0),
    completedPayments: payments.filter(p => p.status === 'completed').length,
    pendingPayments: payments.filter(p => p.status === 'pending').length,
    failedPayments: payments.filter(p => p.status === 'failed').length,
    completionRate: payments.length > 0 ? Math.round((payments.filter(p => p.status === 'completed').length / payments.length) * 100) : 0,
    revenueGrowth: 7
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Helmet>
        <title>Finanças - Opa que delicia</title>
        <meta name="description" content="Gestão financeira e análise de pagamentos do restaurante." />
      </Helmet>

      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="ml-64 flex-1 p-8">
        {/* Header/Navbar */}
        <AdminNavbar title="Finanças" />
        
        <div className="space-y-6">
          {/* Métricas Financeiras */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Receita Total */}
            <div className="bg-white rounded-xl shadow-sm p-6 border-t-4 border-green-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Receita Total</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">
                    {formatCurrency(metrics.totalRevenue)}
                  </p>
                  <div className="flex items-center mt-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-green-600 font-medium">+{metrics.revenueGrowth}%</span>
                    <span className="text-gray-500 ml-1">em relação ao mês passado</span>
                  </div>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Pagamentos Concluídos */}
            <div className="bg-white rounded-xl shadow-sm p-6 border-t-4 border-blue-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Pagamentos Concluídos</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{metrics.completedPayments}</p>
                  <div className="flex items-center mt-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-blue-500 mr-1" />
                    <span className="text-blue-600 font-medium">{metrics.completionRate}%</span>
                    <span className="text-gray-500 ml-1">do total</span>
                  </div>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Pagamentos Pendentes */}
            <div className="bg-white rounded-xl shadow-sm p-6 border-t-4 border-yellow-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Pagamentos Pendentes</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{metrics.pendingPayments}</p>
                  <div className="flex items-center mt-2 text-sm">
                    <Clock className="w-4 h-4 text-yellow-500 mr-1" />
                    <span className="text-yellow-600 font-medium">
                      {payments.length > 0 ? Math.round((metrics.pendingPayments / payments.length) * 100) : 0}%
                    </span>
                    <span className="text-gray-500 ml-1">do total</span>
                  </div>
                </div>
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            {/* Falhas de Pagamento */}
            <div className="bg-white rounded-xl shadow-sm p-6 border-t-4 border-red-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Falhas de Pagamento</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{metrics.failedPayments}</p>
                  <div className="flex items-center mt-2 text-sm">
                    <XCircle className="w-4 h-4 text-red-500 mr-1" />
                    <span className="text-red-600 font-medium">
                      {payments.length > 0 ? Math.round((metrics.failedPayments / payments.length) * 100) : 0}%
                    </span>
                    <span className="text-gray-500 ml-1">do total</span>
                  </div>
                </div>
                <div className="bg-red-100 p-3 rounded-lg">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('pagamentos')}
                  className={`px-6 py-3 font-medium text-sm ${
                    activeTab === 'pagamentos'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Pagamentos
                </button>
                <button
                  onClick={() => setActiveTab('analise')}
                  className={`px-6 py-3 font-medium text-sm ${
                    activeTab === 'analise'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Análise
                </button>
              </div>
            </div>

            {activeTab === 'pagamentos' && (
              <div className="p-6">
                {/* Filtros */}
                <div className="flex flex-wrap items-end gap-4 mb-6">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pesquisar
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Buscar por transação, referência ou usuário..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="min-w-[150px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="completed">Concluído</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="failed">Falha</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="min-w-[150px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Método
                    </label>
                    <Select value={methodFilter} onValueChange={setMethodFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="card">Cartão</SelectItem>
                        <SelectItem value="cash">Dinheiro</SelectItem>
                        <SelectItem value="mbway">MBWay</SelectItem>
                        <SelectItem value="multibanco">Multibanco</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="w-4 h-4 mr-2" />
                      Filtros
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Exportar
                    </Button>
                  </div>
                </div>

                {/* Tabela de Pagamentos */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-500">ID</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Usuário</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Valor</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Método</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Data</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentsLoading ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-gray-500">
                            Carregando pagamentos...
                          </td>
                        </tr>
                      ) : filteredPayments.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-gray-500">
                            Nenhum pagamento encontrado
                          </td>
                        </tr>
                      ) : (
                        filteredPayments.map((payment) => (
                          <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm font-mono">{payment.id}</td>
                            <td className="py-3 px-4">
                              <div>
                                <div className="font-medium text-gray-900">
                                  {payment.first_name} {payment.last_name}
                                </div>
                                <div className="text-sm text-gray-500">@{payment.username}</div>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-medium">{formatCurrency(payment.amount)}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                {getPaymentMethodIcon(payment.method)}
                                <span className="ml-2">{getPaymentMethodLabel(payment.method)}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-500">
                              {formatDate(payment.payment_date)}
                            </td>
                            <td className="py-3 px-4">
                              {getStatusBadge(payment.status)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'analise' && (
              <div className="p-6">
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Análise Financeira
                  </h3>
                  <p className="text-gray-500">
                    Gráficos e relatórios detalhados em desenvolvimento.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Finances;