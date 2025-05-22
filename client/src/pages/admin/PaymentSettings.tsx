import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CreditCard, Banknote, Landmark, QrCode, ArrowRight } from 'lucide-react';

// Interface para os dados de configuração de pagamento retornados pela API
interface PaymentSettingsData {
  acceptCard: string;
  acceptMBWay: string;
  acceptMultibanco: string;
  acceptBankTransfer: string;
  acceptCash: string;
  eupagoApiKey?: string;
}

// Schema para as configurações de pagamento
const paymentSettingsSchema = z.object({
  acceptCard: z.boolean().default(true),
  acceptMBWay: z.boolean().default(true),
  acceptMultibanco: z.boolean().default(true),
  acceptBankTransfer: z.boolean().default(true),
  acceptCash: z.boolean().default(true),
  eupagoApiKey: z.string().optional(),
});

type PaymentSettings = z.infer<typeof paymentSettingsSchema>;

const PaymentSettings: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  // Formulário de configurações de pagamento
  const form = useForm<PaymentSettings>({
    resolver: zodResolver(paymentSettingsSchema),
    defaultValues: {
      acceptCard: true,
      acceptMBWay: true,
      acceptMultibanco: true,
      acceptBankTransfer: true,
      acceptCash: true,
      eupagoApiKey: '',
    },
  });

  // Buscar as configurações atuais
  const { data: settings, isLoading: settingsLoading } = useQuery<PaymentSettingsData>({
    queryKey: ['/api/settings/payments'],
    enabled: isAuthenticated && isAdmin
  });
  
  // Atualizar o formulário quando os dados são carregados
  useEffect(() => {
    if (settings) {
      const formData = {
        acceptCard: settings.acceptCard !== 'false',
        acceptMBWay: settings.acceptMBWay !== 'false',
        acceptMultibanco: settings.acceptMultibanco !== 'false',
        acceptBankTransfer: settings.acceptBankTransfer !== 'false',
        acceptCash: settings.acceptCash !== 'false',
        eupagoApiKey: settings.eupagoApiKey || '',
      };
      form.reset(formData);
    }
  }, [settings, form]);

  // Mutation para atualizar as configurações
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: PaymentSettings) => {
      return apiRequest('PUT', '/api/settings/payments', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/payments'] });
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

  // Verificar autenticação
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      setLocation('/admin');
    }
  }, [isAuthenticated, isAdmin, isLoading, setLocation]);

  // Submit handler
  const onSubmit = (data: PaymentSettings) => {
    updateSettingsMutation.mutate(data);
  };

  if (settingsLoading || isLoading) {
    return (
      <AdminLayout title={t('PaymentSettings')}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={t('PaymentSettings')}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-montserrat font-bold">{t('PaymentSettings')}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('PaymentSettings')}</CardTitle>
          <CardDescription>{t('PaymentSettingsDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Configurações de Gateway de Pagamento */}
              <div className="space-y-2">
                <h3 className="text-lg font-medium">{t('PaymentGatewaySettings')}</h3>
                <div className="p-6 border rounded-md bg-slate-50">
                  <FormField
                    control={form.control}
                    name="eupagoApiKey"
                    render={({ field }) => {
                      // Usando um estado local para manter o valor visível
                      const [apiKey, setApiKey] = React.useState(field.value || '');
                      
                      // Quando o valor mudar, atualize o formulário e o estado local
                      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                        const newValue = e.target.value;
                        setApiKey(newValue);
                        field.onChange(newValue);
                      };
                      
                      return (
                        <FormItem>
                          <FormLabel className="text-lg font-semibold">{t('EuPagoAPIKey')}</FormLabel>
                          <FormDescription className="mb-2">
                            {t('EuPagoAPIKeyDescription')}
                          </FormDescription>
                          <FormControl>
                            {/* Input customizado que não esconde os caracteres */}
                            <input
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm font-mono"
                              value={apiKey}
                              onChange={handleChange}
                              onBlur={field.onBlur}
                              name={field.name}
                              id={field.name}
                              placeholder="Digite sua chave API do EuPago"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>
              </div>

              <Separator />

              {/* Métodos de Pagamento */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">{t('PaymentMethods')}</h3>
                
                <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t('ImportantNote')}</AlertTitle>
                  <AlertDescription>
                    {t('CashPaymentVisibleOnlyToAdmin')}
                  </AlertDescription>
                </Alert>

                <div className="space-y-3 mt-4">
                  <FormField
                    control={form.control}
                    name="acceptCard"
                    render={({ field }) => (
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <CreditCard className="h-5 w-5 text-gray-500" />
                          <div>
                            <Label htmlFor="card" className="font-medium">{t('AcceptCard')}</Label>
                            <p className="text-sm text-gray-500">{t('ProcessedByEuPago')}</p>
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            id="card"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </div>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="acceptMBWay"
                    render={({ field }) => (
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <QrCode className="h-5 w-5 text-gray-500" />
                          <div>
                            <Label htmlFor="mbway" className="font-medium">{t('AcceptMBWay')}</Label>
                            <p className="text-sm text-gray-500">{t('ProcessedByEuPago')}</p>
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            id="mbway"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </div>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="acceptMultibanco"
                    render={({ field }) => (
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <ArrowRight className="h-5 w-5 text-gray-500" />
                          <div>
                            <Label htmlFor="multibanco" className="font-medium">{t('AcceptMultibanco')}</Label>
                            <p className="text-sm text-gray-500">{t('ProcessedByEuPago')}</p>
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            id="multibanco"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </div>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="acceptBankTransfer"
                    render={({ field }) => (
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <Landmark className="h-5 w-5 text-gray-500" />
                          <div>
                            <Label htmlFor="bankTransfer" className="font-medium">{t('AcceptBankTransfer')}</Label>
                            <p className="text-sm text-gray-500">{t('ManualVerification')}</p>
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            id="bankTransfer"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </div>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="acceptCash"
                    render={({ field }) => (
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <Banknote className="h-5 w-5 text-gray-500" />
                          <div>
                            <Label htmlFor="cash" className="font-medium">{t('AcceptCash')}</Label>
                            <p className="text-sm text-gray-500">{t('PaidAtRestaurant')}</p>
                            <p className="text-xs text-amber-600">{t('OnlyVisibleToAdmin')}</p>
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            id="cash"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </div>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  type="submit" 
                  className="bg-brasil-green hover:bg-brasil-green/90"
                  disabled={updateSettingsMutation.isPending}
                >
                  {updateSettingsMutation.isPending ? t('Saving') : t('SaveChanges')}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default PaymentSettings;