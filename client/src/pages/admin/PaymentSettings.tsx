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
import { AlertCircle, CreditCard, Smartphone, Landmark, Key, Settings, Check, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { usePaymentSettings, type PaymentSettings as PaymentSettingsType } from '@/hooks/usePaymentSettings';
import Swal from 'sweetalert2';

export default function PaymentSettings() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  // Hook personalizado com Realtime
  const { 
    settings, 
    isLoading: isLoadingSettings, 
    error, 
    updateSettings, 
    hasValidApiKey 
  } = usePaymentSettings();
  
  // Estados locais do componente
  const [localApiKey, setLocalApiKey] = useState('');
  const [localEnabledMethods, setLocalEnabledMethods] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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

  // Sincronizar estados locais com configurações do hook
  useEffect(() => {
    if (settings) {
      console.log('🔄 [PaymentSettings] Sincronizando estado local com configurações:', settings);
      setLocalApiKey(settings.eupago_api_key || '');
      setLocalEnabledMethods(settings.enabled_methods || []);
      setHasUnsavedChanges(false);
    }
  }, [settings]);

  // Detectar mudanças não salvas
  useEffect(() => {
    if (!settings) return;
    
    const hasChanges = 
      localApiKey !== (settings.eupago_api_key || '') ||
      JSON.stringify(localEnabledMethods.sort()) !== JSON.stringify((settings.enabled_methods || []).sort());
    
    setHasUnsavedChanges(hasChanges);
  }, [localApiKey, localEnabledMethods, settings]);

  // Handler para mudança da API Key
  const handleApiKeyChange = (value: string) => {
    setLocalApiKey(value);
  };

  // Handler para alternar método de pagamento
  const togglePaymentMethod = (methodId: string, enabled: boolean) => {
    const currentApiKey = localApiKey.trim();
    if (!currentApiKey) return; // Só permite mudanças se há API Key

    setLocalEnabledMethods(prev => 
      enabled 
        ? [...prev, methodId]
        : prev.filter(m => m !== methodId)
    );
  };

  // Salvar configurações
  const handleSave = async () => {
    // Validação da API Key
    if (!localApiKey.trim()) {
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
      console.log('💾 [PaymentSettings] Salvando configurações locais:', {
        eupago_api_key: localApiKey,
        enabled_methods: localEnabledMethods
      });

      await updateSettings({
        eupago_api_key: localApiKey,
        enabled_methods: localEnabledMethods
      });

      Swal.fire({
        title: 'Sucesso!',
        text: 'Configurações de pagamento salvas com sucesso!',
        icon: 'success',
        timer: 3000,
        showConfirmButton: false
      });

    } catch (error) {
      console.error('❌ [PaymentSettings] Erro ao salvar:', error);
      Swal.fire({
        title: 'Erro!',
        text: error instanceof Error ? error.message : 'Não foi possível salvar as configurações. Tente novamente.',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Validar se a API Key local é válida
  const hasValidLocalApiKey = Boolean(localApiKey && localApiKey.trim().length > 0);

  // Loading state
  if (isLoading || isLoadingSettings) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-gray-600">Carregando configurações de pagamento...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro ao carregar configurações</h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Settings className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Configurações de Pagamento</h1>
          </div>
          
          {/* Indicador de conexão Realtime */}
          <div className="flex items-center gap-2">
            {hasValidApiKey ? (
              <div className="flex items-center gap-2 text-green-600">
                <Wifi className="w-4 h-4" />
                <span className="text-sm">Tempo Real Ativo</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-400">
                <WifiOff className="w-4 h-4" />
                <span className="text-sm">Aguardando API Key</span>
              </div>
            )}
          </div>
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
                  value={localApiKey}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  className="font-mono"
                />
                <p className="text-sm text-gray-500">
                  Esta chave será usada para processar pagamentos através da Eupago.
                </p>
              </div>

              {hasValidLocalApiKey && (
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="w-4 h-4" />
                  <span className="text-sm">API Key configurada</span>
                </div>
              )}
              
              {hasUnsavedChanges && (
                <div className="flex items-center gap-2 text-orange-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Alterações não salvas</span>
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
              {!hasValidLocalApiKey && (
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
                  const isEnabled = localEnabledMethods.includes(method.id);
                  const isDisabled = !hasValidLocalApiKey;

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
              disabled={isSaving || !hasValidLocalApiKey || !hasUnsavedChanges}
              className="min-w-[120px]"
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </div>
              ) : hasUnsavedChanges ? (
                'Salvar Configurações'
              ) : (
                'Configurações Salvas'
              )}
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}