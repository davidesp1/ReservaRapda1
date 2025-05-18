import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  FaUtensils, FaChartLine, FaUsers, FaBookOpen, 
  FaChair, FaCoins, FaCreditCard, FaCalendarCheck, 
  FaCog, FaSignOutAlt, FaBars, FaTimes
} from 'react-icons/fa';

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
      label: t('Dashboard'),
      icon: <FaChartLine className="w-6 text-brasil-yellow" />
    },
    {
      path: '/admin/customers',
      label: t('Customers'),
      icon: <FaUsers className="w-6 text-brasil-yellow" />
    },
    {
      path: '/admin/menu',
      label: t('MenuManagement'),
      icon: <FaBookOpen className="w-6 text-brasil-yellow" />
    },
    {
      path: '/admin/tables',
      label: t('Tables'),
      icon: <FaChair className="w-6 text-brasil-yellow" />
    },
    {
      path: '/admin/finance',
      label: t('Finance'),
      icon: <FaCoins className="w-6 text-brasil-yellow" />
    },
    {
      path: '/admin/reservations',
      label: t('Reservations'),
      icon: <FaCalendarCheck className="w-6 text-brasil-yellow" />
    },
    {
      path: '/admin/settings',
      label: t('Settings'),
      icon: <FaCog className="w-6 text-brasil-yellow" />
    }
  ];

  const handleLogout = async () => {
    await logout();
  };

  // Mobile Sidebar Component
  const MobileSidebar = () => (
    <div className="bg-brasil-blue text-white w-3/4 h-full max-w-xs flex flex-col">
      <div className="flex justify-between items-center p-4 border-b border-blue-700">
        <h2 className="font-bold text-lg">Menu</h2>
        <button onClick={closeMenu} className="text-white">
          <FaTimes className="text-xl" />
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
            <FaSignOutAlt className="w-6 text-brasil-yellow mr-3 text-center" />
            <span>{t('Logout')}</span>
          </button>
        </nav>
      </div>
    </div>
  );

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
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <ul>
          {navItems.map((item) => (
            <li key={item.path} className="px-6 py-3">
              <Link href={item.path}>
                <a 
                  className={`flex items-center text-white ${
                    location === item.path 
                      ? 'bg-brasil-blue bg-opacity-40' 
                      : 'hover:bg-brasil-blue hover:bg-opacity-40'
                  } rounded-lg p-2 cursor-pointer`}
                  onClick={closeMenu}
                >
                  {item.icon}
                  <span className="ml-2 font-medium">{item.label}</span>
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="mt-auto border-t border-blue-400 p-4">
        <button 
          onClick={handleLogout}
          className="flex w-full items-center text-white hover:bg-brasil-blue hover:bg-opacity-40 rounded-lg p-2 cursor-pointer"
        >
          <FaSignOutAlt className="w-6 text-brasil-yellow" />
          <span className="ml-2 font-medium">{t('Logout')}</span>
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
              <FaBars className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 bg-brasil-blue text-white">
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
