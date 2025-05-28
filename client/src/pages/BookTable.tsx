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
  const [activeCategory, setActiveCategory] = useState('entradas');

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

  // Dados do menu por categoria (em euros)
  const menuData = {
    entradas: [
      {
        id: 1,
        name: 'Empada de Frango',
        price: 12.50,
        description: 'Clássica empada cremosa, massa leve e recheio suculento.',
        image: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/food/empada.jpg'
      },
      {
        id: 2,
        name: 'Bolinho de Bacalhau (6un)',
        price: 18.00,
        description: 'Tradicionais bolinhos de bacalhau fritos, crocantes e saborosos.',
        image: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/food/bolinho-bacalhau.jpg'
      }
    ],
    principais: [
      {
        id: 3,
        name: 'Moqueca de Camarão',
        price: 65.90,
        description: 'Deliciosa moqueca com camarões frescos.',
        image: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/14db3df368-c5ada7c592c7a6a484df.png'
      },
      {
        id: 4,
        name: 'Picanha Grelhada',
        price: 75.00,
        description: 'Suculenta picanha grelhada com acompanhamentos.',
        image: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/food/picanha.jpg'
      }
    ],
    sobremesas: [
      {
        id: 5,
        name: 'Pudim de Leite',
        price: 8.50,
        description: 'Tradicional pudim de leite condensado.',
        image: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/food/pudim.jpg'
      },
      {
        id: 6,
        name: 'Brigadeiro Gourmet',
        price: 15.00,
        description: 'Brigadeiros artesanais com diversos sabores.',
        image: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/food/brigadeiro.jpg'
      }
    ],
    bebidas: [
      {
        id: 7,
        name: 'Caipirinha',
        price: 12.00,
        description: 'Tradicional caipirinha brasileira.',
        image: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/food/caipirinha.jpg'
      },
      {
        id: 8,
        name: 'Suco Natural',
        price: 6.50,
        description: 'Suco natural de frutas da estação.',
        image: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/food/suco.jpg'
      }
    ]
  };

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

  const total = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

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
                    Selecione os Pratos do Cardápio
                  </h2>
                  
                  {/* Navegação por categorias */}
                  <nav className="flex flex-wrap gap-4 mb-8">
                    {Object.entries(menuData).map(([category, items]) => (
                      <Button
                        key={category}
                        type="button"
                        onClick={() => setActiveCategory(category)}
                        className={`px-5 py-2 rounded-lg font-bold shadow transition ${
                          activeCategory === category
                            ? 'bg-brasil-green text-white'
                            : 'bg-gray-100 text-brasil-blue hover:bg-brasil-yellow hover:text-brasil-blue'
                        }`}
                      >
                        {category === 'entradas' && 'Entradas'}
                        {category === 'principais' && 'Pratos Principais'}
                        {category === 'sobremesas' && 'Sobremesas'}
                        {category === 'bebidas' && 'Bebidas'}
                      </Button>
                    ))}
                  </nav>

                  {/* Lista de itens da categoria ativa */}
                  <div className="flex-1 mb-8">
                    <h3 className="text-lg font-bold font-montserrat text-brasil-green mb-4 flex items-center gap-2">
                      {activeCategory === 'entradas' && <><i className="fa-solid fa-seedling"></i> Entradas</>}
                      {activeCategory === 'principais' && <><i className="fa-solid fa-drumstick-bite"></i> Pratos Principais</>}
                      {activeCategory === 'sobremesas' && <><i className="fa-solid fa-ice-cream"></i> Sobremesas</>}
                      {activeCategory === 'bebidas' && <><i className="fa-solid fa-wine-glass"></i> Bebidas</>}
                    </h3>
                    
                    <div className="grid sm:grid-cols-2 gap-5 mb-6">
                      {menuData[activeCategory as keyof typeof menuData]?.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white rounded-xl p-4 flex gap-4 items-center shadow border-2 border-transparent hover:border-brasil-green transition group"
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-16 rounded-lg object-cover border-2 border-gray-100 group-hover:scale-105 transition"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-gray-800">{item.name}</span>
                              <span className="font-bold text-brasil-green">€{item.price.toFixed(2)}</span>
                            </div>
                            <p className="text-xs text-gray-600">{item.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              {selectedItems.find(selected => selected.id === item.id) ? (
                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateQuantity(item.id, (selectedItems.find(s => s.id === item.id)?.quantity || 1) - 1)}
                                    className="h-6 w-6 p-0"
                                  >
                                    -
                                  </Button>
                                  <span className="text-sm font-bold min-w-[20px] text-center">
                                    {selectedItems.find(s => s.id === item.id)?.quantity || 0}
                                  </span>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateQuantity(item.id, (selectedItems.find(s => s.id === item.id)?.quantity || 0) + 1)}
                                    className="h-6 w-6 p-0"
                                  >
                                    +
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  type="button"
                                  onClick={() => addMenuItem(item)}
                                  className="bg-brasil-yellow px-3 py-1 rounded-lg text-brasil-blue text-xs font-bold hover:bg-brasil-yellow/90"
                                >
                                  <i className="fa-solid fa-plus mr-1"></i>
                                  Adicionar
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Resumo dos itens selecionados */}
                  {selectedItems.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <h4 className="font-bold text-gray-800 mb-3">Itens Selecionados:</h4>
                      <div className="space-y-2 mb-3">
                        {selectedItems.map((item) => (
                          <div key={item.id} className="flex justify-between items-center text-sm">
                            <span>{item.name} x{item.quantity}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">€{(item.price * item.quantity).toFixed(2)}</span>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => removeMenuItem(item.id)}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              >
                                ×
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between items-center font-bold">
                          <span>Total:</span>
                          <span className="text-brasil-green">€{total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between mt-auto">
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
                  <h2 className="mb-6 text-xl font-bold font-montserrat text-brasil-blue">Resumo da Reserva</h2>
                  
                  <div className="space-y-4 mb-8">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p><strong>Data:</strong> {form.watch('date')}</p>
                      <p><strong>Horário:</strong> {form.watch('time')}</p>
                      <p><strong>Pessoas:</strong> {form.watch('party_size')}</p>
                      <p><strong>Mesa:</strong> {availableTables.find((t: any) => t.id === form.watch('table_id'))?.number || 'N/A'}</p>
                      {form.watch('special_requests') && (
                        <p><strong>Observações:</strong> {form.watch('special_requests')}</p>
                      )}
                    </div>
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