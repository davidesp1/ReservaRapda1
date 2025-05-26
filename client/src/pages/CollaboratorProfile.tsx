import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Menu, 
  CreditCard, 
  User, 
  LogOut,
  ChefHat,
  Mail,
  Phone,
  MapPin,
  Calendar
} from 'lucide-react';
import { FaUtensils } from 'react-icons/fa';

const CollaboratorProfile: React.FC = () => {
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
        <title>Perfil - Opa que delicia</title>
        <meta name="description" content="Perfil do colaborador do restaurante Opa que delicia." />
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
                Meu Perfil
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
            {/* Profile Header */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={user?.profilePicture} />
                    <AvatarFallback className="bg-brasil-yellow text-brasil-blue text-2xl">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center md:text-left">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                      {user?.firstName} {user?.lastName}
                    </h2>
                    <p className="text-lg text-gray-600 mb-2">@{user?.username}</p>
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-brasil-blue text-white">
                      <ChefHat className="w-4 h-4 mr-2" />
                      Colaborador
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Informações de Contato</CardTitle>
                <CardDescription>Seus dados de contato registrados no sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900">{user?.email}</span>
                </div>
                {user?.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{user?.phone}</span>
                  </div>
                )}
                {user?.address && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-gray-900">{user?.address}</p>
                      {(user?.city || user?.postalCode) && (
                        <p className="text-gray-600 text-sm">
                          {user?.city} {user?.postalCode}
                        </p>
                      )}
                      {user?.country && (
                        <p className="text-gray-600 text-sm">{user?.country}</p>
                      )}
                    </div>
                  </div>
                )}
                {user?.memberSince && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">
                      Membro desde {new Date(user.memberSince).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Access Information */}
            <Card>
              <CardHeader>
                <CardTitle>Acesso ao Sistema</CardTitle>
                <CardDescription>Informações sobre suas permissões e último acesso</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Suas Permissões:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Acesso ao Sistema POS</li>
                    <li>• Visualização e edição do perfil pessoal</li>
                    <li>• Processamento de vendas e pagamentos</li>
                  </ul>
                </div>
                {user?.lastLogin && (
                  <div className="text-sm text-gray-600">
                    <strong>Último acesso:</strong> {new Date(user.lastLogin).toLocaleString('pt-BR')}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={() => setLocation('/collaborator/pos')} 
                className="bg-brasil-blue hover:bg-brasil-blue/90"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Ir para Sistema POS
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CollaboratorProfile;