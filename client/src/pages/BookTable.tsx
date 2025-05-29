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
import { ArrowRight, ArrowLeft, Calendar, Clock, Utensils, CreditCard, Check, Plus } from 'lucide-react';

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
  const [activeCategory, setActiveCategory] = useState<string>('');

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

  // Buscar categorias do menu
  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ['/api/menu-categories'],
  });

  // Buscar itens do menu organizados por categoria
  const { data: menuByCategory = [] } = useQuery<any[]>({
    queryKey: ['/api/menu-items'],
  });

  // Mutation para finalizar reserva
  const finalizeReservationMutation = useMutation({
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
        total: selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        duration: 120,
        selectedItems: selectedItems // Incluir itens selecionados
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Reserva Confirmada!",
        description: "Sua reserva foi confirmada com sucesso. Você receberá uma confirmação em breve.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
      setLocation('/reservations');
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao Confirmar Reserva",
        description: error.message || "Ocorreu um erro ao confirmar a reserva. Tente novamente.",
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ReservationForm) => {
    // Só deve finalizar a reserva se estiver no step 4 (Pagamento)
    if (currentStep === 4) {
      finalizeReservationMutation.mutate(data);
    }
  };

  const nextStep = () => {
    // Validar cada step antes de prosseguir
    if (currentStep === 1) {
      // Validar dados obrigatórios do step 1
      const isValid = form.getValues('date') && form.getValues('time') && form.getValues('party_size') && form.getValues('table_id');
      if (!isValid) {
        toast({
          title: "Dados Incompletos",
          description: "Por favor, preencha todos os campos obrigatórios antes de continuar.",
          variant: 'destructive',
        });
        return;
      }
    }
    
    if (currentStep === 2) {
      // Validar se pelo menos um item foi selecionado
      if (selectedItems.length === 0) {
        toast({
          title: "Menu Não Selecionado",
          description: "Por favor, selecione pelo menos um item do menu antes de continuar.",
          variant: 'destructive',
        });
        return;
      }
    }
    
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

  // Função para obter todos os itens a partir da resposta organizada por categoria
  const getAllItems = () => {
    if (!menuByCategory) return [];
    
    // Flatmap para extrair todos os itens de todas as categorias
    return menuByCategory.flatMap((categoryData: any) => categoryData.items);
  };

  // Organizar itens do menu por categoria usando o nome da categoria
  const getItemsByCategory = (categoryName: string) => {
    if (!menuByCategory) return [];
    
    // Encontrar a categoria correspondente no menuByCategory
    const categoryData = menuByCategory.find((catData: any) => 
      catData.category?.name === categoryName
    );
    
    return categoryData ? categoryData.items : [];
  };

  // Definir primeira categoria como ativa por padrão baseado nas categorias reais
  if (categories.length > 0 && !activeCategory) {
    setActiveCategory(categories[0].name);
  }

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
                  <h2 className="mb-6 text-xl font-bold font-montserrat text-brasil-yellow">Selecione o que irá consumir</h2>
                  
                  {/* Menu Tabs */}
                  <div className="flex items-center gap-2 overflow-x-auto border-b border-gray-200 mb-7 scrollbar-hide">
                    {categories.map((category: any, index: number) => {
                      // Mapear ícones baseado no nome da categoria
                      const getIcon = (name: string) => {
                        const lowerName = name.toLowerCase();
                        if (lowerName.includes('entrada')) return 'fa-solid fa-leaf';
                        if (lowerName.includes('principal') || lowerName.includes('prato')) return 'fa-solid fa-bowl-food';
                        if (lowerName.includes('sobremesa')) return 'fa-regular fa-ice-cream';
                        if (lowerName.includes('bebida')) return 'fa-solid fa-martini-glass-citrus';
                        return 'fa-solid fa-utensils';
                      };

                      // Mapear cores baseado no nome da categoria
                      const getColor = (name: string) => {
                        const lowerName = name.toLowerCase();
                        if (lowerName.includes('entrada')) return 'brasil-green';
                        if (lowerName.includes('principal') || lowerName.includes('prato')) return 'brasil-blue';
                        if (lowerName.includes('sobremesa')) return 'brasil-yellow';
                        if (lowerName.includes('bebida')) return 'brasil-red';
                        return 'brasil-green';
                      };

                      const color = getColor(category.name);
                      const icon = getIcon(category.name);

                      return (
                        <button 
                          key={category.id}
                          className={`flex items-center gap-2 px-6 py-2 font-bold bg-white border-b-4 rounded-t-lg font-montserrat transition ${
                            activeCategory === category.name 
                              ? `text-${color} border-${color}` 
                              : `text-brasil-blue border-transparent hover:border-${color}`
                          }`}
                          onClick={() => setActiveCategory(category.name)}
                        >
                          <i className={icon}></i> {category.name}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-col gap-10 md:flex-row">
                    {/* Menu Categories Content */}
                    <div className="flex-1 min-w-[320px]">
                      <div className="space-y-0">
                        {menuByCategory.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <Utensils className="w-16 h-16 mb-4" />
                            <p className="text-lg">Carregando cardápio...</p>
                          </div>
                        ) : activeCategory && (
                          <div className="menu-category-tab">
                            {/* Category Header */}
                            <div className="flex items-center gap-2 mb-4">
                              {(() => {
                                const lowerName = activeCategory.toLowerCase();
                                let icon = 'fa-solid fa-utensils';
                                let color = 'brasil-green';
                                
                                if (lowerName.includes('entrada')) {
                                  icon = 'fa-solid fa-leaf';
                                  color = 'brasil-green';
                                } else if (lowerName.includes('principal') || lowerName.includes('prato')) {
                                  icon = 'fa-solid fa-bowl-food';
                                  color = 'brasil-blue';
                                } else if (lowerName.includes('sobremesa')) {
                                  icon = 'fa-regular fa-ice-cream';
                                  color = 'brasil-yellow';
                                } else if (lowerName.includes('bebida')) {
                                  icon = 'fa-solid fa-martini-glass-citrus';
                                  color = 'brasil-red';
                                }
                                
                                return (
                                  <>
                                    <i className={`text-xl ${icon} text-${color}`}></i>
                                    <h3 className={`text-lg font-bold uppercase font-montserrat text-${color}`}>
                                      {activeCategory}
                                    </h3>
                                  </>
                                );
                              })()}
                            </div>
                            
                            {/* Menu Items Grid */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                              {getItemsByCategory(activeCategory).map((item: any) => {
                                const categoryColor = 
                                  activeCategory === 'Entradas' ? 'brasil-green' :
                                  activeCategory === 'Pratos Principais' ? 'brasil-blue' :
                                  activeCategory === 'Sobremesas' ? 'brasil-yellow' :
                                  'brasil-red';
                                
                                return (
                                  <div 
                                    key={item.id} 
                                    className={`bg-gray-50 rounded-xl p-4 flex items-center gap-3 border-2 border-gray-100 hover:border-${categoryColor} transition group min-w-[220px] cursor-pointer hover:shadow-md transform hover:scale-[1.02]`}
                                    onClick={() => addMenuItem(item)}
                                  >
                                    <img 
                                      src={item.image_url || item.image || 'https://storage.googleapis.com/uxpilot-auth.appspot.com/food/default.jpg'} 
                                      className={`object-cover rounded-lg w-14 h-14 ring-2 ring-${categoryColor} ring-opacity-20 group-hover:ring-opacity-40`}
                                      alt={item.name}
                                    />
                                    <div className="flex-1">
                                      <h4 className="text-base font-bold text-gray-800 group-hover:text-gray-900">{item.name}</h4>
                                      <span className="block text-xs text-gray-500 group-hover:text-gray-600">{item.description || 'Delicioso prato do nosso restaurante.'}</span>
                                      <div className="flex items-center justify-between mt-1">
                                        <span className={`text-base font-bold text-${categoryColor} group-hover:text-opacity-80`}>
                                          {formatPrice(item.price)}
                                        </span>
                                        <div className="px-2 py-1 text-xs font-bold rounded-lg bg-brasil-yellow text-brasil-blue group-hover:bg-yellow-400 transition">
                                          <i className="fa-solid fa-plus"></i>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="w-full md:w-[340px] shrink-0">
                      <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-10 min-h-[320px] border-2 border-brasil-yellow">
                        <h4 className="flex items-center gap-2 mb-3 text-lg font-bold text-brasil-yellow font-montserrat">
                          <i className="fa-solid fa-clipboard-list"></i> Meu Pedido
                        </h4>
                        
                        <div className="space-y-3 min-h-[48px]">
                          {selectedItems.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              <i className="fas fa-utensils text-3xl text-gray-300 mb-3"></i>
                              <p>Nenhum item selecionado</p>
                              <p className="text-sm">Adicione pratos do cardápio</p>
                            </div>
                          ) : (
                            selectedItems.map((item) => (
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
                            ))
                          )}
                        </div>
                        
                        <hr className="my-4 border-dashed border-brasil-yellow" />
                        
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold text-gray-700">Total</span>
                          <span className="text-2xl font-extrabold text-brasil-green">€ {total.toFixed(2)}</span>
                        </div>
                        
                        <div className="flex justify-between gap-2 mt-6">
                          <button 
                            onClick={prevStep}
                            className="flex items-center justify-center w-1/2 px-5 py-3 font-bold text-gray-700 transition bg-gray-200 rounded-lg hover:bg-gray-300"
                          >
                            <i className="mr-2 fa-solid fa-arrow-left"></i>
                            Voltar
                          </button>
                          <button 
                            onClick={nextStep}
                            className="flex items-center justify-center w-1/2 py-3 text-lg font-bold transition rounded-lg shadow bg-brasil-yellow text-brasil-blue px-7 hover:bg-yellow-400"
                          >
                            Próximo
                            <i className="ml-2 fa-solid fa-arrow-right"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Resumo */}
              {currentStep === 3 && (
                <div className="flex-1">
                  <h2 className="text-xl font-bold font-montserrat text-brasil-blue mb-8 flex items-center gap-3">
                    <i className="fa-solid fa-clipboard-list text-brasil-blue"></i>
                    Resumo do Pedido
                  </h2>
                  
                  <div className="flex flex-col md:flex-row gap-9">
                    {/* Order Summary Card */}
                    <div className="flex-1">
                      <div className="bg-white rounded-2xl shadow-xl border-2 border-brasil-blue p-6 mb-7 min-h-[320px]">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-montserrat text-lg font-bold text-brasil-blue flex items-center gap-2">
                            <i className="fa-solid fa-utensils"></i> Itens Selecionados
                          </h3>
                          <button 
                            onClick={() => setCurrentStep(2)}
                            className="text-brasil-green hover:underline font-bold text-sm flex items-center gap-1"
                          >
                            <i className="fa-solid fa-pen-to-square"></i> Editar
                          </button>
                        </div>
                        
                        <div className="divide-y divide-gray-200 mb-4">
                          {selectedItems.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              <i className="fa-solid fa-utensils text-3xl text-gray-300 mb-3"></i>
                              <p>Nenhum item selecionado</p>
                              <p className="text-sm">Volte para adicionar pratos</p>
                            </div>
                          ) : (
                            selectedItems.map((item) => (
                              <div key={item.id} className="flex items-center justify-between py-3">
                                <span className="font-montserrat font-semibold text-gray-700 flex-1">
                                  {item.name} 
                                  <span className="text-xs text-gray-400 font-normal ml-2">x{item.quantity}</span>
                                </span>
                                <span className="text-gray-600 font-bold">
                                  {formatPrice(item.price * item.quantity)}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                        
                        <div className="flex justify-between mt-5 mb-0 items-center">
                          <span className="text-gray-700 font-bold text-base">Total</span>
                          <span className="text-2xl font-extrabold text-brasil-green">€ {total.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      {/* Política de Cancelamento */}
                      <div className="bg-blue-50 rounded-2xl border-l-4 border-brasil-blue px-6 py-4 flex items-start gap-4 shadow-sm mb-5">
                        <i className="fa-solid fa-circle-info text-brasil-blue text-xl mt-1"></i>
                        <div>
                          <div className="text-brasil-blue font-semibold mb-1">Política de Cancelamento</div>
                          <div className="text-gray-700 text-sm">
                            Cancelamentos até 2 horas antes do horário reservado são gratuitos. Após isso, poderá ser aplicada uma taxa. 
                            Consulte <span className="underline text-brasil-blue font-bold cursor-pointer">detalhes</span>.
                          </div>
                        </div>
                      </div>

                      {/* Detalhes da Reserva */}
                      <div className="bg-white rounded-2xl shadow-xl border-2 border-brasil-yellow p-6 mb-5">
                        <h4 className="font-montserrat text-lg font-bold text-brasil-yellow mb-4 flex items-center gap-2">
                          <i className="fa-solid fa-calendar-check text-brasil-yellow"></i> Detalhes da Reserva
                        </h4>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium text-gray-700">Data:</span>
                            <span className="font-semibold">{form.watch('date') ? new Date(form.watch('date')).toLocaleDateString('pt-BR') : 'N/A'}</span>
                          </div>
                          
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium text-gray-700">Horário:</span>
                            <span className="font-semibold">{form.watch('time') || 'N/A'}</span>
                          </div>
                          
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium text-gray-700">Pessoas:</span>
                            <span className="font-semibold">{form.watch('party_size')} {form.watch('party_size') === 1 ? 'pessoa' : 'pessoas'}</span>
                          </div>
                          
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium text-gray-700">Mesa:</span>
                            <span className="font-semibold">Mesa {availableTables.find((t: any) => t.id === form.watch('table_id'))?.number || 'N/A'}</span>
                          </div>
                          
                          {form.watch('special_requests') && (
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <span className="font-medium text-gray-700 block mb-1">Observações:</span>
                              <p className="text-sm text-gray-600">{form.watch('special_requests')}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Payment Selection Card */}
                    <div className="w-full md:w-[370px] shrink-0">
                      <div className="bg-white rounded-2xl shadow-xl border-2 border-brasil-yellow p-7 min-h-[410px] flex flex-col justify-between">
                        <div>
                          <h4 className="font-montserrat text-lg font-bold text-brasil-yellow mb-4 flex items-center gap-2">
                            <i className="fa-solid fa-lock text-brasil-yellow"></i> Selecione o método de pagamento
                          </h4>
                          
                          <div className="space-y-4">
                            <label className="flex items-center gap-4 cursor-pointer border-2 border-gray-200 rounded-xl px-4 py-3 hover:border-brasil-green transition focus-within:border-brasil-green">
                              <input type="radio" name="payment-method" value="card" className="hidden peer" defaultChecked />
                              <span className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-200 peer-checked:ring-2 peer-checked:ring-brasil-green">
                                <i className="fa-solid fa-credit-card text-brasil-green text-2xl"></i>
                              </span>
                              <span className="flex-1 text-gray-800 font-bold font-montserrat">Cartão</span>
                              <i className="fa-solid fa-check text-brasil-green opacity-0 peer-checked:opacity-100 transition"></i>
                            </label>
                            
                            <label className="flex items-center gap-4 cursor-pointer border-2 border-gray-200 rounded-xl px-4 py-3 hover:border-brasil-blue transition focus-within:border-brasil-blue">
                              <input type="radio" name="payment-method" value="multibanco" className="hidden peer" />
                              <span className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-200 peer-checked:ring-2 peer-checked:ring-brasil-blue">
                                <i className="fa-solid fa-building-columns text-brasil-blue text-2xl"></i>
                              </span>
                              <span className="flex-1 text-gray-800 font-bold font-montserrat">Multibanco</span>
                              <i className="fa-solid fa-check text-brasil-blue opacity-0 peer-checked:opacity-100 transition"></i>
                            </label>
                            
                            <label className="flex items-center gap-4 cursor-pointer border-2 border-gray-200 rounded-xl px-4 py-3 hover:border-brasil-red transition focus-within:border-brasil-red">
                              <input type="radio" name="payment-method" value="mbway" className="hidden peer" />
                              <span className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-200 peer-checked:ring-2 peer-checked:ring-brasil-red">
                                <i className="fa-solid fa-mobile-screen-button text-brasil-red text-2xl"></i>
                              </span>
                              <span className="flex-1 text-gray-800 font-bold font-montserrat">MB Way</span>
                              <i className="fa-solid fa-check text-brasil-red opacity-0 peer-checked:opacity-100 transition"></i>
                            </label>
                          </div>
                        </div>
                        
                        <div className="flex justify-between mt-9 gap-2">
                          <button 
                            onClick={prevStep}
                            className="bg-gray-200 text-gray-700 font-bold px-5 py-3 rounded-lg hover:bg-gray-300 transition flex items-center w-1/2 justify-center"
                          >
                            <i className="fa-solid fa-arrow-left mr-2"></i>
                            Voltar
                          </button>
                          <button 
                            onClick={nextStep}
                            className="bg-brasil-yellow text-brasil-blue font-bold px-7 py-3 rounded-lg shadow hover:bg-yellow-400 transition text-lg flex items-center w-1/2 justify-center"
                          >
                            Próximo
                            <i className="fa-solid fa-arrow-right ml-2"></i>
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center text-xs text-gray-500 mt-4 gap-1">
                        <i className="fa-solid fa-shield-halved text-brasil-green"></i>
                        Ambiente seguro. Todos os pagamentos são protegidos e criptografados.
                      </div>
                    </div>
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
                      disabled={finalizeReservationMutation.isPending}
                      className="flex items-center px-8 py-3 text-lg font-bold text-white bg-brasil-red hover:bg-brasil-red/90"
                    >
                      {finalizeReservationMutation.isPending ? (
                        <>
                          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          Confirmando...
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