import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Helmet } from 'react-helmet';
import AdminSidebar from '@/components/admin/Sidebar';
import Dashboard from '@/pages/admin/Dashboard';

const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isAdmin, isCollaborator, isLoading } = useAuth();
  const [_, setLocation] = useLocation();
  
  // Redirect to home if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      setLocation('/');
    }
  }, [isAuthenticated, isAdmin, isLoading, setLocation]);

  // Redirect collaborators to their own dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && isCollaborator) {
      setLocation('/collaborator');
    }
  }, [isAuthenticated, isCollaborator, isLoading, setLocation]);
  
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
    <div className="min-h-screen bg-gray-100">
      <Helmet>
        <title>{t('AdminPanel')} - Opa que delicia</title>
        <meta name="description" content="Painel de administração do restaurante Opa que delicia." />
      </Helmet>
      
      <div className="flex h-screen">
        <AdminSidebar />
        
        <main className="flex-1 overflow-y-auto">
          <Dashboard />
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
