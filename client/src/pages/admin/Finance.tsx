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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Search,
  TrendingUp,
  Clock,
  XCircle,
  CheckCircle,
  Filter,
  FileDown,
  CreditCard,
  Banknote,
  Smartphone,
  Building,
  ArrowLeftRight,
  FileText,
  FileSpreadsheet,
  FileType,
  Calendar,
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
  user_name?: string;
  email?: string;
  phone?: string;
  reservation_code?: string;
  date: string;
  party_size: number;
  table_number: number;
  status: string;
  total?: number;
}

const Finance: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isAdmin, user } = useAuth();
  const [currentTab, setCurrentTab] = useState("pagamentos");
  const [searchText, setSearchText] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [filteredPayments, setFilteredPayments] = useState<PaymentWithUser[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const { toast } = useToast();

  // Fetch payments
  const {
    data: payments,
    isLoading: paymentsLoading,
    refetch,
  } = useQuery<PaymentWithUser[]>({
    queryKey: ["/api/admin/payments"],
    enabled: isAuthenticated && isAdmin,
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
  });

  // Fetch reservations
  const { data: reservations = [], isLoading: reservationsLoading } = useQuery<Reservation[]>({
    queryKey: ['/api/admin/reservations'],
    enabled: isAuthenticated && isAdmin,
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
  });

  // Format price helper
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
    }).format(amount / 100);
  };

  // Apply filters for payments
  const applyFilters = () => {
    if (!payments) {
      setFilteredPayments([]);
      return;
    }

    let filtered = [...payments];

    // Search filter
    if (searchText) {
      filtered = filtered.filter(
        (payment) =>
          payment.transaction_id?.toLowerCase().includes(searchText.toLowerCase()) ||
          payment.reference?.toLowerCase().includes(searchText.toLowerCase()) ||
          payment.username?.toLowerCase().includes(searchText.toLowerCase()) ||
          payment.first_name?.toLowerCase().includes(searchText.toLowerCase()) ||
          payment.last_name?.toLowerCase().includes(searchText.toLowerCase()),
      );
    }

    // Date filters
    if (startDate) {
      filtered = filtered.filter(
        (payment) => new Date(payment.payment_date) >= new Date(startDate),
      );
    }

    if (endDate) {
      filtered = filtered.filter(
        (payment) =>
          new Date(payment.payment_date) <= new Date(endDate + "T23:59:59"),
      );
    }

    // Status filter
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((payment) => payment.status === statusFilter);
    }

    // Method filter
    if (methodFilter && methodFilter !== "all") {
      filtered = filtered.filter((payment) => payment.method === methodFilter);
    }

    setFilteredPayments(filtered);
  };

  // Apply filters for reservations
  const applyReservationFilters = () => {
    if (!reservations) {
      setFilteredReservations([]);
      return;
    }

    let filtered = [...reservations];

    // Search filter
    if (searchText) {
      filtered = filtered.filter(
        (reservation) =>
          reservation.user_name?.toLowerCase().includes(searchText.toLowerCase()) ||
          reservation.email?.toLowerCase().includes(searchText.toLowerCase()) ||
          reservation.phone?.toLowerCase().includes(searchText.toLowerCase()) ||
          reservation.reservation_code?.toLowerCase().includes(searchText.toLowerCase()),
      );
    }

    // Date filters
    if (startDate) {
      filtered = filtered.filter(
        (reservation) => new Date(reservation.date) >= new Date(startDate),
      );
    }

    if (endDate) {
      filtered = filtered.filter(
        (reservation) =>
          new Date(reservation.date) <= new Date(endDate + "T23:59:59"),
      );
    }

    setFilteredReservations(filtered);
  };

  // Calculate statistics based on filtered payments
  const calculateFilteredStats = () => {
    const paymentsToAnalyze = filteredPayments.length > 0 ? filteredPayments : (payments || []);
    
    const totalRevenue = paymentsToAnalyze.reduce((sum, payment) => sum + payment.amount, 0);
    const completedPayments = paymentsToAnalyze.filter(p => p.status === 'completed').length;
    const pendingPayments = paymentsToAnalyze.filter(p => p.status === 'pending').length;
    const failedPayments = paymentsToAnalyze.filter(p => p.status === 'failed').length;
    
    return {
      totalRevenue,
      completedPayments,
      pendingPayments,
      failedPayments,
      totalTransactions: paymentsToAnalyze.length
    };
  };

  // Apply filters automatically when data changes
  useEffect(() => {
    if (payments) {
      applyFilters();
    }
  }, [payments?.length, searchText, startDate, endDate, statusFilter, methodFilter]);

  useEffect(() => {
    if (reservations) {
      applyReservationFilters();
    }
  }, [reservations?.length, searchText, startDate, endDate, statusFilter, methodFilter]);

  // Reset pagination when changing tabs or filters
  useEffect(() => {
    setCurrentPage(1);
  }, [currentTab, searchText, startDate, endDate, statusFilter, methodFilter]);

  // Pagination helpers
  const getCurrentItems = () => {
    const items = currentTab === "pagamentos" ? filteredPayments : filteredReservations;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    const items = currentTab === "pagamentos" ? filteredPayments : filteredReservations;
    return Math.ceil(items.length / itemsPerPage);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleNextPage = () => {
    const totalPages = getTotalPages();
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const generatePageNumbers = () => {
    const totalPages = getTotalPages();
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  // Badge helpers
  const getPaymentMethodBadge = (method: string) => {
    const methodMap = {
      cash: { icon: Banknote, label: "Dinheiro", color: "bg-green-100 text-green-800" },
      card: { icon: CreditCard, label: "Cartão", color: "bg-blue-100 text-blue-800" },
      mbway: { icon: Smartphone, label: "MB Way", color: "bg-purple-100 text-purple-800" },
      multibanco: { icon: Building, label: "Multibanco", color: "bg-orange-100 text-orange-800" },
      multibanco_TPA: { icon: Building, label: "Multibanco TPA", color: "bg-yellow-100 text-yellow-800" },
      transfer: { icon: ArrowLeftRight, label: "Transferência", color: "bg-gray-100 text-gray-800" },
    };

    const methodInfo = methodMap[method as keyof typeof methodMap];
    if (!methodInfo) {
      return <Badge className="bg-gray-100 text-gray-800">{method}</Badge>;
    }

    const Icon = methodInfo.icon;
    return (
      <Badge className={`${methodInfo.color} hover:${methodInfo.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {methodInfo.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Concluído
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="w-3 h-3 mr-1" />
            Falha
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            {status}
          </Badge>
        );
    }
  };

  if (paymentsLoading) {
    return (
      <AdminLayout title={t("Finance")}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-xl"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Finanças">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Finanças</h1>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(() => {
            const stats = calculateFilteredStats();
            const hasFilters = searchText || startDate || endDate || (statusFilter && statusFilter !== "all") || (methodFilter && methodFilter !== "all");
            
            return (
              <>
                {/* Receita Total */}
                <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-green-500">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500 font-medium">
                        {hasFilters ? "Receita Filtrada" : "Receita Total"}
                      </p>
                      <p className="text-2xl font-bold text-gray-800 mt-1">
                        {formatPrice(stats.totalRevenue)}
                      </p>
                      <div className="flex items-center mt-2 text-sm">
                        <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                        <span className="text-gray-500">
                          {hasFilters ? `${stats.totalTransactions} transações filtradas` : `${stats.totalTransactions} transações totais`}
                        </span>
                      </div>
                    </div>
                    <div className="bg-green-100 p-3 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>

                {/* Pagamentos Concluídos */}
                <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-blue-500">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Pagamentos Concluídos</p>
                      <p className="text-2xl font-bold text-gray-800 mt-1">
                        {stats.completedPayments}
                      </p>
                      <div className="flex items-center mt-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-blue-500 mr-1" />
                        <span className="text-gray-500">
                          {stats.totalTransactions > 0 ? Math.round((stats.completedPayments / stats.totalTransactions) * 100) : 0}% do total
                        </span>
                      </div>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                {/* Pagamentos Pendentes */}
                <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-yellow-500">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Pagamentos Pendentes</p>
                      <p className="text-2xl font-bold text-gray-800 mt-1">
                        {stats.pendingPayments}
                      </p>
                      <div className="flex items-center mt-2 text-sm">
                        <Clock className="w-4 h-4 text-yellow-500 mr-1" />
                        <span className="text-gray-500">
                          {stats.totalTransactions > 0 ? Math.round((stats.pendingPayments / stats.totalTransactions) * 100) : 0}% do total
                        </span>
                      </div>
                    </div>
                    <div className="bg-yellow-100 p-3 rounded-lg">
                      <Clock className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                </div>

                {/* Pagamentos Falhados */}
                <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-red-500">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Pagamentos Falhados</p>
                      <p className="text-2xl font-bold text-gray-800 mt-1">
                        {stats.failedPayments}
                      </p>
                      <div className="flex items-center mt-2 text-sm">
                        <XCircle className="w-4 h-4 text-red-500 mr-1" />
                        <span className="text-gray-500">
                          {stats.totalTransactions > 0 ? Math.round((stats.failedPayments / stats.totalTransactions) * 100) : 0}% do total
                        </span>
                      </div>
                    </div>
                    <div className="bg-red-100 p-3 rounded-lg">
                      <XCircle className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-xl shadow-md">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setCurrentTab("pagamentos")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  currentTab === "pagamentos"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Pagamentos
              </button>
              <button
                onClick={() => setCurrentTab("reservas")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  currentTab === "reservas"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Reservas
              </button>
              <button
                onClick={() => setCurrentTab("analise")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  currentTab === "analise"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Análise
              </button>
            </nav>
          </div>

          {/* Content based on active tab */}
          {(currentTab === "pagamentos" || currentTab === "reservas") && (
            <div className="p-6">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Input
                  type="date"
                  placeholder="Data início"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />

                <Input
                  type="date"
                  placeholder="Data fim"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="failed">Falhado</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={methodFilter} onValueChange={setMethodFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="cash">Dinheiro</SelectItem>
                    <SelectItem value="card">Cartão</SelectItem>
                    <SelectItem value="mbway">MB Way</SelectItem>
                    <SelectItem value="multibanco">Multibanco</SelectItem>
                    <SelectItem value="multibanco_TPA">Multibanco TPA</SelectItem>
                    <SelectItem value="transfer">Transferência</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchText("");
                      setStartDate("");
                      setEndDate("");
                      setStatusFilter("all");
                      setMethodFilter("all");
                      applyFilters();
                    }}
                    className="flex items-center gap-2"
                  >
                    <Filter className="w-4 h-4" />
                    Limpar
                  </Button>
                </div>
              </div>

              {/* Payments Table */}
              {currentTab === "pagamentos" && (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Transação
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Método
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Usuário
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getCurrentItems().length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <CreditCard className="w-12 h-12 text-gray-300 mb-4" />
                              <p className="text-gray-500 font-medium">
                                Nenhum pagamento encontrado
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        getCurrentItems().map((payment: any) => (
                          <tr key={payment.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {format(new Date(payment.payment_date), "dd/MM/yyyy")}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {payment.transaction_id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatPrice(payment.amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getPaymentMethodBadge(payment.method)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {payment.first_name || payment.last_name
                                ? `${payment.first_name || ""} ${payment.last_name || ""}`.trim()
                                : payment.username || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(payment.status)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Reservations Table */}
              {currentTab === "reservas" && (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cliente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mesa
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pessoas
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getCurrentItems().length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <Calendar className="w-12 h-12 text-gray-300 mb-4" />
                              <p className="text-gray-500 font-medium">
                                Nenhuma reserva encontrada
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        getCurrentItems().map((reservation: any) => (
                          <tr key={reservation.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {format(new Date(reservation.date), "dd/MM/yyyy HH:mm")}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {reservation.user_name || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              Mesa {reservation.table_number}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {reservation.party_size}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatPrice(reservation.total || 0)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(reservation.status)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {(currentTab === "pagamentos" ? filteredPayments : filteredReservations).length > 0 && getTotalPages() > 1 && (
                <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-gray-200">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === getTotalPages()}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Próximo
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Mostrando{" "}
                        <span className="font-medium">
                          {(currentPage - 1) * itemsPerPage + 1}
                        </span>{" "}
                        a{" "}
                        <span className="font-medium">
                          {Math.min(
                            currentPage * itemsPerPage,
                            (currentTab === "pagamentos" ? filteredPayments : filteredReservations).length
                          )}
                        </span>{" "}
                        de{" "}
                        <span className="font-medium">
                          {(currentTab === "pagamentos" ? filteredPayments : filteredReservations).length}
                        </span>{" "}
                        resultados
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={handlePreviousPage}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Anterior
                        </button>
                        {generatePageNumbers().map((page) => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === page
                                ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        <button
                          onClick={handleNextPage}
                          disabled={currentPage === getTotalPages()}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Próximo
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Analysis Tab */}
          {currentTab === "analise" && (
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Análise Financeira</h3>
              <p className="text-gray-600">
                Gráficos e análises detalhadas serão implementados aqui.
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Finance;