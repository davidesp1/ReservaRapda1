import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, CreditCard, Smartphone, Building2, Banknote, PiggyBank, Zap } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Swal from 'sweetalert2';

import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { usePaymentSettings } from '@/hooks/usePaymentSettings';

const paymentSettingsSchema = z.object({
  eupagoApiKey: z.string().min(1, 'Chave API é obrigatória'),
  enabledMethods: z.array(z.string()).min(1, 'Selecione pelo menos um método de pagamento'),
});

type PaymentSettingsForm = z.infer<typeof paymentSettingsSchema>;

export default function PaymentSettings() {
  const { t } = useTranslation();
  const { settings, isLoading, error, updateSettings, hasValidApiKey } = usePaymentSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PaymentSettingsForm>({
    resolver: zodResolver(paymentSettingsSchema),
    defaultValues: {
      eupagoApiKey: '',
      enabledMethods: []
    }
  });

  // Atualizar formulário quando as configurações carregarem
  useEffect(() => {
    if (settings) {
      form.reset({
        eupagoApiKey: settings.eupago_api_key || '',
        enabledMethods: settings.enabled_methods || []
      });
    }
  }, [settings, form]);

  const onSubmit = async (data: PaymentSettingsForm) => {
    try {
      setIsSubmitting(true);
      console.log('💾 Salvando configurações:', data);

      await updateSettings({
        eupago_api_key: data.eupagoApiKey.trim(),
        enabled_methods: data.enabledMethods
      });

      await Swal.fire({
        icon: 'success',
        title: 'Sucesso!',
        text: 'Configurações de pagamento salvas com sucesso.',
        timer: 2000,
        showConfirmButton: false
      });

    } catch (err) {
      console.error('Erro ao salvar:', err);
      await Swal.fire({
        icon: 'error',
        title: 'Erro!',
        text: err instanceof Error ? err.message : 'Erro ao salvar configurações.',
        confirmButtonText: 'OK'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const methodOptions = [
    {
      id: 'card',
      icon: CreditCard,
      label: 'Cartão de Crédito/Débito',
      description: 'Aceitar pagamentos por cartão'
    },
    {
      id: 'mbway',
      icon: Smartphone,
      label: 'MB Way',
      description: 'Pagamentos via MB Way'
    },
    {
      id: 'multibanco',
      icon: Building2,
      label: 'Multibanco',
      description: 'Referência Multibanco'
    },
    {
      id: 'transfer',
      icon: Banknote,
      label: 'Transferência Bancária',
      description: 'Transferência direta'
    },
    {
      id: 'cash',
      icon: PiggyBank,
      label: 'Dinheiro',
      description: 'Pagamento em dinheiro'
    },
    {
      id: 'multibanco_tpa',
      icon: Zap,
      label: 'TPA Multibanco',
      description: 'Terminal de pagamento automático'
    }
  ];

  if (isLoading) {
    return (
      <AdminLayout title="Configurações de Pagamento">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              <span>Carregando configurações...</span>
            </div>
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Configurações de Pagamento">
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-red-600">
              <p className="font-medium">Erro ao carregar configurações</p>
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Configurações de Pagamento">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Configurações de Pagamento</h1>
          <p className="text-muted-foreground">
            Configure a integração com a EuPago e selecione os métodos de pagamento disponíveis
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Integração EuPago</CardTitle>
            <CardDescription>
              Configure sua chave API da EuPago para processar pagamentos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="eupagoApiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chave API EuPago</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Insira sua chave API do EuPago"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Sua chave API será usada para processar pagamentos com segurança
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">Métodos de Pagamento</Label>
                    <p className="text-sm text-muted-foreground">
                      {hasValidApiKey 
                        ? 'Selecione os métodos de pagamento que deseja aceitar'
                        : 'Configure uma chave API válida para habilitar os métodos de pagamento'
                      }
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="enabledMethods"
                    render={({ field }) => (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {methodOptions.map((method) => {
                          const Icon = method.icon;
                          const isChecked = field.value.includes(method.id);
                          
                          return (
                            <div
                              key={method.id}
                              className={`
                                flex items-center justify-between p-4 border rounded-lg transition-colors
                                ${hasValidApiKey ? 'hover:bg-muted/50' : 'opacity-50 cursor-not-allowed'}
                              `}
                            >
                              <div className="flex items-center space-x-3">
                                <Icon className="w-5 h-5 text-primary" />
                                <div>
                                  <p className="font-medium">{method.label}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {method.description}
                                  </p>
                                </div>
                              </div>
                              <Switch
                                checked={isChecked}
                                disabled={!hasValidApiKey}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    field.onChange([...field.value, method.id]);
                                  } else {
                                    field.onChange(field.value.filter(id => id !== method.id));
                                  }
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  />
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="min-w-[150px]"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        Salvando...
                      </div>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Configurações
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}