import React, { ReactNode, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Helmet } from 'react-helmet';
import CustomerSidebar from '@/components/customer/Sidebar';

interface CustomerLayoutProps {
  children: ReactNode;
  title?: string;
}

export const CustomerLayout: React.FC<CustomerLayoutProps> = ({ 
  children, 
  title = 'Dashboard' 
}) => {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();
  const [_, setLocation] = useLocation();
  
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

  return (
    <div className="min-h-screen bg-pattern">
      <Helmet>
        <title>{title} - Opa que delicia</title>
        <meta name="description" content={`${title} - Gerencie sua conta no restaurante Opa que delicia.`} />
      </Helmet>
      
      <div className="flex flex-col md:flex-row">
        <CustomerSidebar />
        
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default CustomerLayout;