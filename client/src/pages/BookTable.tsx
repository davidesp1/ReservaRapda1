import { useState } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import CustomerLayout from '@/components/layouts/CustomerLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ArrowRight, ArrowLeft, Calendar, Clock, Utensils, CreditCard, Check } from 'lucide-react';

// Schema de validação para a reserva
const reservationSchema = z.object({
  date: z.string().min(1, "Data é obrigatória"),
  time: z.string().min(1, "Horário é obrigatório"),
  party_size: z.number().min(1, "Número de pessoas deve ser pelo menos 1").max(20, "Máximo 20 pessoas"),
  table_id: z.number().min(1, "Mesa é obrigatória"),
  special_requests: z.string().optional(),
});

type ReservationForm = z.infer<typeof reservationSchema>;

export default function BookTable() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);

  // Form setup
  const form = useForm<ReservationForm>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      date: '',
      time: '',
      party_size: 2,
      table_id: 1,
      special_requests: '',
    },
  });

  // Buscar mesas disponíveis
  const { data: availableTables = [] } = useQuery<any[]>({
    queryKey: ['/api/tables'],
  });

  // Buscar itens do menu
  const { data: menuItems = [] } = useQuery<any[]>({
    queryKey: ['/api/menu'],
  });

  // Mutation para criar reserva
  const createReservationMutation = useMutation({
    mutationFn: async (data: ReservationForm) => {
      const fullDateTime = `${data.date} ${data.time}`;
      
      const response = await apiRequest('POST', '/api/reservations', {
        date: fullDateTime,
        tableId: data.table_id,
        partySize: data.party_size,
        notes: data.special_requests || '',
        status: 'confirmed',
        paymentMethod: 'multibanco',
        paymentStatus: 'pending',
        total: selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
        duration: 120
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Reserva Criada!",
        description: "Sua reserva foi criada com sucesso. Você receberá uma confirmação em breve.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
      setLocation('/reservations');
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao Criar Reserva",
        description: error.message || "Ocorreu um erro ao criar a reserva. Tente novamente.",
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ReservationForm) => {
    createReservationMutation.mutate(data);
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addMenuItem = (item: any) => {
    const existingItem = selectedItems.find(selected => selected.id === item.id);
    if (existingItem) {
      setSelectedItems(selectedItems.map(selected => 
        selected.id === item.id 
          ? { ...selected, quantity: selected.quantity + 1 }
          : selected
      ));
    } else {
      setSelectedItems([...selectedItems, { ...item, quantity: 1 }]);
    }
  };

  // Organizar itens do menu por categoria
  const getItemsByCategory = (category: string) => {
    return menuItems.filter((item: any) => item.category === category);
  };

  // Converter preço para euros
  const formatPrice = (price: number) => {
    return `€ ${(price / 100).toFixed(2)}`;
  };

  const removeMenuItem = (itemId: number) => {
    setSelectedItems(selectedItems.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: number, quantity: number) => {
    if (quantity === 0) {
      removeMenuItem(itemId);
    } else {
      setSelectedItems(selectedItems.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      ));
    }
  };

  const total = selectedItems.reduce((sum, item) => sum + (item.price / 100) * item.quantity, 0);

  const getStepColor = (step: number) => {
    if (step === 1) return currentStep >= step ? 'brasil-green' : 'gray-300';
    if (step === 2) return currentStep >= step ? 'brasil-yellow' : 'gray-300';
    if (step === 3) return currentStep >= step ? 'brasil-blue' : 'gray-300';
    if (step === 4) return currentStep >= step ? 'brasil-red' : 'gray-300';
    return 'gray-300';
  };

  return (
    <CustomerLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-800 font-montserrat">Nova Reserva</h1>
          <Button
            variant="outline"
            onClick={() => setLocation('/reservations')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar às Reservas
          </Button>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`flex items-center justify-center w-10 h-10 text-lg font-bold rounded-full border-4 ${currentStep >= 1 ? 'bg-brasil-green border-brasil-green text-white' : 'bg-white border-gray-300 text-gray-300'}`}>
                {currentStep > 1 ? <Check className="h-5 w-5" /> : '1'}
              </div>
              <span className={`mt-2 text-xs font-bold tracking-wide uppercase ${currentStep >= 1 ? 'text-brasil-green' : 'text-gray-300'}`}>
                Data e Hora
              </span>
            </div>
            <div className={`flex-1 h-1 mx-2 ${currentStep > 1 ? 'bg-brasil-green' : 'bg-gray-300'}`}></div>
          </div>

          <div className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`flex items-center justify-center w-10 h-10 text-lg font-bold rounded-full border-4 ${currentStep >= 2 ? 'bg-brasil-yellow border-brasil-yellow text-brasil-blue' : 'bg-white border-gray-300 text-gray-300'}`}>
                {currentStep > 2 ? <Check className="h-5 w-5" /> : '2'}
              </div>
              <span className={`mt-2 text-xs font-bold tracking-wide uppercase ${currentStep >= 2 ? 'text-brasil-yellow' : 'text-gray-300'}`}>
                Menu
              </span>
            </div>
            <div className={`flex-1 h-1 mx-2 ${currentStep > 2 ? 'bg-brasil-yellow' : 'bg-gray-300'}`}></div>
          </div>

          <div className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`flex items-center justify-center w-10 h-10 text-lg font-bold rounded-full border-4 ${currentStep >= 3 ? 'bg-brasil-blue border-brasil-blue text-white' : 'bg-white border-gray-300 text-gray-300'}`}>
                {currentStep > 3 ? <Check className="h-5 w-5" /> : '3'}
              </div>
              <span className={`mt-2 text-xs font-bold tracking-wide uppercase ${currentStep >= 3 ? 'text-brasil-blue' : 'text-gray-300'}`}>
                Resumo
              </span>
            </div>
            <div className={`flex-1 h-1 mx-2 ${currentStep > 3 ? 'bg-brasil-blue' : 'bg-gray-300'}`}></div>
          </div>

          <div className="flex flex-col items-center">
            <div className={`flex items-center justify-center w-10 h-10 text-lg font-bold rounded-full border-4 ${currentStep >= 4 ? 'bg-brasil-red border-brasil-red text-white' : 'bg-white border-gray-300 text-gray-300'}`}>
              4
            </div>
            <span className={`mt-2 text-xs font-bold tracking-wide uppercase ${currentStep >= 4 ? 'text-brasil-red' : 'text-gray-300'}`}>
              Pagamento
            </span>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-lg p-8 flex-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col">
              
              {/* Step 1: Data e Hora */}
              {currentStep === 1 && (
                <div className="flex-1">
                  <h2 className="mb-6 text-xl font-bold font-montserrat text-brasil-green flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Escolha Data, Hora e Adicione Observações
                  </h2>
                  
                  <div className="grid gap-6 md:grid-cols-2 mb-6">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-gray-700">Data da Reserva</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              min={new Date().toISOString().split('T')[0]}
                              className="border-2 border-brasil-green focus:ring-brasil-green"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-gray-700">Horário</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger className="border-2 border-brasil-green focus:ring-brasil-green">
                                <SelectValue placeholder="Selecione o horário" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="12:00">12:00</SelectItem>
                                <SelectItem value="12:30">12:30</SelectItem>
                                <SelectItem value="13:00">13:00</SelectItem>
                                <SelectItem value="13:30">13:30</SelectItem>
                                <SelectItem value="18:00">18:00</SelectItem>
                                <SelectItem value="18:30">18:30</SelectItem>
                                <SelectItem value="19:00">19:00</SelectItem>
                                <SelectItem value="19:30">19:30</SelectItem>
                                <SelectItem value="20:00">20:00</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-6 md:grid-cols-2 mb-8">
                    <FormField
                      control={form.control}
                      name="party_size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-gray-700">Número de Pessoas</FormLabel>
                          <FormControl>
                            <Select 
                              onValueChange={(value) => field.onChange(parseInt(value))} 
                              defaultValue={field.value?.toString()}
                            >
                              <SelectTrigger className="border-2 border-brasil-green focus:ring-brasil-green">
                                <SelectValue placeholder="Quantas pessoas?" />
                              </SelectTrigger>
                              <SelectContent>
                                {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].map(num => (
                                  <SelectItem key={num} value={num.toString()}>
                                    {num} {num === 1 ? 'pessoa' : 'pessoas'}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="table_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-gray-700">Mesa</FormLabel>
                          <FormControl>
                            <Select 
                              onValueChange={(value) => field.onChange(parseInt(value))} 
                              defaultValue={field.value?.toString()}
                            >
                              <SelectTrigger className="border-2 border-brasil-green focus:ring-brasil-green">
                                <SelectValue placeholder="Escolha a mesa" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableTables.map((table: any) => (
                                  <SelectItem key={table.id} value={table.id.toString()}>
                                    Mesa {table.number} ({table.capacity} lugares)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="special_requests"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-gray-700">
                          Observações <span className="text-xs text-gray-400">(opcional)</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Ex: Deixe nos saber de suas observações."
                            className="border-2 border-brasil-green focus:ring-brasil-green resize-none"
                            rows={3}
                            maxLength={200}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end mt-10">
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="flex items-center px-8 py-3 text-lg font-bold text-white bg-brasil-green hover:bg-brasil-green/90"
                    >
                      Próximo
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Menu */}
              {currentStep === 2 && (
                <div className="flex-1 flex flex-col">
                  <h2 className="mb-6 text-xl font-bold font-montserrat text-brasil-yellow flex items-center gap-2">
                    <Utensils className="h-5 w-5" />
                    Selecione os Pratos
                  </h2>
                  
                  <div className="flex gap-8 flex-1">
                    {/* Menu Categories and Items */}
                    <div className="flex-1">
                      {/* Category Navigation */}
                      <nav className="flex flex-wrap gap-4 mb-6">
                        <button className="px-5 py-2 rounded-lg font-bold bg-brasil-green text-white shadow hover:bg-green-700 transition">
                          Entradas
                        </button>
                        <button className="px-5 py-2 rounded-lg font-bold bg-gray-100 text-brasil-blue shadow hover:bg-brasil-yellow hover:text-brasil-blue transition">
                          Pratos Principais
                        </button>
                        <button className="px-5 py-2 rounded-lg font-bold bg-gray-100 text-brasil-blue shadow hover:bg-brasil-yellow hover:text-brasil-blue transition">
                          Sobremesas
                        </button>
                        <button className="px-5 py-2 rounded-lg font-bold bg-gray-100 text-brasil-blue shadow hover:bg-brasil-yellow hover:text-brasil-blue transition">
                          Bebidas
                        </button>
                      </nav>

                      {/* Menu Items Grid */}
                      <div className="space-y-6">
                        {['entradas', 'principais', 'sobremesas', 'bebidas'].map((category) => {
                          const categoryItems = getItemsByCategory(category);
                          if (categoryItems.length === 0) return null;

                          const categoryConfig = {
                            entradas: { name: 'Entradas', icon: 'fa-seedling' },
                            principais: { name: 'Pratos Principais', icon: 'fa-drumstick-bite' },
                            sobremesas: { name: 'Sobremesas', icon: 'fa-ice-cream' },
                            bebidas: { name: 'Bebidas', icon: 'fa-glass-water' }
                          };

                          return (
                            <div key={category}>
                              <h3 className="text-lg font-bold font-montserrat text-brasil-green mb-3 flex items-center gap-2">
                                <i className={`fas ${categoryConfig[category as keyof typeof categoryConfig].icon}`}></i> 
                                {categoryConfig[category as keyof typeof categoryConfig].name}
                              </h3>
                              <div className="grid gap-4">
                                {categoryItems.map((item: any) => (
                                  <div key={item.id} className="bg-white rounded-xl p-3 flex gap-4 items-center shadow border-2 border-transparent hover:border-brasil-green transition group">
                                    <img 
                                      src={item.image || 'https://storage.googleapis.com/uxpilot-auth.appspot.com/food/default.jpg'} 
                                      alt={item.name} 
                                      className="w-14 h-14 rounded-lg object-cover border-2 border-gray-100 group-hover:scale-105 transition"
                                    />
                                    <div className="flex-1">
                                      <div className="flex justify-between items-center">
                                        <span className="font-bold text-gray-800">{item.name}</span>
                                        <span className="font-bold text-brasil-green">{formatPrice(item.price)}</span>
                                      </div>
                                      <p className="text-xs text-gray-600 mt-1">{item.description || 'Delicioso prato do nosso restaurante.'}</p>
                                    </div>
                                    <button 
                                      onClick={() => addMenuItem(item)}
                                      className="ml-3 bg-brasil-yellow px-2.5 py-1.5 rounded-lg text-brasil-blue text-xs font-bold hover:bg-brasil-yellow/90 transition"
                                    >
                                      <i className="fas fa-plus"></i>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}

                        {menuItems.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <i className="fas fa-utensils text-3xl text-gray-300 mb-3"></i>
                            <p>Carregando cardápio...</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Cart Sidebar */}
                    <div className="w-80 bg-white rounded-xl shadow-lg p-6 h-fit">
                      <h3 className="text-lg font-bold text-brasil-blue mb-4 flex items-center gap-2">
                        <i className="fas fa-shopping-cart"></i>
                        Pedido ({selectedItems.length} {selectedItems.length === 1 ? 'item' : 'itens'})
                      </h3>

                      {selectedItems.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <i className="fas fa-utensils text-3xl text-gray-300 mb-3"></i>
                          <p>Nenhum item selecionado</p>
                          <p className="text-sm">Adicione pratos do cardápio</p>
                        </div>
                      ) : (
                        <div className="space-y-3 mb-4">
                          {selectedItems.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm">{item.name}</h4>
                                <p className="text-brasil-green font-bold">{formatPrice(item.price)}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition"
                                >
                                  <i className="fas fa-minus text-xs"></i>
                                </button>
                                <span className="w-8 text-center font-semibold">{item.quantity}</span>
                                <button 
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="w-6 h-6 bg-brasil-yellow rounded-full flex items-center justify-center hover:bg-brasil-yellow/90 transition"
                                >
                                  <i className="fas fa-plus text-xs text-brasil-blue"></i>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {selectedItems.length > 0 && (
                        <div className="border-t pt-4">
                          <div className="flex justify-between items-center font-bold text-lg">
                            <span>Total:</span>
                            <span className="text-brasil-green">€ {total.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between mt-8 pt-6 border-t">
                    <Button
                      type="button"
                      onClick={prevStep}
                      variant="outline"
                      className="flex items-center px-8 py-3 text-lg font-bold"
                    >
                      <ArrowLeft className="mr-2 h-5 w-5" />
                      Anterior
                    </Button>
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="flex items-center px-8 py-3 text-lg font-bold text-brasil-blue bg-brasil-yellow hover:bg-brasil-yellow/90"
                    >
                      Próximo
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Resumo */}
              {currentStep === 3 && (
                <div className="flex-1">
                  <h2 className="mb-6 text-xl font-bold font-montserrat text-brasil-blue flex items-center gap-2">
                    <i className="fas fa-clipboard-list"></i>
                    Resumo da Reserva
                  </h2>
                  
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Informações da Reserva */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="font-bold text-lg text-brasil-blue mb-4 flex items-center gap-2">
                        <i className="fas fa-calendar-check"></i>
                        Detalhes da Reserva
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="font-medium">Data:</span>
                          <span>{form.watch('date') ? new Date(form.watch('date')).toLocaleDateString('pt-BR') : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Horário:</span>
                          <span>{form.watch('time') || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Pessoas:</span>
                          <span>{form.watch('party_size')} {form.watch('party_size') === 1 ? 'pessoa' : 'pessoas'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Mesa:</span>
                          <span>Mesa {availableTables.find((t: any) => t.id === form.watch('table_id'))?.number || 'N/A'}</span>
                        </div>
                        {form.watch('special_requests') && (
                          <div className="pt-3 border-t">
                            <span className="font-medium">Observações:</span>
                            <p className="text-sm text-gray-600 mt-1">{form.watch('special_requests')}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Itens do Pedido */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="font-bold text-lg text-brasil-blue mb-4 flex items-center gap-2">
                        <i className="fas fa-utensils"></i>
                        Pedido ({selectedItems.length} {selectedItems.length === 1 ? 'item' : 'itens'})
                      </h3>
                      
                      {selectedItems.length === 0 ? (
                        <div className="text-center py-6 text-gray-500">
                          <i className="fas fa-plate-wheat text-2xl text-gray-300 mb-2"></i>
                          <p>Nenhum item selecionado</p>
                          <p className="text-sm">Volte para adicionar pratos</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {selectedItems.map((item) => (
                            <div key={item.id} className="flex justify-between items-center p-3 bg-white rounded-lg">
                              <div>
                                <h4 className="font-semibold text-sm">{item.name}</h4>
                                <p className="text-xs text-gray-600">Qtd: {item.quantity}</p>
                              </div>
                              <span className="font-bold text-brasil-green">
                                € {((item.price / 100) * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                          
                          <div className="border-t pt-3 mt-4">
                            <div className="flex justify-between items-center font-bold text-lg">
                              <span>Total do Pedido:</span>
                              <span className="text-brasil-green">€ {total.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Total Geral */}
                  <div className="mt-8 p-6 bg-brasil-blue/10 rounded-lg border-2 border-brasil-blue/20">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-xl font-bold text-brasil-blue">Total da Reserva</h3>
                        <p className="text-sm text-gray-600">
                          {selectedItems.length > 0 ? 'Inclui taxa de mesa e pedido' : 'Apenas reserva da mesa'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-brasil-green">
                          € {total.toFixed(2)}
                        </div>
                        <p className="text-sm text-gray-600">
                          {selectedItems.length > 0 ? 'Pagamento no restaurante' : 'Reserva gratuita'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between mt-8">
                    <Button
                      type="button"
                      onClick={prevStep}
                      variant="outline"
                      className="flex items-center px-8 py-3 text-lg font-bold"
                    >
                      <ArrowLeft className="mr-2 h-5 w-5" />
                      Anterior
                    </Button>
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="flex items-center px-8 py-3 text-lg font-bold text-white bg-brasil-blue hover:bg-brasil-blue/90"
                    >
                      Finalizar
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: Pagamento */}
              {currentStep === 4 && (
                <div className="flex-1">
                  <h2 className="mb-6 text-xl font-bold font-montserrat text-brasil-red flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Confirmação Final
                  </h2>
                  
                  <div className="text-center py-8">
                    <p className="text-lg mb-6">Sua reserva está pronta para ser confirmada!</p>
                    <p className="text-gray-600 mb-8">
                      Clique em "Confirmar Reserva" para finalizar o processo.
                    </p>
                  </div>

                  <div className="flex justify-between mt-10">
                    <Button
                      type="button"
                      onClick={prevStep}
                      variant="outline"
                      className="flex items-center px-8 py-3 text-lg font-bold"
                    >
                      <ArrowLeft className="mr-2 h-5 w-5" />
                      Anterior
                    </Button>
                    <Button
                      type="submit"
                      disabled={createReservationMutation.isPending}
                      className="flex items-center px-8 py-3 text-lg font-bold text-white bg-brasil-red hover:bg-brasil-red/90"
                    >
                      {createReservationMutation.isPending ? (
                        <>
                          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          Criando...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-5 w-5" />
                          Confirmar Reserva
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

            </form>
          </Form>
        </div>
      </div>
    </CustomerLayout>
  );
}