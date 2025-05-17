import React, { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Helmet } from 'react-helmet';
import AdminSidebar from '@/components/admin/Sidebar';
import { FaBell } from 'react-icons/fa';

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

  return (
    <div className="min-h-screen bg-gray-100 font-opensans">
      <Helmet>
        <title>{title} - Opa que delicia</title>
        <meta name="description" content={`${title} - Painel de administração do restaurante Opa que delicia.`} />
      </Helmet>
      
      <div className="flex h-screen">
        <AdminSidebar />
        
        <div id="main-content" className="ml-64 flex-1 p-8">
          {/* Header */}
          <div id="header" className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 font-montserrat">{title}</h1>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button className="relative">
                  <FaBell className="text-xl text-gray-600" />
                  <span className="absolute -top-1 -right-1 bg-brasil-red text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {/* Number of notifications */}
                    3
                  </span>
                </button>
              </div>
              <div className="flex items-center">
                {user?.profileImageUrl ? (
                  <img 
                    src={user.profileImageUrl} 
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