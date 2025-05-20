import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, Link } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PaymentDetailsModal from '@/components/payments/PaymentDetailsModal';
import CountdownTimer from '@/components/payments/CountdownTimer';
import QRCodeDisplay from '@/components/payments/QRCodeDisplay';
import CardDetailsForm from '@/components/payments/CardDetailsForm';
import MBWayForm from '@/components/payments/MBWayForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { 
  CalendarIcon, 
  Clock, 
  Plus, 
  Calendar as CalendarIcon2,
  Info, 
  CreditCard,
  Check,
  AlertCircle,
  ArrowRight,
  Trash2,
  Smartphone,
  Landmark
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import CustomerLayout from '@/components/layouts/CustomerLayout';

// Status de reserva
type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
type PaymentStatus = 'pending' | 'paid' | 'failed';

// Tipo para os itens de menu da reserva
interface MenuItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

// Interface para a nova reserva
interface ReservationData {
  id?: number;
  date: Date;
  time: string;
  partySize: number;
  tableId?: number;
  status: ReservationStatus;
  confirmationCode?: string;
  items?: MenuItem[];
  total?: number;
  notes?: string;
  paymentMethod?: string;
  paymentStatus?: PaymentStatus;
}

// Estado para detalhes de pagamento
interface PaymentDetails {
  entity?: string;
  reference?: string;
  expirationDate?: string;
  phone?: string;
}

// Estender a interface ReservationData
interface ExtendedReservationData extends ReservationData {
  paymentDetails?: PaymentDetails;
  paymentUrl?: string;
  paymentReference?: string;
  mainContent?: React.ReactNode; // Adicionado para resolver erro
}

const Reservations: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Estado para controlar a etapa atual da criação da reserva
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isCreatingReservation, setIsCreatingReservation] = useState(false);
  
  // Estado para armazenar dados da reserva em andamento
  const [reservationData, setReservationData] = useState<ExtendedReservationData>({
    date: new Date(),
    time: '',
    partySize: 2,
    status: 'pending',
    items: [],
    notes: '',
  });
  
  // Estado para o formulário básico
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [partySize, setPartySize] = useState<number>(2);
  const [selectedTime, setSelectedTime] = useState<string>('');
  
  // Estado para controlar o modal de pagamento
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  
  // Estados para o novo fluxo de pagamento
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'mbway' | 'multibanco' | null>(null);
  const [showCardForm, setShowCardForm] = useState(false);
  const [showMBWayForm, setShowMBWayForm] = useState(false);
  const [cardDetails, setCardDetails] = useState<{ cardholderName: string; cardNumber: string; expiryDate: string; cvv: string } | null>(null);
  const [mbwayPhone, setMbwayPhone] = useState<string | null>(null);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/');
    }
  }, [isAuthenticated, isLoading, setLocation]);
  
  // Fetch das reservas do usuário
  const { data: userReservations, isLoading: reservationsLoading, refetch: refetchReservations } = useQuery({
    queryKey: ['/api/reservations'],
    enabled: !!isAuthenticated,
  });
  
  // Fetch available tables for the selected date, time and party size
  // Buscar todas as mesas
  const { data: allTables, isLoading: allTablesLoading } = useQuery<any[]>({
    queryKey: ['/api/tables'],
    enabled: !!isAuthenticated,
  });
  
  // Buscar mesas disponíveis quando uma data for selecionada
  const { data: availableTables, isLoading: tablesLoading, refetch: refetchTables } = useQuery<any[]>({
    queryKey: ['/api/tables/available', { date: selectedDate?.toISOString(), partySize }],
    queryFn: async ({ queryKey }) => {
      const [_, params] = queryKey;
      const { date, partySize } = params as { date?: string; partySize: number };
      
      // Se não há data, retornamos todas as mesas mas marcamos como não disponíveis para seleção
      if (!date) {
        return allTables?.filter(table => table.available) || [];
      }
      
      // Usamos uma hora padrão para evitar problemas com o campo time
      const defaultTime = "19:00";
      const apiUrl = `/api/tables/available?date=${encodeURIComponent(date)}&time=${encodeURIComponent(defaultTime)}&partySize=${partySize}`;
      
      const response = await apiRequest('GET', apiUrl);
      return response.json();
    },
    enabled: !!isAuthenticated && isCreatingReservation,
  });
  
  // Fetch menu items
  const { data: menuCategories, isLoading: menuItemsLoading } = useQuery({
    queryKey: ['/api/menu-items'],
    enabled: !!isAuthenticated && currentStep === 2,
  });
  
  // Estado para controlar categoria atual sendo exibida
  const [currentCategory, setCurrentCategory] = useState<number>(0);
  
  // Time slots available for reservations
  const timeSlots = [
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', 
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', 
    '20:00', '20:30', '21:00', '21:30'
  ];
  
  // Schema para validação da etapa 1 (Detalhes iniciais)
  const step1Schema = z.object({
    date: z.date({ required_error: t('PleaseSelectDate') }),
    time: z.string({ required_error: t('PleaseSelectTime') }),
    partySize: z.coerce.number().min(1, { message: t('InvalidPartySize') }),
    tableId: z.coerce.number({ required_error: t('PleaseSelectTable') }),
    notes: z.string().optional(),
  });
  
  type Step1FormValues = z.infer<typeof step1Schema>;
  
  const step1Form = useForm<Step1FormValues>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      date: undefined,
      time: '',
      partySize: 2,
      tableId: undefined,
      notes: '',
    },
  });
  
  // Quando a data é selecionada no formulário
  const onDateSelect = (date: Date | undefined) => {
    handleDateChange(date);
    step1Form.setValue('date', date as Date);
  };
  
  // Quando o tamanho do grupo muda no formulário
  const onPartySizeChange = (value: string) => {
    const size = parseInt(value);
    setPartySize(size);
    step1Form.setValue('partySize', size);
  };
  
  // Adiciona state para hora selecionada
  const [selectedTimeValue, setSelectedTimeValue] = useState('');

  // Manipulador de alteração de horário
  const handleTimeChange = (time: string) => {
    setSelectedTimeValue(time);
    step1Form.setValue('time', time);
  };
  
  // Manipulador para alterar data
  const handleDateChange = useCallback((date: Date | undefined) => {
    setSelectedDate(date);
    if (date && isCreatingReservation) {
      refetchTables();
    }
  }, [isCreatingReservation, refetchTables]);
  
  // Atualiza as mesas disponíveis quando a data, hora ou o tamanho do grupo mudam
  useEffect(() => {
    if (selectedDate && isCreatingReservation) {
      refetchTables();
    }
  }, [selectedDate, partySize, refetchTables, isCreatingReservation]);
  
  // Atualiza o estado com os dados da etapa 1
  const onSubmitStep1 = (data: Step1FormValues) => {
    // Atualiza os dados da reserva
    setReservationData(prev => ({
      ...prev,
      date: data.date,
      time: data.time,
      partySize: data.partySize,
      tableId: data.tableId,
      notes: data.notes,
    }));
    
    // Avança para a próxima etapa
    setCurrentStep(2);
  };
  
  // Função para adicionar item de menu à reserva
  const addMenuItem = (item: any) => {
    setReservationData(prev => {
      const existingItems = prev.items || [];
      const existingItem = existingItems.find(i => i.id === item.id);
      
      if (existingItem) {
        // Atualiza a quantidade do item existente
        return {
          ...prev,
          items: existingItems.map(i => 
            i.id === item.id 
              ? { ...i, quantity: i.quantity + 1 } 
              : i
          ),
        };
      } else {
        // Adiciona o novo item à lista
        return {
          ...prev,
          items: [...existingItems, { ...item, quantity: 1 }],
        };
      }
    });
  };
  
  // Função para remover item de menu da reserva
  const removeMenuItem = (itemId: number) => {
    setReservationData(prev => {
      const existingItems = prev.items || [];
      
      return {
        ...prev,
        items: existingItems.filter(i => i.id !== itemId),
      };
    });
  };
  
  // Função para atualizar a quantidade de um item
  const updateItemQuantity = (itemId: number, quantity: number) => {
    setReservationData(prev => {
      const existingItems = prev.items || [];
      
      if (quantity <= 0) {
        return {
          ...prev,
          items: existingItems.filter(i => i.id !== itemId),
        };
      }
      
      return {
        ...prev,
        items: existingItems.map(i => 
          i.id === itemId 
            ? { ...i, quantity } 
            : i
        ),
      };
    });
  };
  
  // Submeter etapa 2 - Itens de menu
  const submitStep2 = () => {
    // Calcular valor total
    const total = (reservationData.items || []).reduce(
      (sum, item) => sum + (item.price * item.quantity), 
      0
    );
    
    setReservationData(prev => ({
      ...prev,
      total,
    }));
    
    // Avançar para a próxima etapa
    setCurrentStep(3);
  };
  
  // Estados para o controle do pagamento
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  
  // Função para lidar com a seleção do método de pagamento
  const handlePaymentMethodSelect = (method: 'card' | 'mbway' | 'multibanco') => {
    setSelectedPaymentMethod(method);
  };

  // Função para lidar com a submissão do formulário de cartão
  const handleCardFormSubmit = (data: { cardholderName: string; cardNumber: string; expiryDate: string; cvv: string }) => {
    setCardDetails(data);
    setShowCardForm(false);
    
    toast({
      title: t('CardDetailsAdded'),
      description: t('CardDetailsSaved'),
    });
  };

  // Função para lidar com a submissão do formulário MBWay
  const handleMBWayFormSubmit = (data: { phone: string }) => {
    setMbwayPhone(data.phone);
    setShowMBWayForm(false);
    
    toast({
      title: t('MBWayNumberAdded'),
      description: t('MBWayNumberSaved'),
    });
  };

  // Função para fechar o modal de pagamento e prosseguir para a confirmação
  const handlePaymentCompleted = () => {
    // Importante: não fechamos o modal aqui para Multibanco
    // Apenas registramos o status do pagamento e permitimos o usuário prosseguir
    
    // Se o modal estiver aberto para o método Multibanco, não fechamos automaticamente
    if (reservationData.paymentMethod !== 'multibanco') {
      setPaymentModalOpen(false);
    }
    
    // Avançar para confirmação mesmo com modal aberto
    setCurrentStep(4);
    
    toast({
      title: t('PaymentProcessing'),
      description: t('ReservationConfirmed'),
      duration: 4000,
    });
  };
  
  // Contador regressivo para pagamento Multibanco
  const [countdownTime, setCountdownTime] = useState<number>(300); // 5 minutos em segundos
  const [countdownActive, setCountdownActive] = useState<boolean>(false);
  
  // Efeito para gerenciar o contador regressivo
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (countdownActive && countdownTime > 0) {
      timer = setInterval(() => {
        setCountdownTime(prev => prev - 1);
      }, 1000);
    } else if (countdownTime === 0) {
      // Tempo esgotado, cancelar o pagamento
      setReservationData(prev => ({
        ...prev,
        paymentStatus: 'failed'  // Usamos "failed" em vez de "cancelled" para compatibilidade de tipos
      }));
      
      toast({
        title: t('PaymentTimeout'),
        description: t('PaymentTimeoutDescription'),
        variant: 'destructive',
      });
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdownActive, countdownTime, t]);
  
  // Formatar o tempo de contagem regressiva
  const formatCountdown = () => {
    const minutes = Math.floor(countdownTime / 60);
    const seconds = countdownTime % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Verificação periódica do status do pagamento Multibanco
  useEffect(() => {
    let checkInterval: NodeJS.Timeout;
    
    // Se for um pagamento Multibanco pendente e tivermos uma referência, verificamos o status periodicamente
    if (
      reservationData.paymentMethod === 'multibanco' && 
      reservationData.paymentStatus === 'pending' && 
      reservationData.paymentReference
    ) {
      checkInterval = setInterval(async () => {
        try {
          // Chamar API para verificar o status do pagamento
          const response = await apiRequest('GET', `/api/payments/status/${reservationData.paymentReference}`);
          
          if (response.ok) {
            const result = await response.json();
            
            // Se o pagamento foi confirmado, atualizar o status
            if (result.status === 'paid') {
              setReservationData(prev => ({
                ...prev,
                paymentStatus: 'paid'
              }));
              
              // Mostrar notificação de pagamento confirmado
              toast({
                title: t('PaymentConfirmed'),
                description: t('PaymentConfirmedDescription'),
                variant: 'default',
              });
              
              // Desativar o contador regressivo
              setCountdownActive(false);
            }
          }
        } catch (error) {
          console.error('Erro ao verificar status do pagamento:', error);
        }
      }, 15000); // Verificar a cada 15 segundos
    }
    
    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [reservationData.paymentMethod, reservationData.paymentStatus, reservationData.paymentReference, t]);

  // Submeter etapa 3 - Pagamento
  const submitStep3 = async (paymentMethod: string) => {
    setIsProcessingPayment(true);
    setPaymentError(null);
    
    try {
      // Calcular valor total para o pagamento
      const total = reservationData.items?.reduce(
        (sum, item) => sum + (item.price * item.quantity), 
        0
      ) || 0;
      
      // Gerar código de confirmação único
      const confirmationCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      // Preparar dados para o pagamento
      const paymentData = {
        method: paymentMethod,
        amount: total,
        reference: `RES-${Date.now()}`, // Referência única para o pagamento
        description: `Reserva ${format(reservationData.date, 'dd/MM/yyyy')} - ${reservationData.time}`,
        email: user?.email,
        name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.username,
        phone: user?.phone || '',
        reservationId: reservationData.id // Adicionar ID da reserva para associar o pagamento
      };
      
      console.log(`Processando pagamento ${paymentMethod}`, paymentData);
      
      // Chamar API para processar o pagamento
      const response = await apiRequest('POST', '/api/payments/process', paymentData);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Erro ao processar pagamento');
      }
      
      console.log(`Resposta do pagamento ${paymentMethod}:`, result);
      
      // Processar o resultado do pagamento conforme o método
      if (paymentMethod === 'multibanco') {
        // Para Multibanco, configuramos os detalhes do pagamento
        const multibancoDetails = {
          entity: result.entity || '11111',
          reference: result.reference || '999 999 999',
          amount: total,
          expirationDate: result.expirationDate || new Date(Date.now() + 72*3600*1000).toISOString()
        };
        
        console.log("Processando Multibanco com detalhes:", multibancoDetails);
        
        // Atualizar dados da reserva
        setReservationData({
          ...reservationData,
          paymentMethod,
          paymentStatus: 'pending', // Importante: status pendente para Multibanco
          confirmationCode,
          paymentReference: result.paymentReference,
          total: total,
          paymentDetails: multibancoDetails
        });
        
        // Iniciar contador regressivo para o pagamento
        setCountdownTime(300); // 5 minutos
        setCountdownActive(true);
        
        // Criar alerta de toast com os detalhes para garantir visibilidade
        toast({
          title: t('MultibancoPaymentDetails'),
          description: `${t('Entity')}: ${multibancoDetails.entity} | ${t('Reference')}: ${multibancoDetails.reference}`,
          duration: 10000,
        });
        
        // Avançar para a etapa final
        setCurrentStep(4);
      } 
      else if (paymentMethod === 'mbway') {
        setReservationData({
          ...reservationData,
          paymentMethod,
          paymentStatus: 'pending',
          confirmationCode,
          paymentReference: result.paymentReference,
          total: total,
          paymentDetails: {
            phone: paymentData.phone
          }
        });
        console.log("Abrindo modal de pagamento MBWay");
        setPaymentModalOpen(true);
      }
      else if (paymentMethod === 'card') {
        // Atualizar dados da reserva
        setReservationData({
          ...reservationData,
          paymentMethod,
          paymentStatus: 'pending',
          confirmationCode,
          paymentReference: result.paymentReference,
          paymentUrl: result.paymentUrl,
          total: total,
          paymentDetails: {
            reference: result.reference
          }
        });
        
        // Se temos URL de pagamento, abrir em nova janela
        if (result.paymentUrl) {
          console.log("Abrindo URL de pagamento:", result.paymentUrl);
          window.open(result.paymentUrl, '_blank');
        }
        
        console.log("Abrindo modal de pagamento com cartão");
        setPaymentModalOpen(true);
      } 
      else {
        // Para outros métodos ou simulação
        setReservationData({
          ...reservationData,
          paymentMethod,
          paymentStatus: 'paid',
          confirmationCode,
          paymentReference: result.paymentReference,
          total: total,
          paymentDetails: result
        });
        
        // Avançar para a etapa final
        setCurrentStep(4);
      }
    } catch (error: any) {
      console.error('Erro no pagamento:', error);
      setPaymentError(error.message || 'Ocorreu um erro ao processar o pagamento. Por favor, tente novamente.');
      toast({
        title: t('PaymentError'),
        description: error.message || t('PaymentErrorMessage'),
        variant: 'destructive',
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };
  
  // Criar reserva mutation
  const createReservationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/reservations', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('ReservationSuccess'),
        description: t('ReservationSuccessMessage'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
      // Resetar o fluxo e voltar para a lista de reservas
      finishReservationProcess();
    },
    onError: (error: any) => {
      toast({
        title: t('ReservationError'),
        description: error.message || t('ReservationErrorMessage'),
        variant: 'destructive',
      });
    }
  });
  
  // Finalizar processo e salvar a reserva
  const finalizeReservation = () => {
    // Prepare reservation data
    const dateTime = new Date(reservationData.date);
    const [hours, minutes] = reservationData.time.split(':').map(Number);
    dateTime.setHours(hours, minutes, 0, 0);
    
    // Conversão adequada para formato compatível com a API
    const submitData = {
      userId: user?.id,
      date: dateTime.toISOString(),
      tableId: reservationData.tableId,
      partySize: reservationData.partySize,
      notes: reservationData.notes || '',
      status: 'confirmed',
      confirmationCode: reservationData.confirmationCode,
      paymentMethod: reservationData.paymentMethod,
      paymentStatus: reservationData.paymentStatus,
      items: reservationData.items,
      total: reservationData.total,
      // Valores padrão
      duration: 120,
    };
    
    createReservationMutation.mutate(submitData);
  };
  
  // Cancelar criação de reserva e voltar à lista
  const cancelReservationCreation = () => {
    setIsCreatingReservation(false);
    setCurrentStep(1);
    
    // Resetar dados do formulário
    step1Form.reset();
  };
  
  // Finalizar processo de reserva
  const finishReservationProcess = () => {
    setIsCreatingReservation(false);
    setCurrentStep(1);
    refetchReservations();
    
    // Resetar dados do formulário
    step1Form.reset();
  };
  
  // Deletar reserva
  const deleteReservationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/reservations/${id}`);
      return response.ok;
    },
    onSuccess: () => {
      toast({
        title: t('ReservationCancelled'),
        description: t('ReservationCancelledMessage'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
    },
    onError: () => {
      toast({
        title: t('Error'),
        description: t('ReservationCancelError'),
        variant: 'destructive',
      });
    }
  });
  
  const handleDeleteReservation = (id: number) => {
    if (window.confirm(t('ConfirmCancelReservation'))) {
      deleteReservationMutation.mutate(id);
    }
  };
  
  // Renderiza a etapa atual do processo de criação de reserva
  const renderReservationStep = () => {
    // Etapa 1: Detalhes da reserva
    if (currentStep === 1) {
      return (
        <div className="space-y-6">
          <Card className="shadow-md">
            <CardHeader className="pb-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl mb-1">{t('Step1Title')}</CardTitle>
                  <CardDescription>{t('Step1Description')}</CardDescription>
                </div>
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brasil-blue text-white font-semibold">
                  1
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Form {...step1Form}>
                <form onSubmit={step1Form.handleSubmit(onSubmitStep1)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={step1Form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('Date')}</FormLabel>
                          <div className="flex flex-col">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start text-left font-normal"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value ? (
                                    format(field.value, 'PPP')
                                  ) : (
                                    <span>{t('SelectDate')}</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={(date) => onDateSelect(date)}
                                  disabled={(date) => 
                                    date < new Date(new Date().setHours(0, 0, 0, 0)) // No past dates
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={step1Form.control}
                      name="time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('Time')}</FormLabel>
                          <Select 
                              onValueChange={(value) => {
                                field.onChange(value);
                                handleTimeChange(value);
                              }} 
                              value={field.value}
                            >
                            <SelectTrigger>
                              <SelectValue placeholder={t('SelectTime')}>
                                {field.value ? (
                                  <div className="flex items-center">
                                    <Clock className="mr-2 h-4 w-4" />
                                    {field.value}
                                  </div>
                                ) : (
                                  <span>{t('SelectTime')}</span>
                                )}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {timeSlots.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={step1Form.control}
                      name="partySize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('PartySize')}</FormLabel>
                          <Select 
                            onValueChange={(value) => onPartySizeChange(value)} 
                            value={field.value ? field.value.toString() : "2"}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={t('SelectPartySize')} />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((size) => (
                                <SelectItem key={size} value={size.toString()}>
                                  {size} {size === 1 ? t('Person') : t('People')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={step1Form.control}
                      name="tableId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('Table')}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value ? field.value.toString() : ""}>
                            <SelectTrigger>
                              <SelectValue placeholder={t('SelectTable')} />
                            </SelectTrigger>
                            <SelectContent>
                              {tablesLoading ? (
                                <SelectItem value="loading" disabled>
                                  {t('Loading')}...
                                </SelectItem>
                              ) : availableTables && Array.isArray(availableTables) && availableTables.length > 0 ? (
                                availableTables.map((table: any) => (
                                  <SelectItem key={table.id} value={table.id.toString()}>
                                    {t('Table')} {table.number} ({table.capacity} {t('Seats')})
                                    {table.category === 'vip' && ` - ${t('VIP')}`}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="no-tables-available" disabled>
                                  {t('NoTablesAvailable')}
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={step1Form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('Notes')}</FormLabel>
                        <FormControl>
                          <textarea
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brasil-green focus:border-transparent resize-none"
                            rows={3}
                            placeholder={t('NotesPlaceholder')}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {t('NotesDescription')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-between pt-4">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={cancelReservationCreation}
                    >
                      {t('Cancel')}
                    </Button>
                    
                    <Button 
                      type="submit" 
                      className="bg-brasil-green hover:bg-green-700 text-white"
                      disabled={
                        !availableTables || 
                        !(Array.isArray(availableTables) && availableTables.length > 0)
                      }
                    >
                      <span className="flex items-center">
                        {t('Continue')} <ArrowRight className="ml-2 h-4 w-4" />
                      </span>
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          {/* Card com informações do evento */}
          <Card className="shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">{t('EventInformation')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <h3 className="font-semibold mb-3 text-brasil-blue">{t('EventDetails')}</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="bg-brasil-blue/10 p-2 rounded-full mr-3 flex-shrink-0">
                      <CalendarIcon2 className="h-4 w-4 text-brasil-blue" />
                    </div>
                    <p className="text-sm text-gray-600">29/05/2025 - 01/06/2025</p>
                  </div>
                  <div className="flex items-center">
                    <div className="bg-brasil-blue/10 p-2 rounded-full mr-3 flex-shrink-0">
                      <Clock className="h-4 w-4 text-brasil-blue" />
                    </div>
                    <p className="text-sm text-gray-600">11:00 - 22:00</p>
                  </div>
                  <div className="flex items-center">
                    <div className="bg-brasil-blue/10 p-2 rounded-full mr-3 flex-shrink-0">
                      <Info className="h-4 w-4 text-brasil-blue" />
                    </div>
                    <p className="text-sm text-gray-600">{t('ConventionCenter')}, MSBN Europe</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    // Etapa 2: Seleção de menu
    else if (currentStep === 2) {
      return (
        <div className="space-y-6">
          <Card className="shadow-md">
            <CardHeader className="pb-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl mb-1">{t('Step2Title')}</CardTitle>
                  <CardDescription>{t('Step2Description')}</CardDescription>
                </div>
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brasil-blue text-white font-semibold">
                  2
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <h3 className="font-semibold mb-4">{t('AvailableMenuItems')}</h3>
                  
                  {menuItemsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin w-8 h-8 border-4 border-brasil-green border-t-transparent rounded-full"></div>
                    </div>
                  ) : menuCategories && Array.isArray(menuCategories) ? (
                    <div className="space-y-8">
                      {/* Indicadores de progresso da categoria */}
                      <div className="flex justify-center space-x-2 mb-6">
                        {menuCategories.map((categoryGroup: any, index: number) => (
                          <div 
                            key={categoryGroup.category.id}
                            className={`h-2 w-10 rounded-full transition-colors cursor-pointer ${currentCategory === index ? 'bg-brasil-green' : 'bg-gray-200'}`}
                            onClick={() => setCurrentCategory(index)}
                          ></div>
                        ))}
                      </div>
                      
                      {/* Título da categoria atual */}
                      {menuCategories[currentCategory] && (
                        <div className="text-center">
                          <h3 className="text-xl font-semibold text-brasil-blue mb-1">
                            {menuCategories[currentCategory].category.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {t('CategoryStep')} {currentCategory + 1} {t('of')} {menuCategories.length}
                          </p>
                        </div>
                      )}
                      
                      {/* Itens da categoria atual */}
                      {menuCategories[currentCategory] && menuCategories[currentCategory].items && menuCategories[currentCategory].items.length > 0 ? (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {/* Opção sem seleção/pular */}
                            <Card className="overflow-hidden flex flex-col h-full border-brasil-blue/20 bg-gray-50">
                              <div className="p-3">
                                <div className="flex justify-between">
                                  <div>
                                    <h4 className="font-medium">{t('NoSelection')}</h4>
                                    <p className="text-sm text-gray-500 line-clamp-2">{t('SkipThisCategory')}</p>
                                  </div>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="mt-2 border-brasil-blue text-brasil-blue hover:bg-brasil-blue/10"
                                  onClick={() => {
                                    // Aqui não fazemos nada, apenas oferecemos o botão como uma opção visual
                                    // O usuário avançará usando os botões de navegação no final da página
                                  }}
                                >
                                  {t('Skip')}
                                </Button>
                              </div>
                            </Card>
                            
                            {/* Itens da categoria */}
                            {menuCategories[currentCategory].items.map((item: any) => (
                              <Card key={item.id} className="overflow-hidden flex flex-col h-full border-brasil-blue/20">
                                <div className="p-3">
                                  <div className="flex justify-between">
                                    <div>
                                      <h4 className="font-medium">{item.name}</h4>
                                      <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
                                    </div>
                                    <div className="font-semibold text-brasil-green">€{(Number(item.price) / 100).toLocaleString('pt-PT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                                  </div>
                                  <Button 
                                    size="sm" 
                                    className="mt-2 bg-brasil-green hover:bg-green-700 text-white"
                                    onClick={() => addMenuItem(item)}
                                  >
                                    <Plus className="h-4 w-4 mr-1" /> {t('Add')}
                                  </Button>
                                </div>
                              </Card>
                            ))}
                          </div>
                          
                          {/* Botões de navegação entre categorias */}
                          <div className="flex justify-between mt-8">
                            <Button
                              variant="outline"
                              onClick={() => setCurrentCategory(Math.max(0, currentCategory - 1))}
                              disabled={currentCategory === 0}
                              className="border-brasil-blue text-brasil-blue"
                            >
                              {t('Previous')}
                            </Button>
                            
                            <Button
                              variant="outline"
                              onClick={() => {
                                if (currentCategory < menuCategories.length - 1) {
                                  setCurrentCategory(currentCategory + 1);
                                } else {
                                  submitStep2();
                                }
                              }}
                              className="border-brasil-blue text-brasil-blue"
                            >
                              {currentCategory === menuCategories.length - 1 ? t('Finish') : t('Next')}
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-4 text-gray-400 italic">
                          {t('NoCategoryItems')}
                          <div className="mt-4">
                            <Button
                              variant="outline"
                              onClick={() => {
                                if (currentCategory < menuCategories.length - 1) {
                                  setCurrentCategory(currentCategory + 1);
                                } else {
                                  submitStep2();
                                }
                              }}
                              className="border-brasil-blue text-brasil-blue"
                            >
                              {currentCategory === menuCategories.length - 1 ? t('Finish') : t('Next')}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      {t('NoMenuItemsAvailable')}
                    </div>
                  )}
                </div>
                
                <div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 sticky top-4">
                    <h3 className="font-semibold mb-4">{t('YourOrder')}</h3>
                    
                    {reservationData.items && reservationData.items.length > 0 ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          {reservationData.items.map((item) => (
                            <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                              <div className="flex-1">
                                <div className="flex items-center">
                                  <span className="text-sm font-medium">{item.name}</span>
                                </div>
                                <div className="flex items-center mt-1">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 w-6 p-0"
                                    onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                                  >
                                    -
                                  </Button>
                                  <span className="mx-2 text-sm">{item.quantity}</span>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 w-6 p-0"
                                    onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                                  >
                                    +
                                  </Button>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-semibold">
                                  €{((Number(item.price) / 100) * item.quantity).toLocaleString('pt-PT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 text-red-500 p-0 mt-1"
                                  onClick={() => removeMenuItem(item.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="pt-2 border-t border-gray-200">
                          <div className="flex justify-between font-semibold">
                            <span>{t('Total')}</span>
                            <span>€{Number(reservationData.items.reduce((sum, item) => sum + ((Number(item.price) / 100) * item.quantity), 0)).toLocaleString('pt-PT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                          </div>
                        </div>
                        
                        <Button 
                          className="w-full bg-brasil-green hover:bg-green-700 text-white"
                          onClick={submitStep2}
                        >
                          {t('ProceedToPayment')}
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <p className="mb-2">{t('NoItemsSelected')}</p>
                        <p className="text-sm">{t('PleaseSelectItems')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between mt-6 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep(1)}
                >
                  {t('Back')}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={cancelReservationCreation}
                >
                  {t('CancelReservation')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    // Etapa 3: Pagamento
    else if (currentStep === 3) {
      return (
        <div className="space-y-6">
          <Card className="shadow-md">
            <CardHeader className="pb-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl mb-1">{t('Step3Title')}</CardTitle>
                  <CardDescription>{t('Step3Description')}</CardDescription>
                </div>
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brasil-blue text-white font-semibold">
                  3
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-4">{t('PaymentMethods')}</h3>
                  
                  <div className="space-y-3">
                    {isProcessingPayment ? (
                      <div className="flex flex-col items-center justify-center py-10">
                        <div className="animate-spin w-10 h-10 border-4 border-brasil-green border-t-transparent rounded-full mb-4"></div>
                        <p className="text-brasil-blue font-medium">{t('ProcessingPayment')}</p>
                        <p className="text-sm text-gray-500 mt-2">{t('PleaseWait')}</p>
                      </div>
                    ) : (
                      <>
                        {paymentError && (
                          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                            <h4 className="font-medium mb-1">{t('PaymentError')}</h4>
                            <p className="text-sm">{paymentError}</p>
                          </div>
                        )}
                        
                        <Card 
                          className={`cursor-pointer hover:border-brasil-green border-2 transition-colors ${selectedPaymentMethod === 'card' ? 'border-brasil-green' : 'border-gray-200'}`}
                          onClick={() => handlePaymentMethodSelect('card')}
                        >
                          <CardContent className="p-4 flex items-center">
                            <div className="bg-brasil-blue/10 p-3 rounded-full mr-4">
                              <CreditCard className="h-6 w-6 text-brasil-blue" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium">{t('CreditCard')}</h4>
                              <p className="text-sm text-gray-500">{t('CreditCardDescription')}</p>
                              {cardDetails && (
                                <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-100 text-sm">
                                  <p>**** **** **** {cardDetails.cardNumber.slice(-4)}</p>
                                  <p>{cardDetails.cardholderName}</p>
                                </div>
                              )}
                            </div>
                            {selectedPaymentMethod === 'card' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowCardForm(true);
                                }}
                              >
                                {cardDetails ? t('ChangeCard') : t('AddCard')}
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                        
                        <Card 
                          className={`cursor-pointer hover:border-brasil-green border-2 transition-colors ${selectedPaymentMethod === 'mbway' ? 'border-brasil-green' : 'border-gray-200'}`}
                          onClick={() => handlePaymentMethodSelect('mbway')}
                        >
                          <CardContent className="p-4 flex items-center">
                            <div className="bg-brasil-blue/10 p-3 rounded-full mr-4">
                              <Smartphone className="h-6 w-6 text-brasil-blue" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium">MBWay</h4>
                              <p className="text-sm text-gray-500">{t('MBWayDescription')}</p>
                              {mbwayPhone && (
                                <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-100 text-sm">
                                  <p>{mbwayPhone}</p>
                                </div>
                              )}
                            </div>
                            {selectedPaymentMethod === 'mbway' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowMBWayForm(true);
                                }}
                              >
                                {mbwayPhone ? t('ChangePhone') : t('AddPhone')}
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                        
                        <Card 
                          className={`cursor-pointer hover:border-brasil-green border-2 transition-colors ${selectedPaymentMethod === 'multibanco' ? 'border-brasil-green' : 'border-gray-200'}`}
                          onClick={() => handlePaymentMethodSelect('multibanco')}
                        >
                          <CardContent className="p-4 flex items-center">
                            <div className="bg-brasil-blue/10 p-3 rounded-full mr-4">
                              <Landmark className="h-6 w-6 text-brasil-blue" />
                            </div>
                            <div>
                              <h4 className="font-medium">Multibanco</h4>
                              <p className="text-sm text-gray-500">{t('MultibancoDescription')}</p>
                            </div>
                          </CardContent>
                        </Card>
                        
                        {selectedPaymentMethod && (
                          <div className="mt-6">
                            <Button 
                              className="w-full bg-brasil-green hover:bg-green-700 text-white"
                              onClick={() => submitStep3(selectedPaymentMethod)}
                            >
                              {t('ProceedToPayment')}
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-4">{t('ReservationSummary')}</h3>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('Date')}:</span>
                        <span className="font-medium">{format(reservationData.date, 'PPP')}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('Time')}:</span>
                        <span className="font-medium">{reservationData.time}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('PartySize')}:</span>
                        <span className="font-medium">{reservationData.partySize} {reservationData.partySize === 1 ? t('Person') : t('People')}</span>
                      </div>
                      
                      <div className="pt-3 border-t">
                        <h4 className="font-semibold mb-2">{t('OrderItems')}</h4>
                        
                        {reservationData.items && reservationData.items.length > 0 ? (
                          <div className="space-y-2">
                            {reservationData.items.map((item) => (
                              <div key={item.id} className="flex justify-between text-sm">
                                <span>{item.name} x{item.quantity}</span>
                                <span>€{Number(item.price * item.quantity).toLocaleString('pt-PT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                              </div>
                            ))}
                            
                            <div className="flex justify-between font-semibold pt-2 border-t">
                              <span>{t('Total')}</span>
                              <span>€{Number(reservationData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)).toLocaleString('pt-PT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">{t('NoItemsSelected')}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between mt-6 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep(2)}
                >
                  {t('Back')}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={cancelReservationCreation}
                >
                  {t('CancelReservation')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    // Etapa 4: Confirmação
    else {
      return (
        <div className="space-y-6">
          <Card className="shadow-md">
            <CardHeader className="pb-4 border-b bg-green-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl mb-1">{t('ReservationConfirmed')}</CardTitle>
                  <CardDescription>{t('ReservationConfirmedDescription')}</CardDescription>
                </div>
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500 text-white">
                  <Check className="h-6 w-6" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-lg mb-4">{t('ReservationDetails')}</h3>
                  
                  <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
                    <div className="space-y-4">
                      {/* Código da reserva */}
                      <div className="text-center pb-4 border-b">
                        <div className="text-sm text-gray-600 mb-1">{t('ReservationCode')}</div>
                        <div className="text-xl font-bold font-mono">{reservationData.confirmationCode}</div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-600">{t('Date')}</div>
                          <div className="font-medium">{format(reservationData.date, 'PPP')}</div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-600">{t('Time')}</div>
                          <div className="font-medium">{reservationData.time}</div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-600">{t('PartySize')}</div>
                          <div className="font-medium">
                            {reservationData.partySize} {reservationData.partySize === 1 ? t('Person') : t('People')}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-600">{t('PaymentStatus')}</div>
                          <div className="font-medium">
                            <Badge variant="outline" className={
                              reservationData.paymentMethod === 'multibanco' && reservationData.paymentStatus !== 'paid' 
                                ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                : "bg-green-50 text-green-700 border-green-200"
                            }>
                              {reservationData.paymentMethod === 'multibanco' && reservationData.paymentStatus !== 'paid' 
                                ? t('Pending') 
                                : t('Paid')}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3">{t('PaymentInformation')}</h3>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <div className="flex items-center mb-3">
                        <div className="bg-brasil-blue/10 p-2 rounded-full mr-3">
                          {reservationData.paymentMethod === 'multibanco' ? (
                            <Landmark className="h-4 w-4 text-brasil-blue" />
                          ) : reservationData.paymentMethod === 'mbway' ? (
                            <Smartphone className="h-4 w-4 text-brasil-blue" />
                          ) : (
                            <CreditCard className="h-4 w-4 text-brasil-blue" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{t(reservationData.paymentMethod || 'card')}</div>
                          <div className="text-sm text-gray-600">
                            {reservationData.paymentMethod === 'multibanco' && reservationData.paymentStatus === 'pending' 
                              ? t('PendingTransaction') 
                              : t('TransactionProcessed')}
                          </div>
                        </div>
                      </div>
                      
                      {/* Detalhes específicos para Multibanco */}
                      {reservationData.paymentMethod === 'multibanco' && reservationData.paymentStatus === 'pending' && (
                        <div className="mb-3 p-3 bg-yellow-50 rounded-md border border-yellow-100">
                          <div className="text-center mb-2 font-medium text-yellow-800">
                            {t('PaymentPendingApproval')}
                          </div>
                          
                          {countdownActive && (
                            <div className="text-center mb-3">
                              <div className="text-sm text-gray-600">{t('TimeRemaining')}</div>
                              <div className="text-xl font-mono font-semibold text-yellow-800">{formatCountdown()}</div>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            <div>
                              <div className="text-sm text-gray-600">{t('Entity')}</div>
                              <div className="font-bold font-mono text-lg">{reservationData.paymentDetails?.entity || '11111'}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">{t('Reference')}</div>
                              <div className="font-bold font-mono text-lg">{reservationData.paymentDetails?.reference || '999 999 999'}</div>
                            </div>
                          </div>
                          
                          <div className="text-sm text-center text-gray-600">
                            {t('MultibancoCTA')}
                          </div>
                        </div>
                      )}
                      
                      <div className="pt-3 border-t">
                        <div className="flex justify-between font-semibold">
                          <span>{t('Total')}</span>
                          <span>€{Number(reservationData.total || 0).toLocaleString('pt-PT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-4">{t('AccessCodes')}</h3>
                  
                  <div className="bg-gray-50 p-5 rounded-lg border border-gray-100 text-center">
                    <div className="mb-4">
                      <div className="text-sm text-gray-600 mb-2">{t('ScanQRCode')}</div>
                      <div className="bg-white p-4 inline-block rounded-lg border border-gray-200">
                        {/* QR Code para Multibanco */}
                        {reservationData.paymentMethod === 'multibanco' && reservationData.paymentStatus === 'pending' ? (
                          <div className="text-center">
                            <div className="w-48 h-48 bg-gray-800 mx-auto flex items-center justify-center">
                              <div className="p-4 bg-white">
                                <div className="text-sm font-bold mb-2">{t('MultibancoPay')}</div>
                                <div className="text-xs mb-1">{t('Entity')}: {reservationData.paymentDetails?.entity || '11111'}</div>
                                <div className="text-xs mb-1">{t('Reference')}: {reservationData.paymentDetails?.reference || '999999999'}</div>
                                <div className="text-xs mb-1">€{Number(reservationData.total || 0).toLocaleString('pt-PT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="w-48 h-48 bg-gray-800 mx-auto flex items-center justify-center text-white text-sm p-2 text-center">
                            {t('ReservationQRCode')}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="mb-4 pb-4 border-b">
                      <div className="text-sm text-gray-600 mb-2">{t('OrShowBarcode')}</div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        {/* Código de barras para Multibanco */}
                        {reservationData.paymentMethod === 'multibanco' && reservationData.paymentStatus === 'pending' ? (
                          <div className="text-center">
                            <div className="w-full h-16 bg-gray-800 mx-auto flex items-center justify-center">
                              <div className="px-4 py-2 bg-white">
                                <div className="text-xs font-mono font-bold">
                                  {reservationData.paymentDetails?.entity || '11111'} | {reservationData.paymentDetails?.reference || '999999999'} | €{Number(reservationData.total || 0).toLocaleString('pt-PT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-16 bg-gray-800 mx-auto flex items-center justify-center text-white text-sm">
                            {t('ReservationBarcode')}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => alert(t('PrintFunctionality'))}
                      >
                        <i className="fas fa-print mr-2"></i>
                        {t('PrintConfirmation')}
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => alert(t('EmailFunctionality'))}
                      >
                        <i className="fas fa-envelope mr-2"></i>
                        {t('EmailConfirmation')}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center mt-8">
                <Button 
                  className="bg-brasil-green hover:bg-green-700 text-white px-8"
                  onClick={finalizeReservation}
                >
                  {t('FinishAndSaveReservation')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
  };
  
  // Render da página principal de Reservas
  return (
    <CustomerLayout title={t('Reservations')}>
      {isCreatingReservation ? (
        // Interface de criação de reserva em etapas
        <div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-montserrat font-bold md:block hidden">
              {t('MakeReservation')} - {t(`Step${currentStep}Name`)}
            </h1>
            
            <div className="hidden md:flex items-center space-x-2">
              {[1, 2, 3, 4].map((step) => (
                <div 
                  key={step}
                  className={`flex items-center ${step !== 4 ? 'mr-2' : ''}`}
                >
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                      currentStep === step 
                        ? 'bg-brasil-blue text-white' 
                        : currentStep > step
                          ? 'bg-brasil-green text-white'
                          : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {currentStep > step ? <Check className="h-4 w-4" /> : step}
                  </div>
                  
                  {step !== 4 && (
                    <div 
                      className={`h-1 w-6 ${
                        currentStep > step ? 'bg-brasil-green' : 'bg-gray-200'
                      }`}
                    ></div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {renderReservationStep()}
        </div>
      ) : (
        // Lista de reservas
        <div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-montserrat font-bold md:block hidden">
              {t('Reservations')}
            </h1>
            
            <Button 
              className="bg-brasil-green hover:bg-green-700 text-white"
              onClick={() => setIsCreatingReservation(true)}
            >
              <Plus className="mr-2 h-4 w-4" /> {t('NewReservation')}
            </Button>
          </div>
          
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>{t('YourReservations')}</CardTitle>
              <CardDescription>{t('ManageYourReservations')}</CardDescription>
            </CardHeader>
            <CardContent>
              {reservationsLoading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin w-8 h-8 border-4 border-brasil-green border-t-transparent rounded-full"></div>
                </div>
              ) : userReservations && Array.isArray(userReservations) && userReservations.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('Date')}</TableHead>
                        <TableHead>{t('Time')}</TableHead>
                        <TableHead>{t('People')}</TableHead>
                        <TableHead>{t('Status')}</TableHead>
                        <TableHead>{t('Actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userReservations.map((reservation: any) => {
                        const reservationDate = new Date(reservation.date);
                        const formattedDate = format(reservationDate, 'PPP');
                        const formattedTime = format(reservationDate, 'HH:mm');
                        
                        return (
                          <TableRow key={reservation.id}>
                            <TableCell>{formattedDate}</TableCell>
                            <TableCell>{formattedTime}</TableCell>
                            <TableCell>{reservation.partySize}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={
                                reservation.status === 'confirmed' 
                                  ? 'bg-green-50 text-green-700 border-green-200' 
                                  : reservation.status === 'cancelled'
                                    ? 'bg-red-50 text-red-700 border-red-200'
                                    : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                              }>
                                {t(reservation.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">
                                  {t('View')}
                                </Button>
                                
                                {reservation.status !== 'cancelled' && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="text-red-500 border-red-200 hover:bg-red-50"
                                    onClick={() => handleDeleteReservation(reservation.id)}
                                  >
                                    {t('Cancel')}
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <AlertCircle className="mx-auto h-10 w-10 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">{t('NoReservations')}</h3>
                  <p className="text-gray-500 mb-6">{t('NoReservationsDescription')}</p>
                  <Button 
                    className="bg-brasil-green hover:bg-green-700 text-white"
                    onClick={() => setIsCreatingReservation(true)}
                  >
                    {t('MakeYourFirstReservation')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </CustomerLayout>
  );
  
  // Renderizar o conteúdo da página baseado no estado atual
  const renderPageContent = () => (
    <div className="container max-w-7xl mx-auto py-6 space-y-8">
      {isCreatingReservation ? renderReservationStep() : renderReservationsList()}
    </div>
  );
  
  // Modal de pagamento
  return (
    <>
      <CustomerLayout>
        {/* Conteúdo principal da página */}
        {renderPageContent()}
      </CustomerLayout>
      
      {/* Modal de formulário de cartão */}
      <CardDetailsForm
        open={showCardForm}
        onOpenChange={setShowCardForm}
        onSubmit={handleCardFormSubmit}
      />
      
      {/* Modal de formulário MBWay */}
      <MBWayForm
        open={showMBWayForm}
        onOpenChange={setShowMBWayForm}
        onSubmit={handleMBWayFormSubmit}
        defaultPhone={user?.phone || ''}
      />
      
      {/* Modal de pagamento */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('PaymentInformation')}</DialogTitle>
            <DialogDescription>
              {reservationData.paymentMethod === 'multibanco' && t('MultibancoPaymentDescription')}
              {reservationData.paymentMethod === 'mbway' && t('MBWayPaymentDescription')}
              {reservationData.paymentMethod === 'card' && t('CardPaymentDescription')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 my-4">
            {/* Detalhes de pagamento Multibanco */}
            {reservationData.paymentMethod === 'multibanco' && reservationData.paymentDetails && (
              <div className="space-y-4">
                {/* Contador regressivo */}
                {reservationData.paymentDetails.expirationDate && (
                  <CountdownTimer 
                    expirationDate={reservationData.paymentDetails.expirationDate}
                    reference={reservationData.paymentDetails.reference}
                    onExpire={() => setPaymentModalOpen(false)}
                  />
                )}
                
                {/* Status do pagamento */}
                <div className="text-center mb-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    {t('Pending')}
                  </span>
                </div>
                
                {/* QR Code e Código de barras */}
                <QRCodeDisplay 
                  entity={reservationData.paymentDetails.entity || '12345'}
                  reference={reservationData.paymentDetails.reference || '123 456 789'}
                  amount={Number(reservationData.total || 0)}
                />
                
                {/* Informações de pagamento */}
                <div className="flex justify-between">
                  <span className="font-medium">{t('Entity')}:</span>
                  <span className="font-bold">{reservationData.paymentDetails.entity || '12345'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">{t('Reference')}:</span>
                  <span className="font-bold">{reservationData.paymentDetails.reference || '123 456 789'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">{t('Amount')}:</span>
                  <span className="font-bold">€{Number(reservationData.total || 0).toLocaleString('pt-PT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
              </div>
            )}
            
            {/* Detalhes de pagamento MBWay */}
            {reservationData.paymentMethod === 'mbway' && reservationData.paymentDetails && (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="font-medium">{t('PhoneNumber')}:</span>
                  <span className="font-bold">{reservationData.paymentDetails.phone || user?.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">{t('Amount')}:</span>
                  <span className="font-bold">€{Number(reservationData.total || 0).toLocaleString('pt-PT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                <div className="text-center text-sm text-gray-600 mt-2">
                  {t('CheckYourPhoneForMBWayNotification')}
                </div>
              </div>
            )}
            
            {/* Detalhes de pagamento com Cartão */}
            {reservationData.paymentMethod === 'card' && reservationData.paymentDetails && (
              <div className="space-y-4 text-center">
                <div className="text-sm text-gray-600">
                  {t('RedirectedToPaymentPage')}
                </div>
                {reservationData.paymentUrl && (
                  <Button
                    className="w-full bg-brasil-blue hover:bg-blue-700"
                    onClick={() => window.open(reservationData.paymentUrl, '_blank')}
                  >
                    {t('OpenPaymentPage')}
                  </Button>
                )}
              </div>
            )}
          </div>
          
          <DialogFooter className="flex sm:justify-between">
            <Button 
              variant="outline" 
              onClick={() => setPaymentModalOpen(false)}
            >
              {t('Cancel')}
            </Button>
            <Button 
              className="bg-brasil-green hover:bg-green-700 text-white"
              onClick={handlePaymentCompleted}
            >
              {t('ConfirmPayment')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Reservations;