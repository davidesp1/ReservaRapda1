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
import AdminLayout from '@/components/layouts/AdminLayout';

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

  // Estado para o fluxo completo de reserva
  const [isReservationWizardOpen, setIsReservationWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [showCashCalculator, setShowCashCalculator] = useState(false);
  const [cashCalculatorData, setCashCalculatorData] = useState({
    total: 0,
    received: '',
    change: 0
  });
  const [wizardData, setWizardData] = useState({
    selectedItems: [] as any[],
    customerInfo: {
      name: '',
      email: '',
      phone: '',
      partySize: 2
    },
    tableSelection: {
      tableId: null as number | null,
      date: '',
      time: ''
    },
    paymentMethod: 'multibanco',
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

  // Fetch menu items for wizard
  const { data: menuItems = [] } = useQuery<any[]>({
    queryKey: ['/api/menu-items'],
    enabled: isAuthenticated && isAdmin && isReservationWizardOpen,
  });

  // Create new reservation mutation (simple form)
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

  // Create complete reservation with wizard flow
  const createCompleteReservationMutation = useMutation({
    mutationFn: async (completeData: any) => {
      const response = await apiRequest('POST', '/api/complete-reservation', completeData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Reserva Criada com Sucesso',
        description: `Reserva ${data.reservation_code} criada. Referência de pagamento: ${data.reference}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reservations'] });
      setIsReservationWizardOpen(false);
      resetWizardData();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao Criar Reserva',
        description: error.message || 'Erro ao processar reserva completa',
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

  // Reset wizard data
  const resetWizardData = () => {
    setWizardStep(1);
    setShowCashCalculator(false);
    setCashCalculatorData({ total: 0, received: '', change: 0 });
    setWizardData({
      selectedItems: [],
      customerInfo: {
        name: '',
        email: '',
        phone: '',
        partySize: 2
      },
      tableSelection: {
        tableId: null,
        date: '',
        time: ''
      },
      paymentMethod: 'multibanco',
      notes: ''
    });
  };

  // Calculadora de troco
  const handleCashCalculation = (receivedAmount: string) => {
    const received = parseFloat(receivedAmount) || 0;
    const total = calculateTotal();
    const change = received - total;
    
    setCashCalculatorData({
      total,
      received: receivedAmount,
      change: Math.max(0, change)
    });
  };

  const handleCashCalculatorDigit = (digit: string) => {
    if (digit === 'clear') {
      setCashCalculatorData(prev => ({ ...prev, received: '', change: 0 }));
    } else if (digit === 'backspace') {
      const newReceived = cashCalculatorData.received.slice(0, -1);
      handleCashCalculation(newReceived);
    } else if (digit === '.' && !cashCalculatorData.received.includes('.')) {
      const newReceived = cashCalculatorData.received + digit;
      handleCashCalculation(newReceived);
    } else if (digit !== '.' && !isNaN(Number(digit))) {
      const newReceived = cashCalculatorData.received + digit;
      handleCashCalculation(newReceived);
    }
  };

  // Wizard functions
  const handleWizardNext = () => {
    if (wizardStep < 4) {
      setWizardStep(wizardStep + 1);
    }
  };

  const handleWizardPrev = () => {
    if (wizardStep > 1) {
      setWizardStep(wizardStep - 1);
    }
  };

  const handleAddMenuItem = (item: any) => {
    setWizardData(prev => ({
      ...prev,
      selectedItems: [...prev.selectedItems.filter(i => i.id !== item.id), { ...item, quantity: 1 }]
    }));
  };

  const handleRemoveMenuItem = (itemId: number) => {
    setWizardData(prev => ({
      ...prev,
      selectedItems: prev.selectedItems.filter(i => i.id !== itemId)
    }));
  };

  const handleUpdateItemQuantity = (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveMenuItem(itemId);
      return;
    }
    setWizardData(prev => ({
      ...prev,
      selectedItems: prev.selectedItems.map(i => 
        i.id === itemId ? { ...i, quantity } : i
      )
    }));
  };

  const calculateTotal = () => {
    return wizardData.selectedItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const formatPrice = (price: number) => {
    return (price / 100).toLocaleString('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    });
  };

  const handleCompleteReservation = async () => {
    const total = calculateTotal();
    const dateTime = `${wizardData.tableSelection.date}T${wizardData.tableSelection.time}:00`;
    
    const completeData = {
      customerInfo: wizardData.customerInfo,
      selectedItems: wizardData.selectedItems,
      tableId: wizardData.tableSelection.tableId,
      date: dateTime,
      paymentMethod: wizardData.paymentMethod,
      total,
      notes: wizardData.notes,
      adminCreated: true
    };

    createCompleteReservationMutation.mutate(completeData);
  };

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
    setCurrentPage(1);
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
      <AdminLayout title="Gestão de Reservas">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Gestão de Reservas">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Gestão de Reservas</h1>
          <div className="flex space-x-3">
            <Button
              onClick={() => setIsReservationWizardOpen(true)}
              className="bg-brasil-blue hover:bg-brasil-blue/90 text-white font-bold flex items-center space-x-2"
            >
              <i className="fa-solid fa-magic"></i>
              <span>Nova Reserva Completa</span>
            </Button>
            <Button
              onClick={() => setIsNewReservationModalOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white font-bold flex items-center space-x-2"
            >
              <i className="fa-solid fa-plus"></i>
              <span>Reserva Simples</span>
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row md:items-end md:space-x-6 space-y-3 md:space-y-0 mb-6">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-semibold mb-1 text-gray-700">Buscar Reserva</label>
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
              <label className="block text-sm font-semibold mb-1 text-gray-700">Método de Pagamento</label>
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
              <label className="block text-sm font-semibold mb-1 text-gray-700">Status de Pagamento</label>
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
          </div>

          {/* Table */}
          <div className="flex-1 flex flex-col overflow-hidden rounded-xl border border-gray-100 shadow bg-white">
            <div className="overflow-x-auto flex-1">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-blue-800">
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-bold text-white tracking-wider">Código</th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-white tracking-wider">Cliente</th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-white tracking-wider">Contato</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-white tracking-wider">Mesa</th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-white tracking-wider">Data</th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-white tracking-wider">Hora</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-white tracking-wider">Status de Pagamento</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-white tracking-wider">Método</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-white tracking-wider">Ações</th>
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

      {/* Wizard de Reserva Completa */}
      <Dialog open={isReservationWizardOpen} onOpenChange={setIsReservationWizardOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Reserva Completa - Etapa {wizardStep} de 4</DialogTitle>
            <DialogDescription>
              {wizardStep === 1 && "Selecione os itens do menu para a reserva"}
              {wizardStep === 2 && "Informações do cliente"}
              {wizardStep === 3 && "Escolha da mesa e horário"}
              {wizardStep === 4 && "Resumo e confirmação"}
            </DialogDescription>
          </DialogHeader>

          {/* Indicador de Progresso Moderno */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[
                { step: 1, title: 'Menu', icon: 'fa-solid fa-utensils' },
                { step: 2, title: 'Cliente', icon: 'fa-solid fa-user' },
                { step: 3, title: 'Mesa', icon: 'fa-solid fa-chair' },
                { step: 4, title: 'Confirmação', icon: 'fa-solid fa-check-circle' }
              ].map((item, index) => (
                <div key={item.step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium transition-all duration-300 ${
                      item.step < wizardStep 
                        ? 'bg-green-500 text-white shadow-lg' 
                        : item.step === wizardStep 
                        ? 'bg-brasil-blue text-white shadow-lg animate-pulse' 
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {item.step < wizardStep ? (
                        <i className="fa-solid fa-check"></i>
                      ) : (
                        <i className={item.icon}></i>
                      )}
                    </div>
                    <span className={`mt-2 text-xs font-medium ${
                      item.step <= wizardStep ? 'text-gray-800' : 'text-gray-500'
                    }`}>
                      {item.title}
                    </span>
                  </div>
                  {index < 3 && (
                    <div className="flex-1 mx-4">
                      <div className={`h-1 rounded-full transition-all duration-500 ${
                        item.step < wizardStep ? 'bg-green-500' : 'bg-gray-200'
                      }`} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Etapa 1: Seleção do Menu */}
          {wizardStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Itens do Menu</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {menuItems.map((categoryData: any) => (
                  <div key={categoryData.category.id} className="space-y-2">
                    <h4 className="font-medium text-gray-800">{categoryData.category.name}</h4>
                    {categoryData.items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-600">{formatPrice(item.price)}</div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAddMenuItem(item)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Adicionar
                        </Button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              
              {/* Itens Selecionados */}
              {wizardData.selectedItems.length > 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Itens Selecionados</h4>
                  {wizardData.selectedItems.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center py-2">
                      <span>{item.name}</span>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateItemQuantity(item.id, item.quantity - 1)}
                        >
                          -
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateItemQuantity(item.id, item.quantity + 1)}
                        >
                          +
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveMenuItem(item.id)}
                        >
                          Remover
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2">
                    <strong>Total: {formatPrice(calculateTotal())}</strong>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Etapa 2: Informações do Cliente */}
          {wizardStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informações do Cliente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Nome Completo</Label>
                  <Input
                    id="customerName"
                    value={wizardData.customerInfo.name}
                    onChange={(e) => setWizardData(prev => ({
                      ...prev,
                      customerInfo: { ...prev.customerInfo, name: e.target.value }
                    }))}
                    placeholder="Nome do cliente"
                  />
                </div>
                <div>
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={wizardData.customerInfo.email}
                    onChange={(e) => setWizardData(prev => ({
                      ...prev,
                      customerInfo: { ...prev.customerInfo, email: e.target.value }
                    }))}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone">Telefone</Label>
                  <Input
                    id="customerPhone"
                    value={wizardData.customerInfo.phone}
                    onChange={(e) => setWizardData(prev => ({
                      ...prev,
                      customerInfo: { ...prev.customerInfo, phone: e.target.value }
                    }))}
                    placeholder="+351 999 999 999"
                  />
                </div>
                <div>
                  <Label htmlFor="partySize">Número de Pessoas</Label>
                  <Select
                    value={wizardData.customerInfo.partySize.toString()}
                    onValueChange={(value) => setWizardData(prev => ({
                      ...prev,
                      customerInfo: { ...prev.customerInfo, partySize: parseInt(value) }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} {num === 1 ? 'pessoa' : 'pessoas'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Etapa 3: Seleção de Mesa */}
          {wizardStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Escolha da Mesa e Horário</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="reservationDate">Data</Label>
                  <Input
                    id="reservationDate"
                    type="date"
                    value={wizardData.tableSelection.date}
                    onChange={(e) => setWizardData(prev => ({
                      ...prev,
                      tableSelection: { ...prev.tableSelection, date: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="reservationTime">Hora</Label>
                  <Input
                    id="reservationTime"
                    type="time"
                    value={wizardData.tableSelection.time}
                    onChange={(e) => setWizardData(prev => ({
                      ...prev,
                      tableSelection: { ...prev.tableSelection, time: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="tableSelect">Mesa</Label>
                  <Select
                    value={wizardData.tableSelection.tableId?.toString() || ''}
                    onValueChange={(value) => setWizardData(prev => ({
                      ...prev,
                      tableSelection: { ...prev.tableSelection, tableId: parseInt(value) }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar mesa" />
                    </SelectTrigger>
                    <SelectContent>
                      {tables.map((table: any) => (
                        <SelectItem key={table.id} value={table.id.toString()}>
                          Mesa {table.number} (Cap: {table.capacity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="wizardNotes">Observações (opcional)</Label>
                <Textarea
                  id="wizardNotes"
                  value={wizardData.notes}
                  onChange={(e) => setWizardData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Observações especiais para a reserva..."
                />
              </div>
            </div>
          )}

          {/* Etapa 4: Resumo e Pagamento */}
          {wizardStep === 4 && (
            <div className="space-y-6">
              {/* Cabeçalho de Confirmação */}
              <div className="text-center py-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fa-solid fa-check text-white text-2xl"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Reserva Pronta para Confirmação</h3>
                <p className="text-gray-600">Revise os detalhes antes de finalizar</p>
              </div>

              {/* Cards de Informação */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Informações do Cliente */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-brasil-blue rounded-full flex items-center justify-center mr-3">
                      <i className="fa-solid fa-user text-white text-sm"></i>
                    </div>
                    <h4 className="font-semibold text-gray-800">Informações do Cliente</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nome:</span>
                      <span className="font-medium">{wizardData.customerInfo.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{wizardData.customerInfo.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Telefone:</span>
                      <span className="font-medium">{wizardData.customerInfo.phone || 'Não informado'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pessoas:</span>
                      <span className="font-medium">{wizardData.customerInfo.partySize}</span>
                    </div>
                  </div>
                </div>

                {/* Informações da Mesa e Data */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                      <i className="fa-solid fa-calendar text-white text-sm"></i>
                    </div>
                    <h4 className="font-semibold text-gray-800">Detalhes da Reserva</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mesa:</span>
                      <span className="font-medium">#{tables.find(t => t.id === wizardData.tableSelection.tableId)?.number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Data:</span>
                      <span className="font-medium">{new Date(wizardData.tableSelection.date).toLocaleDateString('pt-PT')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hora:</span>
                      <span className="font-medium">{wizardData.tableSelection.time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duração:</span>
                      <span className="font-medium">2 horas</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Itens Selecionados */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <i className="fa-solid fa-utensils text-white text-sm"></i>
                  </div>
                  <h4 className="font-semibold text-gray-800">Itens do Menu</h4>
                </div>
                <div className="space-y-3">
                  {wizardData.selectedItems.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">{item.quantity}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-800">{item.name}</span>
                          <p className="text-xs text-gray-500">{item.category?.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-800">{formatPrice(item.price * item.quantity)}</div>
                        <div className="text-xs text-gray-500">{formatPrice(item.price)} cada</div>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-800">Total:</span>
                      <span className="text-xl font-bold text-brasil-blue">{formatPrice(calculateTotal())}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-base font-semibold mb-3 block">Método de Pagamento</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { value: 'cash', label: 'Dinheiro', icon: 'fa-solid fa-money-bills', color: 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100' },
                    { value: 'multibanco', label: 'Multibanco', icon: 'fa-solid fa-university', color: 'bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100' },
                    { value: 'mbway', label: 'MB Way', icon: 'fa-solid fa-mobile-screen', color: 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100' },
                    { value: 'card', label: 'Cartão', icon: 'fa-solid fa-credit-card', color: 'bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100' },
                    { value: 'transfer', label: 'Transferência', icon: 'fa-solid fa-exchange-alt', color: 'bg-indigo-50 border-indigo-200 text-indigo-800 hover:bg-indigo-100' }
                  ].map((method) => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setWizardData(prev => ({ ...prev, paymentMethod: method.value }))}
                      className={`
                        relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer
                        ${wizardData.paymentMethod === method.value 
                          ? 'border-brasil-blue bg-brasil-blue/10 shadow-md scale-105' 
                          : `${method.color} border-dashed`
                        }
                      `}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <i className={`${method.icon} text-2xl`}></i>
                        <span className="font-medium text-sm">{method.label}</span>
                        {wizardData.paymentMethod === method.value && (
                          <div className="absolute -top-2 -right-2 bg-brasil-blue text-white rounded-full w-6 h-6 flex items-center justify-center">
                            <i className="fa-solid fa-check text-xs"></i>
                          </div>
                        )}
                      </div>
                      {method.value === 'cash' && (
                        <div className="mt-2 text-xs text-center text-gray-600">
                          Pagamento na entrega
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                
                {/* Informação adicional baseada no método selecionado */}
                {wizardData.paymentMethod === 'cash' && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <i className="fa-solid fa-info-circle text-green-600 mt-0.5"></i>
                      <div>
                        <h4 className="font-medium text-green-800">Pagamento em Dinheiro</h4>
                        <p className="text-sm text-green-700 mt-1">
                          O cliente irá pagar em dinheiro no restaurante. A reserva será confirmada sem necessidade de pagamento online.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {wizardData.paymentMethod === 'multibanco' && (
                  <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <i className="fa-solid fa-university text-orange-600 mt-0.5"></i>
                      <div>
                        <h4 className="font-medium text-orange-800">Referência Multibanco</h4>
                        <p className="text-sm text-orange-700 mt-1">
                          Será gerada uma referência Multibanco para pagamento. O cliente receberá as instruções por email.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {wizardData.paymentMethod === 'mbway' && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <i className="fa-solid fa-mobile-screen text-blue-600 mt-0.5"></i>
                      <div>
                        <h4 className="font-medium text-blue-800">MB Way</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Será enviado um pedido de pagamento MB Way para o número de telefone fornecido: {wizardData.customerInfo.phone || 'a definir'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Resumo de Pagamento */}
              <div className="bg-gradient-to-r from-brasil-blue to-blue-600 text-white rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <i className="fa-solid fa-credit-card text-xl mr-3"></i>
                    <h4 className="font-semibold text-lg">Resumo do Pagamento</h4>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm opacity-90 mb-1">Método de Pagamento</div>
                    <div className="font-medium">
                      {wizardData.paymentMethod === 'cash' && '💰 Dinheiro'}
                      {wizardData.paymentMethod === 'multibanco' && '🏛️ Multibanco'}
                      {wizardData.paymentMethod === 'mbway' && '📱 MB Way'}
                      {wizardData.paymentMethod === 'card' && '💳 Cartão'}
                      {wizardData.paymentMethod === 'transfer' && '🔄 Transferência'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm opacity-90 mb-1">Total a Pagar</div>
                    <div className="text-2xl font-bold">{formatPrice(calculateTotal())}</div>
                  </div>
                </div>
                
                {wizardData.paymentMethod === 'cash' && (
                  <div className="mt-3 p-3 bg-white/10 rounded-lg">
                    <div className="flex items-center">
                      <i className="fa-solid fa-info-circle mr-2"></i>
                      <span className="text-sm">Pagamento será realizado no restaurante</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Notas adicionais */}
              {wizardData.notes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <i className="fa-solid fa-sticky-note text-yellow-600 mt-1 mr-3"></i>
                    <div>
                      <h4 className="font-medium text-yellow-800 mb-1">Observações</h4>
                      <p className="text-sm text-yellow-700">{wizardData.notes}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <div className="flex justify-between w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsReservationWizardOpen(false)}
              >
                Cancelar
              </Button>
              <div className="flex space-x-2">
                {wizardStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleWizardPrev}
                  >
                    Anterior
                  </Button>
                )}
                {wizardStep < 4 ? (
                  <Button
                    type="button"
                    onClick={handleWizardNext}
                    disabled={
                      (wizardStep === 1 && wizardData.selectedItems.length === 0) ||
                      (wizardStep === 2 && (!wizardData.customerInfo.name || !wizardData.customerInfo.email)) ||
                      (wizardStep === 3 && (!wizardData.tableSelection.date || !wizardData.tableSelection.time || !wizardData.tableSelection.tableId))
                    }
                  >
                    Próximo
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => {
                      if (wizardData.paymentMethod === 'cash') {
                        setCashCalculatorData({ 
                          total: calculateTotal(), 
                          received: '', 
                          change: 0 
                        });
                        setShowCashCalculator(true);
                      } else {
                        handleCompleteReservation();
                      }
                    }}
                    disabled={createCompleteReservationMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {createCompleteReservationMutation.isPending ? 'Criando...' : 
                     wizardData.paymentMethod === 'cash' ? 'Calcular Troco' : 'Criar Reserva'}
                  </Button>
                )}
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal da Calculadora de Troco */}
      <Dialog open={showCashCalculator} onOpenChange={setShowCashCalculator}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-3">
            <DialogTitle className="flex items-center text-lg">
              <i className="fa-solid fa-calculator mr-2 text-green-600"></i>
              Calculadora de Troco
            </DialogTitle>
            <DialogDescription className="text-sm">
              Calcule o troco para o pagamento em dinheiro
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {/* Resumo dos Valores */}
            <div className="grid grid-cols-3 gap-2 text-center">
              {/* Valor Total */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">Total</div>
                <div className="text-lg font-bold text-gray-800">{formatPrice(cashCalculatorData.total)}</div>
              </div>

              {/* Valor Recebido */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-xs text-blue-600 mb-1">Recebido</div>
                <div className="text-lg font-bold text-blue-800">
                  €{cashCalculatorData.received || '0.00'}
                </div>
              </div>

              {/* Troco */}
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-xs text-green-600 mb-1">Troco</div>
                <div className="text-lg font-bold text-green-800">
                  {formatPrice(cashCalculatorData.change)}
                </div>
                {cashCalculatorData.change < 0 && (
                  <div className="text-xs text-red-500 mt-1">Insuficiente</div>
                )}
              </div>
            </div>

            {/* Teclado Numérico Compacto */}
            <div className="grid grid-cols-3 gap-1.5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map((key) => (
                <Button
                  key={key}
                  variant="outline"
                  className="h-10 text-base font-medium"
                  onClick={() => handleCashCalculatorDigit(key === '⌫' ? 'backspace' : key)}
                >
                  {key}
                </Button>
              ))}
            </div>

            {/* Botões de Valor Rápido */}
            <div className="grid grid-cols-4 gap-1.5">
              {[5, 10, 20, 50].map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  onClick={() => handleCashCalculation(amount.toString())}
                  className="text-xs h-8"
                >
                  €{amount}
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={() => setCashCalculatorData(prev => ({ ...prev, received: '', change: 0 }))}
              className="w-full h-9 text-sm"
            >
              <i className="fa-solid fa-eraser mr-2"></i>
              Limpar
            </Button>
          </div>

          <DialogFooter className="pt-3 gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCashCalculator(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setShowCashCalculator(false);
                handleCompleteReservation();
              }}
              disabled={parseFloat(cashCalculatorData.received) < cashCalculatorData.total}
              className="bg-green-600 hover:bg-green-700 flex-1"
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default ReservationManager;