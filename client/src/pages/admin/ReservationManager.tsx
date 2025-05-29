import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type Reservation = {
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
};

const ReservationManager: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchText, setSearchText] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('');
  const [isNewReservationModalOpen, setIsNewReservationModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [reservationToDelete, setReservationToDelete] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [reservationsPerPage] = useState(10);
  const [newReservationData, setNewReservationData] = useState({
    user_id: '',
    table_id: '',
    date: '',
    time: '',
    party_size: '',
    notes: ''
  });

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      setLocation('/');
    }
  }, [isAuthenticated, isAdmin, isLoading, setLocation]);

  // Fetch reservations
  const { data: reservations = [], isLoading: reservationsLoading } = useQuery<Reservation[]>({
    queryKey: ['/api/admin/reservations'],
    enabled: isAuthenticated && isAdmin,
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
  });

  // Fetch users for new reservation form
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ['/api/users'],
    enabled: isAuthenticated && isAdmin,
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/users');
      return response.json();
    },
  });

  // Fetch tables for new reservation form
  const { data: tables = [] } = useQuery<any[]>({
    queryKey: ['/api/tables'],
    enabled: isAuthenticated && isAdmin,
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/tables');
      return response.json();
    },
  });

  // Create new reservation mutation
  const createReservationMutation = useMutation({
    mutationFn: async (reservationData: any) => {
      const dateTime = `${reservationData.date}T${reservationData.time}:00`;
      const payload = {
        user_id: parseInt(reservationData.user_id),
        table_id: parseInt(reservationData.table_id),
        date: dateTime,
        party_size: parseInt(reservationData.party_size),
        notes: reservationData.notes,
        status: 'confirmed',
        payment_status: 'pending'
      };
      const response = await apiRequest('POST', '/api/reservations', payload);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Reserva Criada',
        description: 'A reserva foi criada com sucesso',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reservations'] });
      setIsNewReservationModalOpen(false);
      setNewReservationData({
        user_id: '',
        table_id: '',
        date: '',
        time: '',
        party_size: '',
        notes: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao Criar Reserva',
        description: error.message || 'Erro ao criar reserva',
        variant: 'destructive',
      });
    }
  });

  // Delete reservation mutation
  const deleteReservationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/reservations/${id}`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Reserva Deletada',
        description: 'A reserva foi deletada com sucesso',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reservations'] });
      setIsDeleteModalOpen(false);
      setReservationToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao Deletar',
        description: error.message || 'Erro ao deletar reserva',
        variant: 'destructive',
      });
    }
  });

  // Handle new reservation form
  const handleNewReservationSubmit = () => {
    if (!newReservationData.user_id || !newReservationData.table_id || !newReservationData.date || !newReservationData.time || !newReservationData.party_size) {
      toast({
        title: 'Erro de Validação',
        description: 'Por favor, preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }
    createReservationMutation.mutate(newReservationData);
  };

  // Handle delete reservation
  const handleDeleteReservation = (id: number) => {
    setReservationToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (reservationToDelete) {
      deleteReservationMutation.mutate(reservationToDelete);
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSearchText('');
    setPaymentMethodFilter('');
    setPaymentStatusFilter('');
    setCurrentPage(1); // Reset to first page when clearing filters
  };

  // Filter reservations based on search and filters
  const filteredReservations = reservations.filter((reservation) => {
    const matchesSearch = searchText === '' || 
      reservation.user_name?.toLowerCase().includes(searchText.toLowerCase()) ||
      reservation.email?.toLowerCase().includes(searchText.toLowerCase()) ||
      reservation.phone?.toLowerCase().includes(searchText.toLowerCase()) ||
      reservation.reservation_code?.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesPaymentMethod = paymentMethodFilter === '' || reservation.payment_method === paymentMethodFilter;
    const matchesPaymentStatus = paymentStatusFilter === '' || reservation.payment_status === paymentStatusFilter;
    
    return matchesSearch && matchesPaymentMethod && matchesPaymentStatus;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredReservations.length / reservationsPerPage);
  const startIndex = (currentPage - 1) * reservationsPerPage;
  const endIndex = startIndex + reservationsPerPage;
  const currentReservations = filteredReservations.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle next page
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Handle previous page
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= maxVisiblePages; i++) {
          pages.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - maxVisiblePages + 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }
    
    return pages;
  };

  // Format payment method display
  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case 'card': return 'Cartão';
      case 'mbway': return 'MBWay';
      case 'multibanco': return 'Multibanco';
      case 'transfer': return 'Transferência';
      case 'cash': return 'Dinheiro';
      default: return method || 'N/A';
    }
  };

  // Format payment status display
  const formatPaymentStatus = (status: string) => {
    switch (status) {
      case 'completed': return 'Pago';
      case 'pending': return 'Pendente';
      case 'failed': return 'Falhou';
      case 'cancelled': return 'Cancelado';
      default: return status || 'N/A';
    }
  };

  // Get payment method icon
  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'card': return 'fa-solid fa-credit-card';
      case 'mbway': return 'fa-solid fa-mobile';
      case 'multibanco': return 'fa-solid fa-university';
      case 'transfer': return 'fa-solid fa-exchange-alt';
      case 'cash': return 'fa-solid fa-money-bill-wave';
      default: return 'fa-solid fa-question';
    }
  };

  // Get payment status icon and color
  const getPaymentStatusDisplay = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          icon: 'fa-solid fa-circle-check',
          bgColor: 'bg-green-100',
          textColor: 'text-green-600'
        };
      case 'pending':
        return {
          icon: 'fa-solid fa-clock',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-600'
        };
      case 'failed':
      case 'cancelled':
        return {
          icon: 'fa-solid fa-circle-xmark',
          bgColor: 'bg-red-100',
          textColor: 'text-red-600'
        };
      default:
        return {
          icon: 'fa-solid fa-question',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-600'
        };
    }
  };

  if (reservationsLoading) {
    return (
      <div className="bg-gray-100 font-opensans min-h-screen">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 font-opensans">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="fixed left-0 top-0 h-full w-64 bg-blue-800 flex flex-col">
          <div className="p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center mr-2">
                <i className="fa-solid fa-utensils text-blue-800"></i>
              </div>
              <span className="text-xl font-semibold text-white font-montserrat">
                Opa que delicia
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ul>
              <li className="px-6 py-3">
                <span className="flex items-center text-white hover:bg-blue-800 hover:bg-opacity-40 rounded-lg p-2 cursor-pointer">
                  <i className="fa-solid fa-chart-line text-yellow-400 w-6"></i>
                  <span className="ml-2 font-medium">Dashboard</span>
                </span>
              </li>
              <li className="px-6 py-3">
                <span className="flex items-center text-white hover:bg-blue-800 hover:bg-opacity-40 rounded-lg p-2 cursor-pointer">
                  <i className="fa-solid fa-users text-yellow-400 w-6"></i>
                  <span className="ml-2 font-medium">Gestão de Clientes</span>
                </span>
              </li>
              <li className="px-6 py-3">
                <span className="flex items-center text-white hover:bg-blue-800 hover:bg-opacity-40 rounded-lg p-2 cursor-pointer">
                  <i className="fa-solid fa-book-open text-yellow-400 w-6"></i>
                  <span className="ml-2 font-medium">Gestão do Menu</span>
                </span>
              </li>
              <li className="px-6 py-3">
                <span className="flex items-center text-white hover:bg-blue-800 hover:bg-opacity-40 rounded-lg p-2 cursor-pointer">
                  <i className="fa-solid fa-chair text-yellow-400 w-6"></i>
                  <span className="ml-2 font-medium">Gestão das Mesas</span>
                </span>
              </li>
              <li className="px-6 py-3">
                <span className="flex items-center text-white hover:bg-blue-800 hover:bg-opacity-40 rounded-lg p-2 cursor-pointer">
                  <i className="fa-solid fa-coins text-yellow-400 w-6"></i>
                  <span className="ml-2 font-medium">Gestão Financeira</span>
                </span>
              </li>
              <li className="px-6 py-3">
                <span className="flex items-center text-white hover:bg-blue-800 hover:bg-opacity-40 rounded-lg p-2 cursor-pointer">
                  <i className="fa-solid fa-credit-card text-yellow-400 w-6"></i>
                  <span className="ml-2 font-medium">Pagamentos</span>
                </span>
              </li>
              <li className="px-6 py-3">
                <span className="flex items-center text-white bg-blue-800 bg-opacity-40 rounded-lg p-2 cursor-pointer">
                  <i className="fa-solid fa-calendar-check text-yellow-400 w-6"></i>
                  <span className="ml-2 font-medium">Reservas</span>
                </span>
              </li>
            </ul>
          </div>
          <div className="mt-auto border-t border-blue-400 p-4">
            <span className="flex items-center text-white hover:bg-blue-800 hover:bg-opacity-40 rounded-lg p-2 cursor-pointer">
              <i className="fa-solid fa-gear text-yellow-400 w-6"></i>
              <span className="ml-2 font-medium">Configurações</span>
            </span>
            <span className="flex items-center text-white hover:bg-blue-800 hover:bg-opacity-40 rounded-lg p-2 mt-2 cursor-pointer">
              <i className="fa-solid fa-right-from-bracket text-yellow-400 w-6"></i>
              <span className="ml-2 font-medium">Sair</span>
            </span>
          </div>
        </div>

        <div className="ml-64 flex-1 p-8 relative">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 font-montserrat">Gestão de Reservas</h1>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button className="relative">
                  <i className="fa-regular fa-bell text-xl text-gray-600"></i>
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">2</span>
                </button>
              </div>
              <div className="flex items-center">
                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg" alt="User Avatar" className="w-10 h-10 rounded-full border-2 border-yellow-400" />
                <div className="ml-2">
                  <p className="text-sm font-medium text-gray-800">Admin</p>
                  <p className="text-xs text-gray-500">Administrador</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col" style={{ height: '760px' }}>
            {/* Filters */}
            <div className="flex flex-col md:flex-row md:items-end md:space-x-6 space-y-3 md:space-y-0 mb-6">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-semibold mb-1 text-gray-700 font-montserrat">Buscar Reserva</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Nome do cliente, contato ou código"
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 bg-white text-gray-800 font-medium transition"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <i className="fa-solid fa-magnifying-glass"></i>
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700 font-montserrat">Método de Pagamento</label>
                <select
                  className="w-full md:w-44 border border-gray-200 rounded-lg py-2 px-3 bg-white text-gray-700 font-medium focus:ring-2 focus:ring-blue-600"
                  value={paymentMethodFilter}
                  onChange={(e) => setPaymentMethodFilter(e.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="cash">Dinheiro</option>
                  <option value="card">Cartão</option>
                  <option value="mbway">MBWay</option>
                  <option value="multibanco">Multibanco</option>
                  <option value="transfer">Transferência</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700 font-montserrat">Status de Pagamento</label>
                <select
                  className="w-full md:w-44 border border-gray-200 rounded-lg py-2 px-3 bg-white text-gray-700 font-medium focus:ring-2 focus:ring-blue-600"
                  value={paymentStatusFilter}
                  onChange={(e) => setPaymentStatusFilter(e.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="completed">Pago</option>
                  <option value="pending">Pendente</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
              <div>
                <button
                  onClick={clearFilters}
                  className="bg-yellow-400 text-blue-800 font-semibold rounded-lg px-4 py-2 shadow hover:bg-yellow-200 transition mt-2 md:mt-0"
                >
                  Limpar
                </button>
              </div>
              <div className="ml-auto">
                <button
                  onClick={() => setIsNewReservationModalOpen(true)}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2 rounded-lg shadow transition flex items-center space-x-2"
                >
                  <i className="fa-solid fa-plus"></i>
                  <span>Nova Reserva</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 flex flex-col overflow-hidden rounded-xl border border-gray-100 shadow bg-white">
              <div className="overflow-x-auto flex-1">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-blue-800">
                    <tr>
                      <th className="px-4 py-4 text-left text-xs font-bold text-white tracking-wider font-montserrat">Código</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-white tracking-wider font-montserrat">Cliente</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-white tracking-wider font-montserrat">Contato</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-white tracking-wider font-montserrat">Mesa</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-white tracking-wider font-montserrat">Data</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-white tracking-wider font-montserrat">Hora</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-white tracking-wider font-montserrat">Status de Pagamento</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-white tracking-wider font-montserrat">Método</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-white tracking-wider font-montserrat">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100 text-gray-800 font-medium">
                    {currentReservations.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                          Nenhuma reserva encontrada
                        </td>
                      </tr>
                    ) : (
                      currentReservations.map((reservation) => {
                        const statusDisplay = getPaymentStatusDisplay(reservation.payment_status);
                        return (
                          <tr key={reservation.id}>
                            <td className="px-4 py-4 font-semibold text-blue-800">
                              {reservation.reservation_code || `#R${reservation.id}`}
                            </td>
                            <td className="px-4 py-4 flex items-center">
                              <img
                                src={`https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-${(reservation.id % 8) + 1}.jpg`}
                                alt=""
                                className="w-8 h-8 rounded-full border-2 border-green-600 mr-3"
                              />
                              {reservation.user_name || `${reservation.first_name} ${reservation.last_name}`}
                            </td>
                            <td className="px-4 py-4">{reservation.phone || reservation.email}</td>
                            <td className="px-4 py-4 text-center">{reservation.table_number}</td>
                            <td className="px-4 py-4">{format(new Date(reservation.date), 'dd/MM/yyyy')}</td>
                            <td className="px-4 py-4">{format(new Date(reservation.date), 'HH:mm')}</td>
                            <td className="px-4 py-4 text-center">
                              <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold ${statusDisplay.bgColor} ${statusDisplay.textColor} rounded`}>
                                <i className={`${statusDisplay.icon} mr-1`}></i> {formatPaymentStatus(reservation.payment_status)}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className="inline-flex items-center px-2 py-1 text-xs font-semibold bg-gray-100 text-blue-800 rounded">
                                <i className={`${getPaymentMethodIcon(reservation.payment_method)} mr-1`}></i> {formatPaymentMethod(reservation.payment_method)}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center space-x-1">
                              <button
                                onClick={() => {
                                  setSelectedReservation(reservation);
                                  setIsDetailsModalOpen(true);
                                }}
                                className="text-blue-800 hover:text-green-600 px-2 py-1 rounded"
                              >
                                <i className="fa-solid fa-eye"></i>
                              </button>
                              <button className="text-yellow-500 hover:text-yellow-600 px-2 py-1 rounded">
                                <i className="fa-solid fa-pen"></i>
                              </button>
                              <button
                                onClick={() => handleDeleteReservation(reservation.id)}
                                className="text-red-500 hover:text-red-600 px-2 py-1 rounded"
                              >
                                <i className="fa-solid fa-trash"></i>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div className="flex justify-between items-center px-6 py-4 bg-white border-t border-gray-100">
                <div className="text-sm text-gray-600">
                  Exibindo {filteredReservations.length > 0 ? startIndex + 1 : 0} a {Math.min(endIndex, filteredReservations.length)} de {filteredReservations.length} reservas
                </div>
                {totalPages > 1 && (
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
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1 rounded-lg font-bold transition ${
                        currentPage === totalPages 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-gray-100 text-gray-500 hover:bg-blue-800 hover:text-white'
                      }`}
                    >
                      <i className="fa-solid fa-angle-right"></i>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Reservation Modal */}
      <Dialog open={isNewReservationModalOpen} onOpenChange={setIsNewReservationModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Nova Reserva</DialogTitle>
            <DialogDescription>
              Crie uma nova reserva para um cliente
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client">Cliente</Label>
                <Select
                  value={newReservationData.user_id}
                  onValueChange={(value) => setNewReservationData(prev => ({ ...prev, user_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user: any) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.username || `${user.first_name} ${user.last_name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="table">Mesa</Label>
                <Select
                  value={newReservationData.table_id}
                  onValueChange={(value) => setNewReservationData(prev => ({ ...prev, table_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar mesa" />
                  </SelectTrigger>
                  <SelectContent>
                    {tables.map((table: any) => (
                      <SelectItem key={table.id} value={table.id.toString()}>
                        Mesa {table.number} - {table.capacity} lugares
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={newReservationData.date}
                  onChange={(e) => setNewReservationData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Hora</Label>
                <Input
                  id="time"
                  type="time"
                  value={newReservationData.time}
                  onChange={(e) => setNewReservationData(prev => ({ ...prev, time: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="party_size">Número de Pessoas</Label>
              <Input
                id="party_size"
                type="number"
                min="1"
                max="20"
                value={newReservationData.party_size}
                onChange={(e) => setNewReservationData(prev => ({ ...prev, party_size: e.target.value }))}
                placeholder="Quantas pessoas"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={newReservationData.notes}
                onChange={(e) => setNewReservationData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Observações adicionais"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsNewReservationModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleNewReservationSubmit}
              disabled={createReservationMutation.isPending}
            >
              {createReservationMutation.isPending ? 'Criando...' : 'Criar Reserva'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reservation Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalhes da Reserva</DialogTitle>
          </DialogHeader>
          {selectedReservation && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Cliente:</strong> {selectedReservation.user_name}
                </div>
                <div>
                  <strong>Email:</strong> {selectedReservation.email}
                </div>
                <div>
                  <strong>Telefone:</strong> {selectedReservation.phone}
                </div>
                <div>
                  <strong>Mesa:</strong> Mesa {selectedReservation.table_number}
                </div>
                <div>
                  <strong>Data:</strong> {format(new Date(selectedReservation.date), 'dd/MM/yyyy HH:mm')}
                </div>
                <div>
                  <strong>Pessoas:</strong> {selectedReservation.party_size}
                </div>
                <div>
                  <strong>Status:</strong> {selectedReservation.status}
                </div>
                <div>
                  <strong>Total:</strong> €{(selectedReservation.total / 100).toFixed(2)}
                </div>
              </div>
              {selectedReservation.notes && (
                <div>
                  <strong>Observações:</strong>
                  <p className="mt-1 text-sm text-gray-600">{selectedReservation.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDetailsModalOpen(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deletar Reserva</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar esta reserva? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteReservationMutation.isPending}
            >
              {deleteReservationMutation.isPending ? 'Deletando...' : 'Deletar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReservationManager;