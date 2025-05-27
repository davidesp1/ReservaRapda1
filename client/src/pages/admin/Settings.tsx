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
  
  // Estado para configurações POS
  const [posSettings, setPosSettings] = useState<any>({});
  
  // Query para carregar configurações POS
  const { data: posData, isLoading: posLoading } = useQuery({
    queryKey: ['/api/settings/pos'],
    enabled: activeTab === 6,
  });

  // Query para carregar impressoras disponíveis
  const { data: availablePrinters = [] } = useQuery<any[]>({
    queryKey: ['/api/settings/pos/printers'],
    enabled: activeTab === 6,
  });

  // Mutation para salvar configurações POS
  const savePosSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      const response = await fetch('/api/settings/pos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao salvar configurações POS');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Configurações POS salvas",
        description: "As configurações foram salvas com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings/pos'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Erro ao salvar configurações POS",
        variant: "destructive",
      });
    },
  });

  // Carregar dados do POS quando a aba for ativada
  useEffect(() => {
    if (posData && activeTab === 6) {
      setPosSettings(posData);
    }
  }, [posData, activeTab]);
  
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

  // Função para atualizar configurações POS
  const handlePosSettingChange = (field: string, value: any) => {
    setPosSettings((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  // Função para salvar configurações POS
  const handleSavePosSettings = async () => {
    setIsSubmitting(true);
    try {
      await savePosSettingsMutation.mutateAsync(posSettings);
      
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
      console.error('Erro ao salvar configurações POS:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para testar impressão
  const handleTestPrint = async () => {
    try {
      const response = await fetch('/api/settings/pos/test-print', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      toast({
        title: "Teste de impressão",
        description: data.message || "Página de teste enviada para impressão",
      });
    } catch (error: any) {
      toast({
        title: "Erro no teste",
        description: error.message || "Erro ao testar impressão",
        variant: "destructive",
      });
    }
  };

  // Função para verificar conexão
  const handleCheckConnection = async () => {
    try {
      const response = await fetch('/api/settings/pos/check-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      toast({
        title: "Status da conexão",
        description: data.message || "Impressora conectada",
      });
    } catch (error: any) {
      toast({
        title: "Erro na conexão",
        description: error.message || "Erro ao verificar conexão",
        variant: "destructive",
      });
    }
  };

  // Função para salvar configurações gerais
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Se estamos na aba POS, usar função específica
    if (activeTab === 6) {
      await handleSavePosSettings();
      return;
    }
    
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
              <div>
                <form id="notificacoes-settings-form" className="space-y-8" onSubmit={handleSaveSettings}>
                  <div className="px-6 py-4 mb-4 border-l-4 rounded-lg" style={{ backgroundColor: 'rgba(0, 39, 118, 0.05)', borderColor: '#002776' }}>
                    <div className="flex items-center mb-2">
                      <i className="mr-3 text-lg fa-solid fa-sms" style={{ color: '#002776' }}></i>
                      <span className="text-lg font-semibold font-montserrat" style={{ color: '#002776' }}>Mensagens por SMS</span>
                    </div>
                    <div className="grid grid-cols-1 gap-8 mt-4 md:grid-cols-3">
                      <div>
                        <label htmlFor="sms-confirmacao" className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">Mensagem de Confirmação</label>
                        <textarea 
                          id="sms-confirmacao" 
                          rows={2} 
                          className="w-full px-4 py-3 font-semibold border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-800 focus:outline-none bg-gray-50" 
                          placeholder="Ex: Sua reserva foi confirmada!"
                        />
                      </div>
                      <div>
                        <label htmlFor="sms-cancelamento" className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">Mensagem de Cancelamento</label>
                        <textarea 
                          id="sms-cancelamento" 
                          rows={2} 
                          className="w-full px-4 py-3 font-semibold border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-800 focus:outline-none bg-gray-50" 
                          placeholder="Ex: Sua reserva foi cancelada."
                        />
                      </div>
                      <div>
                        <label htmlFor="sms-alteracao" className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">Mensagem de Alteração</label>
                        <textarea 
                          id="sms-alteracao" 
                          rows={2} 
                          className="w-full px-4 py-3 font-semibold border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-800 focus:outline-none bg-gray-50" 
                          placeholder="Ex: Sua reserva foi alterada."
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-6 py-4 mb-4 border-l-4 rounded-lg" style={{ backgroundColor: 'rgba(255, 223, 0, 0.1)', borderColor: '#ffdf00' }}>
                    <div className="flex items-center mb-2">
                      <i className="mr-3 text-lg fa-solid fa-envelope" style={{ color: '#ffdf00' }}></i>
                      <span className="text-lg font-semibold font-montserrat" style={{ color: '#ffdf00' }}>Mensagens por Email</span>
                    </div>
                    <div className="grid grid-cols-1 gap-8 mt-4 md:grid-cols-3">
                      <div>
                        <label htmlFor="email-confirmacao" className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">Mensagem de Confirmação</label>
                        <textarea 
                          id="email-confirmacao" 
                          rows={2} 
                          className="w-full px-4 py-3 font-semibold border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-800 focus:outline-none bg-gray-50" 
                          placeholder="Ex: Sua reserva foi confirmada por email!"
                        />
                      </div>
                      <div>
                        <label htmlFor="email-cancelamento" className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">Mensagem de Cancelamento</label>
                        <textarea 
                          id="email-cancelamento" 
                          rows={2} 
                          className="w-full px-4 py-3 font-semibold border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-800 focus:outline-none bg-gray-50" 
                          placeholder="Ex: Sua reserva foi cancelada por email."
                        />
                      </div>
                      <div>
                        <label htmlFor="email-alteracao" className="block mb-2 text-sm font-semibold text-gray-700 font-montserrat">Mensagem de Alteração</label>
                        <textarea 
                          id="email-alteracao" 
                          rows={2} 
                          className="w-full px-4 py-3 font-semibold border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-800 focus:outline-none bg-gray-50" 
                          placeholder="Ex: Sua reserva foi alterada por email."
                        />
                      </div>
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

            {activeTab === 6 && (
              <div className="grid grid-cols-12 gap-6">
                {/* Left side: Configuration panels */}
                <div className="col-span-12 lg:col-span-7">
                  {/* 1. Seleção de Impressora / Porta / Conexão */}
                  <div className="p-5 mb-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <h2 className="flex items-center mb-4 text-lg font-semibold text-gray-800 font-montserrat">
                      <i className="mr-2 fa-solid fa-print" style={{ color: '#002776' }}></i>
                      Seleção de Impressora
                    </h2>
                    
                    <div className="mb-4">
                      <label className="block mb-2 text-sm font-medium text-gray-700">Impressoras Disponíveis</label>
                      <select 
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-800 focus:outline-none"
                        value={posSettings.selectedPrinter || ''}
                        onChange={(e) => handlePosSettingChange('selectedPrinter', e.target.value)}
                      >
                        <option value="">Selecione uma impressora</option>
                        {availablePrinters.map((printer: any) => (
                          <option key={printer.id} value={printer.id}>
                            {printer.name} {printer.status === 'offline' ? '(Offline)' : ''}
                          </option>
                        ))}
                      </select>
                      <button 
                        className="flex items-center px-3 py-1 mt-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/settings/pos/printers'] })}
                      >
                        <i className="mr-1 fa-solid fa-sync-alt"></i> Atualizar Lista
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">Tipo de Conexão</label>
                        <select 
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-800 focus:outline-none"
                          value={posSettings.connectionType || 'usb'}
                          onChange={(e) => handlePosSettingChange('connectionType', e.target.value)}
                        >
                          <option value="usb">USB</option>
                          <option value="bluetooth">Bluetooth</option>
                          <option value="network">Rede (TCP/IP)</option>
                          <option value="serial">Serial (COM)</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">Timeout (ms)</label>
                        <input type="number" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-800 focus:outline-none" defaultValue="5000" />
                      </div>
                      
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">Tentativas de Reconexão</label>
                        <input type="number" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-800 focus:outline-none" defaultValue="3" />
                      </div>
                    </div>
                  </div>
                  
                  {/* 2. Parâmetros de Impressão */}
                  <div className="p-5 mb-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <h2 className="flex items-center mb-4 text-lg font-semibold text-gray-800 font-montserrat">
                      <i className="mr-2 fa-solid fa-sliders" style={{ color: '#009c3b' }}></i>
                      Parâmetros de Impressão
                    </h2>
                    
                    <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">Intensidade (Darkness)</label>
                        <div className="flex items-center">
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={posSettings.printIntensity || 70}
                            onChange={(e) => handlePosSettingChange('printIntensity', parseInt(e.target.value))}
                            className="w-full" 
                            style={{ accentColor: '#002776' }} 
                          />
                          <span className="w-8 ml-2 text-sm font-medium">{posSettings.printIntensity || 70}%</span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">Velocidade (mm/s)</label>
                        <select 
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-800 focus:outline-none"
                          value={posSettings.printSpeed || 100}
                          onChange={(e) => handlePosSettingChange('printSpeed', parseInt(e.target.value))}
                        >
                          <option value="50">50 mm/s</option>
                          <option value="80">80 mm/s</option>
                          <option value="100">100 mm/s</option>
                          <option value="150">150 mm/s</option>
                          <option value="200">200 mm/s</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">Avanço de Papel (mm)</label>
                        <input 
                          type="number" 
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-800 focus:outline-none" 
                          value={posSettings.paperFeed || 3}
                          onChange={(e) => handlePosSettingChange('paperFeed', parseInt(e.target.value))}
                          min="0" 
                          max="50" 
                        />
                      </div>
                      
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">Guilhotina Automática</label>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <input 
                              type="checkbox" 
                              className="w-5 h-5 rounded" 
                              style={{ accentColor: '#002776' }} 
                              checked={posSettings.autoCutterEnabled !== undefined ? posSettings.autoCutterEnabled : true}
                              onChange={(e) => handlePosSettingChange('autoCutterEnabled', e.target.checked)}
                            />
                            <label className="ml-2 text-sm text-gray-700">Ativar</label>
                          </div>
                          
                          <select className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-800 focus:outline-none">
                            <option value="full">Corte Total</option>
                            <option value="partial" selected>Corte Parcial</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">Gaveta de Dinheiro</label>
                      <div className="flex items-center">
                        <input type="checkbox" className="w-5 h-5 rounded" style={{ accentColor: '#002776' }} defaultChecked />
                        <label className="ml-2 text-sm text-gray-700">Acionar gaveta após impressão</label>
                      </div>
                    </div>
                  </div>
                  
                  {/* 3. Layout e Formatação */}
                  <div className="p-5 mb-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <h2 className="flex items-center mb-4 text-lg font-semibold text-gray-800 font-montserrat">
                      <i className="mr-2 fa-solid fa-table-columns" style={{ color: '#ffdf00' }}></i>
                      Layout e Formatação
                    </h2>
                    
                    <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">Número de Cópias</label>
                        <input type="number" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-800 focus:outline-none" defaultValue="1" min="1" max="10" />
                      </div>
                      
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">Alinhamento Global</label>
                        <div className="flex space-x-2">
                          <button type="button" className="flex-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-blue-800 focus:outline-none">
                            <i className="fa-solid fa-align-left"></i>
                          </button>
                          <button type="button" className="flex-1 px-3 py-2 text-white rounded-none border" style={{ backgroundColor: '#002776', borderColor: '#002776' }}>
                            <i className="fa-solid fa-align-center"></i>
                          </button>
                          <button type="button" className="flex-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-r-md focus:ring-2 focus:ring-blue-800 focus:outline-none">
                            <i className="fa-solid fa-align-right"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block mb-2 text-sm font-medium text-gray-700">Largura das Colunas</label>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block mb-1 text-xs text-gray-500">Descrição</label>
                          <div className="flex items-center">
                            <input type="range" min="20" max="70" defaultValue="50" className="w-full" style={{ accentColor: '#002776' }} />
                            <span className="w-8 ml-2 text-sm font-medium">50%</span>
                          </div>
                        </div>
                        <div>
                          <label className="block mb-1 text-xs text-gray-500">Quantidade</label>
                          <div className="flex items-center">
                            <input type="range" min="10" max="40" defaultValue="20" className="w-full" style={{ accentColor: '#002776' }} />
                            <span className="w-8 ml-2 text-sm font-medium">20%</span>
                          </div>
                        </div>
                        <div>
                          <label className="block mb-1 text-xs text-gray-500">Preço</label>
                          <div className="flex items-center">
                            <input type="range" min="10" max="40" defaultValue="30" className="w-full" style={{ accentColor: '#002776' }} />
                            <span className="w-8 ml-2 text-sm font-medium">30%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">Espaçamento entre Itens (mm)</label>
                        <input type="number" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-800 focus:outline-none" defaultValue="1" min="0" max="10" step="0.5" />
                      </div>
                      
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">Linhas de Destaque</label>
                        <select className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-800 focus:outline-none">
                          <option value="none">Nenhum</option>
                          <option value="border" selected>Borda</option>
                          <option value="shade">Sombreado</option>
                          <option value="dashed">Linha Pontilhada</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  {/* 4. Fonte e Charset */}
                  <div className="p-5 mb-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <h2 className="flex items-center mb-4 text-lg font-semibold text-gray-800 font-montserrat">
                      <i className="mr-2 fa-solid fa-font" style={{ color: '#002776' }}></i>
                      Fonte e Charset
                    </h2>
                    
                    <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">Charset</label>
                        <select className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-800 focus:outline-none">
                          <option value="CP437">CP437 (US/Internacional)</option>
                          <option value="CP850" selected>CP850 (Multilíngue)</option>
                          <option value="CP860">CP860 (Português)</option>
                          <option value="CP863">CP863 (Canadense-Francês)</option>
                          <option value="CP865">CP865 (Nórdico)</option>
                          <option value="UTF8">UTF-8 (Unicode)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">Tamanho da Fonte</label>
                        <select className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-800 focus:outline-none">
                          <option value="small">Pequeno</option>
                          <option value="medium" selected>Médio</option>
                          <option value="large">Grande</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center mb-2">
                        <input type="checkbox" className="w-5 h-5 rounded" style={{ accentColor: '#002776' }} defaultChecked />
                        <label className="ml-2 text-sm font-medium text-gray-700">Suporte a caracteres acentuados</label>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" className="w-5 h-5 rounded" style={{ accentColor: '#002776' }} defaultChecked />
                        <label className="ml-2 text-sm font-medium text-gray-700">Usar fonte secundária para caracteres não suportados</label>
                      </div>
                    </div>
                  </div>
                  
                  {/* 5. Imagens e Gráficos */}
                  <div className="p-5 mb-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <h2 className="flex items-center mb-4 text-lg font-semibold text-gray-800 font-montserrat">
                      <i className="mr-2 fa-solid fa-image" style={{ color: '#009c3b' }}></i>
                      Imagens e Gráficos
                    </h2>
                    
                    <div className="mb-4">
                      <label className="block mb-2 text-sm font-medium text-gray-700">Logo</label>
                      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-y-0 md:space-x-4">
                        <input type="file" className="hidden" accept="image/*" />
                        <label className="inline-flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-md cursor-pointer hover:bg-gray-200">
                          <i className="mr-2 fa-solid fa-upload"></i> Carregar Logo
                        </label>
                        <span className="text-sm text-gray-500">Nenhum arquivo selecionado</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">Posição da Logo</label>
                        <select className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-800 focus:outline-none">
                          <option value="top-left">Superior Esquerdo</option>
                          <option value="top-center" selected>Superior Centro</option>
                          <option value="top-right">Superior Direito</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">Escala da Logo (%)</label>
                        <input type="number" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-800 focus:outline-none" defaultValue="100" min="10" max="200" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">Código de Barras</label>
                        <select className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-800 focus:outline-none">
                          <option value="none">Nenhum</option>
                          <option value="EAN13" selected>EAN-13</option>
                          <option value="CODE128">CODE-128</option>
                          <option value="CODE39">CODE-39</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">QR Code de Opinião</label>
                        <div className="flex items-center">
                          <input type="checkbox" className="w-5 h-5 rounded" style={{ accentColor: '#002776' }} defaultChecked />
                          <label className="ml-2 text-sm text-gray-700">Incluir QR Code</label>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 6. Cabeçalho e Rodapé */}
                  <div className="p-5 mb-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <h2 className="flex items-center mb-4 text-lg font-semibold text-gray-800 font-montserrat">
                      <i className="mr-2 fa-solid fa-file-lines" style={{ color: '#ffdf00' }}></i>
                      Cabeçalho e Rodapé
                    </h2>
                    
                    <div className="mb-4">
                      <label className="block mb-2 text-sm font-medium text-gray-700">Formato de Data/Hora</label>
                      <select className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-800 focus:outline-none">
                        <option value="short">DD/MM/YYYY HH:MM</option>
                        <option value="medium" selected>DD de Mês de YYYY às HH:MM</option>
                        <option value="long">Dia da semana, DD de Mês de YYYY às HH:MM</option>
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
                      <div>
                        <div className="flex items-center mb-2">
                          <input type="checkbox" className="w-5 h-5 rounded" style={{ accentColor: '#002776' }} defaultChecked />
                          <label className="ml-2 text-sm font-medium text-gray-700">Exibir Dados do Operador</label>
                        </div>
                        <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-800 focus:outline-none" defaultValue="Atendente: {nome} ({id})" />
                      </div>
                      
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">Mensagem Promocional</label>
                        <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-800 focus:outline-none" defaultValue="Volte sempre! Siga-nos no Instagram @opaquedelicia" />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">Rodapé Customizado</label>
                      <textarea className="w-full h-20 px-4 py-2 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-800 focus:outline-none" placeholder="Digite o texto para o rodapé personalizado" defaultValue="Opa que delicia - CNPJ: 12.345.678/0001-99&#10;Rua da Gastronomia, 123 - São Paulo, SP&#10;Tel: (11) 98765-4321 | www.opaquedelicia.com"></textarea>
                    </div>
                  </div>
                  
                  {/* 7. Campos Personalizados de Recibo */}
                  <div className="p-5 mb-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <h2 className="flex items-center mb-4 text-lg font-semibold text-gray-800 font-montserrat">
                      <i className="mr-2 fa-solid fa-list-check" style={{ color: '#002776' }}></i>
                      Campos Personalizados de Recibo
                    </h2>
                    
                    <div className="mb-4">
                      <label className="block mb-2 text-sm font-medium text-gray-700">Campos a Exibir</label>
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                        <div className="flex items-center">
                          <input type="checkbox" className="w-5 h-5 rounded" style={{ accentColor: '#002776' }} defaultChecked />
                          <label className="ml-2 text-sm text-gray-700">Itens</label>
                        </div>
                        <div className="flex items-center">
                          <input type="checkbox" className="w-5 h-5 rounded" style={{ accentColor: '#002776' }} defaultChecked />
                          <label className="ml-2 text-sm text-gray-700">Descontos</label>
                        </div>
                        <div className="flex items-center">
                          <input type="checkbox" className="w-5 h-5 rounded" style={{ accentColor: '#002776' }} defaultChecked />
                          <label className="ml-2 text-sm text-gray-700">Taxas</label>
                        </div>
                        <div className="flex items-center">
                          <input type="checkbox" className="w-5 h-5 rounded" style={{ accentColor: '#002776' }} defaultChecked />
                          <label className="ml-2 text-sm text-gray-700">Subtotal</label>
                        </div>
                        <div className="flex items-center">
                          <input type="checkbox" className="w-5 h-5 rounded" style={{ accentColor: '#002776' }} defaultChecked />
                          <label className="ml-2 text-sm text-gray-700">Total</label>
                        </div>
                        <div className="flex items-center">
                          <input type="checkbox" className="w-5 h-5 rounded" style={{ accentColor: '#002776' }} defaultChecked />
                          <label className="ml-2 text-sm text-gray-700">Forma de Pagamento</label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block mb-2 text-sm font-medium text-gray-700">Mensagens Fixas</label>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-center">
                          <input type="checkbox" className="w-5 h-5 rounded" style={{ accentColor: '#002776' }} defaultChecked />
                          <label className="ml-2 text-sm text-gray-700">Obrigado pela preferência!</label>
                        </div>
                        <div className="flex items-center">
                          <input type="checkbox" className="w-5 h-5 rounded" style={{ accentColor: '#002776' }} defaultChecked />
                          <label className="ml-2 text-sm text-gray-700">Não é documento fiscal</label>
                        </div>
                        <div className="flex items-center">
                          <input type="checkbox" className="w-5 h-5 rounded" style={{ accentColor: '#002776' }} />
                          <label className="ml-2 text-sm text-gray-700">Mensagem personalizada:</label>
                        </div>
                        <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-800 focus:outline-none" placeholder="Digite sua mensagem personalizada" />
                      </div>
                    </div>
                  </div>
                  
                  {/* 8. Testes e Diagnósticos */}
                  <div className="p-5 mb-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <h2 className="flex items-center mb-4 text-lg font-semibold text-gray-800 font-montserrat">
                      <i className="mr-2 fa-solid fa-vial" style={{ color: '#c8102e' }}></i>
                      Testes e Diagnósticos
                    </h2>
                    
                    <div className="flex flex-col space-y-3 md:flex-row md:items-center md:space-y-0 md:space-x-4">
                      <button 
                        onClick={handleTestPrint}
                        className="flex items-center px-4 py-2 text-white rounded-md hover:bg-blue-700" 
                        style={{ backgroundColor: '#002776' }}
                      >
                        <i className="mr-2 fa-solid fa-print"></i> Imprimir Página de Teste
                      </button>
                      
                      <button className="flex items-center px-4 py-2 text-white rounded-md hover:bg-green-700" style={{ backgroundColor: '#009c3b' }}>
                        <i className="mr-2 fa-solid fa-circle-info"></i> Relatório de Status ESC/POS
                      </button>
                      
                      <button 
                        onClick={handleCheckConnection}
                        className="flex items-center px-4 py-2 font-medium rounded-md hover:bg-yellow-400" 
                        style={{ backgroundColor: '#ffdf00', color: '#002776' }}
                      >
                        <i className="mr-2 fa-solid fa-plug"></i> Verificar Conexão
                      </button>
                    </div>
                  </div>
                  
                  {/* 9. Ações Pós-Impressão */}
                  <div className="p-5 mb-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <h2 className="flex items-center mb-4 text-lg font-semibold text-gray-800 font-montserrat">
                      <i className="mr-2 fa-solid fa-gear" style={{ color: '#009c3b' }}></i>
                      Ações Pós-Impressão
                    </h2>
                    
                    <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
                      <div>
                        <div className="flex items-center mb-2">
                          <input type="checkbox" className="w-5 h-5 rounded" style={{ accentColor: '#002776' }} />
                          <label className="ml-2 text-sm font-medium text-gray-700">Beep ao fim da impressão</label>
                        </div>
                        
                        <div className="flex items-center">
                          <input type="checkbox" className="w-5 h-5 rounded" style={{ accentColor: '#002776' }} />
                          <label className="ml-2 text-sm font-medium text-gray-700">Enviar PDF por e-mail</label>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">Gaveta de Dinheiro</label>
                        <select className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-800 focus:outline-none">
                          <option value="before">Abrir antes do corte</option>
                          <option value="after" selected>Abrir depois do corte</option>
                          <option value="none">Não abrir automaticamente</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  {/* 10. Segurança e Auditoria */}
                  <div className="p-5 mb-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <h2 className="flex items-center mb-4 text-lg font-semibold text-gray-800 font-montserrat">
                      <i className="mr-2 fa-solid fa-shield-halved" style={{ color: '#002776' }}></i>
                      Segurança e Auditoria
                    </h2>
                    
                    <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
                      <div>
                        <div className="flex items-center mb-2">
                          <input type="checkbox" className="w-5 h-5 rounded" style={{ accentColor: '#002776' }} defaultChecked />
                          <label className="ml-2 text-sm font-medium text-gray-700">Exigir autenticação para alterações</label>
                        </div>
                        
                        <div className="mt-2">
                          <label className="block mb-1 text-sm font-medium text-gray-700">Senha de Administrador</label>
                          <input type="password" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-800 focus:outline-none" placeholder="********" />
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center mb-2">
                          <input type="checkbox" className="w-5 h-5 rounded" style={{ accentColor: '#002776' }} defaultChecked />
                          <label className="ml-2 text-sm font-medium text-gray-700">Registrar logs de auditoria</label>
                        </div>
                        
                        <div className="mt-2">
                          <label className="block mb-1 text-sm font-medium text-gray-700">Retenção de Logs (dias)</label>
                          <input type="number" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-800 focus:outline-none" defaultValue="90" min="30" max="365" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 11. Perfis de Configuração */}
                  <div className="p-5 mb-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <h2 className="flex items-center mb-4 text-lg font-semibold text-gray-800 font-montserrat">
                      <i className="mr-2 fa-solid fa-user-gear" style={{ color: '#ffdf00' }}></i>
                      Perfis de Configuração
                    </h2>
                    
                    <div className="flex flex-col mb-4 space-y-3 md:flex-row md:items-center md:space-y-0 md:space-x-4">
                      <button className="flex items-center px-4 py-2 text-white rounded-md hover:bg-blue-700" style={{ backgroundColor: '#002776' }}>
                        <i className="mr-2 fa-solid fa-file-export"></i> Exportar Perfil
                      </button>
                      
                      <button className="flex items-center px-4 py-2 text-white rounded-md hover:bg-green-700" style={{ backgroundColor: '#009c3b' }}>
                        <i className="mr-2 fa-solid fa-file-import"></i> Importar Perfil
                      </button>
                      
                      <input type="file" className="hidden" accept=".json" />
                    </div>
                    
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">Perfis Salvos</label>
                      <select className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-800 focus:outline-none">
                        <option value="default" selected>Perfil Padrão</option>
                        <option value="compact">Recibo Compacto</option>
                        <option value="detailed">Recibo Detalhado</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Salvar Configurações */}
                  <div className="flex justify-end">
                    <button 
                      className="flex items-center px-6 py-3 font-bold text-white transition-colors rounded-lg shadow-md hover:bg-green-700" 
                      style={{ backgroundColor: '#009c3b' }}
                      onClick={handleSaveSettings}
                      disabled={isSubmitting}
                    >
                      <i className="mr-2 fa-solid fa-floppy-disk"></i> 
                      {isSubmitting ? 'Salvando...' : 'Salvar Configurações'}
                    </button>
                  </div>
                </div>
                
                {/* Right side: Preview Panel */}
                <div className="col-span-12 lg:col-span-5">
                  <div className="sticky top-4">
                    <div className="p-5 mb-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                      <h2 className="flex items-center mb-4 text-lg font-semibold text-gray-800 font-montserrat">
                        <i className="mr-2 fa-solid fa-eye" style={{ color: '#002776' }}></i>
                        Pré-visualização em Tempo Real
                      </h2>
                      
                      <div 
                        className="p-4 mx-auto bg-white border border-gray-300 rounded-lg" 
                        style={{ 
                          width: '300px', 
                          height: '500px', 
                          overflowY: 'auto', 
                          fontFamily: 'Courier New, monospace',
                          fontSize: posSettings.fontSize === 'small' ? '10px' : posSettings.fontSize === 'large' ? '14px' : '12px',
                          textAlign: posSettings.globalAlignment || 'center'
                        }}
                      >
                        {/* Header com logo baseado na configuração */}
                        <div className={`mb-4 ${posSettings.logoPosition?.includes('center') ? 'text-center' : posSettings.logoPosition?.includes('left') ? 'text-left' : 'text-right'}`}>
                          <div className="mb-1 text-xs">LOGO</div>
                          <div className="font-bold">OPA QUE DELICIA</div>
                          <div className="text-xs">{posSettings.customFooter?.split('\n')[0] || 'CNPJ: 12.345.678/0001-99'}</div>
                          <div className="text-xs">{posSettings.customFooter?.split('\n')[1] || 'Rua da Gastronomia, 123 - São Paulo, SP'}</div>
                          <div className="text-xs">{posSettings.customFooter?.split('\n')[2] || 'Tel: (11) 98765-4321'}</div>
                        </div>
                        
                        {/* Informações do cupom com timestamp dinâmico */}
                        <div className="py-2 my-2 text-xs border-t border-b border-gray-400 border-dashed">
                          {posSettings.nonFiscalMessage !== false && <div>CUPOM NÃO FISCAL</div>}
                          <div>Data: {new Date().toLocaleString('pt-BR', { 
                            dateStyle: posSettings.timestampFormat === 'short' ? 'short' : posSettings.timestampFormat === 'long' ? 'full' : 'medium',
                            timeStyle: 'medium'
                          })}</div>
                          {posSettings.showOperator !== false && (
                            <div>{posSettings.operatorFormat?.replace('{nome}', 'Carlos Silva').replace('{id}', '1234') || 'Atendente: Carlos Silva (ID: 1234)'}</div>
                          )}
                          <div>Mesa: 08 | Comanda: 4567</div>
                        </div>
                        
                        {/* Items com layout baseado nas configurações de coluna */}
                        {posSettings.showItems !== false && (
                          <div className="my-3 text-xs">
                            <div className="flex justify-between mb-1 font-bold">
                              <span style={{ width: `${posSettings.columnWidthDescription || 50}%` }}>DESCRIÇÃO</span>
                              <span style={{ width: `${posSettings.columnWidthQuantity || 20}%` }} className="text-center">QTD</span>
                              <span style={{ width: `${posSettings.columnWidthPrice || 30}%` }} className="text-right">VALOR</span>
                            </div>
                            
                            <div className="flex justify-between py-1 border-b border-gray-300 border-dotted" style={{ marginBottom: `${posSettings.itemSpacing || 1}px` }}>
                              <span style={{ width: `${posSettings.columnWidthDescription || 50}%` }}>Feijoada Completa</span>
                              <span style={{ width: `${posSettings.columnWidthQuantity || 20}%` }} className="text-center">1</span>
                              <span style={{ width: `${posSettings.columnWidthPrice || 30}%` }} className="text-right">R$ 45,90</span>
                            </div>
                            
                            <div className="flex justify-between py-1 border-b border-gray-300 border-dotted" style={{ marginBottom: `${posSettings.itemSpacing || 1}px` }}>
                              <span style={{ width: `${posSettings.columnWidthDescription || 50}%` }}>Caipirinha de Limão</span>
                              <span style={{ width: `${posSettings.columnWidthQuantity || 20}%` }} className="text-center">2</span>
                              <span style={{ width: `${posSettings.columnWidthPrice || 30}%` }} className="text-right">R$ 29,80</span>
                            </div>
                            
                            <div className="flex justify-between py-1 border-b border-gray-300 border-dotted" style={{ marginBottom: `${posSettings.itemSpacing || 1}px` }}>
                              <span style={{ width: `${posSettings.columnWidthDescription || 50}%` }}>Pudim de Leite</span>
                              <span style={{ width: `${posSettings.columnWidthQuantity || 20}%` }} className="text-center">1</span>
                              <span style={{ width: `${posSettings.columnWidthPrice || 30}%` }} className="text-right">R$ 15,90</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Totais baseados nas configurações */}
                        <div className="my-3 text-xs">
                          {posSettings.showSubtotal !== false && (
                            <div className="flex justify-between py-1">
                              <span>Subtotal:</span>
                              <span>R$ 91,60</span>
                            </div>
                          )}
                          {posSettings.showTaxes !== false && (
                            <div className="flex justify-between py-1">
                              <span>Taxa de Serviço (10%):</span>
                              <span>R$ 9,16</span>
                            </div>
                          )}
                          {posSettings.showTotal !== false && (
                            <div className="flex justify-between py-1 font-bold">
                              <span>TOTAL:</span>
                              <span>R$ 100,76</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Informações de pagamento */}
                        {posSettings.showPaymentMethod !== false && (
                          <div className="py-2 my-2 text-xs border-t border-b border-gray-400 border-dashed">
                            <div>Forma de Pagamento: Cartão de Crédito</div>
                            <div>Valor Pago: R$ 100,76</div>
                          </div>
                        )}
                        
                        {/* Mensagens personalizáveis */}
                        <div className="my-3 text-xs text-center">
                          {posSettings.thankYouMessage !== false && <div className="mb-2">OBRIGADO PELA PREFERÊNCIA!</div>}
                          <div className="mb-2">{posSettings.promoMessage || 'Volte sempre! Siga-nos no Instagram @opaquedelicia'}</div>
                          {posSettings.qrcodeEnabled && (
                            <div 
                              className="mx-auto my-2 bg-gray-200" 
                              style={{ 
                                width: `${posSettings.qrcodeSize || 100}px`, 
                                height: `${posSettings.qrcodeSize || 100}px`,
                                margin: `${posSettings.qrcodeMargin || 2}px auto`
                              }}
                            ></div>
                          )}
                          <div>Avalie nosso atendimento</div>
                          {posSettings.customMessageEnabled && posSettings.customMessage && (
                            <div className="mt-2 font-medium">{posSettings.customMessage}</div>
                          )}
                        </div>
                        
                        <div className="pt-2 mt-4 text-xs text-center border-t border-gray-300">
                          <div>www.opaquedelicia.com</div>
                          {posSettings.nonFiscalMessage !== false && <div>*** DOCUMENTO SEM VALOR FISCAL ***</div>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start px-4 py-3 border-l-4 rounded-lg" style={{ backgroundColor: 'rgba(255, 223, 0, 0.2)', borderColor: '#ffdf00' }}>
                      <i className="mt-1 mr-3 fa-solid fa-lightbulb" style={{ color: '#ffdf00' }}></i>
                      <div>
                        <p className="mb-1 text-sm font-semibold text-gray-800">Dica:</p>
                        <p className="text-sm text-gray-700">As alterações feitas nas configurações são refletidas automaticamente na pré-visualização. Experimente ajustar as configurações para ver como ficará seu recibo antes de imprimir.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;