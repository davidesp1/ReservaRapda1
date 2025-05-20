import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import CustomerLayout from '@/components/layouts/CustomerLayout';

const Reservations: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const [isCreatingReservation, setIsCreatingReservation] = useState(false);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/');
    }
  }, [isAuthenticated, isLoading, setLocation]);
  
  // Fetch das reservas do usuário
  const { data: userReservations = [], isLoading: reservationsLoading } = useQuery({
    queryKey: ['/api/reservations'],
    enabled: !!isAuthenticated,
  });
  
  // Função para renderizar a lista de reservas existentes
  const renderExistingReservations = () => {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-montserrat font-bold">
            {t('Reservations')}
          </h1>
          
          <Button 
            className="bg-brasil-green hover:bg-green-700 text-white"
            onClick={() => setIsCreatingReservation(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('NewReservation')}
          </Button>
        </div>
        
        {reservationsLoading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-t-brasil-blue border-brasil-blue/30 rounded-full animate-spin mx-auto mb-4"></div>
            <p>{t('LoadingReservations')}</p>
          </div>
        ) : userReservations.length > 0 ? (
          <div className="space-y-4">
            {userReservations.map((reservation: any) => (
              <Card key={reservation.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h3 className="font-bold text-lg mb-1">
                        {new Date(reservation.date).toLocaleDateString()}
                      </h3>
                      <p className="text-gray-600">
                        {format(new Date(reservation.date), 'HH:mm')}
                      </p>
                      <Badge 
                        className={
                          reservation.status === 'confirmed' ? 'bg-green-500' :
                          reservation.status === 'cancelled' ? 'bg-red-500' :
                          'bg-yellow-500'
                        }
                      >
                        {t(reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1))}
                      </Badge>
                    </div>
                    
                    <div>
                      <p className="font-medium">{t('Table')}: {reservation.table_number}</p>
                      <p>{t('Guests')}: {reservation.partysize || reservation.party_size}</p>
                      {reservation.confirmationcode && (
                        <p className="mt-2 text-sm text-gray-600">
                          {t('ConfirmationCode')}: <span className="font-mono">{reservation.confirmationcode}</span>
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <p className="font-medium">{t('Total')}: €{((reservation.total || 0) / 100).toFixed(2)}</p>
                      {reservation.paymentstatus && (
                        <Badge 
                          className={
                            reservation.paymentstatus === 'paid' ? 'bg-green-500' :
                            reservation.paymentstatus === 'failed' ? 'bg-red-500' :
                            'bg-yellow-500'
                          }
                        >
                          {t(reservation.paymentstatus.charAt(0).toUpperCase() + reservation.paymentstatus.slice(1))}
                        </Badge>
                      )}
                      
                      <div className="mt-2 flex justify-end">
                        <Button variant="outline" size="sm" className="text-xs">
                          {t('ViewDetails')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-gray-500 mb-4">{t('NoReservations')}</p>
              <Button 
                className="bg-brasil-green hover:bg-green-700 text-white"
                onClick={() => setIsCreatingReservation(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('MakeFirstReservation')}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };
  
  // Renderização do componente principal
  return (
    <CustomerLayout title={t('Reservations')}>
      <div className="container max-w-7xl mx-auto py-6 space-y-8">
        {isCreatingReservation ? (
          <Card>
            <CardHeader>
              <CardTitle>{t('CreateReservation')}</CardTitle>
              <CardDescription>{t('CreateReservationDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-10">{t('ReservationCreationDisabled')}</p>
              
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreatingReservation(false)}
                >
                  {t('GoBack')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          renderExistingReservations()
        )}
      </div>
    </CustomerLayout>
  );
};

export default Reservations;