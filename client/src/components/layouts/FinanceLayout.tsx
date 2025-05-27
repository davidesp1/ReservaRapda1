import React, { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';
import { Menu, X, User, DollarSign, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface FinanceLayoutProps {
  children: ReactNode;
  title?: string;
}

export const FinanceLayout: React.FC<FinanceLayoutProps> = ({ 
  children, 
  title = 'Painel Financeiro' 
}) => {
  const { t } = useTranslation();
  const { user, isAuthenticated, isFinanceiro, isLoading, logout } = useAuth();
  const [_, setLocation] = useLocation();
  const [location] = useLocation();

  // Redirect to home if not authenticated or not finance user
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isFinanceiro)) {
      setLocation('/');
    }
  }, [isAuthenticated, isFinanceiro, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brasil-green"></div>
      </div>
    );
  }

  if (!isAuthenticated || !isFinanceiro) {
    return null;
  }

  const navItems = [
    { 
      path: '/financeiro/dashboard', 
      label: 'Painel Financeiro', 
      icon: <DollarSign className="h-5 w-5 mr-3" /> 
    },
    { 
      path: '/financeiro/profile', 
      label: 'Meu Perfil', 
      icon: <User className="h-5 w-5 mr-3" /> 
    }
  ];

  const handleLogout = async () => {
    await logout();
    setLocation('/');
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-white border-r">
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-10 h-10 mr-2 rounded-full bg-brasil-yellow">
            <span className="text-brasil-blue font-bold">O</span>
          </div>
          <span className="text-xl font-semibold text-brasil-blue font-montserrat">
            Opa que delicia
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <button
                onClick={() => setLocation(item.path)}
                className={`w-full flex items-center p-3 rounded-lg text-left transition-colors ${
                  location === item.path
                    ? 'bg-brasil-yellow text-brasil-blue font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t">
        <div className="flex items-center mb-4">
          <Avatar className="h-10 w-10 mr-3">
            <AvatarImage src={user?.profilePicture} />
            <AvatarFallback className="bg-brasil-yellow text-brasil-blue">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500 truncate">Financeiro</p>
          </div>
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>
    </div>
  );

  const MobileHeader = () => (
    <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
      <div className="flex items-center">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar />
          </SheetContent>
        </Sheet>
        <h1 className="ml-3 text-lg font-semibold text-brasil-blue">{title}</h1>
      </div>
      <Avatar className="h-8 w-8">
        <AvatarImage src={user?.profilePicture} />
        <AvatarFallback className="bg-brasil-yellow text-brasil-blue text-xs">
          {user?.firstName?.[0]}{user?.lastName?.[0]}
        </AvatarFallback>
      </Avatar>
    </header>
  );

  const DesktopHeader = () => (
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <p className="text-gray-600">Painel de controle financeiro</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 font-opensans">
      <Helmet>
        <title>{title} - Opa que delicia</title>
        <meta name="description" content={`${title} - Painel financeiro do restaurante Opa que delicia.`} />
      </Helmet>
      
      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col h-screen">
        <MobileHeader />
        
        {/* Mobile Main Content */}
        <main className="flex-1 overflow-y-auto px-4 pb-16 pt-4">
          {children}
        </main>
      </div>
      
      {/* Desktop Layout */}
      <div className="hidden md:flex h-screen">
        <div className="w-64 h-full">
          <Sidebar />
        </div>
        
        <main className="flex-1 p-8 overflow-y-auto">
          <DesktopHeader />
          {children}
        </main>
      </div>
    </div>
  );
};

export default FinanceLayout;