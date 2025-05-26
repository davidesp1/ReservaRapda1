import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Building, 
  Globe, 
  Calendar, 
  CreditCard, 
  Bell, 
  Monitor,
  Save
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import Swal from 'sweetalert2';

interface Settings {
  restaurantName: string;
  restaurantEmail: string;
  restaurantPhone: string;
  restaurantAddress: string;
  restaurantWebsite: string;
  openingTime: string;
  closingTime: string;
  restaurantDescription: string;
  pageTitle: string;
  navBar: string;
  aboutSection: string;
  locationContact: string;
  testimonials: string;
  footer: string;
  minReservationTime: number;
  maxReservationDays: number;
  allowCancellation: boolean;
  requireConfirmation: boolean;
  automaticConfirmation: boolean;
  currency: string;
  taxRate: number;
  eupagoApiKey: string;
  allowCard: boolean;
  allowMbway: boolean;
  allowMultibanco: boolean;
  allowTransfer: boolean;
  allowCash: boolean;
}

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(1);
  
  const [formData, setFormData] = useState<Settings>({
    restaurantName: 'Opa que delicia',
    restaurantEmail: 'contato@opaquedelicia.com',
    restaurantPhone: '(11) 98765-4321',
    restaurantAddress: 'Rua da Gastronomia, 123 - São Paulo, SP',
    restaurantWebsite: 'https://opaquedelicia.com',
    openingTime: '09:00',
    closingTime: '22:00',
    restaurantDescription: '',
    pageTitle: 'Opa que delicia - Restaurante Brasileiro',
    navBar: 'Home, Cardápio, Reservas, Sobre, Contato',
    aboutSection: '',
    locationContact: '',
    testimonials: '',
    footer: '',
    minReservationTime: 30,
    maxReservationDays: 30,
    allowCancellation: true,
    requireConfirmation: false,
    automaticConfirmation: true,
    currency: 'BRL',
    taxRate: 10.0,
    eupagoApiKey: '',
    allowCard: false,
    allowMbway: false,
    allowMultibanco: false,
    allowTransfer: false,
    allowCash: true,
  });

  // Fetch settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/settings'],
    queryFn: () => apiRequest('/api/settings')
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (data: Settings) => apiRequest('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json'
      }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      Swal.fire({
        title: 'Sucesso!',
        text: 'Configurações atualizadas com sucesso!',
        icon: 'success',
        confirmButtonColor: '#009c3b'
      });
    },
    onError: () => {
      Swal.fire({
        title: 'Erro!',
        text: 'Erro ao atualizar configurações.',
        icon: 'error',
        confirmButtonColor: '#c8102e'
      });
    }
  });

  useEffect(() => {
    if (settings) {
      setFormData(prev => ({ ...prev, ...settings }));
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof Settings, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const switchTab = (tabNumber: number) => {
    setActiveTab(tabNumber);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brasil-green"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 font-montserrat">Configurações</h1>
        <p className="text-gray-600 mt-2">Gerencie as configurações do seu restaurante</p>
      </div>

      <Card className="p-8 bg-white shadow-md rounded-xl">
        {/* Tabs Navigation */}
        <div className="flex mb-8 space-x-2 border-b border-gray-200 overflow-x-auto">
          {[
            { id: 1, icon: Building, label: 'Configurações Gerais', color: 'text-brasil-green' },
            { id: 2, icon: Globe, label: 'Configurações de Página', color: 'text-yellow-500' },
            { id: 3, icon: Calendar, label: 'Configurações de Reservas', color: 'text-brasil-blue' },
            { id: 4, icon: CreditCard, label: 'Configurações de Pagamento', color: 'text-brasil-green' },
            { id: 5, icon: Bell, label: 'Configuração de Notificações', color: 'text-yellow-500' },
            { id: 6, icon: Monitor, label: 'Configurações POS', color: 'text-brasil-blue' }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                className={`px-5 py-3 -mb-px font-medium border-b-4 transition-all duration-300 whitespace-nowrap rounded-t-md font-montserrat ${
                  activeTab === tab.id
                    ? 'text-brasil-blue border-brasil-blue bg-gray-50 font-semibold'
                    : 'text-gray-600 border-transparent hover:text-brasil-blue bg-gray-50'
                }`}
              >
                <Icon className={`mr-2 inline w-4 h-4 ${tab.color}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Tab Content 1 - Configurações Gerais */}
          {activeTab === 1 && (
            <div className="tab-content transition-all duration-500 ease-in-out">
              <div className="space-y-8">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div>
                    <Label htmlFor="restaurante-nome" className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">
                      Nome do Restaurante
                    </Label>
                    <Input
                      id="restaurante-nome"
                      value={formData.restaurantName}
                      onChange={(e) => handleInputChange('restaurantName', e.target.value)}
                      className="w-full px-4 py-3 font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-brasil-blue focus:outline-none bg-gray-50"
                      placeholder="Opa que delicia"
                    />
                  </div>
                  <div>
                    <Label htmlFor="restaurante-email" className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">
                      Email
                    </Label>
                    <Input
                      id="restaurante-email"
                      type="email"
                      value={formData.restaurantEmail}
                      onChange={(e) => handleInputChange('restaurantEmail', e.target.value)}
                      className="w-full px-4 py-3 font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-brasil-blue focus:outline-none bg-gray-50"
                      placeholder="contato@opaquedelicia.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="restaurante-telefone" className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">
                      Telefone
                    </Label>
                    <Input
                      id="restaurante-telefone"
                      type="tel"
                      value={formData.restaurantPhone}
                      onChange={(e) => handleInputChange('restaurantPhone', e.target.value)}
                      className="w-full px-4 py-3 font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-brasil-blue focus:outline-none bg-gray-50"
                      placeholder="(11) 98765-4321"
                    />
                  </div>
                  <div>
                    <Label htmlFor="restaurante-website" className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">
                      Website
                    </Label>
                    <Input
                      id="restaurante-website"
                      type="url"
                      value={formData.restaurantWebsite}
                      onChange={(e) => handleInputChange('restaurantWebsite', e.target.value)}
                      className="w-full px-4 py-3 font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-brasil-blue focus:outline-none bg-gray-50"
                      placeholder="https://opaquedelicia.com"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="restaurante-endereco" className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">
                      Endereço
                    </Label>
                    <Input
                      id="restaurante-endereco"
                      value={formData.restaurantAddress}
                      onChange={(e) => handleInputChange('restaurantAddress', e.target.value)}
                      className="w-full px-4 py-3 font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-brasil-blue focus:outline-none bg-gray-50"
                      placeholder="Rua da Gastronomia, 123 - São Paulo, SP"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                  <div>
                    <Label className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">
                      Horário de Funcionamento
                    </Label>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-gray-500">Abertura</span>
                      <Input
                        id="restaurante-abertura"
                        type="time"
                        value={formData.openingTime}
                        onChange={(e) => handleInputChange('openingTime', e.target.value)}
                        className="w-24 px-3 py-2 font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-brasil-blue focus:outline-none bg-gray-50"
                      />
                      <span className="text-xs font-medium text-gray-500">Fechamento</span>
                      <Input
                        id="restaurante-fechamento"
                        type="time"
                        value={formData.closingTime}
                        onChange={(e) => handleInputChange('closingTime', e.target.value)}
                        className="w-24 px-3 py-2 font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-brasil-blue focus:outline-none bg-gray-50"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="restaurante-descricao" className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">
                      Descrição
                    </Label>
                    <Textarea
                      id="restaurante-descricao"
                      rows={3}
                      value={formData.restaurantDescription}
                      onChange={(e) => handleInputChange('restaurantDescription', e.target.value)}
                      className="w-full px-4 py-3 font-semibold border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-brasil-blue focus:outline-none bg-gray-50"
                      placeholder="Conte um pouco sobre o restaurante, especialidades, história, etc."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 2 - Configurações de Página */}
          {activeTab === 2 && (
            <div className="tab-content transition-all duration-500 ease-in-out">
              <div className="space-y-8">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div>
                    <Label htmlFor="page-title" className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">
                      Título da Página
                    </Label>
                    <Input
                      id="page-title"
                      value={formData.pageTitle}
                      onChange={(e) => handleInputChange('pageTitle', e.target.value)}
                      className="w-full px-4 py-3 font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-brasil-blue focus:outline-none bg-gray-50"
                      placeholder="Opa que delicia - Restaurante Brasileiro"
                    />
                  </div>
                  <div className="flex flex-col space-y-4">
                    <div>
                      <Label className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">
                        Insira a Logo
                      </Label>
                      <div className="flex items-center space-x-4">
                        <Input
                          id="page-logo"
                          type="file"
                          accept="image/*"
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brasil-blue file:text-white hover:file:bg-brasil-green"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">
                        Insira o Favicon
                      </Label>
                      <div className="flex items-center space-x-4">
                        <Input
                          id="page-favicon"
                          type="file"
                          accept="image/*"
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-brasil-blue hover:file:bg-brasil-green"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div>
                    <Label htmlFor="nav-bar" className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">
                      Barra de Navegação
                    </Label>
                    <Textarea
                      id="nav-bar"
                      rows={2}
                      value={formData.navBar}
                      onChange={(e) => handleInputChange('navBar', e.target.value)}
                      className="w-full px-4 py-3 font-semibold border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-brasil-blue focus:outline-none bg-gray-50"
                      placeholder="Ex: Home, Cardápio, Reservas, Sobre, Contato"
                    />
                  </div>
                  <div>
                    <Label htmlFor="about-section" className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">
                      Sobre
                    </Label>
                    <Textarea
                      id="about-section"
                      rows={2}
                      value={formData.aboutSection}
                      onChange={(e) => handleInputChange('aboutSection', e.target.value)}
                      className="w-full px-4 py-3 font-semibold border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-brasil-blue focus:outline-none bg-gray-50"
                      placeholder="Descrição da história, missão, valores, equipe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location-contact" className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">
                      Localização e Contato
                    </Label>
                    <Textarea
                      id="location-contact"
                      rows={2}
                      value={formData.locationContact}
                      onChange={(e) => handleInputChange('locationContact', e.target.value)}
                      className="w-full px-4 py-3 font-semibold border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-brasil-blue focus:outline-none bg-gray-50"
                      placeholder="Endereço, telefone, email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="testimonials" className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">
                      Testemunhos
                    </Label>
                    <Textarea
                      id="testimonials"
                      rows={2}
                      value={formData.testimonials}
                      onChange={(e) => handleInputChange('testimonials', e.target.value)}
                      className="w-full px-4 py-3 font-semibold border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-brasil-blue focus:outline-none bg-gray-50"
                      placeholder="Comentários de clientes, avaliações"
                    />
                  </div>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="footer" className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">
                    Footer
                  </Label>
                  <Textarea
                    id="footer"
                    rows={2}
                    value={formData.footer}
                    onChange={(e) => handleInputChange('footer', e.target.value)}
                    className="w-full px-4 py-3 font-semibold border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-brasil-blue focus:outline-none bg-gray-50"
                    placeholder="Informações de copyright, links, redes sociais"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 3 - Configurações de Reservas */}
          {activeTab === 3 && (
            <div className="tab-content transition-all duration-500 ease-in-out">
              <div className="space-y-8">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div>
                    <Label htmlFor="tempo-minimo" className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">
                      Tempo mínimo para reserva (min)
                    </Label>
                    <Input
                      id="tempo-minimo"
                      type="number"
                      min="0"
                      value={formData.minReservationTime}
                      onChange={(e) => handleInputChange('minReservationTime', parseInt(e.target.value))}
                      className="w-full px-4 py-3 font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-brasil-blue focus:outline-none bg-gray-50"
                      placeholder="30"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dias-antecedencia" className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">
                      Dias de reserva máxima antecipada
                    </Label>
                    <Input
                      id="dias-antecedencia"
                      type="number"
                      min="1"
                      value={formData.maxReservationDays}
                      onChange={(e) => handleInputChange('maxReservationDays', parseInt(e.target.value))}
                      className="w-full px-4 py-3 font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-brasil-blue focus:outline-none bg-gray-50"
                      placeholder="30"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="permite-cancelamento"
                      checked={formData.allowCancellation}
                      onCheckedChange={(checked) => handleInputChange('allowCancellation', checked)}
                      className="w-5 h-5 border border-gray-300 rounded-md accent-brasil-green"
                    />
                    <Label htmlFor="permite-cancelamento" className="text-sm font-semibold text-gray-700 font-montserrat">
                      Permitir que os clientes cancelem
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="requer-confirmacao"
                      checked={formData.requireConfirmation}
                      onCheckedChange={(checked) => handleInputChange('requireConfirmation', checked)}
                      className="w-5 h-5 border border-gray-300 rounded-md accent-yellow-500"
                    />
                    <Label htmlFor="requer-confirmacao" className="text-sm font-semibold text-gray-700 font-montserrat">
                      Requer confirmação
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="confirmacao-automatica"
                      checked={formData.automaticConfirmation}
                      onCheckedChange={(checked) => handleInputChange('automaticConfirmation', checked)}
                      className="w-5 h-5 border border-gray-300 rounded-md accent-brasil-blue"
                    />
                    <Label htmlFor="confirmacao-automatica" className="text-sm font-semibold text-gray-700 font-montserrat">
                      Confirmação automática da reserva
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 4 - Configurações de Pagamento */}
          {activeTab === 4 && (
            <div className="tab-content transition-all duration-500 ease-in-out">
              <div className="space-y-8">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div>
                    <Label htmlFor="moeda-sistema" className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">
                      Moeda do Sistema
                    </Label>
                    <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                      <SelectTrigger className="w-full px-4 py-3 font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-brasil-blue focus:outline-none bg-gray-50">
                        <SelectValue placeholder="Selecione a moeda" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BRL">Real Brasileiro (BRL)</SelectItem>
                        <SelectItem value="EUR">Euro (EUR)</SelectItem>
                        <SelectItem value="USD">Dólar Americano (USD)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="taxa-impostos" className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">
                      Taxa de Impostos (%)
                    </Label>
                    <Input
                      id="taxa-impostos"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.taxRate}
                      onChange={(e) => handleInputChange('taxRate', parseFloat(e.target.value))}
                      className="w-full px-4 py-3 font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-brasil-blue focus:outline-none bg-gray-50"
                      placeholder="10.0"
                    />
                  </div>
                </div>
                <div className="flex items-center px-4 py-3 mb-2 border-l-4 rounded-lg bg-yellow-500/20 border-yellow-500">
                  <Monitor className="mr-3 text-lg text-yellow-500" />
                  <span className="text-sm font-semibold text-yellow-500">
                    Chave de API para o serviço de pagamento EuPago. Esta informação é sensível e deve ser mantida segura.
                  </span>
                </div>
                <div className="mb-2">
                  <Label htmlFor="eupago-api-key" className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">
                    Chave API do EuPago
                  </Label>
                  <Input
                    id="eupago-api-key"
                    type="password"
                    value={formData.eupagoApiKey}
                    onChange={(e) => handleInputChange('eupagoApiKey', e.target.value)}
                    className="w-full px-4 py-3 font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-brasil-blue focus:outline-none bg-gray-50"
                    placeholder="Insira sua chave API"
                  />
                  <span className="block mt-2 text-xs text-gray-400">
                    Requer chave API do EuPago para ativação para métodos de pagamento online
                  </span>
                </div>
                <div className="mb-2">
                  <Label className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">
                    Métodos de Pagamento
                  </Label>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="metodo-cc"
                        checked={formData.allowCard}
                        onCheckedChange={(checked) => handleInputChange('allowCard', checked)}
                        className="w-5 h-5 border border-gray-300 rounded-md accent-brasil-green"
                      />
                      <Label htmlFor="metodo-cc" className="text-sm text-gray-700 font-montserrat">
                        Cartão de Crédito/Débito
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="metodo-mbway"
                        checked={formData.allowMbway}
                        onCheckedChange={(checked) => handleInputChange('allowMbway', checked)}
                        className="w-5 h-5 border border-gray-300 rounded-md accent-yellow-500"
                      />
                      <Label htmlFor="metodo-mbway" className="text-sm text-gray-700 font-montserrat">
                        MBWay
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="metodo-multibanco"
                        checked={formData.allowMultibanco}
                        onCheckedChange={(checked) => handleInputChange('allowMultibanco', checked)}
                        className="w-5 h-5 border border-gray-300 rounded-md accent-brasil-blue"
                      />
                      <Label htmlFor="metodo-multibanco" className="text-sm text-gray-700 font-montserrat">
                        Multibanco
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="metodo-transferencia"
                        checked={formData.allowTransfer}
                        onCheckedChange={(checked) => handleInputChange('allowTransfer', checked)}
                        className="w-5 h-5 border border-gray-300 rounded-md accent-brasil-green"
                      />
                      <Label htmlFor="metodo-transferencia" className="text-sm text-gray-700 font-montserrat">
                        Transferência Bancária
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="metodo-dinheiro"
                        checked={formData.allowCash}
                        onCheckedChange={(checked) => handleInputChange('allowCash', checked)}
                        className="w-5 h-5 border border-gray-300 rounded-md accent-yellow-500"
                      />
                      <Label htmlFor="metodo-dinheiro" className="text-sm text-gray-700 font-montserrat">
                        Dinheiro
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 5 - Configurações de Notificações */}
          {activeTab === 5 && (
            <div className="tab-content transition-all duration-500 ease-in-out">
              <div className="space-y-8">
                <div className="text-center py-8">
                  <Bell className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Configurações de Notificações</h3>
                  <p className="text-gray-500">
                    As configurações de notificações serão implementadas em breve.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 6 - Configurações POS */}
          {activeTab === 6 && (
            <div className="tab-content transition-all duration-500 ease-in-out">
              <div className="space-y-8">
                <div className="text-center py-8">
                  <Monitor className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Configurações POS</h3>
                  <p className="text-gray-500">
                    As configurações do sistema POS serão implementadas em breve.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button 
              type="submit" 
              disabled={updateSettingsMutation.isPending}
              className="flex items-center px-6 py-3 text-base font-bold text-white transition-colors rounded-lg shadow bg-brasil-green hover:bg-green-700 font-montserrat"
            >
              {updateSettingsMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Configurações
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Settings;