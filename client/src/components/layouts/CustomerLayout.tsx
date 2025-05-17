import React, { ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Helmet } from 'react-helmet';
import CustomerSidebar from '@/components/customer/Sidebar';
import { Menu, User, Bell, ChevronRight } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface CustomerLayoutProps {
  children: ReactNode;
  title?: string;
}

export const CustomerLayout: React.FC<CustomerLayoutProps> = ({ 
  children, 
  title = 'Dashboard' 
}) => {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [_, setLocation] = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/');
    }
  }, [isAuthenticated, isLoading, setLocation]);
  
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brazil-green"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return null;
  }

  // Mobile Header Component
  const MobileHeader = () => (
    <header className="bg-brazil-blue text-white px-4 py-3 flex justify-between items-center shadow-md">
      <div className="flex items-center">
        <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-3 text-white hover:bg-brazil-blue/80">
              <Menu className="text-xl" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[75%] max-w-xs bg-brazil-blue">
            <CustomerSidebar />
          </SheetContent>
        </Sheet>
        <h1 className="text-lg font-bold">Opa que delicia</h1>
      </div>
      <div className="flex items-center">
        <Button variant="ghost" size="icon" className="relative mr-3 text-white hover:bg-brazil-blue/80">
          <Bell className="text-lg" />
          <span className="absolute -top-1 -right-1 bg-brazil-red text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            3
          </span>
        </Button>
        {user?.profilePicture ? (
          <div className="h-8 w-8 rounded-full overflow-hidden">
            <img src={user.profilePicture} alt="Profile" className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="h-8 w-8 rounded-full bg-brazil-yellow text-brazil-blue flex items-center justify-center">
            <span className="font-semibold text-sm">
              {user?.firstName?.charAt(0) || ''}{user?.lastName?.charAt(0) || ''}
            </span>
          </div>
        )}
      </div>
    </header>
  );

  // Desktop Header Component
  const DesktopHeader = () => (
    <header className="flex justify-between items-center mb-8">
      <h1 className="text-2xl font-bold text-gray-800 font-montserrat">
        {t('Hello')}, {user?.firstName || t('Client')}!
      </h1>
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute -top-1 -right-1 bg-brazil-red text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              3
            </span>
          </Button>
        </div>
        <div className="flex items-center">
          {user?.profilePicture ? (
            <img src={user.profilePicture} alt="User Avatar" className="w-10 h-10 rounded-full border-2 border-brazil-yellow" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-brazil-yellow text-brazil-blue flex items-center justify-center border-2 border-brazil-yellow">
              <span className="font-semibold text-sm">
                {user?.firstName?.charAt(0) || ''}{user?.lastName?.charAt(0) || ''}
              </span>
            </div>
          )}
          <div className="ml-2">
            <p className="text-sm font-medium text-gray-800">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-gray-500">{t('CustomerSince')} 2023</p>
          </div>
        </div>
      </div>
    </header>
  );

  return (
    <div className="min-h-screen bg-gray-100 font-opensans">
      <Helmet>
        <title>{title} - Opa que delicia</title>
        <meta name="description" content={`${title} - Gerencie sua conta no restaurante Opa que delicia.`} />
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
        <CustomerSidebar />
        
        <main className="flex-1 p-8 overflow-y-auto">
          <DesktopHeader />
          {children}
        </main>
      </div>
    </div>
  );
};

export default CustomerLayout;