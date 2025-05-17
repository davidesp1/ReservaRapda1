import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Menu,
  Home, 
  User, 
  Utensils,
  CalendarCheck, 
  CreditCard, 
  Headphones, 
  LogOut 
} from 'lucide-react';

const CustomerSidebar: React.FC = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => {
    setIsOpen(false);
  };

  const navItems = [
    { 
      path: '/dashboard', 
      label: t('Dashboard'), 
      icon: <Home className="h-5 w-5 mr-3" /> 
    },
    { 
      path: '/profile', 
      label: t('Profile'), 
      icon: <User className="h-5 w-5 mr-3" /> 
    },
    { 
      path: '/menu', 
      label: t('Menu'), 
      icon: <Utensils className="h-5 w-5 mr-3" /> 
    },
    { 
      path: '/reservations', 
      label: t('Reservations'), 
      icon: <CalendarCheck className="h-5 w-5 mr-3" /> 
    },
    { 
      path: '/payments', 
      label: t('Payments'), 
      icon: <CreditCard className="h-5 w-5 mr-3" /> 
    },
    { 
      path: '/support', 
      label: t('Support'), 
      icon: <Headphones className="h-5 w-5 mr-3" /> 
    }
  ];

  const handleLogout = async () => {
    await logout();
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-brazil-blue text-white">
      <div className="p-6">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-brazil-yellow rounded-full flex items-center justify-center mr-2">
            <Utensils className="h-5 w-5 text-brazil-blue" />
          </div>
          <span className="text-xl font-semibold text-white font-montserrat">
            Opa que delicia
          </span>
        </div>
      </div>
      
      <nav className="flex-1 px-6 overflow-y-auto">
        <ul>
          {navItems.map((item) => (
            <li key={item.path} className="py-3">
              <Link 
                href={item.path}
                onClick={closeMenu}
                className={`flex items-center text-white rounded-lg p-2 transition cursor-pointer ${
                  location === item.path 
                    ? 'bg-brazil-blue bg-opacity-40' 
                    : 'hover:bg-brazil-blue hover:bg-opacity-40'
                }`}
              >
                <span className="text-brazil-yellow w-6">
                  {React.cloneElement(item.icon, { className: 'h-5 w-5' })}
                </span>
                <span className="ml-2 font-medium">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="mt-auto border-t border-blue-400 p-4">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-white hover:bg-brazil-blue hover:bg-opacity-40 rounded-lg p-2"
          onClick={handleLogout}
        >
          <LogOut className="text-brazil-yellow h-5 w-5 mr-2" />
          <span className="ml-2 font-medium">{t('Logout')}</span>
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar */}
      <div className="md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent side="left" className="p-0 w-64 bg-brazil-blue">
            <Sidebar />
          </SheetContent>
        </Sheet>
      </div>
      
      {/* Desktop sidebar */}
      <div className="hidden md:block w-64 h-full">
        <Sidebar />
      </div>
    </>
  );
};

export default CustomerSidebar;