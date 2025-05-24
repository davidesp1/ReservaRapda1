import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CreditCard, Smartphone, Landmark, Key, Settings, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Swal from 'sweetalert2';

interface PaymentSettings {
  id?: number;
  eupago_api_key: string;
  enabled_methods: string[];
}

export default function PaymentSettings() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  // Estados do componente
  const [settings, setSettings] = useState<PaymentSettings>({
    eupago_api_key: '',
    enabled_methods: []
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasValidApiKey, setHasValidApiKey] = useState(false);

  // Métodos de pagamento disponíveis
  const paymentMethods = [
    {
      id: 'card',
      name: 'Cartão de Crédito/Débito',
      description: 'Pagamentos com cartão via gateway Eupago',
      icon: CreditCard,
      color: 'text-blue-600'
    },
    {
      id: 'mbway',
      name: 'MB Way',
      description: 'Pagamentos através do MB Way',
      icon: Smartphone,
      color: 'text-green-600'
    },
    {
      id: 'multibanco',
      name: 'Multibanco',
      description: 'Referência Multibanco para pagamento',
      icon: Landmark,
      color: 'text-purple-600'
    }
  ];

  // Verificar autenticação
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      setLocation('/login');
    }
  }, [isAuthenticated, isAdmin, isLoading, setLocation]);

  // Carregar configurações do Supabase
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        console.log('🔍 Carregando configurações de pagamento...');
        
        const { data, error } = await supabase
          .from('payment_settings')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('❌ Erro ao carregar configurações:', error);
          throw error;
        }

        if (data && data.length > 0) {
          const currentSettings = data[0];
          console.log('✅ Configurações carregadas:', currentSettings);
          
          setSettings({
            id: currentSettings.id,
            eupago_api_key: currentSettings.eupago_api_key || '',
            enabled_methods: currentSettings.enabled_methods || []
          });
        } else {
          console.log('ℹ️ Nenhuma configuração encontrada, usando valores padrão');
        }
      } catch (error) {
        console.error('❌ Erro ao buscar configurações:', error);
        Swal.fire({
          title: 'Erro!',
          text: 'Não foi possível carregar as configurações de pagamento.',
          icon: 'error',
          confirmButtonText: 'Ok'
        });
      } finally {
        setIsLoadingSettings(false);
      }
    };

    if (!isLoading && isAuthenticated && isAdmin) {
      fetchSettings();
    }
  }, [isAuthenticated, isAdmin, isLoading]);

  // Validar API Key
  useEffect(() => {
    const apiKey = settings.eupago_api_key.trim();
    setHasValidApiKey(apiKey.length > 0);
  }, [settings.eupago_api_key]);

  // Handler para mudança da API Key
  const handleApiKeyChange = (value: string) => {
    setSettings(prev => ({
      ...prev,
      eupago_api_key: value
    }));
  };

  // Handler para alternar método de pagamento
  const togglePaymentMethod = (methodId: string, enabled: boolean) => {
    if (!hasValidApiKey) return;

    setSettings(prev => ({
      ...prev,
      enabled_methods: enabled 
        ? [...prev.enabled_methods, methodId]
        : prev.enabled_methods.filter(m => m !== methodId)
    }));
  };

  // Salvar configurações
  const handleSave = async () => {
    // Validação da API Key
    if (!settings.eupago_api_key.trim()) {
      Swal.fire({
        title: 'Atenção!',
        text: 'Por favor, insira a API Key da Eupago antes de salvar.',
        icon: 'warning',
        confirmButtonText: 'Ok'
      });
      return;
    }

    setIsSaving(true);

    try {
      console.log('💾 Salvando configurações:', settings);

      const dataToSave = {
        eupago_api_key: settings.eupago_api_key.trim(),
        enabled_methods: settings.enabled_methods,
        updated_at: new Date().toISOString()
      };

      let result;
      
      if (settings.id) {
        // Update existente
        result = await supabase
          .from('payment_settings')
          .update(dataToSave)
          .eq('id', settings.id)
          .select();
      } else {
        // Insert novo
        result = await supabase
          .from('payment_settings')
          .insert([{
            ...dataToSave,
            created_at: new Date().toISOString()
          }])
          .select();
      }

      const { data, error } = result;

      if (error) {
        console.error('❌ Erro ao salvar:', error);
        throw error;
      }

      console.log('✅ Configurações salvas com sucesso:', data);

      // Atualizar estado local com o ID retornado
      if (data && data.length > 0) {
        setSettings(prev => ({
          ...prev,
          id: data[0].id
        }));
      }

      Swal.fire({
        title: 'Sucesso!',
        text: 'Configurações de pagamento salvas com sucesso!',
        icon: 'success',
        timer: 3000,
        showConfirmButton: false
      });

    } catch (error) {
      console.error('❌ Erro ao salvar configurações:', error);
      Swal.fire({
        title: 'Erro!',
        text: 'Não foi possível salvar as configurações. Tente novamente.',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (isLoading || isLoadingSettings) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Configurações de Pagamento</h1>
        </div>

        <div className="space-y-6">
          {/* Configuração da API Key */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5 text-yellow-600" />
                API Key da Eupago
              </CardTitle>
              <CardDescription>
                Configure sua chave de API para habilitar os métodos de pagamento da Eupago.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">Chave da API</Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder="Insira sua API Key da Eupago"
                  value={settings.eupago_api_key}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  className="font-mono"
                />
                <p className="text-sm text-gray-500">
                  Esta chave será usada para processar pagamentos através da Eupago.
                </p>
              </div>

              {hasValidApiKey && (
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="w-4 h-4" />
                  <span className="text-sm">API Key configurada</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Métodos de Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle>Métodos de Pagamento</CardTitle>
              <CardDescription>
                Selecione quais métodos de pagamento estarão disponíveis para seus clientes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!hasValidApiKey && (
                <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <p className="text-sm text-yellow-800">
                    Insira sua API Key da Eupago para ativar estas opções.
                  </p>
                </div>
              )}

              <div className="grid gap-4">
                {paymentMethods.map((method) => {
                  const IconComponent = method.icon;
                  const isEnabled = settings.enabled_methods.includes(method.id);
                  const isDisabled = !hasValidApiKey;

                  return (
                    <div
                      key={method.id}
                      className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                        isDisabled
                          ? 'bg-gray-50 border-gray-200'
                          : isEnabled
                          ? 'bg-green-50 border-green-200'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <IconComponent className={`w-6 h-6 ${isDisabled ? 'text-gray-400' : method.color}`} />
                        <div>
                          <h3 className={`font-medium ${isDisabled ? 'text-gray-500' : 'text-gray-900'}`}>
                            {method.name}
                          </h3>
                          <p className={`text-sm ${isDisabled ? 'text-gray-400' : 'text-gray-500'}`}>
                            {method.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isEnabled && !isDisabled && (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Ativo
                          </Badge>
                        )}
                        <Switch
                          checked={isEnabled && !isDisabled}
                          disabled={isDisabled}
                          onCheckedChange={(checked) => togglePaymentMethod(method.id, checked)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Botão de Salvar */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={isSaving || !hasValidApiKey}
              className="min-w-[120px]"
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Salvando...
                </div>
              ) : (
                'Salvar Configurações'
              )}
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}