import React, { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
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

interface CollaboratorLayoutProps {
  children: ReactNode;
  title?: string;
}

export const CollaboratorLayout: React.FC<CollaboratorLayoutProps> = ({ 
  children, 
  title = 'Colaborador' 
}) => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [_, setLocation] = useLocation();
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  // Desktop Sidebar Component
  const DesktopSidebar = () => (
    <div className="fixed left-0 top-0 h-full w-64 bg-brasil-blue flex flex-col">
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
  );

  // Mobile Sidebar Component
  const MobileSidebar = () => (
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
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <DesktopSidebar />
      </div>
      
      {/* Main Content */}
      <div className="md:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              {/* Mobile Menu */}
              <MobileSidebar />
              
              <h1 className="ml-4 md:ml-0 text-xl font-semibold text-gray-900">
                {title}
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
          {children}
        </main>
      </div>
    </div>
  );
};

export default CollaboratorLayout;