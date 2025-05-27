import React, { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Helmet } from 'react-helmet';
import AdminSidebar from '@/components/admin/Sidebar';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { FaBell, FaBars } from 'react-icons/fa';
import { format } from 'date-fns';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ 
  children, 
  title = 'Admin Panel' 
}) => {
  const { t } = useTranslation();
  const { user, isAuthenticated, isAdmin, isLoading } = useAuth();
  const [_, setLocation] = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Redirect to home if not authenticated or not admin
  React.useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      setLocation('/');
    }
  }, [isAuthenticated, isAdmin, isLoading, setLocation]);
  
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brasil-green"></div>
      </div>
    );
  }
  
  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  // Mobile Header Component
  const MobileHeader = () => (
    <header className="bg-brasil-blue text-white px-4 py-3 flex justify-between items-center shadow-md">
      <div className="flex items-center">
        <button onClick={toggleMobileSidebar} className="mr-3">
          <FaBars className="text-xl" />
        </button>
        <h1 className="text-lg font-bold">{t('AdminDashboard')}</h1>
      </div>
      <div className="flex items-center">
        <div className="mr-2 text-white">
          <LanguageSwitcher />
        </div>
        <button className="relative mr-4">
          <FaBell className="text-lg" />
          <span className="absolute -top-1 -right-1 bg-brasil-red text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            3
          </span>
        </button>
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
  const MobileDashboardTitle = () => (
    <div className="px-4 py-3 flex justify-between items-center">
      <h2 className="text-xl font-bold text-gray-800">{title}</h2>
      <div>
        <span className="text-sm text-gray-500">{t('Today')}</span>
        <span className="ml-1 text-sm font-medium text-gray-700">{format(new Date(), 'dd/MM/yyyy')}</span>
      </div>
    </div>
  );

  // Desktop Header
  const DesktopHeader = () => (
    <div id="header" className="flex justify-between items-center mb-8">
      <h1 className="text-2xl font-bold text-gray-800 font-montserrat">{title}</h1>
      <div className="flex items-center space-x-4">
        <LanguageSwitcher />
        <div className="relative">
          <button className="relative">
            <FaBell className="text-xl text-gray-600" />
            <span className="absolute -top-1 -right-1 bg-brasil-red text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              3
            </span>
          </button>
        </div>
        <div className="flex items-center">
          {user?.profilePicture ? (
            <img 
              src={user.profilePicture} 
              alt="User Avatar" 
              className="w-10 h-10 rounded-full border-2 border-brasil-yellow object-cover" 
            />
          ) : (
            <div className="w-10 h-10 rounded-full border-2 border-brasil-yellow bg-brasil-blue text-white flex items-center justify-center">
              <span className="font-semibold">
                {user?.firstName?.charAt(0) || ''}{user?.lastName?.charAt(0) || ''}
              </span>
            </div>
          )}
          <div className="ml-2">
            <p className="text-sm font-medium text-gray-800">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500">{t('AdminRole')}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <Helmet>
        <title>{title} - Opa que delicia</title>
        <meta name="description" content={`${title} - Painel de administração do restaurante Opa que delicia.`} />
      </Helmet>
      
      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col h-screen">
        <MobileHeader />
        
        {/* Mobile Sidebar (slideover) */}
        <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
          <SheetContent side="left" className="p-0 bg-brasil-blue text-white">
            <AdminSidebar isMobile={true} onClose={() => setIsMobileSidebarOpen(false)} />
          </SheetContent>
        </Sheet>
        
        <MobileDashboardTitle />
        
        {/* Mobile Main Content */}
        <main className="flex-1 overflow-y-auto pb-16">
          {children}
        </main>
      </div>
      
      {/* Desktop Layout */}
      <div className="hidden md:flex h-screen">
        <AdminSidebar />
        
        <div id="main-content" className="ml-64 flex-1 p-8">
          <DesktopHeader />

          {/* Main content */}
          <main className="overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;