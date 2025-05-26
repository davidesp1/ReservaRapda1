import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Menu, 
  CreditCard, 
  User, 
  LogOut,
  ChefHat
} from 'lucide-react';
import { FaUtensils } from 'react-icons/fa';

const CollaboratorDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isCollaborator, isLoading, user, logout } = useAuth();
  const [_, setLocation] = useLocation();
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Redirect to home if not authenticated or not collaborator
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isCollaborator)) {
      setLocation('/');
    }
  }, [isAuthenticated, isCollaborator, isLoading, setLocation]);
  
  // Don't auto-redirect to POS, let them navigate normally

  const handleLogout = async () => {
    try {
      await logout();
      setLocation('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const closeMenu = () => setIsMenuOpen(false);

  // Navegação limitada para colaboradores
  const navItems = [
    {
      path: '/collaborator/pos',
      label: 'Sistema POS',
      icon: <CreditCard className="w-5 h-5" />,
    },
    {
      path: '/collaborator/profile',
      label: 'Perfil',
      icon: <User className="w-5 h-5" />,
    }
  ];
  
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brasil-green"></div>
      </div>
    );
  }
  
  if (!isAuthenticated || !isCollaborator) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Dashboard - Opa que delicia</title>
        <meta name="description" content="Dashboard do colaborador do restaurante Opa que delicia." />
      </Helmet>
      
      {/* Desktop Sidebar */}
      <div className="hidden md:block fixed left-0 top-0 h-full w-64 bg-brasil-blue flex flex-col">
        <div className="p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-brasil-yellow rounded-full flex items-center justify-center mr-2">
              <FaUtensils className="text-brasil-blue" />
            </div>
            <span className="text-xl font-semibold text-white font-montserrat">
              Opa que delicia
            </span>
          </div>
          <div className="mt-4 text-sm text-blue-200">
            Colaborador
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <ul>
            {navItems.map((item) => (
              <li key={item.path} className="px-6 py-3">
                <button
                  onClick={() => setLocation(item.path)}
                  className={`flex items-center text-white w-full ${
                    location === item.path 
                      ? 'bg-brasil-blue bg-opacity-40' 
                      : 'hover:bg-brasil-blue hover:bg-opacity-40'
                  } rounded-lg p-2`}
                >
                  {item.icon}
                  <span className="ml-2 font-medium">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="mt-auto border-t border-blue-400 p-4">
          <div className="flex items-center mb-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.profilePicture} />
              <AvatarFallback className="bg-brasil-yellow text-brasil-blue">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="text-white text-sm font-medium">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-blue-200 text-xs">{user?.email}</p>
            </div>
          </div>
          
          <Button 
            onClick={handleLogout}
            variant="ghost" 
            className="w-full text-white hover:bg-brasil-blue hover:bg-opacity-40 justify-start"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {t('Logout')}
          </Button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="md:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              {/* Mobile Menu */}
              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 bg-brasil-blue border-r-0">
                  <SheetHeader>
                    <SheetTitle className="flex items-center text-white">
                      <div className="w-8 h-8 bg-brasil-yellow rounded-full flex items-center justify-center mr-2">
                        <FaUtensils className="text-brasil-blue text-sm" />
                      </div>
                      Opa que delicia
                    </SheetTitle>
                    <div className="text-sm text-blue-200 text-left">
                      Colaborador
                    </div>
                  </SheetHeader>
                  
                  <div className="flex flex-col h-full mt-6">
                    <div className="flex-1">
                      <ul>
                        {navItems.map((item) => (
                          <li key={item.path} className="py-2">
                            <button
                              onClick={() => {
                                setLocation(item.path);
                                closeMenu();
                              }}
                              className={`flex items-center text-white w-full ${
                                location === item.path 
                                  ? 'bg-brasil-blue bg-opacity-40' 
                                  : 'hover:bg-brasil-blue hover:bg-opacity-40'
                              } rounded-lg p-2`}
                            >
                              {item.icon}
                              <span className="ml-2 font-medium">{item.label}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="mt-auto border-t border-blue-400 pt-4">
                      <div className="flex items-center mb-4">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user?.profilePicture} />
                          <AvatarFallback className="bg-brasil-yellow text-brasil-blue text-sm">
                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="ml-3">
                          <p className="text-white text-sm font-medium">
                            {user?.firstName} {user?.lastName}
                          </p>
                          <p className="text-blue-200 text-xs">{user?.email}</p>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={() => {
                          handleLogout();
                          closeMenu();
                        }}
                        variant="ghost" 
                        className="w-full text-white hover:bg-brasil-blue hover:bg-opacity-40 justify-start"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        {t('Logout')}
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              
              <h1 className="ml-4 md:ml-0 text-xl font-semibold text-gray-900">
                Dashboard Colaborador
              </h1>
            </div>
            
            {/* User Info - Desktop */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center">
                <ChefHat className="w-5 h-5 text-brasil-blue mr-2" />
                <span className="text-sm text-gray-600">Colaborador</span>
              </div>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Colaborador</h1>
              <p className="text-gray-600">Bem-vindo ao sistema de gerenciamento do restaurante</p>
            </div>

            {/* Quick Actions Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* POS Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-brasil-blue rounded-lg flex items-center justify-center mr-4">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Sistema POS</h3>
                    <p className="text-gray-600 text-sm">Processar vendas e pagamentos</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  Acesse o sistema de ponto de venda para processar pedidos, receber pagamentos e gerenciar vendas.
                </p>
                <Button 
                  onClick={() => setLocation('/collaborator/pos')} 
                  className="w-full bg-brasil-blue hover:bg-brasil-blue/90"
                >
                  Abrir Sistema POS
                </Button>
              </div>

              {/* Profile Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center mr-4">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Meu Perfil</h3>
                    <p className="text-gray-600 text-sm">Visualizar informações pessoais</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  Visualize e atualize suas informações pessoais, dados de contato e configurações de conta.
                </p>
                <Button 
                  onClick={() => setLocation('/collaborator/profile')} 
                  variant="outline"
                  className="w-full"
                >
                  Ver Perfil
                </Button>
              </div>
            </div>

            {/* User Info Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <Avatar className="h-16 w-16 mr-4">
                  <AvatarImage src={user?.profilePicture} />
                  <AvatarFallback className="bg-brasil-yellow text-brasil-blue text-xl">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </h2>
                  <p className="text-gray-600">{user?.email}</p>
                  <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-brasil-blue text-white mt-1">
                    <ChefHat className="w-3 h-3 mr-1" />
                    Colaborador
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Suas Permissões:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Acesso ao Sistema POS para processar vendas</li>
                  <li>• Visualização e edição do perfil pessoal</li>
                  <li>• Processamento de pagamentos diversos</li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CollaboratorDashboard;