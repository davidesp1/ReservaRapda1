import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Building, 
  Globe, 
  CalendarCheck, 
  CreditCard, 
  Bell, 
  DollarSign,
  Save,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Schemas for different settings sections
const generalSettingsSchema = z.object({
  restaurantName: z.string().min(1, 'Nome do restaurante é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(1, 'Telefone é obrigatório'),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  address: z.string().min(1, 'Endereço é obrigatório'),
  openingTime: z.string().min(1, 'Horário de abertura é obrigatório'),
  closingTime: z.string().min(1, 'Horário de fechamento é obrigatório'),
  description: z.string().optional()
});

const pageSettingsSchema = z.object({
  pageTitle: z.string().min(1, 'Título da página é obrigatório'),
  navBar: z.string().optional(),
  aboutSection: z.string().optional(),
  locationContact: z.string().optional(),
  testimonials: z.string().optional(),
  footer: z.string().optional()
});

const reservationSettingsSchema = z.object({
  minReservationTime: z.number().min(0, 'Tempo mínimo deve ser positivo'),
  maxDaysInAdvance: z.number().min(1, 'Deve permitir pelo menos 1 dia de antecedência'),
  allowCancellation: z.boolean(),
  requireConfirmation: z.boolean(),
  autoConfirmation: z.boolean()
});

const paymentSettingsSchema = z.object({
  currency: z.string().min(1, 'Moeda é obrigatória'),
  taxRate: z.number().min(0, 'Taxa de imposto deve ser positiva'),
  eupagoApiKey: z.string().optional(),
  acceptCard: z.boolean(),
  acceptMBWay: z.boolean(),
  acceptMultibanco: z.boolean(),
  acceptBankTransfer: z.boolean(),
  acceptCash: z.boolean()
});

type GeneralSettings = z.infer<typeof generalSettingsSchema>;
type PageSettings = z.infer<typeof pageSettingsSchema>;
type ReservationSettings = z.infer<typeof reservationSettingsSchema>;
type PaymentSettings = z.infer<typeof paymentSettingsSchema>;

const Settings = () => {
  const [activeTab, setActiveTab] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Forms for different tabs
  const generalForm = useForm<GeneralSettings>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      restaurantName: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      openingTime: '',
      closingTime: '',
      description: ''
    }
  });

  const pageForm = useForm<PageSettings>({
    resolver: zodResolver(pageSettingsSchema),
    defaultValues: {
      pageTitle: '',
      navBar: '',
      aboutSection: '',
      locationContact: '',
      testimonials: '',
      footer: ''
    }
  });

  const reservationForm = useForm<ReservationSettings>({
    resolver: zodResolver(reservationSettingsSchema),
    defaultValues: {
      minReservationTime: 30,
      maxDaysInAdvance: 30,
      allowCancellation: true,
      requireConfirmation: false,
      autoConfirmation: true
    }
  });

  const paymentForm = useForm<PaymentSettings>({
    resolver: zodResolver(paymentSettingsSchema),
    defaultValues: {
      currency: 'EUR',
      taxRate: 23,
      eupagoApiKey: '',
      acceptCard: true,
      acceptMBWay: true,
      acceptMultibanco: true,
      acceptBankTransfer: true,
      acceptCash: true
    }
  });

  // Query to fetch current settings
  const { data: settings } = useQuery({
    queryKey: ['/api/settings'],
    staleTime: 5 * 60 * 1000
  });

  // Mutations for saving settings
  const saveGeneralSettings = useMutation({
    mutationFn: (data: GeneralSettings) => 
      fetch('/api/settings/general', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Configurações gerais salvas com sucesso!'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar configurações gerais',
        variant: 'destructive'
      });
    }
  });

  const savePageSettings = useMutation({
    mutationFn: (data: PageSettings) => 
      fetch('/api/settings/page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Configurações de página salvas com sucesso!'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar configurações de página',
        variant: 'destructive'
      });
    }
  });

  const saveReservationSettings = useMutation({
    mutationFn: (data: ReservationSettings) => 
      fetch('/api/settings/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Configurações de reservas salvas com sucesso!'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar configurações de reservas',
        variant: 'destructive'
      });
    }
  });

  const savePaymentSettings = useMutation({
    mutationFn: (data: PaymentSettings) => apiRequest('/api/settings/payments', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Configurações de pagamento salvas com sucesso!'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar configurações de pagamento',
        variant: 'destructive'
      });
    }
  });

  // Tab configuration
  const tabs = [
    { id: 1, label: 'Configurações Gerais', icon: Building, color: 'text-brasil-green' },
    { id: 2, label: 'Configurações de Página', icon: Globe, color: 'text-brasil-yellow' },
    { id: 3, label: 'Configurações de Reservas', icon: CalendarCheck, color: 'text-brasil-blue' },
    { id: 4, label: 'Configurações de Pagamento', icon: CreditCard, color: 'text-brasil-green' },
    { id: 5, label: 'Configuração de Notificações', icon: Bell, color: 'text-brasil-yellow' },
    { id: 6, label: 'Configurações POS', icon: DollarSign, color: 'text-brasil-blue' }
  ];

  // Update forms when settings are loaded
  useEffect(() => {
    if (settings) {
      // Update forms with existing settings
      if (settings.general) {
        generalForm.reset(settings.general);
      }
      if (settings.page) {
        pageForm.reset(settings.page);
      }
      if (settings.reservations) {
        reservationForm.reset(settings.reservations);
      }
      if (settings.payments) {
        paymentForm.reset(settings.payments);
      }
    }
  }, [settings, generalForm, pageForm, reservationForm, paymentForm]);

  const onSubmitGeneral = (data: GeneralSettings) => {
    saveGeneralSettings.mutate(data);
  };

  const onSubmitPage = (data: PageSettings) => {
    savePageSettings.mutate(data);
  };

  const onSubmitReservation = (data: ReservationSettings) => {
    saveReservationSettings.mutate(data);
  };

  const onSubmitPayment = (data: PaymentSettings) => {
    savePaymentSettings.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 font-montserrat">Configurações</h1>
        <p className="text-gray-600 mt-1">Gerencie as configurações do seu restaurante</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 sm:p-8">
        {/* Tabs Navigation */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-3 font-semibold text-sm whitespace-nowrap rounded-t-md border-b-4 transition-all ${
                  activeTab === tab.id
                    ? 'text-brasil-blue border-brasil-blue bg-gray-50'
                    : 'text-gray-600 border-transparent hover:text-brasil-blue hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-4 h-4 mr-2 ${tab.color}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 1 && (
          <Form {...generalForm}>
            <form onSubmit={generalForm.handleSubmit(onSubmitGeneral)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={generalForm.control}
                  name="restaurantName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-700">Nome do Restaurante</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Opa que delicia"
                          className="bg-gray-50 font-semibold"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={generalForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-700">Email</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="email"
                          placeholder="contato@opaquedelicia.com"
                          className="bg-gray-50 font-semibold"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={generalForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-700">Telefone</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="(11) 98765-4321"
                          className="bg-gray-50 font-semibold"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={generalForm.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-700">Website</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="url"
                          placeholder="https://opaquedelicia.com"
                          className="bg-gray-50 font-semibold"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={generalForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="font-semibold text-gray-700">Endereço</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Rua da Gastronomia, 123 - São Paulo, SP"
                          className="bg-gray-50 font-semibold"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={generalForm.control}
                  name="openingTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-700">Horário de Abertura</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="time"
                          className="bg-gray-50 font-semibold"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={generalForm.control}
                  name="closingTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-700">Horário de Fechamento</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="time"
                          className="bg-gray-50 font-semibold"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={generalForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="font-semibold text-gray-700">Descrição</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          rows={3}
                          placeholder="Conte um pouco sobre o restaurante, especialidades, história, etc."
                          className="bg-gray-50 font-semibold resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  type="submit" 
                  className="bg-brasil-green hover:bg-green-700 text-white font-bold"
                  disabled={saveGeneralSettings.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saveGeneralSettings.isPending ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
              </div>
            </form>
          </Form>
        )}

        {activeTab === 2 && (
          <Form {...pageForm}>
            <form onSubmit={pageForm.handleSubmit(onSubmitPage)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={pageForm.control}
                  name="pageTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-700">Título da Página</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Opa que delicia - Restaurante Brasileiro"
                          className="bg-gray-50 font-semibold"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={pageForm.control}
                  name="navBar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-700">Barra de Navegação</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          rows={2}
                          placeholder="Ex: Home, Cardápio, Reservas, Sobre, Contato"
                          className="bg-gray-50 font-semibold resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={pageForm.control}
                  name="aboutSection"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-700">Sobre</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          rows={2}
                          placeholder="Descrição da história, missão, valores, equipe"
                          className="bg-gray-50 font-semibold resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={pageForm.control}
                  name="locationContact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-700">Localização e Contato</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          rows={2}
                          placeholder="Endereço, telefone, email"
                          className="bg-gray-50 font-semibold resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={pageForm.control}
                  name="testimonials"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-700">Testemunhos</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          rows={2}
                          placeholder="Comentários de clientes, avaliações"
                          className="bg-gray-50 font-semibold resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={pageForm.control}
                  name="footer"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="font-semibold text-gray-700">Footer</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          rows={2}
                          placeholder="Informações de copyright, links, redes sociais"
                          className="bg-gray-50 font-semibold resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  type="submit" 
                  className="bg-brasil-green hover:bg-green-700 text-white font-bold"
                  disabled={savePageSettings.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {savePageSettings.isPending ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
              </div>
            </form>
          </Form>
        )}

        {activeTab === 3 && (
          <Form {...reservationForm}>
            <form onSubmit={reservationForm.handleSubmit(onSubmitReservation)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={reservationForm.control}
                  name="minReservationTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-700">Tempo mínimo para reserva (min)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number"
                          min="0"
                          placeholder="30"
                          className="bg-gray-50 font-semibold"
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={reservationForm.control}
                  name="maxDaysInAdvance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-700">Dias de reserva máxima antecipada</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number"
                          min="1"
                          placeholder="30"
                          className="bg-gray-50 font-semibold"
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={reservationForm.control}
                  name="allowCancellation"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-brasil-green"
                        />
                      </FormControl>
                      <FormLabel className="font-semibold text-gray-700">
                        Permitir que os clientes cancelem
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={reservationForm.control}
                  name="requireConfirmation"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-brasil-yellow"
                        />
                      </FormControl>
                      <FormLabel className="font-semibold text-gray-700">
                        Requer confirmação
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={reservationForm.control}
                  name="autoConfirmation"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-brasil-blue"
                        />
                      </FormControl>
                      <FormLabel className="font-semibold text-gray-700">
                        Confirmação automática da reserva
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  type="submit" 
                  className="bg-brasil-green hover:bg-green-700 text-white font-bold"
                  disabled={saveReservationSettings.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saveReservationSettings.isPending ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
              </div>
            </form>
          </Form>
        )}

        {activeTab === 4 && (
          <Form {...paymentForm}>
            <form onSubmit={paymentForm.handleSubmit(onSubmitPayment)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={paymentForm.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-700">Moeda do Sistema</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-gray-50 font-semibold">
                            <SelectValue placeholder="Selecione a moeda" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="BRL">Real Brasileiro (BRL)</SelectItem>
                          <SelectItem value="EUR">Euro (EUR)</SelectItem>
                          <SelectItem value="USD">Dólar Americano (USD)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={paymentForm.control}
                  name="taxRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-700">Taxa de Impostos (%)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="23.0"
                          className="bg-gray-50 font-semibold"
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="bg-brasil-yellow/20 border-l-4 border-brasil-yellow px-4 py-3 rounded-lg flex items-center">
                <Lock className="text-brasil-yellow mr-3 text-lg w-5 h-5" />
                <span className="text-sm font-semibold text-brasil-yellow">
                  Chave de API para o serviço de pagamento EuPago. Esta informação é sensível e deve ser mantida segura.
                </span>
              </div>

              <FormField
                control={paymentForm.control}
                name="eupagoApiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-gray-700">Chave API do EuPago</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="password"
                        placeholder="Insira sua chave API"
                        className="bg-gray-50 font-semibold"
                      />
                    </FormControl>
                    <p className="text-xs text-gray-400 mt-2">
                      Requer chave API do EuPago para ativação para métodos de pagamento online
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel className="font-semibold text-gray-700 mb-4 block">Métodos de Pagamento</FormLabel>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <FormField
                    control={paymentForm.control}
                    name="acceptCard"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-brasil-green"
                          />
                        </FormControl>
                        <FormLabel className="text-sm text-gray-700">
                          Cartão de Crédito/Débito
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={paymentForm.control}
                    name="acceptMBWay"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-brasil-yellow"
                          />
                        </FormControl>
                        <FormLabel className="text-sm text-gray-700">
                          MBWay
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={paymentForm.control}
                    name="acceptMultibanco"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-brasil-blue"
                          />
                        </FormControl>
                        <FormLabel className="text-sm text-gray-700">
                          Multibanco
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={paymentForm.control}
                    name="acceptBankTransfer"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-brasil-green"
                          />
                        </FormControl>
                        <FormLabel className="text-sm text-gray-700">
                          Transferência Bancária
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={paymentForm.control}
                    name="acceptCash"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-brasil-yellow"
                          />
                        </FormControl>
                        <FormLabel className="text-sm text-gray-700">
                          Dinheiro
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  type="submit" 
                  className="bg-brasil-green hover:bg-green-700 text-white font-bold"
                  disabled={savePaymentSettings.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {savePaymentSettings.isPending ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
              </div>
            </form>
          </Form>
        )}

        {activeTab === 5 && (
          <div className="text-center py-16">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Configurações de Notificações</h3>
            <p className="text-gray-500">Esta seção estará disponível em breve.</p>
          </div>
        )}

        {activeTab === 6 && (
          <div className="text-center py-16">
            <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Configurações POS</h3>
            <p className="text-gray-500">Esta seção estará disponível em breve.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;