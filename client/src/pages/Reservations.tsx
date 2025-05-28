import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import CustomerLayout from '@/components/layouts/CustomerLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Eye, Edit, X, Search, Calendar, Clock, MapPin } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Reservation {
  id: number;
  user_id: number;
  table_id: number;
  date: string;
  time?: string;
  party_size: number;
  status: string;
  payment_status: string;
  special_requests?: string;
  created_at?: string;
  table_number?: number;
  user_name?: string;
  reservation_code?: string;
}

export default function Reservations() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showNewReservationModal, setShowNewReservationModal] = useState(false);

  // Função para lidar com nova reserva
  const handleNewReservation = () => {
    toast({
      title: "Nova Reserva",
      description: "Em breve será possível criar reservas diretamente aqui. Por enquanto, entre em contato conosco!",
    });
  };
  const rowsPerPage = 10;

  // Fetch das reservas do usuário
  const { data: userReservations = [], isLoading, error } = useQuery<Reservation[]>({
    queryKey: ['/api/reservations'],
    staleTime: 30000,
  });



  // Função para mapear status da API para status de exibição
  const mapStatus = (status: string) => {
    const statusMap: { [key: string]: { label: string; color: string; icon: string } } = {
      'pending': { label: 'Pendente', color: 'bg-brasil-yellow text-brasil-blue', icon: 'fa-clock' },
      'confirmed': { label: 'Confirmada', color: 'bg-brasil-blue text-white', icon: 'fa-calendar-check' },
      'cancelled': { label: 'Cancelada', color: 'bg-brasil-red text-white', icon: 'fa-times-circle' },
      'completed': { label: 'Realizada', color: 'bg-brasil-green text-white', icon: 'fa-check-circle' },
      'no-show': { label: 'Não compareceu', color: 'bg-gray-500 text-white', icon: 'fa-user-times' }
    };
    return statusMap[status] || { label: status, color: 'bg-gray-500 text-white', icon: 'fa-question-circle' };
  };

  // Função para mapear status de pagamento
  const mapPaymentStatus = (status: string) => {
    const statusMap: { [key: string]: { label: string; color: string; icon: string } } = {
      'pending': { label: 'Pendente', color: 'bg-brasil-yellow text-brasil-blue', icon: 'fa-wallet' },
      'completed': { label: 'Pago', color: 'bg-brasil-green text-white', icon: 'fa-money-bill-wave' },
      'failed': { label: 'Falhado', color: 'bg-brasil-red text-white', icon: 'fa-ban' },
      'refunded': { label: 'Reembolsado', color: 'bg-orange-500 text-white', icon: 'fa-undo' }
    };
    return statusMap[status] || { label: status, color: 'bg-gray-500 text-white', icon: 'fa-question' };
  };

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
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (error) {
      return '';
    }
  };

  // Filtrar reservas
  const filteredReservations = userReservations.filter(reservation => {
    const matchesSearch = searchTerm === '' || 
      formatDate(reservation.date).includes(searchTerm.toLowerCase()) ||
      (reservation.date && formatTime(reservation.date).includes(searchTerm.toLowerCase())) ||
      `Mesa ${reservation.table_number || reservation.table_id}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mapStatus(reservation.status).label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mapPaymentStatus(reservation.payment_status).label.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === '' || 
      mapStatus(reservation.status).label.toLowerCase() === statusFilter.toLowerCase();

    const matchesPayment = paymentFilter === '' || 
      mapPaymentStatus(reservation.payment_status).label.toLowerCase() === paymentFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesPayment;
  });

  // Paginação
  const totalPages = Math.ceil(filteredReservations.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentReservations = filteredReservations.slice(startIndex, endIndex);

  // Limpar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setPaymentFilter('');
    setCurrentPage(1);
  };

  // Função para cancelar reserva
  const cancelReservation = useMutation({
    mutationFn: async (reservationId: number) => {
      const response = await apiRequest('PATCH', `/api/reservations/${reservationId}`, {
        status: 'cancelled'
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Reserva cancelada",
        description: "Sua reserva foi cancelada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cancelar",
        description: error.message || "Não foi possível cancelar a reserva.",
        variant: "destructive",
      });
    }
  });

  const handleCancelReservation = (reservationId: number) => {
    if (confirm('Tem certeza que deseja cancelar esta reserva?')) {
      cancelReservation.mutate(reservationId);
    }
  };

  if (isLoading) {
    return (
      <CustomerLayout title="Minhas Reservas">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brasil-green"></div>
        </div>
      </CustomerLayout>
    );
  }

  if (error) {
    return (
      <CustomerLayout title="Minhas Reservas">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Erro ao carregar suas reservas. Tente novamente.</p>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout title="Minhas Reservas">
      <div className="flex flex-col gap-8 h-full">
        {/* Filtros */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:space-x-6 space-y-3 lg:space-y-0">
          <div className="flex-1">
            <label className="block text-sm font-semibold mb-1 text-gray-700 font-montserrat">
              Pesquisar Reserva
            </label>
            <div className="relative">
              <Input
                type="text"
                placeholder="Data, status, mesa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brasil-blue bg-white text-gray-800 font-medium transition"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700 font-montserrat">
              Status da Reserva
            </label>
            <Select value={statusFilter || "todos"} onValueChange={(value) => setStatusFilter(value === "todos" ? "" : value)}>
              <SelectTrigger className="w-full lg:w-40 border border-gray-200 rounded-lg bg-white text-gray-700 font-medium focus:ring-2 focus:ring-brasil-blue">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="confirmada">Confirmada</SelectItem>
                <SelectItem value="realizada">Realizada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700 font-montserrat">
              Status de Pagamento
            </label>
            <Select value={paymentFilter || "todos"} onValueChange={(value) => setPaymentFilter(value === "todos" ? "" : value)}>
              <SelectTrigger className="w-full lg:w-40 border border-gray-200 rounded-lg bg-white text-gray-700 font-medium focus:ring-2 focus:ring-brasil-blue">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="falhado">Falhado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button
            onClick={clearFilters}
            className="bg-brasil-yellow text-brasil-blue font-semibold rounded-lg px-4 py-2 shadow hover:bg-yellow-200 transition"
          >
            Limpar
          </Button>
          
          <Button 
            onClick={handleNewReservation}
            className="bg-brasil-green text-white font-semibold rounded-lg px-4 py-2 shadow hover:bg-green-600 transition flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Reserva</span>
          </Button>
        </div>

        {/* Tabela de Reservas */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden flex-1 flex flex-col">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-brasil-blue">
                <tr>
                  <th className="px-4 py-4 text-center text-xs font-bold text-white tracking-wider font-montserrat">
                    Código da Reserva
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white tracking-wider font-montserrat">
                    Data
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-white tracking-wider font-montserrat">
                    Hora
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-white tracking-wider font-montserrat">
                    Mesa
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-white tracking-wider font-montserrat">
                    Status da Reserva
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-white tracking-wider font-montserrat">
                    Status de Pagamento
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-white tracking-wider font-montserrat">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100 text-gray-800 font-medium">
                {currentReservations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Calendar className="h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-gray-500 font-medium">
                          {filteredReservations.length === 0 && userReservations.length > 0 
                            ? "Nenhuma reserva encontrada com os filtros aplicados" 
                            : "Você ainda não tem reservas"}
                        </p>
                        {userReservations.length === 0 && (
                          <p className="text-gray-400 text-sm mt-2">
                            Clique em "Nova Reserva" para fazer sua primeira reserva
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentReservations.map((reservation) => {
                    const status = mapStatus(reservation.status);
                    const paymentStatus = mapPaymentStatus(reservation.payment_status);
                    
                    return (
                      <tr key={reservation.id} className="hover:bg-gray-50 transition cursor-pointer">
                        <td className="px-4 py-4 text-center">
                          <span className="font-mono text-sm font-semibold text-brasil-blue">
                            {reservation.reservation_code || `#${String(reservation.id).padStart(6, '0')}`}
                          </span>
                        </td>
                        <td className="px-6 py-4">{formatDate(reservation.date)}</td>
                        <td className="px-4 py-4">{formatTime(reservation.date)}</td>
                        <td className="px-4 py-4 text-center">
                          Mesa {reservation.table_number || reservation.table_id}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <Badge className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded ${status.color}`}>
                            <i className={`fa-solid ${status.icon} mr-1`}></i>
                            {status.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <Badge className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded ${paymentStatus.color}`}>
                            <i className={`fa-solid ${paymentStatus.icon} mr-1`}></i>
                            {paymentStatus.label}
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
                            {reservation.status !== 'cancelled' && reservation.status !== 'completed' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-brasil-yellow hover:text-brasil-blue transition p-1"
                                  title="Editar"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCancelReservation(reservation.id)}
                                  className="text-brasil-red hover:text-red-700 transition p-1"
                                  title="Cancelar Reserva"
                                  disabled={cancelReservation.isPending}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
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
          {filteredReservations.length > 0 && (
            <div className="px-6 py-3 flex justify-between items-center bg-gray-50">
              <span className="text-xs text-gray-600">
                Exibindo {startIndex + 1}-{Math.min(endIndex, filteredReservations.length)} de {filteredReservations.length} reservas
              </span>
              <div className="space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-1 rounded text-brasil-blue hover:bg-brasil-blue hover:text-white transition"
                >
                  <i className="fa-solid fa-angle-left"></i>
                </Button>
                {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                  const pageNumber = i + 1;
                  return (
                    <Button
                      key={pageNumber}
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`px-2 py-1 rounded ${
                        currentPage === pageNumber 
                          ? "bg-brasil-yellow text-brasil-blue font-bold" 
                          : "text-brasil-blue hover:bg-brasil-blue hover:text-white transition"
                      }`}
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 rounded text-brasil-blue hover:bg-brasil-blue hover:text-white transition"
                >
                  <i className="fa-solid fa-angle-right"></i>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </CustomerLayout>
  );
}