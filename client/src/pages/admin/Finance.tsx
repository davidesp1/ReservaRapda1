import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Search,
  Filter,
  CreditCard,
  Banknote,
  Smartphone,
  Building,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
}

interface PaymentWithUser extends Payment {
  username?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

interface Reservation {
  id: number;
  user_id: number;
  table_id: number;
  user_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  reservation_code: string;
  date: string;
  party_size: number;
  status: string;
  payment_method: string;
  payment_status: string;
  total: number;
  notes: string;
  duration: number;
  table_number: number;
  table_capacity: number;
  eupago_entity: string;
  eupago_reference: string;
}

interface CombinedItem {
  id: number;
  type: 'payment' | 'reservation';
  date: string;
  client_name: string;
  amount?: number;
  total?: number;
  method: string;
  status: string;
  transaction_id?: string;
  reference?: string;
  reservation_code?: string;
  email?: string;
  search_text: string;
}

const Finance: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();

  // Estados dos filtros
  const [searchText, setSearchText] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  
  // Estados da paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredItems, setFilteredItems] = useState<CombinedItem[]>([]);
  const itemsPerPage = 10;

  // Buscar pagamentos
  const { data: payments, isLoading: isLoadingPayments } = useQuery<PaymentWithUser[]>({
    queryKey: ['/api/payments'],
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
  });

  // Buscar reservas
  const { data: reservations, isLoading: isLoadingReservations } = useQuery<Reservation[]>({
    queryKey: ['/api/admin/reservations'],
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
  });

  // Combinar e aplicar filtros
  const applyFilters = () => {
    const combinedItems: CombinedItem[] = [];

    // Adicionar pagamentos
    if (payments) {
      payments.forEach(payment => {
        combinedItems.push({
          ...payment,
          type: 'payment',
          date: payment.payment_date,
          client_name: payment.username || `${payment.first_name} ${payment.last_name}`.trim(),
          search_text: `${payment.transaction_id} ${payment.reference} ${payment.username} ${payment.first_name} ${payment.last_name}`.toLowerCase()
        });
      });
    }

    // Adicionar reservas
    if (reservations) {
      reservations.forEach(reservation => {
        combinedItems.push({
          ...reservation,
          type: 'reservation',
          client_name: reservation.user_name,
          method: reservation.payment_method,
          status: reservation.payment_status,
          search_text: `${reservation.user_name} ${reservation.email} ${reservation.phone} ${reservation.reservation_code}`.toLowerCase()
        });
      });
    }

    let filtered = [...combinedItems];

    // Filtro de tipo
    if (typeFilter) {
      filtered = filtered.filter((item) => item.type === typeFilter);
    }

    // Filtro de busca
    if (searchText) {
      filtered = filtered.filter((item) =>
        item.search_text.includes(searchText.toLowerCase())
      );
    }

    // Filtro de data
    if (startDate) {
      filtered = filtered.filter(
        (item) => new Date(item.date) >= new Date(startDate),
      );
    }
    if (endDate) {
      filtered = filtered.filter(
        (item) => new Date(item.date) <= new Date(endDate + "T23:59:59"),
      );
    }

    // Filtro de status
    if (statusFilter) {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    // Filtro de método
    if (methodFilter) {
      filtered = filtered.filter((item) => item.method === methodFilter);
    }

    // Ordenar por data (mais recente primeiro)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setFilteredItems(filtered);
  };

  // Aplicar filtros automaticamente quando os dados mudarem
  useEffect(() => {
    applyFilters();
  }, [payments, reservations, searchText, startDate, endDate, statusFilter, methodFilter, typeFilter]);

  // Reset pagination when changing filters
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, startDate, endDate, statusFilter, methodFilter, typeFilter]);

  // Paginação
  const getCurrentItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredItems.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    return Math.ceil(filteredItems.length / itemsPerPage);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < getTotalPages()) {
      setCurrentPage(currentPage + 1);
    }
  };

  const generatePageNumbers = () => {
    const totalPages = getTotalPages();
    const pages: number[] = [];
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  // Função para obter badge do método de pagamento
  const getPaymentMethodBadge = (method: string) => {
    const methodMap: { [key: string]: { icon: React.ReactNode; color: string; label: string } } = {
      card: { icon: <CreditCard className="w-3 h-3" />, color: "bg-blue-100 text-blue-800", label: "Cartão" },
      mbway: { icon: <Smartphone className="w-3 h-3" />, color: "bg-green-100 text-green-800", label: "MB Way" },
      multibanco: { icon: <Building className="w-3 h-3" />, color: "bg-yellow-100 text-yellow-800", label: "Multibanco" },
      transfer: { icon: <Banknote className="w-3 h-3" />, color: "bg-purple-100 text-purple-800", label: "Transferência" },
      cash: { icon: <Banknote className="w-3 h-3" />, color: "bg-gray-100 text-gray-800", label: "Dinheiro" },
    };

    const methodInfo = methodMap[method] || { icon: <Banknote className="w-3 h-3" />, color: "bg-gray-100 text-gray-800", label: method || "Desconhecido" };

    return (
      <Badge className={`inline-flex items-center gap-1 ${methodInfo.color}`}>
        {methodInfo.icon}
        {methodInfo.label}
      </Badge>
    );
  };

  // Função para obter badge do status
  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { color: string; label: string } } = {
      completed: { color: "bg-green-100 text-green-800", label: "Pago" },
      pending: { color: "bg-yellow-100 text-yellow-800", label: "Pendente" },
      failed: { color: "bg-red-100 text-red-800", label: "Falhou" },
      cancelled: { color: "bg-gray-100 text-gray-800", label: "Cancelado" },
      confirmed: { color: "bg-green-100 text-green-800", label: "Confirmado" },
    };

    const statusInfo = statusMap[status] || { color: "bg-gray-100 text-gray-800", label: status || "Desconhecido" };

    return (
      <Badge className={statusInfo.color}>
        {statusInfo.label}
      </Badge>
    );
  };

  if (isLoadingPayments || isLoadingReservations) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Gestão Financeira
          </h1>
          <p className="text-gray-600">
            Visão geral de pagamentos e reservas com informações financeiras
          </p>
        </div>

        {/* Transações Financeiras (Pagamentos e Reservas) */}
        <div className="w-full">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Transações Financeiras</h2>
            <p className="text-gray-600">Pagamentos processados e reservas com informações financeiras</p>
          </div>

          <div className="space-y-6">
            {/* Filtros */}
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[180px]">
                <label className="block text-xs text-gray-600 mb-1 font-semibold">
                  Pesquisar
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="pl-10"
                    placeholder="Buscar por transação, reserva ou cliente..."
                  />
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div className="min-w-[140px]">
                <label className="block text-xs text-gray-600 mb-1 font-semibold">
                  Tipo
                </label>
                <Select value={typeFilter || "all"} onValueChange={(value) => setTypeFilter(value === "all" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="payment">Pagamentos</SelectItem>
                    <SelectItem value="reservation">Reservas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[150px]">
                <label className="block text-xs text-gray-600 mb-1 font-semibold">
                  Data Início
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="min-w-[150px]">
                <label className="block text-xs text-gray-600 mb-1 font-semibold">
                  Data Fim
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="min-w-[140px]">
                <label className="block text-xs text-gray-600 mb-1 font-semibold">
                  Status
                </label>
                <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="completed">Pago</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="failed">Falhou</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[140px]">
                <label className="block text-xs text-gray-600 mb-1 font-semibold">
                  Método
                </label>
                <Select value={methodFilter || "all"} onValueChange={(value) => setMethodFilter(value === "all" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="card">Cartão</SelectItem>
                    <SelectItem value="mbway">MB Way</SelectItem>
                    <SelectItem value="multibanco">Multibanco</SelectItem>
                    <SelectItem value="transfer">Transferência</SelectItem>
                    <SelectItem value="cash">Dinheiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Button
                  onClick={() => {
                    setSearchText("");
                    setStartDate("");
                    setEndDate("");
                    setStatusFilter("");
                    setMethodFilter("");
                    setTypeFilter("");
                  }}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Limpar
                </Button>
              </div>
            </div>

            {/* Tabela Unificada */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-blue-600">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                        Referência
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                        Método
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getCurrentItems().map((item: CombinedItem, index: number) => (
                      <tr key={`${item.type}-${item.id}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded ${
                            item.type === 'payment' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {item.type === 'payment' ? 'Pagamento' : 'Reserva'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(new Date(item.date), 'dd/MM/yyyy HH:mm')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <img
                              src={`https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-${(item.id % 8) + 1}.jpg`}
                              alt=""
                              className="w-8 h-8 rounded-full border-2 border-green-600 mr-3"
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {item.client_name}
                              </div>
                              {item.type === 'reservation' && item.email && (
                                <div className="text-sm text-gray-500">
                                  {item.email}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                          {item.type === 'payment' 
                            ? (item.transaction_id || item.reference) 
                            : (item.reservation_code || `#R${item.id}`)
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          €{item.type === 'payment' 
                            ? (item.amount! / 100).toFixed(2) 
                            : (item.total! / 100).toFixed(2)
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getPaymentMethodBadge(item.method)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(item.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredItems.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">
                      Nenhuma transação encontrada
                    </p>
                  </div>
                )}
              </div>

              {/* Paginação */}
              {getTotalPages() > 1 && (
                <div className="flex justify-between items-center px-6 py-4 bg-white border-t border-gray-100">
                  <div className="text-sm text-gray-600">
                    Exibindo {filteredItems.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} a {Math.min(currentPage * itemsPerPage, filteredItems.length)} de {filteredItems.length} transações
                  </div>
                  <div className="flex space-x-1">
                    <button 
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      className={`px-3 py-1 rounded-lg font-bold transition ${
                        currentPage === 1 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-gray-100 text-gray-500 hover:bg-blue-800 hover:text-white'
                      }`}
                    >
                      <i className="fa-solid fa-angle-left"></i>
                    </button>
                    
                    {generatePageNumbers().map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 rounded-lg font-bold transition ${
                          currentPage === page
                            ? 'bg-blue-800 text-white'
                            : 'bg-gray-100 text-gray-800 hover:bg-blue-800 hover:text-white'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    
                    <button 
                      onClick={handleNextPage}
                      disabled={currentPage === getTotalPages()}
                      className={`px-3 py-1 rounded-lg font-bold transition ${
                        currentPage === getTotalPages() 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-gray-100 text-gray-500 hover:bg-blue-800 hover:text-white'
                      }`}
                    >
                      <i className="fa-solid fa-angle-right"></i>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Seção de Análise */}
          <div className="mt-8">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Resumo Financeiro</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-green-600 font-medium">Total de Pagamentos</div>
                  <div className="text-2xl font-bold text-green-800">
                    €{filteredItems
                      .filter(item => item.type === 'payment' && item.status === 'completed')
                      .reduce((sum, item) => sum + (item.amount! / 100), 0)
                      .toFixed(2)
                    }
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-blue-600 font-medium">Total de Reservas</div>
                  <div className="text-2xl font-bold text-blue-800">
                    €{filteredItems
                      .filter(item => item.type === 'reservation' && item.status === 'completed')
                      .reduce((sum, item) => sum + (item.total! / 100), 0)
                      .toFixed(2)
                    }
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm text-purple-600 font-medium">Total Geral</div>
                  <div className="text-2xl font-bold text-purple-800">
                    €{filteredItems
                      .filter(item => item.status === 'completed')
                      .reduce((sum, item) => {
                        return sum + (item.type === 'payment' ? item.amount! / 100 : item.total! / 100);
                      }, 0)
                      .toFixed(2)
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Finance;