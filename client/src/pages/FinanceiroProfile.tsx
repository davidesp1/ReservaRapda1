import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Menu, 
  X, 
  User, 
  DollarSign, 
  TrendingUp, 
  CreditCard,
  FileText,
  BarChart3,
  LogOut,
  Home
} from 'lucide-react';
import { Helmet } from 'react-helmet';

const FinanceiroProfile: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isFinanceiro, isLoading, user, logout } = useAuth();
  const [_, setLocation] = useLocation();
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Redirect to home if not authenticated or not financeiro
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isFinanceiro)) {
      setLocation('/');
    }
  }, [isAuthenticated, isFinanceiro, isLoading, setLocation]);

  const handleLogout = async () => {
    try {
      await logout();
      setLocation('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const closeMenu = () => setIsMenuOpen(false);

  // Navegação específica para usuários financeiros
  const navItems = [
    {
      path: '/financeiro/profile',
      label: 'Meu Perfil',
      icon: <User className="w-5 h-5" />,
    },
    {
      path: '/admin/finance',
      label: 'Módulo Financeiro',
      icon: <DollarSign className="w-5 h-5" />,
    }
  ];
  
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Perfil Financeiro - Sistema Restaurante</title>
        <meta name="description" content="Área financeira do sistema de gestão de restaurante" />
      </Helmet>

      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.profilePicture} />
              <AvatarFallback>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
              <Badge variant="secondary" className="text-xs">
                <DollarSign className="w-3 h-3 mr-1" />
                Financeiro
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="mt-4 pb-4 border-t border-gray-200">
            <nav className="space-y-2 pt-4">
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  variant={location === item.path ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => {
                    setLocation(item.path);
                    closeMenu();
                  }}
                >
                  {item.icon}
                  <span className="ml-2">{item.label}</span>
                </Button>
              ))}
              <Separator className="my-2" />
              <Button
                variant="ghost"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5 mr-2" />
                Sair
              </Button>
            </nav>
          </div>
        )}
      </div>

      <div className="lg:flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:flex-shrink-0">
          <div className="flex flex-col w-64 bg-white border-r border-gray-200">
            <div className="flex-1 flex flex-col min-h-0">
              {/* Profile Section */}
              <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                <div className="flex items-center flex-shrink-0 px-4 mb-6">
                  <Avatar className="h-12 w-12 mr-3">
                    <AvatarImage src={user?.profilePicture} />
                    <AvatarFallback>
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                    <Badge variant="secondary" className="text-xs">
                      <DollarSign className="w-3 h-3 mr-1" />
                      Financeiro
                    </Badge>
                  </div>
                </div>
                
                {/* Navigation */}
                <nav className="flex-1 px-2 space-y-1">
                  {navItems.map((item) => (
                    <Button
                      key={item.path}
                      variant={location === item.path ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setLocation(item.path)}
                    >
                      {item.icon}
                      <span className="ml-2">{item.label}</span>
                    </Button>
                  ))}
                </nav>
              </div>
              
              {/* Logout Button */}
              <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  Sair
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Page header */}
            <div className="bg-white shadow">
              <div className="px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Área Financeira</h1>
                    <p className="mt-1 text-sm text-gray-500">
                      Gerencie as finanças do restaurante
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setLocation('/')}
                    className="flex items-center space-x-2"
                  >
                    <Home className="w-4 h-4" />
                    <span>Voltar ao Início</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Page content */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-8">
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Profile Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <User className="w-5 h-5 mr-2" />
                        Informações do Perfil
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p><strong>Nome:</strong> {user?.firstName} {user?.lastName}</p>
                        <p><strong>Email:</strong> {user?.email}</p>
                        <p><strong>Usuário:</strong> {user?.username}</p>
                        <p><strong>Função:</strong> Financeiro</p>
                        {user?.phone && <p><strong>Telefone:</strong> {user?.phone}</p>}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <DollarSign className="w-5 h-5 mr-2" />
                        Ações Rápidas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Button 
                          className="w-full justify-start" 
                          variant="outline"
                          onClick={() => setLocation('/admin/finance')}
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          Acessar Finanças
                        </Button>
                        <Button 
                          className="w-full justify-start" 
                          variant="outline"
                          onClick={() => setLocation('/admin/finance')}
                        >
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Ver Receitas
                        </Button>
                        <Button 
                          className="w-full justify-start" 
                          variant="outline"
                          onClick={() => setLocation('/admin/finance')}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Relatórios Financeiros
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Access Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Acesso Permitido</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center text-green-600">
                          <User className="w-4 h-4 mr-2" />
                          <span className="text-sm">Perfil Pessoal</span>
                        </div>
                        <div className="flex items-center text-green-600">
                          <DollarSign className="w-4 h-4 mr-2" />
                          <span className="text-sm">Módulo Financeiro Completo</span>
                        </div>
                        <div className="flex items-center text-green-600">
                          <TrendingUp className="w-4 h-4 mr-2" />
                          <span className="text-sm">Relatórios de Receitas</span>
                        </div>
                        <div className="flex items-center text-green-600">
                          <CreditCard className="w-4 h-4 mr-2" />
                          <span className="text-sm">Gestão de Pagamentos</span>
                        </div>
                        <div className="flex items-center text-green-600">
                          <FileText className="w-4 h-4 mr-2" />
                          <span className="text-sm">Relatórios Financeiros</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceiroProfile;