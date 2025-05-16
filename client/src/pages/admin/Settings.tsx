import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Save, Globe, CreditCard, BellRing, Store, Calendar, Euro } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

// Configure schema for general settings
const generalSettingsSchema = z.object({
  restaurantName: z.string().min(1, 'O nome do restaurante é obrigatório'),
  address: z.string().min(1, 'O endereço é obrigatório'),
  phone: z.string().min(1, 'O telefone é obrigatório'),
  email: z.string().email('Email inválido'),
  website: z.string().url('Website inválido').optional().or(z.literal('')),
  openingTime: z.string().min(1, 'Horário de abertura obrigatório'),
  closingTime: z.string().min(1, 'Horário de fechamento obrigatório'),
  description: z.string().max(500, 'A descrição não pode ter mais de 500 caracteres').optional(),
});

// Configure schema for reservation settings
const reservationSettingsSchema = z.object({
  minReservationTime: z.coerce.number().min(30, 'Mínimo de 30 minutos'),
  maxReservationTime: z.coerce.number().min(60, 'Mínimo de 60 minutos'),
  reservationTimeInterval: z.coerce.number().min(15, 'Mínimo de 15 minutos'),
  maxPartySize: z.coerce.number().min(1, 'Mínimo de 1 pessoa'),
  reservationLeadHours: z.coerce.number().min(1, 'Mínimo de 1 hora'),
  maxAdvanceReservationDays: z.coerce.number().min(1, 'Mínimo de 1 dia'),
  allowCustomersToCancel: z.boolean(),
  requireConfirmation: z.boolean(),
  autoConfirmReservations: z.boolean(),
});

// Configure schema for payment settings
const paymentSettingsSchema = z.object({
  currency: z.string().min(1, 'Moeda obrigatória'),
  acceptCreditCards: z.boolean(),
  acceptDebitCards: z.boolean(),
  acceptCash: z.boolean(),
  acceptMBWay: z.boolean(),
  acceptMultibanco: z.boolean(),
  acceptBankTransfer: z.boolean(),
  requirePrepayment: z.boolean(),
  requirePrepaymentAmount: z.coerce.number().min(0, 'Valor não pode ser negativo'),
  showPricesWithTax: z.boolean(),
  taxRate: z.coerce.number().min(0, 'Taxa não pode ser negativa'),
});

// Configure schema for notification settings
const notificationSettingsSchema = z.object({
  sendEmailConfirmation: z.boolean(),
  sendSmsConfirmation: z.boolean(),
  sendEmailReminders: z.boolean(),
  sendSmsReminders: z.boolean(),
  reminderHoursBeforeReservation: z.coerce.number().min(1, 'Mínimo de 1 hora'),
  allowCustomerFeedback: z.boolean(),
  collectCustomerFeedback: z.boolean(),
});

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Tab handling
  const [activeTab, setActiveTab] = useState('general');

  // General settings form
  const generalForm = useForm<z.infer<typeof generalSettingsSchema>>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      restaurantName: 'Opa que delicia',
      address: 'MSBN Europe Convention Center, Barcelona',
      phone: '+34 612 345 678',
      email: 'contact@opaquedelicia.com',
      website: 'https://opaquedelicia.com',
      openingTime: '11:00',
      closingTime: '23:00',
      description: 'Autêntica comida brasileira durante a convenção MSBN Europe',
    },
  });

  // Reservation settings form
  const reservationForm = useForm<z.infer<typeof reservationSettingsSchema>>({
    resolver: zodResolver(reservationSettingsSchema),
    defaultValues: {
      minReservationTime: 60,
      maxReservationTime: 180,
      reservationTimeInterval: 30,
      maxPartySize: 12,
      reservationLeadHours: 2,
      maxAdvanceReservationDays: 30,
      allowCustomersToCancel: true,
      requireConfirmation: true,
      autoConfirmReservations: false,
    },
  });

  // Payment settings form
  const paymentForm = useForm<z.infer<typeof paymentSettingsSchema>>({
    resolver: zodResolver(paymentSettingsSchema),
    defaultValues: {
      currency: 'EUR',
      acceptCreditCards: true,
      acceptDebitCards: true,
      acceptCash: true,
      acceptMBWay: true,
      acceptMultibanco: true,
      acceptBankTransfer: true,
      requirePrepayment: false,
      requirePrepaymentAmount: 0,
      showPricesWithTax: true,
      taxRate: 23,
    },
  });

  // Notification settings form
  const notificationForm = useForm<z.infer<typeof notificationSettingsSchema>>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      sendEmailConfirmation: true,
      sendSmsConfirmation: false,
      sendEmailReminders: true,
      sendSmsReminders: false,
      reminderHoursBeforeReservation: 24,
      allowCustomerFeedback: true,
      collectCustomerFeedback: true,
    },
  });

  // Fetch settings data
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/settings'],
    enabled: isAuthenticated && isAdmin,
  });

  // Update general settings mutation
  const updateGeneralSettingsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof generalSettingsSchema>) => {
      return apiRequest('PUT', '/api/settings/general', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: t('SettingsSaved'),
        description: t('GeneralSettingsSavedDescription'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('SettingsSaveError'),
        description: error.message || t('SettingsSaveErrorDescription'),
        variant: 'destructive',
      });
    },
  });

  // Update reservation settings mutation
  const updateReservationSettingsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof reservationSettingsSchema>) => {
      return apiRequest('PUT', '/api/settings/reservations', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: t('SettingsSaved'),
        description: t('ReservationSettingsSavedDescription'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('SettingsSaveError'),
        description: error.message || t('SettingsSaveErrorDescription'),
        variant: 'destructive',
      });
    },
  });

  // Update payment settings mutation
  const updatePaymentSettingsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof paymentSettingsSchema>) => {
      return apiRequest('PUT', '/api/settings/payments', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: t('SettingsSaved'),
        description: t('PaymentSettingsSavedDescription'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('SettingsSaveError'),
        description: error.message || t('SettingsSaveErrorDescription'),
        variant: 'destructive',
      });
    },
  });

  // Update notification settings mutation
  const updateNotificationSettingsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof notificationSettingsSchema>) => {
      return apiRequest('PUT', '/api/settings/notifications', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: t('SettingsSaved'),
        description: t('NotificationSettingsSavedDescription'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('SettingsSaveError'),
        description: error.message || t('SettingsSaveErrorDescription'),
        variant: 'destructive',
      });
    },
  });

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      setLocation('/');
    }
  }, [isAuthenticated, isAdmin, isLoading, setLocation]);

  // Submit handlers
  const onGeneralSubmit = (data: z.infer<typeof generalSettingsSchema>) => {
    updateGeneralSettingsMutation.mutate(data);
  };

  const onReservationSubmit = (data: z.infer<typeof reservationSettingsSchema>) => {
    updateReservationSettingsMutation.mutate(data);
  };

  const onPaymentSubmit = (data: z.infer<typeof paymentSettingsSchema>) => {
    updatePaymentSettingsMutation.mutate(data);
  };

  const onNotificationSubmit = (data: z.infer<typeof notificationSettingsSchema>) => {
    updateNotificationSettingsMutation.mutate(data);
  };

  if (settingsLoading || isLoading) {
    return (
      <AdminLayout title={t('Settings')}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={t('Settings')}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-montserrat font-bold">{t('Settings')}</h1>
      </div>

      <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full mb-8">
          <TabsTrigger value="general" className="flex items-center">
            <Store className="w-4 h-4 mr-2" /> {t('GeneralSettings')}
          </TabsTrigger>
          <TabsTrigger value="reservations" className="flex items-center">
            <Calendar className="w-4 h-4 mr-2" /> {t('ReservationSettings')}
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center">
            <CreditCard className="w-4 h-4 mr-2" /> {t('PaymentSettings')}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center">
            <BellRing className="w-4 h-4 mr-2" /> {t('NotificationSettings')}
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>{t('GeneralSettings')}</CardTitle>
              <CardDescription>{t('GeneralSettingsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...generalForm}>
                <form onSubmit={generalForm.handleSubmit(onGeneralSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={generalForm.control}
                      name="restaurantName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('RestaurantName')}</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                          <FormLabel>{t('Email')}</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" />
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
                          <FormLabel>{t('Phone')}</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                          <FormLabel>{t('Website')}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={generalForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="col-span-1 md:col-span-2">
                          <FormLabel>{t('Address')}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={generalForm.control}
                      name="openingTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('OpeningTime')}</FormLabel>
                          <FormControl>
                            <Input {...field} type="time" />
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
                          <FormLabel>{t('ClosingTime')}</FormLabel>
                          <FormControl>
                            <Input {...field} type="time" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={generalForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('Description')}</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            rows={4}
                            placeholder={t('RestaurantDescriptionPlaceholder')} 
                          />
                        </FormControl>
                        <FormDescription>
                          {t('DescriptionHelp')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      className="bg-brasil-green text-white"
                    >
                      <Save className="w-4 h-4 mr-2" /> {t('SaveSettings')}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reservation Settings */}
        <TabsContent value="reservations">
          <Card>
            <CardHeader>
              <CardTitle>{t('ReservationSettings')}</CardTitle>
              <CardDescription>{t('ReservationSettingsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...reservationForm}>
                <form onSubmit={reservationForm.handleSubmit(onReservationSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={reservationForm.control}
                      name="minReservationTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('MinReservationTime')}</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" min="30" step="15" />
                          </FormControl>
                          <FormDescription>
                            {t('MinutesValue')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={reservationForm.control}
                      name="maxReservationTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('MaxReservationTime')}</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" min="60" step="15" />
                          </FormControl>
                          <FormDescription>
                            {t('MinutesValue')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={reservationForm.control}
                      name="reservationTimeInterval"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('ReservationTimeInterval')}</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" min="15" step="15" />
                          </FormControl>
                          <FormDescription>
                            {t('MinutesValue')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={reservationForm.control}
                      name="maxPartySize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('MaxPartySize')}</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" min="1" />
                          </FormControl>
                          <FormDescription>
                            {t('PeopleValue')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={reservationForm.control}
                      name="reservationLeadHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('ReservationLeadHours')}</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" min="1" />
                          </FormControl>
                          <FormDescription>
                            {t('HoursValue')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={reservationForm.control}
                      name="maxAdvanceReservationDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('MaxAdvanceReservationDays')}</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" min="1" />
                          </FormControl>
                          <FormDescription>
                            {t('DaysValue')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator className="my-6" />

                  <div className="space-y-4">
                    <FormField
                      control={reservationForm.control}
                      name="allowCustomersToCancel"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between p-3 border rounded-lg">
                          <div className="space-y-0.5">
                            <FormLabel>{t('AllowCustomersToCancel')}</FormLabel>
                            <FormDescription>
                              {t('AllowCustomersToCancelDescription')}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={reservationForm.control}
                      name="requireConfirmation"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between p-3 border rounded-lg">
                          <div className="space-y-0.5">
                            <FormLabel>{t('RequireConfirmation')}</FormLabel>
                            <FormDescription>
                              {t('RequireConfirmationDescription')}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={reservationForm.control}
                      name="autoConfirmReservations"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between p-3 border rounded-lg">
                          <div className="space-y-0.5">
                            <FormLabel>{t('AutoConfirmReservations')}</FormLabel>
                            <FormDescription>
                              {t('AutoConfirmReservationsDescription')}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      className="bg-brasil-green text-white"
                    >
                      <Save className="w-4 h-4 mr-2" /> {t('SaveSettings')}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>{t('PaymentSettings')}</CardTitle>
              <CardDescription>{t('PaymentSettingsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...paymentForm}>
                <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={paymentForm.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('Currency')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('SelectCurrency')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="EUR">Euro (€)</SelectItem>
                              <SelectItem value="USD">US Dollar ($)</SelectItem>
                              <SelectItem value="GBP">British Pound (£)</SelectItem>
                              <SelectItem value="BRL">Real Brasileiro (R$)</SelectItem>
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
                          <FormLabel>{t('TaxRate')}</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" min="0" step="0.01" />
                          </FormControl>
                          <FormDescription>
                            {t('PercentageValue')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator className="my-6" />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t('PaymentMethods')}</h3>
                    
                    <FormField
                      control={paymentForm.control}
                      name="acceptCreditCards"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between p-3 border rounded-lg">
                          <div className="space-y-0.5">
                            <FormLabel>{t('AcceptCreditCards')}</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={paymentForm.control}
                      name="acceptDebitCards"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between p-3 border rounded-lg">
                          <div className="space-y-0.5">
                            <FormLabel>{t('AcceptDebitCards')}</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={paymentForm.control}
                      name="acceptCash"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between p-3 border rounded-lg">
                          <div className="space-y-0.5">
                            <FormLabel>{t('AcceptCash')}</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={paymentForm.control}
                      name="acceptMBWay"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between p-3 border rounded-lg">
                          <div className="space-y-0.5">
                            <FormLabel>{t('AcceptMBWay')}</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={paymentForm.control}
                      name="acceptMultibanco"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between p-3 border rounded-lg">
                          <div className="space-y-0.5">
                            <FormLabel>{t('AcceptMultibanco')}</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={paymentForm.control}
                      name="acceptBankTransfer"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between p-3 border rounded-lg">
                          <div className="space-y-0.5">
                            <FormLabel>{t('AcceptBankTransfer')}</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator className="my-6" />

                  <div className="space-y-4">
                    <FormField
                      control={paymentForm.control}
                      name="requirePrepayment"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between p-3 border rounded-lg">
                          <div className="space-y-0.5">
                            <FormLabel>{t('RequirePrepayment')}</FormLabel>
                            <FormDescription>
                              {t('RequirePrepaymentDescription')}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {paymentForm.watch('requirePrepayment') && (
                      <FormField
                        control={paymentForm.control}
                        name="requirePrepaymentAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('PrepaymentAmount')}</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="0" step="0.01" />
                            </FormControl>
                            <FormDescription>
                              {t('AmountValue')}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={paymentForm.control}
                      name="showPricesWithTax"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between p-3 border rounded-lg">
                          <div className="space-y-0.5">
                            <FormLabel>{t('ShowPricesWithTax')}</FormLabel>
                            <FormDescription>
                              {t('ShowPricesWithTaxDescription')}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      className="bg-brasil-green text-white"
                    >
                      <Save className="w-4 h-4 mr-2" /> {t('SaveSettings')}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>{t('NotificationSettings')}</CardTitle>
              <CardDescription>{t('NotificationSettingsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...notificationForm}>
                <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t('Confirmations')}</h3>
                    
                    <FormField
                      control={notificationForm.control}
                      name="sendEmailConfirmation"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between p-3 border rounded-lg">
                          <div className="space-y-0.5">
                            <FormLabel>{t('SendEmailConfirmation')}</FormLabel>
                            <FormDescription>
                              {t('SendEmailConfirmationDescription')}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={notificationForm.control}
                      name="sendSmsConfirmation"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between p-3 border rounded-lg">
                          <div className="space-y-0.5">
                            <FormLabel>{t('SendSmsConfirmation')}</FormLabel>
                            <FormDescription>
                              {t('SendSmsConfirmationDescription')}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator className="my-6" />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t('Reminders')}</h3>
                    
                    <FormField
                      control={notificationForm.control}
                      name="sendEmailReminders"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between p-3 border rounded-lg">
                          <div className="space-y-0.5">
                            <FormLabel>{t('SendEmailReminders')}</FormLabel>
                            <FormDescription>
                              {t('SendEmailRemindersDescription')}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={notificationForm.control}
                      name="sendSmsReminders"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between p-3 border rounded-lg">
                          <div className="space-y-0.5">
                            <FormLabel>{t('SendSmsReminders')}</FormLabel>
                            <FormDescription>
                              {t('SendSmsRemindersDescription')}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {(notificationForm.watch('sendEmailReminders') || notificationForm.watch('sendSmsReminders')) && (
                      <FormField
                        control={notificationForm.control}
                        name="reminderHoursBeforeReservation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('ReminderHoursBeforeReservation')}</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="1" />
                            </FormControl>
                            <FormDescription>
                              {t('HoursValue')}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  <Separator className="my-6" />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t('Feedback')}</h3>
                    
                    <FormField
                      control={notificationForm.control}
                      name="allowCustomerFeedback"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between p-3 border rounded-lg">
                          <div className="space-y-0.5">
                            <FormLabel>{t('AllowCustomerFeedback')}</FormLabel>
                            <FormDescription>
                              {t('AllowCustomerFeedbackDescription')}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={notificationForm.control}
                      name="collectCustomerFeedback"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between p-3 border rounded-lg">
                          <div className="space-y-0.5">
                            <FormLabel>{t('CollectCustomerFeedback')}</FormLabel>
                            <FormDescription>
                              {t('CollectCustomerFeedbackDescription')}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      className="bg-brasil-green text-white"
                    >
                      <Save className="w-4 h-4 mr-2" /> {t('SaveSettings')}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default Settings;