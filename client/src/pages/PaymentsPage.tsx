import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import CustomerLayout from '@/components/layouts/CustomerLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Search, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';

interface Payment {
  id: number;
  user_id: number;
  reservation_id?: number;
  amount: number;
  method: string;
  status: string;
  reference?: string;
  transaction_id?: string;
  payment_date?: string;
  reservation_code?: string;
  reservation_date?: string;
  table_number?: number;
}

const PaymentsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Buscar pagamentos reais do banco de dados
  const { data: payments = [], isLoading, error } = useQuery<Payment[]>({
    queryKey: ['/api/payments'],
    staleTime: 30000,
  });

  // Função para formatar data
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Função para formatar hora
  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
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
    const dateField = payment.payment_date || payment.reservation_date || '';
    const matchesSearch = searchTerm === '' || 
      formatDate(dateField).includes(searchTerm.toLowerCase()) ||
      formatTime(dateField).includes(searchTerm.toLowerCase()) ||
      (payment.reference && payment.reference.toLowerCase().includes(searchTerm.toLowerCase())) ||
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
    <CustomerLayout title="Meus Pagamentos">
      <div className="flex flex-col gap-8 h-[720px]">

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
          <button className="flex items-center px-4 py-2 space-x-2 font-semibold text-white transition rounded-lg shadow bg-brasil-blue hover:bg-brasil-green">
            <i className="fa-solid fa-gear"></i>
            <span>Configurações de pagamentos</span>
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
                    Código da Reserva
                  </th>
                  <th className="px-4 py-4 text-right text-xs font-bold text-white tracking-wider font-montserrat">
                    Valor
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-white tracking-wider font-montserrat">
                    Método de Pagamento
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-white tracking-wider font-montserrat">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-white tracking-wider font-montserrat">
                    Ação
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100 text-gray-800 font-medium">
                {currentPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">
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
                    
                    const dateField = payment.payment_date || payment.reservation_date || '';
                    const displayAmount = (payment.amount / 100).toFixed(2); // Converter de centavos para euros
                    
                    return (
                      <tr key={payment.id} className="hover:bg-gray-50 transition cursor-pointer">
                        <td className="px-6 py-4">{formatDate(dateField)}</td>
                        <td className="px-4 py-4">
                          <span className="font-mono text-sm font-semibold text-brasil-blue">
                            {payment.reservation_code || `RES-${payment.reservation_id || payment.id}`}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right font-semibold">
                          €{displayAmount}
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
                            <button
                              className="text-brasil-yellow hover:text-brasil-blue transition p-1"
                              title="Baixar Recibo"
                            >
                              <i className="fa-solid fa-download text-sm"></i>
                            </button>
                            {payment.status === 'failed' && (
                              <button
                                className="text-brasil-green hover:text-green-700 transition p-1"
                                title="Tentar Novamente"
                              >
                                <i className="fa-solid fa-redo text-sm"></i>
                              </button>
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