import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO, addDays } from 'date-fns';
import { pt } from 'date-fns/locale';
import CustomerLayout from '@/components/layouts/CustomerLayout';

// Importe os ícones necessários
import { CalendarCheck, ChevronRight } from 'lucide-react';

const CustomerDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [_, setLocation] = useLocation();
  
  // Fetch user reservations
  const { data: reservations = [], isLoading: reservationsLoading } = useQuery({
    queryKey: ['/api/reservations'],
  });

  // Dummy special offers for now - in production, these would come from the API
  const specialOffers = [
    {
      id: 1,
      title: 'Feijoada Completa',
      description: '20% de desconto aos sábados',
      image: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/b244fcda5b-4ef65045cac5d7d21c7f.png'
    }
  ];

  // Dummy menu highlights - in production, these would come from the API
  const menuHighlights = [
    {
      id: 1,
      name: 'Moqueca de Camarão',
      description: 'Prato típico baiano com camarões e leite de coco',
      price: 2490,
      image: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/14db3df368-c5ada7c592c7a6a484df.png',
      popular: true
    },
    {
      id: 2,
      name: 'Picanha na Brasa',
      description: 'Corte nobre de carne bovina grelhada ao ponto',
      price: 3290,
      image: 'https://images.unsplash.com/photo-1579366948929-444eb79881eb?q=80&w=500&auto=format&fit=crop',
      popular: false
    },
    {
      id: 3,
      name: 'Açaí na Tigela',
      description: 'Deliciosa sobremesa com frutas frescas e granola',
      price: 1590,
      image: 'https://images.unsplash.com/photo-1590080875238-5496b40f074c?q=80&w=500&auto=format&fit=crop',
      popular: false
    },
    {
      id: 4,
      name: 'Coxinha Tradicional',
      description: 'Salgado brasileiro recheado com frango desfiado',
      price: 790,
      image: 'https://images.unsplash.com/photo-1604152135912-04a022e73f33?q=80&w=500&auto=format&fit=crop',
      popular: true
    }
  ];

  // Format price to display as currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(price / 100);
  };

  // Get upcoming reservation from API response
  const upcomingReservation = Array.isArray(reservations) && reservations.length > 0 
    ? reservations[0] 
    : null;

  return (
    <CustomerLayout title={t('Dashboard')}>
      {/* Welcome Banner */}
      <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-gradient-to-r from-brasil-blue to-blue-700 rounded-xl p-6 text-white shadow-lg mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h2 className="text-2xl font-bold font-montserrat mb-2">{t('WelcomeToOpaQueDelicia')}</h2>
            <p className="opacity-90">{t('AuthenticBrazilianCuisineWaitingForYou')}</p>
          </div>
          <Button 
            onClick={() => setLocation('/reservations')}
            className="bg-brasil-yellow text-brasil-blue font-bold py-2 px-6 rounded-lg hover:bg-yellow-300 transition shadow-md"
          >
            {t('MakeReservation')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Upcoming Reservations */}
        <div className="col-span-1 md:col-span-2 bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-brasil-green px-6 py-4">
            <h3 className="text-lg font-bold text-white font-montserrat">{t('YourUpcomingReservations')}</h3>
          </div>
          <div className="p-6">
            {reservationsLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-16 bg-gray-200 rounded"></div>
                <div className="h-10 w-32 mx-auto bg-gray-200 rounded"></div>
              </div>
            ) : upcomingReservation ? (
              <div className="mb-4 border-b border-gray-100 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-brasil-green bg-opacity-10 rounded-full flex items-center justify-center text-brasil-green">
                      <CalendarCheck className="h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <h4 className="font-semibold text-gray-800">
                        {upcomingReservation.occasion || t('Dinner')} - {t('Table')} {upcomingReservation.tableId}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {upcomingReservation.date ? 
                          format(new Date(upcomingReservation.date), 'EEEE, d MMMM', { locale: pt }) : 
                          format(new Date(), 'EEEE, d MMMM', { locale: pt })
                        } • {
                          upcomingReservation.date ? 
                          format(new Date(upcomingReservation.date), 'HH:mm') : 
                          '19:30'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => setLocation(`/reservations/${upcomingReservation.id}`)}
                      className="text-sm bg-brasil-blue text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                    >
                      {t('Details')}
                    </Button>
                    <Button 
                      onClick={() => {/* Handle cancellation */}}
                      variant="outline"
                      className="text-sm bg-white border border-brasil-red text-brasil-red px-3 py-1 rounded hover:bg-red-50 transition"
                    >
                      {t('Cancel')}
                    </Button>
                  </div>
                </div>
                <div className="mt-3 flex items-center text-sm text-gray-600">
                  <span className="mr-2">👥</span>
                  <span>{upcomingReservation.partySize || 4} {t('people')}</span>
                  <span className="mx-2">•</span>
                  <span className="mr-2">🍽️</span>
                  <span>{upcomingReservation.occasion || t('Dinner')}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-4">{t('NoUpcomingReservations')}</p>
                <Button 
                  onClick={() => setLocation('/reservations')}
                  className="bg-brasil-green text-white hover:bg-brasil-green/90"
                >
                  {t('BookTable')}
                </Button>
              </div>
            )}
            
            <div className="flex justify-center">
              <Button 
                onClick={() => setLocation('/reservations')}
                variant="link"
                className="text-brasil-blue font-medium hover:text-brasil-green transition flex items-center"
              >
                <span>{t('ViewAllReservations')}</span>
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Special Offers */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-brasil-yellow px-6 py-4">
            <h3 className="text-lg font-bold text-brasil-blue font-montserrat">{t('SpecialOffers')}</h3>
          </div>
          <div className="p-6">
            {specialOffers.map(offer => (
              <div key={offer.id} className="relative rounded-lg overflow-hidden mb-4">
                <img className="w-full h-48 object-cover" src={offer.image} alt={offer.title} />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                  <span className="text-white font-bold">{offer.title}</span>
                  <p className="text-white text-sm">{offer.description}</p>
                </div>
              </div>
            ))}
            <Button 
              onClick={() => setLocation('/menu')}
              className="w-full bg-brasil-yellow text-brasil-blue font-bold py-2 rounded hover:bg-yellow-300 transition"
            >
              {t('ViewPromotions')}
            </Button>
          </div>
        </div>
      </div>

      {/* Menu Highlights */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 font-montserrat">{t('MenuHighlights')}</h2>
          <Button 
            onClick={() => setLocation('/menu')}
            variant="link" 
            className="text-brasil-blue hover:text-brasil-green font-medium"
          >
            {t('ViewFullMenu')}
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {menuHighlights.map(item => (
            <div key={item.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition group">
              <div className="relative h-48 overflow-hidden">
                <img 
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                  src={item.image} 
                  alt={item.name} 
                />
                {item.popular && (
                  <div className="absolute top-2 right-2 bg-brazil-red text-white text-xs font-bold px-2 py-1 rounded">
                    {t('POPULAR')}
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">{item.description}</p>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-brazil-green">{formatPrice(item.price)}</span>
                  <Button 
                    onClick={() => {/* Add to order logic */}}
                    variant="outline" 
                    size="sm"
                    className="text-xs border-brazil-blue text-brazil-blue hover:bg-brazil-blue hover:text-white"
                  >
                    {t('AddToOrder')}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </CustomerLayout>
  );
};

export default CustomerDashboard;