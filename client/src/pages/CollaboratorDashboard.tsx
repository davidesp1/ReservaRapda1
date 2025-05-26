import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Helmet } from 'react-helmet';
import POSMode from '@/pages/admin/POSMode';

const CollaboratorDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isCollaborator, isLoading } = useAuth();
  const [_, setLocation] = useLocation();
  
  // Redirect to home if not authenticated or not collaborator
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isCollaborator)) {
      setLocation('/');
    }
  }, [isAuthenticated, isCollaborator, isLoading, setLocation]);
  
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brasil-green"></div>
      </div>
    );
  }
  
  if (!isAuthenticated || !isCollaborator) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Helmet>
        <title>{t('POS')} - Opa que delicia</title>
        <meta name="description" content="Sistema de ponto de venda do restaurante Opa que delicia." />
      </Helmet>
      
      <div className="h-screen">
        <POSMode />
      </div>
    </div>
  );
};

export default CollaboratorDashboard;