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
  CalendarDays, 
  CreditCard, 
  MessageSquare, 
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
      path: '/reservations', 
      label: t('Reservations'), 
      icon: <CalendarDays className="h-5 w-5 mr-3" /> 
    },
    { 
      path: '/payments', 
      label: t('Payments'), 
      icon: <CreditCard className="h-5 w-5 mr-3" /> 
    },
    { 
      path: '/support', 
      label: t('Support'), 
      icon: <MessageSquare className="h-5 w-5 mr-3" /> 
    }
  ];

  const handleLogout = async () => {
    await logout();
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <Logo />
      </div>
      
      <div className="p-4 border-b">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-brasil-green/10 flex items-center justify-center text-brasil-green">
            <span className="font-semibold text-lg">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </span>
          </div>
          <div className="ml-3">
            <p className="font-semibold">{user?.firstName} {user?.lastName}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link href={item.path}>
                <a 
                  className={`flex items-center p-2 rounded-md transition-colors ${
                    location === item.path 
                      ? 'bg-brasil-green text-white' 
                      : 'hover:bg-brasil-green/10'
                  }`}
                  onClick={closeMenu}
                >
                  {item.icon}
                  {item.label}
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t mt-auto">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 mr-3" />
          {t('Logout')}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar */}
      <div className="md:hidden p-4 border-b bg-white sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <Logo />
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <Sidebar />
            </SheetContent>
          </Sheet>
        </div>
      </div>
      
      {/* Desktop sidebar */}
      <div className="hidden md:block w-64 border-r bg-white h-screen sticky top-0">
        <Sidebar />
      </div>
    </>
  );
};

export default CustomerSidebar;
