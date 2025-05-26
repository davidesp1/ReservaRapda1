import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
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
import POSMode from '@/pages/admin/POSMode';

const POSWrapper: React.FC = () => {
  const { isAuthenticated, isCollaborator, isAdmin, isLoading, user, logout } = useAuth();
  const [_, setLocation] = useLocation();
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/');
    }
  }, [isAuthenticated, isLoading, setLocation]);

  const handleLogout = async () => {
    try {
      await logout();
      setLocation('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const closeMenu = () => setIsMenuOpen(false);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brasil-green"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return null;
  }

  // Se for colaborador, renderize com layout de colaborador
  if (isCollaborator) {
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

    return (
      <div className="min-h-screen bg-gray-50">
        <Helmet>
          <title>Sistema POS - Opa que delicia</title>
          <meta name="description" content="Sistema de ponto de venda do restaurante Opa que delicia." />
        </Helmet>
        
        {/* Desktop Sidebar para Colaborador */}
        <div className="hidden md:block fixed left-0 top-0 h-full w-64 bg-brasil-blue flex flex-col z-50">
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
              Logout
            </Button>
          </div>
        </div>
        
        {/* Main Content para Colaborador */}
        <div className="md:ml-64">
          {/* Header Mobile para Colaborador */}
          <header className="bg-white shadow-sm border-b border-gray-200 md:hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center">
                <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
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
                          Logout
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
                
                <h1 className="ml-4 text-xl font-semibold text-gray-900">
                  Sistema POS
                </h1>
              </div>
              
              <div className="flex items-center">
                <ChefHat className="w-5 h-5 text-brasil-blue mr-2" />
                <span className="text-sm text-gray-600">Colaborador</span>
              </div>
            </div>
          </header>
          
          {/* POS Content */}
          <div className="h-screen">
            <POSMode />
          </div>
        </div>
      </div>
    );
  }

  // Para admin, renderizar normalmente
  return (
    <div className="h-screen">
      <Helmet>
        <title>Sistema POS - Opa que delicia</title>
        <meta name="description" content="Sistema de ponto de venda do restaurante Opa que delicia." />
      </Helmet>
      <POSMode />
    </div>
  );
};

export default POSWrapper;