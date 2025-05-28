import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import CustomerLayout from '@/components/layouts/CustomerLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Eye,
  Edit,
  X,
  Search,
  Plus
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

interface Payment {
  id: number;
  date: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  method: 'card' | 'mbway' | 'multibanco' | 'transfer' | 'cash';
  reference: string;
  reservationId: number;
  table?: string;
}

const PaymentsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Dados reais dos pagamentos do usuário (substituir por API real)
  const payments: Payment[] = [
    {
      id: 1,
      date: '2025-05-28T20:00:00',
      amount: 58.90,
      status: 'completed',
      method: 'card',
      reference: 'REF2025052801',
      reservationId: 7,
      table: 'Mesa 2'
    },
    {
      id: 2,
      date: '2025-05-25T19:30:00',
      amount: 74.50,
      status: 'completed',
      method: 'mbway',
      reference: 'REF2025052502',
      reservationId: 6,
      table: 'Mesa 1'
    },
    {
      id: 3,
      date: '2025-05-30T20:00:00',
      amount: 125.75,
      status: 'pending',
      method: 'multibanco',
      reference: 'REF2025053003',
      reservationId: 8,
      table: 'Mesa 5'
    },
    {
      id: 4,
      date: '2025-05-20T12:15:00',
      amount: 45.20,
      status: 'pending',
      method: 'transfer',
      reference: 'REF2025052004',
      reservationId: 5,
      table: 'Mesa 3'
    },
    {
      id: 5,
      date: '2025-05-15T13:30:00',
      amount: 92.40,
      status: 'failed',
      method: 'card',
      reference: 'REF2025051505',
      reservationId: 4,
      table: 'Mesa 8'
    }
  ];

  // Função para formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Função para formatar hora
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Função para mapear status
  const mapStatus = (status: string) => {
    const statusMap: { [key: string]: { label: string; color: string; icon: string } } = {
      'completed': { label: 'Pago', color: 'bg-brasil-green text-white', icon: 'fa-money-bill-wave' },
      'pending': { label: 'Pendente', color: 'bg-brasil-yellow text-brasil-blue', icon: 'fa-wallet' },
      'failed': { label: 'Falhou', color: 'bg-brasil-red text-white', icon: 'fa-ban' },
      'cancelled': { label: 'Cancelado', color: 'bg-brasil-red text-white', icon: 'fa-ban' }
    };
    return statusMap[status] || { label: status, color: 'bg-gray-500 text-white', icon: 'fa-question' };
  };

  // Função para mapear método de pagamento
  const mapMethod = (method: string) => {
    const methodMap: { [key: string]: string } = {
      'card': 'Cartão',
      'mbway': 'MBWay',
      'multibanco': 'Multibanco',
      'transfer': 'Transferência',
      'cash': 'Dinheiro'
    };
    return methodMap[method] || method;
  };

  // Filtrar pagamentos
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = searchTerm === '' || 
      formatDate(payment.date).includes(searchTerm.toLowerCase()) ||
      formatTime(payment.date).includes(searchTerm.toLowerCase()) ||
      payment.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mapMethod(payment.method).toLowerCase().includes(searchTerm.toLowerCase()) ||
      mapStatus(payment.status).label.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === '' || 
      mapStatus(payment.status).label.toLowerCase() === statusFilter.toLowerCase();

    const matchesPayment = paymentFilter === '' || 
      mapMethod(payment.method).toLowerCase() === paymentFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesPayment;
  });

  // Paginação
  const totalPages = Math.ceil(filteredPayments.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentPayments = filteredPayments.slice(startIndex, endIndex);

  // Limpar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setPaymentFilter('');
    setCurrentPage(1);
  };

  return (
    <CustomerLayout>
      <div className="flex flex-col gap-8 h-[720px]">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-800 font-montserrat">Meus Pagamentos</h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button className="relative">
                <i className="text-xl text-gray-600 fa-regular fa-bell"></i>
                <span className="absolute flex items-center justify-center w-4 h-4 text-xs text-white rounded-full -top-1 -right-1 bg-brasil-red">2</span>
              </button>
            </div>
            <div className="flex items-center">
              <div className="w-10 h-10 border-2 rounded-full bg-brasil-blue border-brasil-yellow flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="ml-2">
                <p className="text-sm font-medium text-gray-800">{user?.username || 'Usuário'}</p>
                <p className="text-xs text-gray-500">Cliente</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col mb-2 space-y-3 lg:flex-row lg:items-end lg:space-x-6 lg:space-y-0">
          <div className="flex-1">
            <label className="block mb-1 text-sm font-semibold text-gray-700 font-montserrat">Pesquisar Pagamento</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Data, referência, método..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-2 pl-10 pr-4 font-medium text-gray-800 transition bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-brasil-blue"
              />
              <span className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2">
                <Search className="h-4 w-4" />
              </span>
            </div>
          </div>
          <div>
            <label className="block mb-1 text-sm font-semibold text-gray-700 font-montserrat">Status do Pagamento</label>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 font-medium text-gray-700 bg-white border border-gray-200 rounded-lg lg:w-40 focus:ring-2 focus:ring-brasil-blue"
            >
              <option value="">Todos</option>
              <option value="pago">Pago</option>
              <option value="pendente">Pendente</option>
              <option value="falhou">Falhou</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 text-sm font-semibold text-gray-700 font-montserrat">Método de Pagamento</label>
            <select 
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full px-3 py-2 font-medium text-gray-700 bg-white border border-gray-200 rounded-lg lg:w-40 focus:ring-2 focus:ring-brasil-blue"
            >
              <option value="">Todos</option>
              <option value="cartão">Cartão</option>
              <option value="mbway">MBWay</option>
              <option value="multibanco">Multibanco</option>
              <option value="transferência">Transferência</option>
            </select>
          </div>
          <button 
            onClick={clearFilters}
            className="px-4 py-2 ml-auto font-semibold transition rounded-lg shadow bg-brasil-yellow text-brasil-blue hover:bg-yellow-200 lg:ml-0"
          >
            Limpar
          </button>
          <button className="flex items-center px-4 py-2 space-x-2 font-semibold text-white transition rounded-lg shadow bg-brasil-green hover:bg-green-600">
            <Plus className="h-4 w-4" />
            <span>Novo Pagamento</span>
          </button>
        </div>

        {/* Tabela de Pagamentos */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden flex-1 flex flex-col">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-brasil-blue">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white tracking-wider font-montserrat">
                    Data
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-white tracking-wider font-montserrat">
                    Hora
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-white tracking-wider font-montserrat">
                    Referência
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-white tracking-wider font-montserrat">
                    Valor
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-white tracking-wider font-montserrat">
                    Método
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-white tracking-wider font-montserrat">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-white tracking-wider font-montserrat">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100 text-gray-800 font-medium">
                {currentPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <i className="fa-solid fa-credit-card text-gray-300 text-5xl mb-4"></i>
                        <p className="text-gray-500 font-medium">
                          {filteredPayments.length === 0 && payments.length > 0 
                            ? "Nenhum pagamento encontrado com os filtros aplicados" 
                            : "Você ainda não tem pagamentos"}
                        </p>
                        {payments.length === 0 && (
                          <p className="text-gray-400 text-sm mt-2">
                            Seus pagamentos aparecerão aqui quando fizer reservas
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentPayments.map((payment) => {
                    const status = mapStatus(payment.status);
                    
                    return (
                      <tr key={payment.id} className="hover:bg-gray-50 transition cursor-pointer">
                        <td className="px-6 py-4">{formatDate(payment.date)}</td>
                        <td className="px-4 py-4">{formatTime(payment.date)}</td>
                        <td className="px-4 py-4 text-center">
                          <span className="font-mono text-sm font-semibold text-brasil-blue">
                            {payment.reference}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center font-semibold">
                          €{payment.amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {mapMethod(payment.method)}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <Badge className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded ${status.color}`}>
                            <i className={`fa-solid ${status.icon} mr-1`}></i>
                            {status.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-brasil-blue hover:text-brasil-green transition p-1"
                              title="Ver Detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-brasil-yellow hover:text-brasil-blue transition p-1"
                              title="Baixar Recibo"
                            >
                              <i className="fa-solid fa-download h-4 w-4"></i>
                            </Button>
                            {payment.status === 'failed' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-brasil-green hover:text-green-700 transition p-1"
                                title="Tentar Novamente"
                              >
                                <i className="fa-solid fa-retry h-4 w-4"></i>
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div className="flex items-center justify-between px-6 py-3 bg-gray-50">
            <span className="text-xs text-gray-600">
              Exibindo {filteredPayments.length === 0 ? 0 : startIndex + 1}-{Math.min(endIndex, filteredPayments.length)} de {filteredPayments.length} pagamentos
            </span>
            <div className="space-x-1">
              <button 
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 transition rounded text-brasil-blue hover:bg-brasil-blue hover:text-white disabled:opacity-50"
              >
                <i className="fa-solid fa-angle-left"></i>
              </button>
              {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button 
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-2 py-1 rounded ${currentPage === pageNum ? 'bg-brasil-yellow font-bold text-brasil-blue' : 'text-brasil-blue hover:bg-brasil-blue hover:text-white transition'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button 
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-2 py-1 transition rounded text-brasil-blue hover:bg-brasil-blue hover:text-white disabled:opacity-50"
              >
                <i className="fa-solid fa-angle-right"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
};

export default PaymentsPage;