import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Building, 
  Globe, 
  Calendar, 
  CreditCard, 
  Bell, 
  ShoppingCart,
  Save,
  RotateCcw,
  Printer,
  FileText
} from 'lucide-react';

export const NewSettings = () => {
  const [activeTab, setActiveTab] = useState(1);
  const [settings, setSettings] = useState<any>({});
  const queryClient = useQueryClient();

  // Buscar configurações
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['/api/settings'],
    retry: false,
  });

  useEffect(() => {
    if (settingsData) {
      setSettings(settingsData);
    }
  }, [settingsData]);

  // Mutation para salvar configurações
  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: any) => {
      const response = await apiRequest('POST', '/api/settings', newSettings);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Configurações salvas",
        description: "As configurações foram atualizadas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Ocorreu um erro ao salvar as configurações.",
        variant: "destructive",
      });
    },
  });

  const updateSetting = (key: string, value: any) => {
    setSettings((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    saveSettingsMutation.mutate(settings);
  };

  const resetMargins = () => {
    updateSetting('printMarginTop', 5);
    updateSetting('printMarginBottom', 5);
    updateSetting('printMarginLeft', 5);
    updateSetting('printMarginRight', 5);
    
    toast({
      title: "Margens restauradas",
      description: "Margens de impressão foram restauradas para 5px.",
    });
  };

  const TabButton = ({ tabId, icon: Icon, label, isActive, iconColor }: any) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`px-5 py-3 border-b-4 -mb-px rounded-t-md font-montserrat transition-all duration-200 flex items-center whitespace-nowrap ${
        isActive
          ? 'font-semibold text-blue-900 border-blue-900 bg-gray-50'
          : 'font-medium text-gray-600 border-transparent bg-gray-50 hover:text-blue-900'
      }`}
    >
      <Icon className={`w-4 h-4 mr-2 ${iconColor}`} />
      {label}
    </button>
  );

  if (isLoading) {
    return (
      <AdminLayout title="Configurações">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Configurações">
      <div className="bg-white rounded-xl shadow-md p-4 md:p-8">
        {/* Tabs Navigation */}
        <div className="flex space-x-2 mb-8 border-b border-gray-200 overflow-x-auto">
          <TabButton 
            tabId={1} 
            icon={Building} 
            label="Configurações Gerais" 
            isActive={activeTab === 1} 
            iconColor="text-green-600" 
          />
          <TabButton 
            tabId={2} 
            icon={Globe} 
            label="Configurações de Página" 
            isActive={activeTab === 2} 
            iconColor="text-yellow-500" 
          />
          <TabButton 
            tabId={3} 
            icon={Calendar} 
            label="Configurações de Reservas" 
            isActive={activeTab === 3} 
            iconColor="text-blue-800" 
          />
          <TabButton 
            tabId={4} 
            icon={CreditCard} 
            label="Configurações de Pagamento" 
            isActive={activeTab === 4} 
            iconColor="text-green-600" 
          />
          <TabButton 
            tabId={5} 
            icon={Bell} 
            label="Configuração de Notificações" 
            isActive={activeTab === 5} 
            iconColor="text-yellow-500" 
          />
          <TabButton 
            tabId={6} 
            icon={ShoppingCart} 
            label="Configurações POS" 
            isActive={activeTab === 6} 
            iconColor="text-blue-800" 
          />
        </div>

        {/* Tab Content */}
        {activeTab === 1 && (
          <div className="space-y-8">
            {/* Dados Gerais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">Nome do Restaurante</label>
                <input
                  type="text"
                  value={settings.restaurantName || ''}
                  onChange={(e) => updateSetting('restaurantName', e.target.value)}
                  placeholder="Opa que delicia"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-800 focus:outline-none font-semibold bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">Email</label>
                <input
                  type="email"
                  value={settings.restaurantEmail || ''}
                  onChange={(e) => updateSetting('restaurantEmail', e.target.value)}
                  placeholder="contato@opaquedelicia.com"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-800 focus:outline-none font-semibold bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">Telefone</label>
                <input
                  type="tel"
                  value={settings.restaurantPhone || ''}
                  onChange={(e) => updateSetting('restaurantPhone', e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-800 focus:outline-none font-semibold bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">Website</label>
                <input
                  type="url"
                  value={settings.restaurantWebsite || ''}
                  onChange={(e) => updateSetting('restaurantWebsite', e.target.value)}
                  placeholder="https://opaquedelicia.com"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-800 focus:outline-none font-semibold bg-gray-50"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">Endereço</label>
                <input
                  type="text"
                  value={settings.restaurantAddress || ''}
                  onChange={(e) => updateSetting('restaurantAddress', e.target.value)}
                  placeholder="Rua da Gastronomia, 123 - São Paulo, SP"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-800 focus:outline-none font-semibold bg-gray-50"
                />
              </div>
            </div>

            {/* Horário de Funcionamento */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">Horário de Funcionamento</label>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-gray-500">Abertura</span>
                  <input
                    type="time"
                    value={settings.openingTime || ''}
                    onChange={(e) => updateSetting('openingTime', e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-800 focus:outline-none bg-gray-50 font-semibold w-24"
                  />
                  <span className="text-xs font-medium text-gray-500">Fechamento</span>
                  <input
                    type="time"
                    value={settings.closingTime || ''}
                    onChange={(e) => updateSetting('closingTime', e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-800 focus:outline-none bg-gray-50 font-semibold w-24"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">Descrição</label>
                <textarea
                  value={settings.restaurantDescription || ''}
                  onChange={(e) => updateSetting('restaurantDescription', e.target.value)}
                  placeholder="Conte um pouco sobre o restaurante, especialidades, história, etc."
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-800 focus:outline-none font-semibold bg-gray-50 resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2 - Configurações de Página */}
        {activeTab === 2 && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">Título da Página</label>
                <input
                  type="text"
                  value={settings.pageTitle || ''}
                  onChange={(e) => updateSetting('pageTitle', e.target.value)}
                  placeholder="Opa que delicia - Restaurante Brasileiro"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-800 focus:outline-none font-semibold bg-gray-50"
                />
              </div>
              <div className="flex flex-col space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">Insira a Logo</label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          updateSetting('logoFile', file);
                        }
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-800 file:text-white hover:file:bg-green-600"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">Insira o Favicon</label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          updateSetting('faviconFile', file);
                        }
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-blue-800 hover:file:bg-green-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">Barra de Navegação</label>
                <textarea
                  value={settings.navBar || ''}
                  onChange={(e) => updateSetting('navBar', e.target.value)}
                  placeholder="Ex: Home, Cardápio, Reservas, Sobre, Contato"
                  rows={2}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-800 focus:outline-none font-semibold bg-gray-50 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">Sobre</label>
                <textarea
                  value={settings.aboutSection || ''}
                  onChange={(e) => updateSetting('aboutSection', e.target.value)}
                  placeholder="Descrição da história, missão, valores, equipe"
                  rows={2}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-800 focus:outline-none font-semibold bg-gray-50 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">Localização e Contato</label>
                <textarea
                  value={settings.locationContact || ''}
                  onChange={(e) => updateSetting('locationContact', e.target.value)}
                  placeholder="Endereço, telefone, email"
                  rows={2}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-800 focus:outline-none font-semibold bg-gray-50 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">Testemunhos</label>
                <textarea
                  value={settings.testimonials || ''}
                  onChange={(e) => updateSetting('testimonials', e.target.value)}
                  placeholder="Comentários de clientes, avaliações"
                  rows={2}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-800 focus:outline-none font-semibold bg-gray-50 resize-none"
                />
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">Footer</label>
              <textarea
                value={settings.footer || ''}
                onChange={(e) => updateSetting('footer', e.target.value)}
                placeholder="Informações de copyright, links, redes sociais"
                rows={2}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-800 focus:outline-none font-semibold bg-gray-50 resize-none"
              />
            </div>
          </div>
        )}

        {/* Tab 3 - Configurações de Reservas */}
        {activeTab === 3 && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">Tempo mínimo para reserva (min)</label>
                <input
                  type="number"
                  min="0"
                  value={settings.minReservationTime || ''}
                  onChange={(e) => updateSetting('minReservationTime', Number(e.target.value))}
                  placeholder="30"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-800 focus:outline-none font-semibold bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">Dias de reserva máxima antecipada</label>
                <input
                  type="number"
                  min="1"
                  value={settings.maxAdvanceReservationDays || ''}
                  onChange={(e) => updateSetting('maxAdvanceReservationDays', Number(e.target.value))}
                  placeholder="30"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-800 focus:outline-none font-semibold bg-gray-50"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.allowCancellation || false}
                  onChange={(e) => updateSetting('allowCancellation', e.target.checked)}
                  className="accent-green-600 w-5 h-5 rounded-md border border-gray-300"
                />
                <label className="text-sm font-semibold text-gray-700 font-montserrat">Permitir que os clientes cancelem</label>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.requireConfirmation || false}
                  onChange={(e) => updateSetting('requireConfirmation', e.target.checked)}
                  className="accent-yellow-500 w-5 h-5 rounded-md border border-gray-300"
                />
                <label className="text-sm font-semibold text-gray-700 font-montserrat">Requer confirmação</label>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.autoConfirmation || false}
                  onChange={(e) => updateSetting('autoConfirmation', e.target.checked)}
                  className="accent-blue-800 w-5 h-5 rounded-md border border-gray-300"
                />
                <label className="text-sm font-semibold text-gray-700 font-montserrat">Confirmação automática da reserva</label>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4 - Configurações de Pagamento */}
        {activeTab === 4 && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">Moeda do Sistema</label>
                <select 
                  value={settings.systemCurrency || 'EUR'} 
                  onChange={(e) => updateSetting('systemCurrency', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-800 focus:outline-none font-semibold bg-gray-50"
                >
                  <option value="BRL">Real Brasileiro (BRL)</option>
                  <option value="EUR">Euro (EUR)</option>
                  <option value="USD">Dólar Americano (USD)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">Taxa de Impostos (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={settings.taxRate || ''}
                  onChange={(e) => updateSetting('taxRate', Number(e.target.value))}
                  placeholder="10.0"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-800 focus:outline-none font-semibold bg-gray-50"
                />
              </div>
            </div>
            
            <div className="bg-yellow-500/20 border-l-4 border-yellow-500 px-4 py-3 rounded-lg flex items-center mb-2">
              <FileText className="text-yellow-500 mr-3 text-lg" />
              <span className="text-sm font-semibold text-yellow-600">Chave de API para o serviço de pagamento EuPago. Esta informação é sensível e deve ser mantida segura.</span>
            </div>
            
            <div className="mb-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">Chave API do EuPago</label>
              <input
                type="password"
                value={settings.eupagoApiKey || ''}
                onChange={(e) => updateSetting('eupagoApiKey', e.target.value)}
                placeholder="Insira sua chave API"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-800 focus:outline-none font-semibold bg-gray-50"
              />
              <span className="block text-xs text-gray-400 mt-2">Requer chave API do EuPago para ativação para métodos de pagamento online</span>
            </div>
            
            <div className="mb-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-montserrat">Métodos de Pagamento</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.acceptCard || false}
                    onChange={(e) => updateSetting('acceptCard', e.target.checked)}
                    className="accent-green-600 w-5 h-5 rounded-md border border-gray-300"
                  />
                  <label className="text-sm text-gray-700 font-montserrat">Cartão de Crédito/Débito</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.acceptMBWay || false}
                    onChange={(e) => updateSetting('acceptMBWay', e.target.checked)}
                    className="accent-yellow-500 w-5 h-5 rounded-md border border-gray-300"
                  />
                  <label className="text-sm text-gray-700 font-montserrat">MBWay</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.acceptMultibanco || false}
                    onChange={(e) => updateSetting('acceptMultibanco', e.target.checked)}
                    className="accent-blue-800 w-5 h-5 rounded-md border border-gray-300"
                  />
                  <label className="text-sm text-gray-700 font-montserrat">Multibanco</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.acceptBankTransfer || false}
                    onChange={(e) => updateSetting('acceptBankTransfer', e.target.checked)}
                    className="accent-green-600 w-5 h-5 rounded-md border border-gray-300"
                  />
                  <label className="text-sm text-gray-700 font-montserrat">Transferência Bancária</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.acceptCash || false}
                    onChange={(e) => updateSetting('acceptCash', e.target.checked)}
                    className="accent-yellow-500 w-5 h-5 rounded-md border border-gray-300"
                  />
                  <label className="text-sm text-gray-700 font-montserrat">Dinheiro</label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5 - Configurações de Notificações */}
        {activeTab === 5 && (
          <div className="space-y-8">
            <div className="text-center text-gray-500 py-8">
              <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Configurações de Notificações</p>
              <p className="text-sm">Esta seção estará disponível em breve.</p>
            </div>
          </div>
        )}

        {/* Tab 6 - Configurações POS */}
        {activeTab === 6 && (
          <div className="space-y-8">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-semibold text-gray-700 font-montserrat flex items-center">
                  <Printer className="w-5 h-5 mr-2 text-blue-800" />
                  Configurações de Impressão
                </h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1">Margem Superior (px)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="50"
                    value={settings.printMarginTop || 5}
                    onChange={(e) => updateSetting('printMarginTop', Number(e.target.value))}
                    className="text-center"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1">Margem Inferior (px)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="50"
                    value={settings.printMarginBottom || 5}
                    onChange={(e) => updateSetting('printMarginBottom', Number(e.target.value))}
                    className="text-center"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1">Margem Esquerda (px)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="50"
                    value={settings.printMarginLeft || 5}
                    onChange={(e) => updateSetting('printMarginLeft', Number(e.target.value))}
                    className="text-center"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1">Margem Direita (px)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="50"
                    value={settings.printMarginRight || 5}
                    onChange={(e) => updateSetting('printMarginRight', Number(e.target.value))}
                    className="text-center"
                  />
                </div>
              </div>
              
              <div className="flex justify-center">
                <Button
                  onClick={resetMargins}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restaurar Margens (5px)
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={handleSave}
            disabled={saveSettingsMutation.isPending}
            className="flex items-center px-6 py-3 bg-green-600 text-white font-bold rounded-lg shadow hover:bg-green-700 transition-colors text-base font-montserrat"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveSettingsMutation.isPending ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default NewSettings;