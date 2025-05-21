import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { apiRequest } from '@/lib/queryClient';

// Esquema de validação
const paymentSettingsSchema = z.object({
  eupagoApiKey: z.string().min(1, 'A chave de API é obrigatória'),
  enabledPaymentMethods: z.object({
    card: z.boolean().default(true),
    mbway: z.boolean().default(true),
    multibanco: z.boolean().default(true),
    bankTransfer: z.boolean().default(true),
    cash: z.boolean().default(true)
  })
});

type PaymentSettingsFormValues = z.infer<typeof paymentSettingsSchema>;

export default function PaymentSettings() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar configurações atuais
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/settings/payment'],
    refetchOnWindowFocus: false,
  });

  // Configurar formulário
  const form = useForm<PaymentSettingsFormValues>({
    resolver: zodResolver(paymentSettingsSchema),
    defaultValues: {
      eupagoApiKey: '',
      enabledPaymentMethods: {
        card: true,
        mbway: true,
        multibanco: true,
        bankTransfer: true,
        cash: true
      }
    },
  });

  // Atualizar formulário quando os dados são carregados
  React.useEffect(() => {
    if (settings) {
      form.reset({
        eupagoApiKey: settings.eupagoApiKey || '',
        enabledPaymentMethods: {
          card: settings.enabledPaymentMethods?.card ?? true,
          mbway: settings.enabledPaymentMethods?.mbway ?? true,
          multibanco: settings.enabledPaymentMethods?.multibanco ?? true,
          bankTransfer: settings.enabledPaymentMethods?.bankTransfer ?? true,
          cash: settings.enabledPaymentMethods?.cash ?? true
        }
      });
    }
  }, [settings, form]);

  // Mutation para salvar configurações
  const { mutate: saveSettings, isPending } = useMutation({
    mutationFn: async (data: PaymentSettingsFormValues) => {
      const response = await apiRequest('POST', '/api/settings/payment', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao salvar configurações');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('Success'),
        description: t('PaymentSettingsSaved'),
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings/payment'] });
    },
    onError: (error: Error) => {
      toast({
        title: t('Error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Submeter formulário
  const onSubmit = (data: PaymentSettingsFormValues) => {
    saveSettings(data);
  };

  // Testar configurações
  const handleTestConnection = async () => {
    try {
      const response = await apiRequest('POST', '/api/settings/payment/test', {
        apiKey: form.getValues('eupagoApiKey')
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha no teste de conexão');
      }
      
      toast({
        title: t('Success'),
        description: t('ConnectionTestSuccess'),
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: t('Error'),
        description: error instanceof Error ? error.message : t('ConnectionTestFailed'),
        variant: 'destructive',
      });
    }
  };

  return (
    <AdminLayout>
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-6">{t('PaymentSettings')}</h1>
        
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>{t('EuPagoIntegration')}</CardTitle>
            <CardDescription>
              {t('ConfigureEuPagoIntegration')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-10 text-center">
                <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-4 text-gray-600">{t('Loading')}...</p>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="eupagoApiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('EuPagoApiKey')}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="••••••••••••••••••••••••••"
                          />
                        </FormControl>
                        <FormDescription>
                          {t('ApiKeyDescription')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3">{t('EnabledPaymentMethods')}</h3>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="enabledPaymentMethods.card"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>{t('CreditDebitCard')}</FormLabel>
                              <FormDescription>
                                {t('ProcessedByEuPago')}
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
                        control={form.control}
                        name="enabledPaymentMethods.mbway"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>MBWay</FormLabel>
                              <FormDescription>
                                {t('ProcessedByEuPago')}
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
                        control={form.control}
                        name="enabledPaymentMethods.multibanco"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Multibanco</FormLabel>
                              <FormDescription>
                                {t('ProcessedByEuPago')}
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
                        control={form.control}
                        name="enabledPaymentMethods.bankTransfer"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>{t('BankTransfer')}</FormLabel>
                              <FormDescription>
                                {t('ManualVerification')}
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
                        control={form.control}
                        name="enabledPaymentMethods.cash"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>{t('Cash')}</FormLabel>
                              <FormDescription>
                                {t('AdminPOSOnly')}
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
                  </div>
                  
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleTestConnection}
                      disabled={isPending || !form.getValues('eupagoApiKey')}
                    >
                      {t('TestConnection')}
                    </Button>
                    <Button
                      type="submit"
                      disabled={isPending}
                    >
                      {isPending ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          {t('Saving')}
                        </span>
                      ) : (
                        t('SaveSettings')
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}