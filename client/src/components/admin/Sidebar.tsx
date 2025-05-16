import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Menu,
  LayoutDashboard,
  Users,
  Utensils,
  CalendarDays,
  CreditCard,
  FileText,
  Settings,
  LogOut
} from 'lucide-react';

const AdminSidebar: React.FC = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => {
    setIsOpen(false);
  };

  const navItems = [
    {
      path: '/admin/dashboard',
      label: t('Dashboard'),
      icon: <LayoutDashboard className="h-5 w-5 mr-3" />
    },
    {
      path: '/admin/customers',
      label: t('Customers'),
      icon: <Users className="h-5 w-5 mr-3" />
    },
    {
      path: '/admin/menu',
      label: t('MenuManagement'),
      icon: <Utensils className="h-5 w-5 mr-3" />
    },
    {
      path: '/admin/tables',
      label: t('Tables'),
      icon: <CalendarDays className="h-5 w-5 mr-3" />
    },
    {
      path: '/admin/finance',
      label: t('Finance'),
      icon: <CreditCard className="h-5 w-5 mr-3" />
    },
    {
      path: '/admin/reports',
      label: t('Reports'),
      icon: <FileText className="h-5 w-5 mr-3" />
    },
    {
      path: '/admin/settings',
      label: t('Settings'),
      icon: <Settings className="h-5 w-5 mr-3" />
    }
  ];

  const handleLogout = async () => {
    await logout();
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      <div className="p-4 border-b border-sidebar-border">
        <Logo />
      </div>
      
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground">
            <span className="font-semibold text-lg">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </span>
          </div>
          <div className="ml-3">
            <p className="font-semibold text-sidebar-foreground">{user?.firstName} {user?.lastName}</p>
            <p className="text-sm text-sidebar-foreground/70">{t('AdminPanel')}</p>
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
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground' 
                      : 'hover:bg-sidebar-accent/20'
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
      
      <div className="p-4 border-t border-sidebar-border mt-auto">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-white/90 hover:text-white hover:bg-red-500/20"
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
      <div className="md:hidden p-4 border-b bg-sidebar text-sidebar-foreground sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <Logo />
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-sidebar-foreground">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 bg-sidebar text-sidebar-foreground">
              <Sidebar />
            </SheetContent>
          </Sheet>
        </div>
      </div>
      
      {/* Desktop sidebar */}
      <div className="hidden md:block w-64 bg-sidebar text-sidebar-foreground h-screen sticky top-0">
        <Sidebar />
      </div>
    </>
  );
};

export default AdminSidebar;
