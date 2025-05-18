import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Clock } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import CustomerLayout from '@/components/layouts/CustomerLayout';

const Reservations: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, user, isLoading } = useAuth();
  const [_, setLocation] = useLocation();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [partySize, setPartySize] = useState<number>(2);
  const { toast } = useToast();
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/');
    }
  }, [isAuthenticated, isLoading, setLocation]);
  
  // Fetch available tables for the selected date and party size
  const { data: availableTables, isLoading: tablesLoading, refetch: refetchTables } = useQuery<any[]>({
    queryKey: ['/api/tables/available', { date: selectedDate?.toISOString(), partySize }],
    enabled: !!selectedDate && partySize > 0 && isAuthenticated,
  });
  
  // Time slots available for reservations
  const timeSlots = [
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', 
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', 
    '20:00', '20:30', '21:00', '21:30'
  ];
  
  const reservationSchema = z.object({
    date: z.date({ required_error: 'Please select a date' }),
    time: z.string({ required_error: 'Please select a time' }),
    partySize: z.coerce.number(),
    tableId: z.coerce.number(),
    dietaryRequirements: z.string().optional(),
  });
  
  type ReservationFormValues = z.infer<typeof reservationSchema>;
  
  const form = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      date: undefined,
      time: '',
      partySize: 2,
      tableId: undefined,
      dietaryRequirements: '',
    },
  });
  
  // Update available tables when date or party size changes
  useEffect(() => {
    if (selectedDate) {
      refetchTables();
    }
  }, [selectedDate, partySize, refetchTables]);
  
  // When date is selected in the form
  const onDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    form.setValue('date', date as Date);
  };
  
  // When party size changes in the form
  const onPartySizeChange = (value: string) => {
    const size = parseInt(value);
    setPartySize(size);
    form.setValue('partySize', size);
  };
  
  // Create reservation mutation
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
      setLocation('/dashboard');
    },
    onError: (error: any) => {
      toast({
        title: t('ReservationError'),
        description: error.message || t('ReservationErrorMessage'),
        variant: 'destructive',
      });
    }
  });
  
  const onSubmit = (data: ReservationFormValues) => {
    // Combine date and time
    const dateTime = new Date(data.date);
    const [hours, minutes] = data.time.split(':').map(Number);
    dateTime.setHours(hours, minutes, 0, 0);
    
    // Prepare reservation data
    const reservationData = {
      date: dateTime.toISOString(),
      tableId: data.tableId,
      partySize: data.partySize,
      dietaryRequirements: data.dietaryRequirements,
      // Valor padrão fixo para a duração (2 horas)
      duration: 120,
      // Gerar código de confirmação aleatório
      confirmationCode: Math.random().toString(36).substring(2, 10).toUpperCase()
    };
    
    createReservationMutation.mutate(reservationData);
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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
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
                        control={form.control}
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
                        control={form.control}
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
                        control={form.control}
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
                      control={form.control}
                      name="dietaryRequirements"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('DietaryRequirements')}</FormLabel>
                          <FormControl>
                            <textarea
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brasil-green focus:border-transparent"
                              rows={2}
                              placeholder={t('DietaryRequirementsPlaceholder')}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            {t('DietaryRequirementsDescription')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    

                    
                    <Button 
                      type="submit" 
                      className="bg-brasil-green hover:bg-green-700 text-white"
                      disabled={
                        createReservationMutation.isPending || 
                        !availableTables || 
                        !(Array.isArray(availableTables) && availableTables.length > 0)
                      }
                    >
                      {createReservationMutation.isPending ? (
                        <span className="flex items-center">
                          <i className="fas fa-spinner fa-spin mr-2"></i> {t('Processing')}
                        </span>
                      ) : (
                        t('ConfirmReservation')
                      )}
                    </Button>
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
