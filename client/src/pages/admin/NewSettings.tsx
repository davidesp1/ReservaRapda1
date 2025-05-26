import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Building, Globe, Calendar, CreditCard, Bell, 
  ShoppingCart, Save, Printer, Palette, FileText,
  RotateCcw, Monitor
} from 'lucide-react';

const NewSettings: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(1);
  const [settings, setSettings] = useState<any>({});

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
      const response = await apiRequest('PUT', '/api/settings', newSettings);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "Configurações salvas",
        description: "As configurações foram atualizadas com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Ocorreu um erro ao salvar as configurações.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveSettingsMutation.mutate(settings);
  };

  const updateSetting = (key: string, value: any) => {
    setSettings((prev: any) => ({
      ...prev,
      [key]: value
    }));
  };

  const resetPrintMargins = () => {
    setSettings((prev: any) => ({
      ...prev,
      printMarginTop: 5,
      printMarginBottom: 5,
      printMarginLeft: 5,
      printMarginRight: 5,
    }));
    toast({
      title: "Margens resetadas",
      description: "Margens de impressão foram restauradas para 5px.",
    });
  };

  const TabButton = ({ tabId, icon: Icon, label, isActive }: any) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`px-5 py-3 font-semibold border-b-4 -mb-px rounded-t-md font-montserrat transition-all duration-200 flex items-center ${
        isActive
          ? 'text-brasil-blue border-brasil-blue bg-gray-50'
          : 'text-gray-600 border-transparent bg-gray-50 hover:text-brasil-blue'
      }`}
    >
      <Icon className="w-4 h-4 mr-2" />
      {label}
    </button>
  );

  if (isLoading) {
    return (
      <AdminLayout title="Configurações">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brasil-green"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Configurações">
      <div className="bg-white rounded-xl shadow-md p-8">
        {/* Tabs Navigation */}
        <div className="flex space-x-2 mb-8 border-b border-gray-200 overflow-x-auto">
          <TabButton tabId={1} icon={Building} label="Configurações Gerais" isActive={activeTab === 1} />
          <TabButton tabId={2} icon={Globe} label="Configurações de Página" isActive={activeTab === 2} />
          <TabButton tabId={3} icon={Calendar} label="Configurações de Reservas" isActive={activeTab === 3} />
          <TabButton tabId={4} icon={CreditCard} label="Configurações de Pagamento" isActive={activeTab === 4} />
          <TabButton tabId={5} icon={Bell} label="Configuração de Notificações" isActive={activeTab === 5} />
          <TabButton tabId={6} icon={ShoppingCart} label="Configurações POS" isActive={activeTab === 6} />
        </div>

        {/* Tab Content */}
        {activeTab === 1 && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 font-montserrat">Nome do Restaurante</Label>
                <Input
                  value={settings.restaurantName || ''}
                  onChange={(e) => updateSetting('restaurantName', e.target.value)}
                  placeholder="Opa que delicia"
                  className="bg-gray-50 font-semibold"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 font-montserrat">Email</Label>
                <Input
                  type="email"
                  value={settings.restaurantEmail || ''}
                  onChange={(e) => updateSetting('restaurantEmail', e.target.value)}
                  placeholder="contato@opaquedelicia.com"
                  className="bg-gray-50 font-semibold"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 font-montserrat">Telefone</Label>
                <Input
                  type="tel"
                  value={settings.restaurantPhone || ''}
                  onChange={(e) => updateSetting('restaurantPhone', e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="bg-gray-50 font-semibold"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 font-montserrat">Website</Label>
                <Input
                  type="url"
                  value={settings.restaurantWebsite || ''}
                  onChange={(e) => updateSetting('restaurantWebsite', e.target.value)}
                  placeholder="https://opaquedelicia.com"
                  className="bg-gray-50 font-semibold"
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm font-semibold text-gray-700 mb-2 font-montserrat">Endereço</Label>
                <Input
                  value={settings.restaurantAddress || ''}
                  onChange={(e) => updateSetting('restaurantAddress', e.target.value)}
                  placeholder="Rua da Gastronomia, 123 - São Paulo, SP"
                  className="bg-gray-50 font-semibold"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 font-montserrat">Horário de Funcionamento</Label>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-gray-500">Abertura</span>
                  <Input
                    type="time"
                    value={settings.openingTime || ''}
                    onChange={(e) => updateSetting('openingTime', e.target.value)}
                    className="bg-gray-50 font-semibold w-24"
                  />
                  <span className="text-xs font-medium text-gray-500">Fechamento</span>
                  <Input
                    type="time"
                    value={settings.closingTime || ''}
                    onChange={(e) => updateSetting('closingTime', e.target.value)}
                    className="bg-gray-50 font-semibold w-24"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm font-semibold text-gray-700 mb-2 font-montserrat">Descrição</Label>
                <Textarea
                  value={settings.restaurantDescription || ''}
                  onChange={(e) => updateSetting('restaurantDescription', e.target.value)}
                  placeholder="Conte um pouco sobre o restaurante, especialidades, história, etc."
                  rows={3}
                  className="bg-gray-50 font-semibold resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 6 && (
          <div className="space-y-8">
            <h3 className="text-lg font-bold text-gray-800 font-montserrat mb-6">Configurações do Sistema POS</h3>
            
            {/* Configurações de Impressão */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-semibold text-gray-700 font-montserrat flex items-center">
                  <Printer className="w-5 h-5 mr-2 text-brasil-blue" />
                  Configurações de Impressão
                </h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2">Impressora Principal</Label>
                  <Select value={settings.defaultPrinter || ''} onValueChange={(value) => updateSetting('defaultPrinter', value)}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Selecionar impressora" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="thermal_58mm">Térmica 58mm</SelectItem>
                      <SelectItem value="thermal_80mm">Térmica 80mm</SelectItem>
                      <SelectItem value="laser_a4">Laser A4</SelectItem>
                      <SelectItem value="inkjet">Jato de Tinta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2">Tamanho do Papel</Label>
                  <Select value={settings.paperSize || ''} onValueChange={(value) => updateSetting('paperSize', value)}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Selecionar tamanho" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="58mm">58mm (Térmica)</SelectItem>
                      <SelectItem value="80mm">80mm (Térmica)</SelectItem>
                      <SelectItem value="a4">A4 (210x297mm)</SelectItem>
                      <SelectItem value="letter">Letter (216x279mm)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Margens de Impressão */}
              <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h5 className="text-sm font-semibold text-gray-700">Margens de Impressão (em pixels)</h5>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={resetPrintMargins}
                    className="text-xs"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Reset Margens
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs text-gray-600">Superior</Label>
                    <Input
                      type="number"
                      value={settings.printMarginTop || 5}
                      onChange={(e) => updateSetting('printMarginTop', Number(e.target.value))}
                      className="bg-white text-center"
                      min="0"
                      max="50"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Inferior</Label>
                    <Input
                      type="number"
                      value={settings.printMarginBottom || 5}
                      onChange={(e) => updateSetting('printMarginBottom', Number(e.target.value))}
                      className="bg-white text-center"
                      min="0"
                      max="50"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Esquerda</Label>
                    <Input
                      type="number"
                      value={settings.printMarginLeft || 5}
                      onChange={(e) => updateSetting('printMarginLeft', Number(e.target.value))}
                      className="bg-white text-center"
                      min="0"
                      max="50"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Direita</Label>
                    <Input
                      type="number"
                      value={settings.printMarginRight || 5}
                      onChange={(e) => updateSetting('printMarginRight', Number(e.target.value))}
                      className="bg-white text-center"
                      min="0"
                      max="50"
                    />
                  </div>
                </div>
              </div>

              {/* Configurações de Fonte */}
              <div className="mt-6">
                <h5 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Configurações de Fonte
                </h5>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-gray-600">Tamanho da Fonte</Label>
                    <Select value={settings.fontSize || '12'} onValueChange={(value) => updateSetting('fontSize', value)}>
                      <SelectTrigger className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10px</SelectItem>
                        <SelectItem value="12">12px</SelectItem>
                        <SelectItem value="14">14px</SelectItem>
                        <SelectItem value="16">16px</SelectItem>
                        <SelectItem value="18">18px</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-xs text-gray-600">Família da Fonte</Label>
                    <Select value={settings.fontFamily || 'monospace'} onValueChange={(value) => updateSetting('fontFamily', value)}>
                      <SelectTrigger className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monospace">Monospace</SelectItem>
                        <SelectItem value="arial">Arial</SelectItem>
                        <SelectItem value="courier">Courier New</SelectItem>
                        <SelectItem value="helvetica">Helvetica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs text-gray-600">Estilo da Fonte</Label>
                    <Select value={settings.fontWeight || 'normal'} onValueChange={(value) => updateSetting('fontWeight', value)}>
                      <SelectTrigger className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="bold">Negrito</SelectItem>
                        <SelectItem value="lighter">Leve</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Opções de Conteúdo do Recibo */}
              <div className="mt-6">
                <h5 className="text-sm font-semibold text-gray-700 mb-4">Conteúdo do Recibo</h5>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={settings.printLogo || false}
                      onCheckedChange={(checked) => updateSetting('printLogo', checked)}
                    />
                    <Label className="text-sm text-gray-700">Imprimir Logo</Label>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={settings.printAddress || true}
                      onCheckedChange={(checked) => updateSetting('printAddress', checked)}
                    />
                    <Label className="text-sm text-gray-700">Imprimir Endereço</Label>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={settings.printPhone || true}
                      onCheckedChange={(checked) => updateSetting('printPhone', checked)}
                    />
                    <Label className="text-sm text-gray-700">Imprimir Telefone</Label>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={settings.printTax || true}
                      onCheckedChange={(checked) => updateSetting('printTax', checked)}
                    />
                    <Label className="text-sm text-gray-700">Imprimir Impostos</Label>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={settings.printOrderId || true}
                      onCheckedChange={(checked) => updateSetting('printOrderId', checked)}
                    />
                    <Label className="text-sm text-gray-700">Imprimir Nº do Pedido</Label>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={settings.printDateTime || true}
                      onCheckedChange={(checked) => updateSetting('printDateTime', checked)}
                    />
                    <Label className="text-sm text-gray-700">Imprimir Data/Hora</Label>
                  </div>
                </div>
              </div>

              {/* Configurações Avançadas */}
              <div className="mt-6">
                <h5 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                  <Monitor className="w-4 h-4 mr-2" />
                  Configurações Avançadas
                </h5>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={settings.autoPrint || false}
                      onCheckedChange={(checked) => updateSetting('autoPrint', checked)}
                    />
                    <Label className="text-sm text-gray-700">Impressão Automática</Label>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={settings.openCashDrawer || false}
                      onCheckedChange={(checked) => updateSetting('openCashDrawer', checked)}
                    />
                    <Label className="text-sm text-gray-700">Abrir Gaveta Automaticamente</Label>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={settings.soundOnPrint || true}
                      onCheckedChange={(checked) => updateSetting('soundOnPrint', checked)}
                    />
                    <Label className="text-sm text-gray-700">Som na Impressão</Label>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={settings.cutPaper || true}
                      onCheckedChange={(checked) => updateSetting('cutPaper', checked)}
                    />
                    <Label className="text-sm text-gray-700">Cortar Papel Automaticamente</Label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2 - Configurações de Página */}
        {activeTab === 2 && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 font-montserrat">Título da Página</Label>
                <Input
                  value={settings.pageTitle || ''}
                  onChange={(e) => updateSetting('pageTitle', e.target.value)}
                  placeholder="Opa que delicia - Restaurante Brasileiro"
                  className="bg-gray-50 font-semibold"
                />
              </div>
              <div className="flex flex-col space-y-4">
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 font-montserrat">Insira a Logo</Label>
                  <div className="flex items-center space-x-4">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Handle file upload logic here
                          updateSetting('logoFile', file);
                        }
                      }}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brasil-blue file:text-white hover:file:bg-brasil-green"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 font-montserrat">Insira o Favicon</Label>
                  <div className="flex items-center space-x-4">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          updateSetting('faviconFile', file);
                        }
                      }}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brasil-yellow file:text-brasil-blue hover:file:bg-brasil-green"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 font-montserrat">Barra de Navegação</Label>
                <Textarea
                  value={settings.navigationBar || ''}
                  onChange={(e) => updateSetting('navigationBar', e.target.value)}
                  placeholder="Ex: Home, Cardápio, Reservas, Sobre, Contato"
                  rows={2}
                  className="bg-gray-50 font-semibold resize-none"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 font-montserrat">Sobre</Label>
                <Textarea
                  value={settings.aboutSection || ''}
                  onChange={(e) => updateSetting('aboutSection', e.target.value)}
                  placeholder="Descrição da história, missão, valores, equipe"
                  rows={2}
                  className="bg-gray-50 font-semibold resize-none"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 font-montserrat">Localização e Contato</Label>
                <Textarea
                  value={settings.locationContact || ''}
                  onChange={(e) => updateSetting('locationContact', e.target.value)}
                  placeholder="Endereço, telefone, email"
                  rows={2}
                  className="bg-gray-50 font-semibold resize-none"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 font-montserrat">Testemunhos</Label>
                <Textarea
                  value={settings.testimonials || ''}
                  onChange={(e) => updateSetting('testimonials', e.target.value)}
                  placeholder="Comentários de clientes, avaliações"
                  rows={2}
                  className="bg-gray-50 font-semibold resize-none"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 font-montserrat">Footer</Label>
              <Textarea
                value={settings.footer || ''}
                onChange={(e) => updateSetting('footer', e.target.value)}
                placeholder="Informações de copyright, links, redes sociais"
                rows={2}
                className="bg-gray-50 font-semibold resize-none"
              />
            </div>
          </div>
        )}

        {/* Tab 3 - Configurações de Reservas */}
        {activeTab === 3 && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 font-montserrat">Tempo mínimo para reserva (min)</Label>
                <Input
                  type="number"
                  min="0"
                  value={settings.minReservationTime || ''}
                  onChange={(e) => updateSetting('minReservationTime', Number(e.target.value))}
                  placeholder="30"
                  className="bg-gray-50 font-semibold"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 font-montserrat">Dias de reserva máxima antecipada</Label>
                <Input
                  type="number"
                  min="1"
                  value={settings.maxAdvanceDays || ''}
                  onChange={(e) => updateSetting('maxAdvanceDays', Number(e.target.value))}
                  placeholder="30"
                  className="bg-gray-50 font-semibold"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex items-center space-x-3">
                <Checkbox
                  checked={settings.allowCancellation || false}
                  onCheckedChange={(checked) => updateSetting('allowCancellation', checked)}
                />
                <Label className="text-sm font-semibold text-gray-700 font-montserrat">Permitir que os clientes cancelem</Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox
                  checked={settings.requireConfirmation || false}
                  onCheckedChange={(checked) => updateSetting('requireConfirmation', checked)}
                />
                <Label className="text-sm font-semibold text-gray-700 font-montserrat">Requer confirmação</Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox
                  checked={settings.autoConfirmation || false}
                  onCheckedChange={(checked) => updateSetting('autoConfirmation', checked)}
                />
                <Label className="text-sm font-semibold text-gray-700 font-montserrat">Confirmação automática da reserva</Label>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4 - Configurações de Pagamento */}
        {activeTab === 4 && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 font-montserrat">Moeda do Sistema</Label>
                <Select value={settings.systemCurrency || 'EUR'} onValueChange={(value) => updateSetting('systemCurrency', value)}>
                  <SelectTrigger className="bg-gray-50 font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BRL">Real Brasileiro (BRL)</SelectItem>
                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    <SelectItem value="USD">Dólar Americano (USD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 font-montserrat">Taxa de Impostos (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={settings.taxRate || ''}
                  onChange={(e) => updateSetting('taxRate', Number(e.target.value))}
                  placeholder="10.0"
                  className="bg-gray-50 font-semibold"
                />
              </div>
            </div>
            
            <div className="bg-brasil-yellow/20 border-l-4 border-brasil-yellow px-4 py-3 rounded-lg flex items-center mb-2">
              <FileText className="text-brasil-yellow mr-3 text-lg" />
              <span className="text-sm font-semibold text-brasil-yellow">Chave de API para o serviço de pagamento EuPago. Esta informação é sensível e deve ser mantida segura.</span>
            </div>
            
            <div className="mb-2">
              <Label className="text-sm font-semibold text-gray-700 mb-2 font-montserrat">Chave API do EuPago</Label>
              <Input
                type="password"
                value={settings.eupagoApiKey || ''}
                onChange={(e) => updateSetting('eupagoApiKey', e.target.value)}
                placeholder="Insira sua chave API"
                className="bg-gray-50 font-semibold"
              />
              <span className="block text-xs text-gray-400 mt-2">Requer chave API do EuPago para ativação para métodos de pagamento online</span>
            </div>
            
            <div className="mb-2">
              <Label className="text-sm font-semibold text-gray-700 mb-2 font-montserrat">Métodos de Pagamento</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={settings.acceptCard || false}
                    onCheckedChange={(checked) => updateSetting('acceptCard', checked)}
                  />
                  <Label className="text-sm text-gray-700 font-montserrat">Cartão de Crédito/Débito</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={settings.acceptMBWay || false}
                    onCheckedChange={(checked) => updateSetting('acceptMBWay', checked)}
                  />
                  <Label className="text-sm text-gray-700 font-montserrat">MBWay</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={settings.acceptMultibanco || false}
                    onCheckedChange={(checked) => updateSetting('acceptMultibanco', checked)}
                  />
                  <Label className="text-sm text-gray-700 font-montserrat">Multibanco</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={settings.acceptBankTransfer || false}
                    onCheckedChange={(checked) => updateSetting('acceptBankTransfer', checked)}
                  />
                  <Label className="text-sm text-gray-700 font-montserrat">Transferência Bancária</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={settings.acceptCash || false}
                    onCheckedChange={(checked) => updateSetting('acceptCash', checked)}
                  />
                  <Label className="text-sm text-gray-700 font-montserrat">Dinheiro</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={settings.acceptMultibancoTPA || false}
                    onCheckedChange={(checked) => updateSetting('acceptMultibancoTPA', checked)}
                  />
                  <Label className="text-sm text-gray-700 font-montserrat">Multibanco TPA</Label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5 - Configuração de Notificações */}
        {activeTab === 5 && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-700 font-montserrat">Notificações por Email</h4>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={settings.emailNotifications || false}
                    onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                  />
                  <Label className="text-sm text-gray-700 font-montserrat">Ativar notificações por email</Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={settings.emailNewReservations || false}
                    onCheckedChange={(checked) => updateSetting('emailNewReservations', checked)}
                  />
                  <Label className="text-sm text-gray-700 font-montserrat">Novas reservas</Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={settings.emailCancellations || false}
                    onCheckedChange={(checked) => updateSetting('emailCancellations', checked)}
                  />
                  <Label className="text-sm text-gray-700 font-montserrat">Cancelamentos</Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={settings.emailPayments || false}
                    onCheckedChange={(checked) => updateSetting('emailPayments', checked)}
                  />
                  <Label className="text-sm text-gray-700 font-montserrat">Pagamentos recebidos</Label>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-700 font-montserrat">Notificações SMS</h4>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={settings.smsNotifications || false}
                    onCheckedChange={(checked) => updateSetting('smsNotifications', checked)}
                  />
                  <Label className="text-sm text-gray-700 font-montserrat">Ativar notificações por SMS</Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={settings.smsReservationReminders || false}
                    onCheckedChange={(checked) => updateSetting('smsReservationReminders', checked)}
                  />
                  <Label className="text-sm text-gray-700 font-montserrat">Lembretes de reserva</Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={settings.smsPromotions || false}
                    onCheckedChange={(checked) => updateSetting('smsPromotions', checked)}
                  />
                  <Label className="text-sm text-gray-700 font-montserrat">Promoções e ofertas</Label>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 font-montserrat">Email do administrador</Label>
                <Input
                  type="email"
                  value={settings.adminEmail || ''}
                  onChange={(e) => updateSetting('adminEmail', e.target.value)}
                  placeholder="admin@opaquedelicia.com"
                  className="bg-gray-50 font-semibold"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 font-montserrat">Telefone para SMS</Label>
                <Input
                  type="tel"
                  value={settings.smsPhone || ''}
                  onChange={(e) => updateSetting('smsPhone', e.target.value)}
                  placeholder="+351 123 456 789"
                  className="bg-gray-50 font-semibold"
                />
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-6 border-t border-gray-200 mt-8">
          <Button
            onClick={handleSave}
            disabled={saveSettingsMutation.isPending}
            className="flex items-center px-6 py-3 bg-brasil-green text-white font-bold rounded-lg shadow hover:bg-green-700 transition-colors text-base font-montserrat"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveSettingsMutation.isPending ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default NewSettings;