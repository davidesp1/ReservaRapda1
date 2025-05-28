import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import CustomerLayout from '@/components/layouts/CustomerLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Settings, Eye, Download, ChevronLeft, ChevronRight, CreditCard, Smartphone, Banknote, QrCode } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';

interface Payment {
  id: number;
  transaction_id?: string;
  reference?: string;
  amount: number;
  method: string;
  status: string;
  payment_date: string;
  reservation_code?: string;
  user_id: number;
}

export default function PaymentsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Fetch pagamentos do usuário
  const { data: payments = [], isLoading } = useQuery<Payment[]>({
    queryKey: ['/api/payments/user'],
    staleTime: 30000,
  });

  // Filtrar pagamentos
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = searchTerm === '' || 
      (payment.payment_date && payment.payment_date.includes(searchTerm)) ||
      (payment.reservation_code && payment.reservation_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (payment.reference && payment.reference.toLowerCase().includes(searchTerm.toLowerCase())) ||
      payment.amount.toString().includes(searchTerm);

    const matchesMethod = methodFilter === '' || methodFilter === 'all' || payment.method === methodFilter;
    const matchesStatus = statusFilter === '' || statusFilter === 'all' || payment.status === statusFilter;

    return matchesSearch && matchesMethod && matchesStatus;
  });

  // Paginação
  const totalPages = Math.ceil(filteredPayments.length / rowsPerPage);
  const currentPayments = filteredPayments.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Formatar data
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return '';
    }
  };

  // Formatar valor
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount / 100);
  };

  // Ícone do método de pagamento
  const getPaymentMethodIcon = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'card':
      case 'cartao':
        return <CreditCard className="w-4 h-4" />;
      case 'mbway':
        return <Smartphone className="w-4 h-4" />;
      case 'cash':
      case 'dinheiro':
        return <Banknote className="w-4 h-4" />;
      case 'multibanco':
        return <QrCode className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  // Formatar método de pagamento
  const formatMethod = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'card':
      case 'cartao':
        return 'Cartão';
      case 'mbway':
        return 'MBWay';
      case 'cash':
      case 'dinheiro':
        return 'Dinheiro';
      case 'multibanco':
        return 'Multibanco';
      default:
        return method;
    }
  };

  // Cor do status
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'pago':
        return 'bg-green-500 text-white';
      case 'pending':
      case 'pendente':
        return 'bg-yellow-500 text-blue-900';
      case 'cancelled':
      case 'cancelado':
        return 'bg-red-500 text-white';
      case 'failed':
      case 'falha':
        return 'bg-gray-300 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Formatar status
  const formatStatus = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'Pago';
      case 'pending':
        return 'Pendente';
      case 'cancelled':
        return 'Cancelado';
      case 'failed':
        return 'Falha';
      default:
        return status;
    }
  };

  // Ícone do status
  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'pago':
        return 'fa-money-bill-wave';
      case 'pending':
      case 'pendente':
        return 'fa-wallet';
      case 'cancelled':
      case 'cancelado':
        return 'fa-ban';
      case 'failed':
      case 'falha':
        return 'fa-exclamation-triangle';
      default:
        return 'fa-question';
    }
  };

  // Limpar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setMethodFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <CustomerLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-96 bg-gray-200 rounded-xl"></div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800 font-montserrat">Pagamentos</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button className="relative">
              <i className="fa-regular fa-bell text-xl text-gray-600"></i>
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">2</span>
            </button>
          </div>
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-gray-600">
                {user?.firstName?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="ml-2">
              <p className="text-sm font-medium text-gray-800">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-gray-500">Cliente</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8 h-[720px]">
        {/* Filtros */}
        <div className="mb-2 flex flex-col lg:flex-row lg:items-end lg:space-x-6 space-y-3 lg:space-y-0">
          <div className="flex-1">
            <label className="block text-sm font-semibold mb-1 text-gray-700 font-montserrat">Pesquisar Pagamento</label>
            <div className="relative">
              <Input
                type="text"
                placeholder="Data, código, valor, status..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 bg-white text-gray-800 font-medium transition"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700 font-montserrat">Método de Pagamento</label>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-full lg:w-44 border border-gray-200 rounded-lg bg-white text-gray-700 font-medium focus:ring-2 focus:ring-blue-600">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="card">Cartão</SelectItem>
                <SelectItem value="mbway">MBWay</SelectItem>
                <SelectItem value="cash">Dinheiro</SelectItem>
                <SelectItem value="multibanco">Multibanco</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700 font-montserrat">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-40 border border-gray-200 rounded-lg bg-white text-gray-700 font-medium focus:ring-2 focus:ring-blue-600">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="completed">Pago</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
                <SelectItem value="failed">Falha</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button
            onClick={clearFilters}
            className="bg-yellow-400 text-blue-900 font-semibold rounded-lg px-4 py-2 shadow hover:bg-yellow-300 transition ml-auto lg:ml-0"
          >
            Limpar
          </Button>
          
          <Button className="bg-blue-600 text-white font-semibold rounded-lg px-4 py-2 shadow hover:bg-green-600 transition flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Configurações de pagamentos</span>
          </Button>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-xl shadow-lg p-0 overflow-hidden flex-1 flex flex-col">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-blue-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white tracking-wider font-montserrat">Data</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-white tracking-wider font-montserrat">Código da Reserva</th>
                  <th className="px-4 py-4 text-right text-xs font-bold text-white tracking-wider font-montserrat">Valor</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-white tracking-wider font-montserrat">Método de Pagamento</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-white tracking-wider font-montserrat">Status</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-white tracking-wider font-montserrat">Ação</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100 text-gray-800 font-medium">
                {currentPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <CreditCard className="h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-gray-500 font-medium">
                          {filteredPayments.length === 0 && payments.length > 0 
                            ? "Nenhum pagamento encontrado com os filtros aplicados" 
                            : "Você ainda não tem pagamentos"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">{formatDate(payment.payment_date)}</td>
                      <td className="px-4 py-4">
                        <span className="font-mono text-sm font-semibold text-blue-600">
                          {payment.reservation_code || payment.reference || `#${String(payment.id).padStart(6, '0')}`}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right font-semibold">{formatAmount(payment.amount)}</td>
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800">
                          {getPaymentMethodIcon(payment.method)}
                          <span className="ml-1">{formatMethod(payment.method)}</span>
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded ${getStatusColor(payment.status)}`}>
                          <i className={`fa-solid ${getStatusIcon(payment.status)} mr-1`}></i>
                          {formatStatus(payment.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button className="text-blue-600 hover:text-green-600 transition mr-2" title="Ver Detalhes">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-yellow-500 hover:text-blue-600 transition" title="Baixar Comprovante">
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Paginação */}
          <div className="px-6 py-3 flex justify-between items-center bg-gray-50">
            <span className="text-xs text-gray-600">
              Exibindo {filteredPayments.length === 0 ? 0 : ((currentPage - 1) * rowsPerPage + 1)}-{Math.min(currentPage * rowsPerPage, filteredPayments.length)} de {filteredPayments.length} pagamentos
            </span>
            <div className="space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 rounded text-blue-600 hover:bg-blue-600 hover:text-white transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              {[...Array(Math.min(3, totalPages))].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-2 py-1 rounded ${currentPage === pageNum ? 'bg-yellow-400 text-blue-900 font-bold' : 'text-blue-600 hover:bg-blue-600 hover:text-white'} transition`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-2 py-1 rounded text-blue-600 hover:bg-blue-600 hover:text-white transition"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}