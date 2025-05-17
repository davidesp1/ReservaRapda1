import React, { ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Helmet } from 'react-helmet';
import CustomerSidebar from '@/components/customer/Sidebar';
import { Menu, User, Bell } from 'lucide-react';
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brasil-green"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return null;
  }

  // Mobile Header Component
  const MobileHeader = () => (
    <header className="bg-brasil-green text-white px-4 py-3 flex justify-between items-center shadow-md">
      <div className="flex items-center">
        <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-3 text-white hover:bg-brasil-green/80">
              <Menu className="text-xl" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[75%] max-w-xs">
            <CustomerSidebar />
          </SheetContent>
        </Sheet>
        <h1 className="text-lg font-bold">Opa que delicia</h1>
      </div>
      <div className="flex items-center">
        <Button variant="ghost" size="icon" className="relative mr-3 text-white hover:bg-brasil-green/80">
          <Bell className="text-lg" />
          <span className="absolute -top-1 -right-1 bg-brasil-red text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            2
          </span>
        </Button>
        {user?.profilePicture ? (
          <div className="h-8 w-8 rounded-full overflow-hidden">
            <img src={user.profilePicture} alt="Profile" className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="h-8 w-8 rounded-full bg-brasil-yellow text-brasil-blue flex items-center justify-center">
            <span className="font-semibold text-sm">
              {user?.firstName?.charAt(0) || ''}{user?.lastName?.charAt(0) || ''}
            </span>
          </div>
        )}
      </div>
    </header>
  );

  // Mobile Dashboard Title
  const MobilePageTitle = () => (
    <div className="px-4 py-3 flex justify-between items-center">
      <h2 className="text-xl font-bold text-gray-800">{title}</h2>
      <div>
        <span className="text-sm text-gray-500">{t('Today')}</span>
        <span className="ml-1 text-sm font-medium text-gray-700">{format(new Date(), 'dd/MM/yyyy')}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-pattern">
      <Helmet>
        <title>{title} - Opa que delicia</title>
        <meta name="description" content={`${title} - Gerencie sua conta no restaurante Opa que delicia.`} />
      </Helmet>
      
      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col h-screen">
        <MobileHeader />
        <MobilePageTitle />
        
        {/* Mobile Main Content */}
        <main className="flex-1 overflow-y-auto px-4 pb-16">
          {children}
        </main>
      </div>
      
      {/* Desktop Layout */}
      <div className="hidden md:flex flex-col md:flex-row h-screen">
        <CustomerSidebar />
        
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default CustomerLayout;