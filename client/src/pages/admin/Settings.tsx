import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Schema para configurações gerais
const generalSettingsSchema = {
  restaurantName: '',
  email: '',
  phone: '',
  website: '',
  address: '',
  openingTime: '',
  closingTime: '',
  description: ''
};

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isAdmin, isLoading, user } = useAuth();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Estado para controlar a aba ativa
  const [activeTab, setActiveTab] = useState(1);
  
  // Estado para o formulário de configurações gerais
  const [generalSettings, setGeneralSettings] = useState(generalSettingsSchema);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verificar autenticação
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      setLocation('/admin');
    }
  }, [isAuthenticated, isAdmin, isLoading, setLocation]);

  // Função para alternar abas
  const switchTab = (tabNumber: number) => {
    setActiveTab(tabNumber);
  };

  // Função para lidar com mudanças nos inputs
  const handleInputChange = (field: string, value: string) => {
    setGeneralSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Função para salvar configurações
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Simular salvamento (aqui você pode integrar com sua API)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Configurações salvas!",
        description: "As configurações foram atualizadas com sucesso.",
      });
      
      // Feedback visual no botão
      const submitBtn = document.querySelector('#submit-btn') as HTMLButtonElement;
      if (submitBtn) {
        submitBtn.innerHTML = '<i class="mr-2 fa-solid fa-circle-check"></i>Salvo!';
        submitBtn.classList.add('bg-blue-600');
        setTimeout(() => {
          submitBtn.innerHTML = '<i class="mr-2 fa-solid fa-floppy-disk"></i>Salvar Configurações';
          submitBtn.classList.remove('bg-blue-600');
        }, 1600);
      }
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para sair
  const handleLogout = () => {
    setLocation('/');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 font-opensans min-h-screen">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="fixed top-0 left-0 flex flex-col w-64 h-full bg-blue-800" style={{ backgroundColor: '#002776' }}>
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 mr-2 rounded-full" style={{ backgroundColor: '#ffdf00' }}>
                <i className="fa-solid fa-utensils" style={{ color: '#002776' }}></i>
              </div>
              <span className="text-xl font-semibold text-white font-montserrat">
                Opa que delicia
              </span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <ul>
              <li className="px-6 py-3">
                <span className="flex items-center p-2 text-white rounded-lg cursor-pointer hover:bg-blue-700 hover:bg-opacity-40" onClick={() => setLocation('/admin')}>
                  <i className="w-6 fa-solid fa-chart-line" style={{ color: '#ffdf00' }}></i>
                  <span className="ml-2 font-medium">Dashboard</span>
                </span>
              </li>
              <li className="px-6 py-3">
                <span className="flex items-center p-2 text-white rounded-lg cursor-pointer hover:bg-blue-700 hover:bg-opacity-40" onClick={() => setLocation('/admin/customers')}>
                  <i className="w-6 fa-solid fa-users" style={{ color: '#ffdf00' }}></i>
                  <span className="ml-2 font-medium">Clientes</span>
                </span>
              </li>
              <li className="px-6 py-3">
                <span className="flex items-center p-2 text-white rounded-lg cursor-pointer hover:bg-blue-700 hover:bg-opacity-40" onClick={() => setLocation('/admin/menu')}>
                  <i className="w-6 fa-solid fa-book-open" style={{ color: '#ffdf00' }}></i>
                  <span className="ml-2 font-medium">Gestão do Menu</span>
                </span>
              </li>
              <li className="px-6 py-3">
                <span className="flex items-center p-2 text-white rounded-lg cursor-pointer hover:bg-blue-700 hover:bg-opacity-40" onClick={() => setLocation('/admin/tables')}>
                  <i className="w-6 fa-solid fa-chair" style={{ color: '#ffdf00' }}></i>
                  <span className="ml-2 font-medium">Mesas</span>
                </span>
              </li>
              <li className="px-6 py-3">
                <span className="flex items-center p-2 text-white rounded-lg cursor-pointer hover:bg-blue-700 hover:bg-opacity-40" onClick={() => setLocation('/admin/finance')}>
                  <i className="w-6 fa-solid fa-coins" style={{ color: '#ffdf00' }}></i>
                  <span className="ml-2 font-medium">Finanças</span>
                </span>
              </li>
              <li className="px-6 py-3">
                <span className="flex items-center p-2 text-white rounded-lg cursor-pointer hover:bg-blue-700 hover:bg-opacity-40" onClick={() => setLocation('/admin/pos')}>
                  <i className="w-6 fa-solid fa-cash-register" style={{ color: '#ffdf00' }}></i>
                  <span className="ml-2 font-medium">Modo POS</span>
                </span>
              </li>
              <li className="px-6 py-3">
                <span className="flex items-center p-2 text-white rounded-lg cursor-pointer hover:bg-blue-700 hover:bg-opacity-40" onClick={() => setLocation('/admin/reservations')}>
                  <i className="w-6 fa-solid fa-calendar-check" style={{ color: '#ffdf00' }}></i>
                  <span className="ml-2 font-medium">Reservas</span>
                </span>
              </li>
              <li className="px-6 py-3">
                <span className="flex items-center p-2 text-white rounded-lg cursor-pointer bg-blue-700 bg-opacity-40">
                  <i className="w-6 fa-solid fa-gear" style={{ color: '#ffdf00' }}></i>
                  <span className="ml-2 font-medium">Configurações</span>
                </span>
              </li>
            </ul>
          </div>
          
          <div className="p-4 mt-auto border-t border-blue-400">
            <span className="flex items-center p-2 mt-2 text-white rounded-lg cursor-pointer hover:bg-blue-700 hover:bg-opacity-40" onClick={handleLogout}>
              <i className="w-6 fa-solid fa-right-from-bracket" style={{ color: '#ffdf00' }}></i>
              <span className="ml-2 font-medium">Sair</span>
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 ml-64">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-gray-800 font-montserrat">Configurações</h1>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button className="relative">
                  <i className="text-xl text-gray-600 fa-regular fa-bell"></i>
                  <span className="absolute flex items-center justify-center w-4 h-4 text-xs text-white rounded-full -top-1 -right-1" style={{ backgroundColor: '#c8102e' }}>3</span>
                </button>
              </div>
              <div className="flex items-center">
                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg" alt="User Avatar" className="w-10 h-10 border-2 rounded-full" style={{ borderColor: '#ffdf00' }} />
                <div className="ml-2">
                  <p className="text-sm font-medium text-gray-800">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-gray-500">Administrador</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 bg-white shadow-md rounded-xl">
            {/* Tabs */}
            <div className="flex mb-8 space-x-2 border-b border-gray-200">
              <button 
                className={`px-5 py-3 -mb-px font-semibold border-b-4 rounded-t-md font-montserrat ${
                  activeTab === 1 
                    ? 'text-blue-800 border-blue-800 bg-gray-50' 
                    : 'text-gray-600 border-transparent hover:text-blue-800 bg-gray-50'
                }`}
                onClick={() => switchTab(1)}
              >
                <i className="mr-2 fa-solid fa-building" style={{ color: '#009c3b' }}></i>Configurações Gerais
              </button>
              <button 
                className={`px-5 py-3 -mb-px font-medium border-b-4 rounded-t-md font-montserrat ${
                  activeTab === 2 
                    ? 'text-blue-800 border-blue-800 bg-gray-50' 
                    : 'text-gray-600 border-transparent hover:text-blue-800 bg-gray-50'
                }`}
                onClick={() => switchTab(2)}
              >
                <i className="mr-2 fa-solid fa-globe" style={{ color: '#ffdf00' }}></i>Configurações de Página
              </button>
              <button 
                className={`px-5 py-3 -mb-px font-medium border-b-4 rounded-t-md font-montserrat ${
                  activeTab === 3 
                    ? 'text-blue-800 border-blue-800 bg-gray-50' 
                    : 'text-gray-600 border-transparent hover:text-blue-800 bg-gray-50'
                }`}
                onClick={() => switchTab(3)}
              >
                <i className="mr-2 fa-solid fa-calendar-check" style={{ color: '#002776' }}></i>Configurações de Reservas
              </button>
              <button 
                className={`px-5 py-3 -mb-px font-medium border-b-4 rounded-t-md font-montserrat ${
                  activeTab === 4 
                    ? 'text-blue-800 border-blue-800 bg-gray-50' 
                    : 'text-gray-600 border-transparent hover:text-blue-800 bg-gray-50'
                }`}
                onClick={() => switchTab(4)}
              >
                <i className="mr-2 fa-solid fa-credit-card" style={{ color: '#009c3b' }}></i>Configurações de Pagamento
              </button>
              <button 
                className={`px-5 py-3 -mb-px font-medium border-b-4 rounded-t-md font-montserrat ${
                  activeTab === 5 
                    ? 'text-blue-800 border-blue-800 bg-gray-50' 
                    : 'text-gray-600 border-transparent hover:text-blue-800 bg-gray-50'
                }`}
                onClick={() => switchTab(5)}
              >
                <i className="mr-2 fa-solid fa-bell" style={{ color: '#ffdf00' }}></i>Configuração de Notificações
              </button>
              <button 
                className={`px-5 py-3 -mb-px font-medium border-b-4 rounded-t-md font-montserrat ${
                  activeTab === 6 
                    ? 'text-blue-800 border-blue-800 bg-gray-50' 
                    : 'text-gray-600 border-transparent hover:text-blue-800 bg-gray-50'
                }`}
                onClick={() => switchTab(6)}
              >
                <i className="mr-2 fa-solid fa-cash-register" style={{ color: '#002776' }}></i>Configurações POS
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 1 && (
              <div>
                <form onSubmit={handleSaveSettings} className="space-y-8">
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <div>
                      <label htmlFor="restaurante-nome" className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">Nome do Restaurante</label>
                      <input 
                        id="restaurante-nome" 
                        type="text" 
                        className="w-full px-4 py-3 font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:outline-none bg-gray-50" 
                        placeholder="Opa que delicia"
                        value={generalSettings.restaurantName}
                        onChange={(e) => handleInputChange('restaurantName', e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="restaurante-email" className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">Email</label>
                      <input 
                        id="restaurante-email" 
                        type="email" 
                        className="w-full px-4 py-3 font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:outline-none bg-gray-50" 
                        placeholder="contato@opaquedelicia.com"
                        value={generalSettings.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="restaurante-telefone" className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">Telefone</label>
                      <input 
                        id="restaurante-telefone" 
                        type="tel" 
                        className="w-full px-4 py-3 font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:outline-none bg-gray-50" 
                        placeholder="(11) 98765-4321"
                        value={generalSettings.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="restaurante-website" className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">Website</label>
                      <input 
                        id="restaurante-website" 
                        type="url" 
                        className="w-full px-4 py-3 font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:outline-none bg-gray-50" 
                        placeholder="https://opaquedelicia.com"
                        value={generalSettings.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="restaurante-endereco" className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">Endereço</label>
                      <input 
                        id="restaurante-endereco" 
                        type="text" 
                        className="w-full px-4 py-3 font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:outline-none bg-gray-50" 
                        placeholder="Rua da Gastronomia, 123 - São Paulo, SP"
                        value={generalSettings.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    <div>
                      <label className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">Horário de Funcionamento</label>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-gray-500">Abertura</span>
                        <input 
                          id="restaurante-abertura" 
                          type="time" 
                          className="w-24 px-3 py-2 font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:outline-none bg-gray-50"
                          value={generalSettings.openingTime}
                          onChange={(e) => handleInputChange('openingTime', e.target.value)}
                        />
                        <span className="text-xs font-medium text-gray-500">Fechamento</span>
                        <input 
                          id="restaurante-fechamento" 
                          type="time" 
                          className="w-24 px-3 py-2 font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:outline-none bg-gray-50"
                          value={generalSettings.closingTime}
                          onChange={(e) => handleInputChange('closingTime', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="restaurante-descricao" className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">Descrição</label>
                      <textarea 
                        id="restaurante-descricao" 
                        rows={3} 
                        className="w-full px-4 py-3 font-semibold border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-800 focus:outline-none bg-gray-50" 
                        placeholder="Conte um pouco sobre o restaurante, especialidades, história, etc."
                        value={generalSettings.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button 
                      id="submit-btn"
                      type="submit" 
                      className="flex items-center px-6 py-3 text-base font-bold text-white transition-colors rounded-lg shadow hover:bg-green-700 font-montserrat"
                      style={{ backgroundColor: '#009c3b' }}
                      disabled={isSubmitting}
                    >
                      <i className="mr-2 fa-solid fa-floppy-disk"></i>
                      {isSubmitting ? 'Salvando...' : 'Salvar Configurações'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 2 && (
              <div>
                <form id="page-settings-form" className="space-y-8" onSubmit={handleSaveSettings}>
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <div>
                      <label htmlFor="page-title" className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">Título da Página</label>
                      <input 
                        id="page-title" 
                        type="text" 
                        className="w-full px-4 py-3 font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:outline-none bg-gray-50" 
                        placeholder="Opa que delicia - Restaurante Brasileiro" 
                      />
                    </div>
                    <div className="flex flex-col space-y-4">
                      <div>
                        <label className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">Insira a Logo</label>
                        <div className="flex items-center space-x-4">
                          <input 
                            id="page-logo" 
                            type="file" 
                            accept="image/*" 
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:text-white hover:file:bg-green-700"
                            style={{ 
                              '--file-bg': '#002776'
                            } as React.CSSProperties}
                          />
                          <img 
                            id="logo-preview" 
                            className="object-contain w-12 h-12 bg-gray-100 border rounded-md" 
                            src="" 
                            alt="" 
                            style={{display: 'none'}} 
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">Insira o Favicon</label>
                        <div className="flex items-center space-x-4">
                          <input 
                            id="page-favicon" 
                            type="file" 
                            accept="image/*" 
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:text-white hover:file:bg-green-700"
                            style={{ 
                              '--file-bg': '#ffdf00',
                              '--file-text': '#002776'
                            } as React.CSSProperties}
                          />
                          <img 
                            id="favicon-preview" 
                            className="object-contain w-8 h-8 bg-gray-100 border rounded-md" 
                            src="" 
                            alt="" 
                            style={{display: 'none'}} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <div>
                      <label htmlFor="nav-bar" className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">Barra de Navegação</label>
                      <textarea 
                        id="nav-bar" 
                        rows={2} 
                        className="w-full px-4 py-3 font-semibold border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-800 focus:outline-none bg-gray-50" 
                        placeholder="Ex: Home, Cardápio, Reservas, Sobre, Contato"
                      />
                    </div>
                    <div>
                      <label htmlFor="about-section" className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">Sobre</label>
                      <textarea 
                        id="about-section" 
                        rows={2} 
                        className="w-full px-4 py-3 font-semibold border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-800 focus:outline-none bg-gray-50" 
                        placeholder="Descrição da história, missão, valores, equipe"
                      />
                    </div>
                    <div>
                      <label htmlFor="location-contact" className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">Localização e Contato</label>
                      <textarea 
                        id="location-contact" 
                        rows={2} 
                        className="w-full px-4 py-3 font-semibold border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-800 focus:outline-none bg-gray-50" 
                        placeholder="Endereço, telefone, email"
                      />
                    </div>
                    <div>
                      <label htmlFor="testimonials" className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">Testemunhos</label>
                      <textarea 
                        id="testimonials" 
                        rows={2} 
                        className="w-full px-4 py-3 font-semibold border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-800 focus:outline-none bg-gray-50" 
                        placeholder="Comentários de clientes, avaliações"
                      />
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <label htmlFor="footer" className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">Footer</label>
                    <textarea 
                      id="footer" 
                      rows={2} 
                      className="w-full px-4 py-3 font-semibold border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-800 focus:outline-none bg-gray-50" 
                      placeholder="Informações de copyright, links, redes sociais"
                    />
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <button 
                      type="submit" 
                      className="flex items-center px-6 py-3 text-base font-bold text-white transition-colors rounded-lg shadow hover:bg-green-700 font-montserrat"
                      style={{ backgroundColor: '#009c3b' }}
                      disabled={isSubmitting}
                    >
                      <i className="mr-2 fa-solid fa-floppy-disk"></i>
                      {isSubmitting ? 'Salvando...' : 'Salvar Configurações'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 3 && (
              <div>
                <form id="reserva-settings-form" className="space-y-8" onSubmit={handleSaveSettings}>
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <div>
                      <label htmlFor="tempo-minimo" className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">Tempo mínimo para reserva (min)</label>
                      <input 
                        id="tempo-minimo" 
                        type="number" 
                        min="0" 
                        className="w-full px-4 py-3 font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:outline-none bg-gray-50" 
                        placeholder="30" 
                      />
                    </div>
                    <div>
                      <label htmlFor="dias-antecedencia" className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">Dias de reserva máxima antecipada</label>
                      <input 
                        id="dias-antecedencia" 
                        type="number" 
                        min="1" 
                        className="w-full px-4 py-3 font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:outline-none bg-gray-50" 
                        placeholder="30" 
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    <div className="flex items-center space-x-3">
                      <input 
                        type="checkbox" 
                        id="permite-cancelamento" 
                        className="w-5 h-5 border border-gray-300 rounded-md"
                        style={{ accentColor: '#009c3b' }}
                      />
                      <label htmlFor="permite-cancelamento" className="text-sm font-semibold text-gray-700 font-montserrat">Permitir que os clientes cancelem</label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input 
                        type="checkbox" 
                        id="requer-confirmacao" 
                        className="w-5 h-5 border border-gray-300 rounded-md"
                        style={{ accentColor: '#ffdf00' }}
                      />
                      <label htmlFor="requer-confirmacao" className="text-sm font-semibold text-gray-700 font-montserrat">Requer confirmação</label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input 
                        type="checkbox" 
                        id="confirmacao-automatica" 
                        className="w-5 h-5 border border-gray-300 rounded-md"
                        style={{ accentColor: '#002776' }}
                      />
                      <label htmlFor="confirmacao-automatica" className="text-sm font-semibold text-gray-700 font-montserrat">Confirmação automática da reserva</label>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <button 
                      type="submit" 
                      className="flex items-center px-6 py-3 text-base font-bold text-white transition-colors rounded-lg shadow hover:bg-green-700 font-montserrat"
                      style={{ backgroundColor: '#009c3b' }}
                      disabled={isSubmitting}
                    >
                      <i className="mr-2 fa-solid fa-floppy-disk"></i>
                      {isSubmitting ? 'Salvando...' : 'Salvar Configurações'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 4 && (
              <div>
                <form id="pagamento-settings-form" className="space-y-8" onSubmit={handleSaveSettings}>
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <div>
                      <label htmlFor="moeda-sistema" className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">Moeda do Sistema</label>
                      <select 
                        id="moeda-sistema" 
                        className="w-full px-4 py-3 font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:outline-none bg-gray-50"
                      >
                        <option value="BRL">Real Brasileiro (BRL)</option>
                        <option value="EUR">Euro (EUR)</option>
                        <option value="USD">Dólar Americano (USD)</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="taxa-impostos" className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">Taxa de Impostos (%)</label>
                      <input 
                        id="taxa-impostos" 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        className="w-full px-4 py-3 font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:outline-none bg-gray-50" 
                        placeholder="10.0" 
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center px-4 py-3 mb-2 border-l-4 rounded-lg" style={{ backgroundColor: 'rgba(255, 223, 0, 0.2)', borderColor: '#ffdf00' }}>
                    <i className="mr-3 text-lg fa-solid fa-lock" style={{ color: '#ffdf00' }}></i>
                    <span className="text-sm font-semibold" style={{ color: '#ffdf00' }}>
                      Chave de API para o serviço de pagamento EuPago. Esta informação é sensível e deve ser mantida segura.
                    </span>
                  </div>
                  
                  <div className="mb-2">
                    <label htmlFor="eupago-api-key" className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">Chave API do EuPago</label>
                    <input 
                      id="eupago-api-key" 
                      type="password" 
                      className="w-full px-4 py-3 font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:outline-none bg-gray-50" 
                      placeholder="Insira sua chave API" 
                    />
                    <span className="block mt-2 text-xs text-gray-400">
                      Requer chave API do EuPago para ativação para métodos de pagamento online
                    </span>
                  </div>
                  
                  <div className="mb-2">
                    <label className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">Métodos de Pagamento</label>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id="metodo-cc" 
                          className="w-5 h-5 border border-gray-300 rounded-md"
                          style={{ accentColor: '#009c3b' }}
                        />
                        <label htmlFor="metodo-cc" className="text-sm text-gray-700 font-montserrat">Cartão de Crédito/Débito</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id="metodo-mbway" 
                          className="w-5 h-5 border border-gray-300 rounded-md"
                          style={{ accentColor: '#ffdf00' }}
                        />
                        <label htmlFor="metodo-mbway" className="text-sm text-gray-700 font-montserrat">MBWay</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id="metodo-multibanco" 
                          className="w-5 h-5 border border-gray-300 rounded-md"
                          style={{ accentColor: '#002776' }}
                        />
                        <label htmlFor="metodo-multibanco" className="text-sm text-gray-700 font-montserrat">Multibanco</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id="metodo-transferencia" 
                          className="w-5 h-5 border border-gray-300 rounded-md"
                          style={{ accentColor: '#009c3b' }}
                        />
                        <label htmlFor="metodo-transferencia" className="text-sm text-gray-700 font-montserrat">Transferência Bancária</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id="metodo-dinheiro" 
                          className="w-5 h-5 border border-gray-300 rounded-md"
                          style={{ accentColor: '#ffdf00' }}
                        />
                        <label htmlFor="metodo-dinheiro" className="text-sm text-gray-700 font-montserrat">Dinheiro</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id="metodo-tpa" 
                          className="w-5 h-5 border border-gray-300 rounded-md"
                          style={{ accentColor: '#002776' }}
                        />
                        <label htmlFor="metodo-tpa" className="text-sm text-gray-700 font-montserrat">Multibanco (TPA)</label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <div className="flex items-center mt-2 space-x-3">
                      <input 
                        type="checkbox" 
                        id="exigir-prepagamento" 
                        className="w-5 h-5 border border-gray-300 rounded-md"
                        style={{ accentColor: '#009c3b' }}
                      />
                      <label htmlFor="exigir-prepagamento" className="text-sm font-semibold text-gray-700 font-montserrat">Exigir Pré-pagamento</label>
                    </div>
                    <div className="flex items-center mt-2 space-x-3">
                      <input 
                        type="checkbox" 
                        id="mostrar-precos-impostos" 
                        className="w-5 h-5 border border-gray-300 rounded-md"
                        style={{ accentColor: '#ffdf00' }}
                      />
                      <label htmlFor="mostrar-precos-impostos" className="text-sm font-semibold text-gray-700 font-montserrat">Mostrar preços com impostos</label>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <button 
                      type="submit" 
                      className="flex items-center px-6 py-3 text-base font-bold text-white transition-colors rounded-lg shadow hover:bg-green-700 font-montserrat"
                      style={{ backgroundColor: '#009c3b' }}
                      disabled={isSubmitting}
                    >
                      <i className="mr-2 fa-solid fa-floppy-disk"></i>
                      {isSubmitting ? 'Salvando...' : 'Salvar Configurações'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 5 && (
              <div className="flex flex-col items-center justify-center h-56 text-gray-400">
                <i className="mb-3 text-3xl fa-solid fa-bell"></i>
                <span className="font-semibold">Configuração de Notificações<br /><span className="text-sm font-normal text-gray-400">(Em breve)</span></span>
              </div>
            )}

            {activeTab === 6 && (
              <div className="flex flex-col items-center justify-center h-56 text-gray-400">
                <i className="mb-3 text-3xl fa-solid fa-cash-register"></i>
                <span className="font-semibold">Configurações POS<br /><span className="text-sm font-normal text-gray-400">(Em breve)</span></span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;