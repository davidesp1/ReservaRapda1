import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { 
  Search, TrendingUp, Clock, XCircle, CheckCircle, 
  Filter, FileDown, CreditCard, Banknote
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Payment {
  id: number;
  transaction_id: string;
  reference: string;
  amount: number;
  method: string;
  status: string;
  payment_date: string;
  user_id: number;
  details?: any;
  created_at: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  payment_source?: string;
  reservation_date?: string;
}

const Finance: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isAdmin, user } = useAuth();
  const [currentTab, setCurrentTab] = useState('pagamentos');
  const [searchText, setSearchText] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [methodFilter, setMethodFilter] = useState<string>('');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Buscar dados em tempo real do banco via API
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/payments');
        
        if (!response.ok) {
          throw new Error('Erro ao buscar pagamentos');
        }
        
        const data = await response.json();
        console.log('Dados de pagamentos carregados:', data.length, 'registros');
        setPayments(data || []);
      } catch (error) {
        console.error('Erro ao buscar pagamentos:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados financeiros",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    // Carregar dados iniciais
    fetchPayments();

    // Configurar atualização automática a cada 5 segundos para dados em tempo real
    const interval = setInterval(fetchPayments, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [toast]);

  // Filtrar pagamentos
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = !searchText || 
      payment.reference?.toLowerCase().includes(searchText.toLowerCase()) ||
      payment.transaction_id?.toLowerCase().includes(searchText.toLowerCase()) ||
      payment.username?.toLowerCase().includes(searchText.toLowerCase()) ||
      payment.email?.toLowerCase().includes(searchText.toLowerCase());

    const matchesStatus = !statusFilter || payment.status === statusFilter;
    const matchesMethod = !methodFilter || payment.method === methodFilter;

    const paymentDate = new Date(payment.payment_date || payment.created_at);
    const matchesStartDate = !startDate || paymentDate >= new Date(startDate);
    const matchesEndDate = !endDate || paymentDate <= new Date(endDate);

    return matchesSearch && matchesStatus && matchesMethod && matchesStartDate && matchesEndDate;
  });

  // Aplicar filtros
  const handleApplyFilters = () => {
    // Os filtros já são aplicados automaticamente devido ao useMemo
    toast({
      title: "Filtros aplicados",
      description: `Mostrando ${filteredPayments.length} pagamentos`,
    });
  };

  // Exportar dados
  const handleExport = () => {
    const csvData = filteredPayments.map(payment => ({
      'ID': payment.id,
      'Referência': payment.reference,
      'Valor': payment.amount,
      'Método': getPaymentMethodDisplay(payment.method),
      'Status': getStatusDisplay(payment.status),
      'Data': format(new Date(payment.payment_date || payment.created_at), 'dd/MM/yyyy HH:mm'),
      'Usuário': payment.username || 'N/A',
      'Email': payment.email || 'N/A'
    }));

    const csvContent = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `financas_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();

    toast({
      title: "Exportação concluída",
      description: "Dados exportados com sucesso",
    });
  };

  // Calcular métricas
  const totalRevenue = filteredPayments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const completedPayments = filteredPayments.filter(p => p.status === 'completed').length;
  const pendingPayments = filteredPayments.filter(p => p.status === 'pending').length;
  const failedPayments = filteredPayments.filter(p => p.status === 'failed').length;

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluído';
      case 'pending': return 'Pendente';
      case 'failed': return 'Falha';
      default: return status;
    }
  };

  const getPaymentMethodDisplay = (method: string) => {
    switch (method) {
      case 'card': return 'Cartão';
      case 'mbway': return 'MBWay';
      case 'multibanco': return 'Multibanco';
      case 'transfer': return 'Transferência';
      case 'cash': return 'Dinheiro';
      case 'multibanco_tpa': return 'Multibanco (TPA)';
      default: return method;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  if (!isAuthenticated || !isAdmin) {
    return <div>Acesso negado</div>;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Finanças</h1>
            <p className="text-gray-600 mt-1">Gestão financeira e relatórios em tempo real</p>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Dados em tempo real
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Receita Total</p>
                <p className="text-2xl font-bold text-gray-900">€{(totalRevenue / 100).toFixed(2)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pagamentos Concluídos</p>
                <p className="text-2xl font-bold text-green-600">{completedPayments}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pagamentos Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingPayments}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pagamentos Falhados</p>
                <p className="text-2xl font-bold text-red-600">{failedPayments}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-4 mb-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
            <div className="min-w-[200px]">
              <label className="block text-xs text-gray-600 mb-1 font-semibold">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Referência, usuário, email..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="min-w-[120px]">
              <label className="block text-xs text-gray-600 mb-1 font-semibold">Data Início</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            
            <div className="min-w-[120px]">
              <label className="block text-xs text-gray-600 mb-1 font-semibold">Data Fim</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            
            <div className="min-w-[150px]">
              <label className="block text-xs text-gray-600 mb-1 font-semibold">Status</label>
              <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}>
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
              <label className="block text-xs text-gray-600 mb-1 font-semibold">Método</label>
              <Select value={methodFilter || "all"} onValueChange={(value) => setMethodFilter(value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="card">Cartão</SelectItem>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="transfer">Transferência</SelectItem>
                  <SelectItem value="mbway">MBWay</SelectItem>
                  <SelectItem value="multibanco">Multibanco</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleApplyFilters} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Filter className="w-4 h-4 mr-2" />
                Aplicar
              </Button>
              <Button onClick={handleExport} className="bg-yellow-500 hover:bg-yellow-600 text-blue-900">
                <FileDown className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </div>

        {/* Tabela de Pagamentos */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Pagamentos ({filteredPayments.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Carregando dados...</p>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Banknote className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p>Nenhum pagamento encontrado</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pagamento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Método
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {payment.reference || payment.transaction_id}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {payment.id}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {payment.username || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {payment.email || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          €{(payment.amount / 100).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <CreditCard className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {getPaymentMethodDisplay(payment.method)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(payment.status)}
                          <Badge variant={getStatusBadgeVariant(payment.status)} className="ml-2">
                            {getStatusDisplay(payment.status)}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(payment.payment_date || payment.created_at), 'dd/MM/yyyy HH:mm')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Finance;