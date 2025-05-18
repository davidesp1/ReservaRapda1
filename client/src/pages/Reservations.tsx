import React, { useState, useEffect } from 'react';
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
  Trash2
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import CustomerLayout from '@/components/layouts/CustomerLayout';

// Status de reserva
type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

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
  paymentStatus?: 'pending' | 'paid' | 'failed';
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
  const [reservationData, setReservationData] = useState<ReservationData>({
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
  
  // Fetch available tables for the selected date and party size
  const { data: availableTables, isLoading: tablesLoading, refetch: refetchTables } = useQuery<any[]>({
    queryKey: ['/api/tables/available', { date: selectedDate?.toISOString(), partySize }],
    queryFn: async ({ queryKey }) => {
      const [_, params] = queryKey;
      const { date, partySize } = params as { date?: string; partySize: number };
      
      if (!date) {
        return [];
      }
      
      const response = await apiRequest(
        'GET', 
        `/api/tables/available?date=${encodeURIComponent(date)}&partySize=${partySize}`
      );
      
      return response.json();
    },
    enabled: !!selectedDate && partySize > 0 && isAuthenticated && isCreatingReservation,
  });
  
  // Fetch menu items
  const { data: menuItems, isLoading: menuItemsLoading } = useQuery({
    queryKey: ['/api/menu-items'],
    enabled: !!isAuthenticated && currentStep === 2,
  });
  
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
    setSelectedDate(date);
    step1Form.setValue('date', date as Date);
  };
  
  // Quando o tamanho do grupo muda no formulário
  const onPartySizeChange = (value: string) => {
    const size = parseInt(value);
    setPartySize(size);
    step1Form.setValue('partySize', size);
  };
  
  // Atualiza as mesas disponíveis quando a data ou o tamanho do grupo mudam
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
  
  // Submeter etapa 3 - Pagamento
  const submitStep3 = (paymentMethod: string) => {
    setReservationData(prev => ({
      ...prev,
      paymentMethod,
      paymentStatus: 'paid', // Simulando um pagamento bem-sucedido
      confirmationCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
    }));
    
    // Avançar para a etapa final
    setCurrentStep(4);
  };
  
  // Criar reserva mutation
  const createReservationMutation = useMutation({
    mutationFn: async (data: ReservationData) => {
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
    
    createReservationMutation.mutate(submitData as any);
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
  
  return (
    <CustomerLayout title={t('MakeReservation')}>
      {/* Título não aparece no mobile - já está no cabeçalho */}
      <h1 className="text-3xl font-montserrat font-bold mb-6 md:block hidden">
        {t('MakeReservation')}
      </h1>
          
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-md">
          <CardHeader className="md:pb-6 pb-3">
            <CardTitle className="md:text-xl text-lg">{t('ReservationDetails')}</CardTitle>
            <CardDescription className="md:text-base text-sm">{t('PleaseSelectDateAndPartySize')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...step1Form}>
              <form onSubmit={step1Form.handleSubmit(onSubmitStep1)} className="space-y-4 md:space-y-6">
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
                            <Select onValueChange={field.onChange} value={field.value}>
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
            
            <Card className="shadow-md">
              <CardHeader className="md:pb-6 pb-3">
                <CardTitle className="md:text-xl text-lg">{t('ReservationInformation')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Informações do evento - layout aprimorado para mobile */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h3 className="font-semibold mb-3 text-brasil-blue">{t('EventDetails')}</h3>
                  <div className="flex items-center mb-3">
                    <div className="bg-brasil-blue/10 p-2 rounded-full mr-3 flex-shrink-0">
                      <i className="fas fa-calendar-alt text-brasil-blue"></i>
                    </div>
                    <p className="text-sm text-gray-600">29/05/2025 - 01/06/2025</p>
                  </div>
                  <div className="flex items-center mb-3">
                    <div className="bg-brasil-blue/10 p-2 rounded-full mr-3 flex-shrink-0">
                      <i className="fas fa-clock text-brasil-blue"></i>
                    </div>
                    <p className="text-sm text-gray-600">11:00 às 22:00</p>
                  </div>
                  <div className="flex items-center">
                    <div className="bg-brasil-blue/10 p-2 rounded-full mr-3 flex-shrink-0">
                      <i className="fas fa-map-marker-alt text-brasil-blue"></i>
                    </div>
                    <p className="text-sm text-gray-600">Centro de Eventos MSBN, Santa Iria</p>
                  </div>
                </div>
                
                {/* Informações importantes - design adaptado para mobile */}
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h3 className="font-semibold text-yellow-800 mb-3 flex items-center">
                    <div className="bg-yellow-100 p-1.5 rounded-full mr-2 flex-shrink-0">
                      <i className="fas fa-exclamation-circle text-yellow-600"></i>
                    </div>
                    <span>{t('ImportantInformation')}</span>
                  </h3>
                  <ul className="text-sm text-yellow-700 space-y-2 pl-2">
                    <li className="flex items-start">
                      <div className="bg-yellow-100 p-1 rounded-full mr-2 mt-0.5 flex-shrink-0">
                        <i className="fas fa-info text-yellow-600 text-xs"></i>
                      </div>
                      <span>{t('CancellationPolicy', { hours: 72 })}</span>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-yellow-100 p-1 rounded-full mr-2 mt-0.5 flex-shrink-0">
                        <i className="fas fa-info text-yellow-600 text-xs"></i>
                      </div>
                      <span>{t('PleaseArriveOnTime', { minutes: 15 })}</span>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-yellow-100 p-1 rounded-full mr-2 mt-0.5 flex-shrink-0">
                        <i className="fas fa-info text-yellow-600 text-xs"></i>
                      </div>
                      <span>{t('MaxDuration', { hours: 2 })}</span>
                    </li>
                  </ul>
                </div>
                
                {/* Informações de contato - redesenhado para mobile */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h3 className="font-semibold mb-3 text-brasil-green">{t('ContactInformation')}</h3>
                  <div className="flex items-center mb-3">
                    <div className="bg-brasil-green/10 p-2 rounded-full mr-3 flex-shrink-0">
                      <i className="fas fa-phone-alt text-brasil-green"></i>
                    </div>
                    <a href="tel:+351912345678" className="text-sm text-gray-600 hover:text-brasil-green">
                      +351 912 345 678
                    </a>
                  </div>
                  <div className="flex items-center">
                    <div className="bg-brasil-green/10 p-2 rounded-full mr-3 flex-shrink-0">
                      <i className="fas fa-envelope text-brasil-green"></i>
                    </div>
                    <a href="mailto:reservas@opaquedelicia.pt" className="text-sm text-gray-600 hover:text-brasil-green">
                      reservas@opaquedelicia.pt
                    </a>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 border-t">
                <p className="text-sm text-gray-600 italic flex items-start">
                  <i className="fas fa-info-circle mr-2 text-gray-400 mt-1 flex-shrink-0"></i>
                  <span>{t('ReservationNote')}</span>
                </p>
              </CardFooter>
            </Card>
          </div>
    </CustomerLayout>
  );
};

export default Reservations;
