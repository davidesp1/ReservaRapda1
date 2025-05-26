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

  // Se for colaborador, renderize POS em tela cheia
  if (isCollaborator) {
    return (
      <div className="h-screen w-screen fixed inset-0 z-50 bg-white">
        <Helmet>
          <title>Sistema POS - Opa que delicia</title>
          <meta name="description" content="Sistema de ponto de venda do restaurante Opa que delicia." />
        </Helmet>
        
        {/* Botão de voltar no canto superior esquerdo */}
        <div className="absolute top-4 left-4 z-50">
          <Button 
            onClick={() => setLocation('/collaborator')}
            variant="outline"
            size="sm"
            className="bg-white/90 backdrop-blur-sm border-gray-300 hover:bg-gray-50"
          >
            ← Voltar ao Dashboard
          </Button>
        </div>
        
        {/* POS em tela cheia */}
        <POSMode />
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