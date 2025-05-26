import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  BarChart3, Users, BookOpen, 
  Utensils, Coins, CreditCard, Calendar, 
  Settings, LogOut, Menu, X, CashRegister
} from 'lucide-react';

interface SidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

const AdminSidebar: React.FC<SidebarProps> = ({ isMobile = false, onClose }) => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  const navItems = [
    {
      path: '/admin/dashboard',
      label: 'Dashboard',
      icon: <BarChart3 className="w-5 h-5 text-yellow-400" />
    },
    {
      path: '/admin/customers',
      label: 'Gestão de Clientes',
      icon: <Users className="w-5 h-5 text-yellow-400" />
    },
    {
      path: '/admin/menu',
      label: 'Gestão do Menu',
      icon: <BookOpen className="w-5 h-5 text-yellow-400" />
    },
    {
      path: '/admin/tables',
      label: 'Gestão das Mesas',
      icon: <Utensils className="w-5 h-5 text-yellow-400" />
    },
    {
      path: '/admin/finance',
      label: 'Gestão Financeira',
      icon: <Coins className="w-5 h-5 text-yellow-400" />
    },
    {
      path: '/admin/payments',
      label: 'Pagamentos',
      icon: <CreditCard className="w-5 h-5 text-yellow-400" />
    },
    {
      path: '/admin/reservations',
      label: 'Reservas',
      icon: <Calendar className="w-5 h-5 text-yellow-400" />
    }
  ];

  const handleLogout = async () => {
    await logout();
  };

  // Mobile Sidebar Component
  const MobileSidebar = () => (
    <div className="bg-blue-900 text-white w-3/4 h-full max-w-xs flex flex-col">
      <div className="flex justify-between items-center p-4 border-b border-blue-700">
        <h2 className="font-bold text-lg">Menu</h2>
        <button onClick={closeMenu} className="text-white">
          <X className="text-xl" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <nav className="py-2">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <a 
                className={`flex items-center px-4 py-3 ${
                  location === item.path 
                    ? 'bg-blue-800' 
                    : ''
                } cursor-pointer`}
                onClick={closeMenu}
              >
                <span className="mr-3 w-6 text-center">{item.icon}</span>
                <span>{item.label}</span>
              </a>
            </Link>
          ))}
          <button 
            onClick={() => {
              handleLogout();
              closeMenu();
            }}
            className="flex w-full items-center px-4 py-3 cursor-pointer text-left"
          >
            <LogOut className="w-5 h-5 text-yellow-400 mr-3 text-center" />
            <span>Sair</span>
          </button>
        </nav>
      </div>
    </div>
  );

  // Desktop Sidebar Component
  const DesktopSidebar = () => (
    <div className="fixed left-0 top-0 h-full w-64 bg-blue-900 flex flex-col">
      <div className="p-6">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center mr-2">
            <Utensils className="text-blue-900 w-5 h-5" />
          </div>
          <span className="text-xl font-semibold text-white font-montserrat">
            Opa que delicia
          </span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <ul>
          {navItems.map((item) => (
            <li key={item.path} className="px-6 py-3">
              <Link href={item.path}>
                <a 
                  className={`flex items-center text-white ${
                    location === item.path 
                      ? 'bg-blue-800 bg-opacity-60' 
                      : 'hover:bg-blue-800 hover:bg-opacity-40'
                  } rounded-lg p-2 cursor-pointer transition-colors`}
                  onClick={closeMenu}
                >
                  {item.icon}
                  <span className="ml-3 font-medium">{item.label}</span>
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="mt-auto border-t border-blue-700 p-4">
        <button 
          onClick={handleLogout}
          className="flex w-full items-center text-white hover:bg-blue-800 hover:bg-opacity-40 rounded-lg p-2 cursor-pointer transition-colors"
        >
          <LogOut className="w-5 h-5 text-yellow-400" />
          <span className="ml-3 font-medium">Sair</span>
        </button>
        <button 
          className="flex w-full items-center text-white hover:bg-blue-800 hover:bg-opacity-40 rounded-lg p-2 mt-2 cursor-pointer transition-colors"
        >
          <Settings className="w-5 h-5 text-yellow-400" />
          <span className="ml-3 font-medium">Configurações</span>
        </button>
      </div>
    </div>
  );

  if (isMobile) {
    return <MobileSidebar />;
  }

  return (
    <>
      {/* Mobile sidebar com Sheet */}
      <div className="md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white p-0 h-auto">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 bg-blue-900 text-white">
            <MobileSidebar />
          </SheetContent>
        </Sheet>
      </div>
      
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <DesktopSidebar />
      </div>
    </>
  );
};

export default AdminSidebar;
