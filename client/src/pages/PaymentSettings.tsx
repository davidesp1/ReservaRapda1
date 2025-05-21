import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useTranslation } from 'react-i18next';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import AdminLayout from '@/components/layouts/AdminLayout';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';

const paymentSettingsSchema = z.object({
  eupagoApiKey: z.string().min(1, { 
    message: "API Key é obrigatória" 
  }),
  enabledPaymentMethods: z.object({
    card: z.boolean().default(true),
    mbway: z.boolean().default(true),
    multibanco: z.boolean().default(true),
    bankTransfer: z.boolean().default(true),
    cash: z.boolean().default(true),
  }),
});

type PaymentSettingsFormValues = z.infer<typeof paymentSettingsSchema>;

export default function PaymentSettings() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Verificar se o usuário é admin
    const checkAdminStatus = async () => {
      try {
        const response = await apiRequest('GET', '/api/auth/me');
        const userData = await response.json();
        setIsAdmin(userData.role === 'admin');
      } catch (error) {
        console.error('Erro ao verificar status de administrador:', error);
      }
    };

    checkAdminStatus();
  }, []);

  const { data: paymentSettings, isLoading } = useQuery({
    queryKey: ['/api/settings/payment'],
    retry: false,
  });

  const updatePaymentSettings = useMutation({
    mutationFn: async (data: PaymentSettingsFormValues) => {
      const response = await apiRequest('PUT', '/api/settings/payment', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('settings.payment.success'),
        description: t('settings.payment.successDescription'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings/payment'] });
    },
    onError: (error) => {
      toast({
        title: t('settings.payment.error'),
        description: error.message || t('settings.payment.errorDescription'),
        variant: 'destructive',
      });
    },
  });

  const form = useForm<PaymentSettingsFormValues>({
    resolver: zodResolver(paymentSettingsSchema),
    defaultValues: {
      eupagoApiKey: '',
      enabledPaymentMethods: {
        card: true,
        mbway: true,
        multibanco: true,
        bankTransfer: true,
        cash: true,
      },
    },
  });

  useEffect(() => {
    if (paymentSettings) {
      form.reset({
        eupagoApiKey: paymentSettings.eupagoApiKey || '',
        enabledPaymentMethods: {
          card: paymentSettings.enabledPaymentMethods?.card ?? true,
          mbway: paymentSettings.enabledPaymentMethods?.mbway ?? true,
          multibanco: paymentSettings.enabledPaymentMethods?.multibanco ?? true,
          bankTransfer: paymentSettings.enabledPaymentMethods?.bankTransfer ?? true,
          cash: paymentSettings.enabledPaymentMethods?.cash ?? true,
        },
      });
    }
  }, [paymentSettings, form]);

  function onSubmit(data: PaymentSettingsFormValues) {
    updatePaymentSettings.mutate(data);
  }

  if (isLoading) {
    return <div className="flex justify-center p-10">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" 
      aria-label={t('common.loading')}/>
    </div>;
  }

  return (
    <AdminLayout>
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>{t('settings.payment.title')}</CardTitle>
          <CardDescription>
            {t('settings.payment.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="eupagoApiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.payment.eupagoApiKey')}</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" />
                    </FormControl>
                    <FormDescription>
                      {t('settings.payment.eupagoApiKeyDesc')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <h3 className="text-lg font-medium">{t('settings.payment.availableMethods')}</h3>
                <div className="border rounded-md p-4 space-y-3">
                  <FormField
                    control={form.control}
                    name="enabledPaymentMethods.card"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>{t('paymentMethods.card')}</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="enabledPaymentMethods.mbway"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>{t('paymentMethods.mbway')}</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="enabledPaymentMethods.multibanco"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>{t('paymentMethods.multibanco')}</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="enabledPaymentMethods.bankTransfer"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>{t('paymentMethods.bankTransfer')}</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  {isAdmin && (
                    <FormField
                      control={form.control}
                      name="enabledPaymentMethods.cash"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>{t('paymentMethods.cash')}</FormLabel>
                            <FormDescription>
                              {t('paymentMethods.cashAdminOnly')}
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full md:w-auto"
                disabled={updatePaymentSettings.isPending}
              >
                {updatePaymentSettings.isPending ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                ) : null}
                {t('common.save')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}