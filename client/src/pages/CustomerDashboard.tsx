import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { User, CreditCard, FileText } from 'lucide-react';
import CustomerLayout from '@/components/layouts/CustomerLayout';

const CustomerDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [_, setLocation] = useLocation();
  
  // Fetch user reservations
  const { data: reservations = [], isLoading: reservationsLoading } = useQuery({
    queryKey: ['/api/reservations'],
  });

  return (
    <CustomerLayout title={t('Dashboard')}>
      <h1 className="text-3xl font-montserrat font-bold mb-6">
        {t('Dashboard')}
      </h1>
      
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-4 md:w-[400px]">
          <TabsTrigger value="overview">{t('Overview')}</TabsTrigger>
          <TabsTrigger value="profile">{t('Profile')}</TabsTrigger>
          <TabsTrigger value="reservations">{t('Reservations')}</TabsTrigger>
          <TabsTrigger value="support">{t('Support')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  {t('ActiveReservations')}
                </CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reservationsLoading ? (
                    <div className="animate-pulse h-7 w-12 bg-gray-200 rounded"></div>
                  ) : (
                    (reservations as any[]).filter(r => r.status === 'confirmed')?.length || 0
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  {t('UpcomingReservation')}
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  {reservationsLoading ? (
                    <div className="animate-pulse h-7 w-32 bg-gray-200 rounded"></div>
                  ) : (
                    (reservations as any[]).length > 0
                      ? format(new Date((reservations as any[])[0].date), 'dd/MM/yyyy')
                      : t('NoReservations')
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  {t('PendingPayments')}
                </CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reservationsLoading ? (
                    <div className="animate-pulse h-7 w-12 bg-gray-200 rounded"></div>
                  ) : (
                    0
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  {t('TotalOrders')}
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reservationsLoading ? (
                    <div className="animate-pulse h-7 w-12 bg-gray-200 rounded"></div>
                  ) : (
                    0
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('PersonalInformation')}</CardTitle>
              <CardDescription>{t('ManageYourPersonalDetails')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    {t('FirstName')}
                  </label>
                  <input
                    type="text"
                    value={user?.firstName || ''}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    {t('LastName')}
                  </label>
                  <input
                    type="text"
                    value={user?.lastName || ''}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    {t('Email')}
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    {t('Username')}
                  </label>
                  <input
                    type="text"
                    value={user?.username || ''}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={() => setLocation('/profile')}
                  className="bg-brasil-green hover:bg-brasil-green/90"
                >
                  {t('EditProfile')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reservations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('ReservationHistory')}</CardTitle>
              <CardDescription>{t('ViewYourPastAndUpcomingReservations')}</CardDescription>
            </CardHeader>
            <CardContent>
              {reservationsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse flex space-x-4">
                      <div className="rounded-md bg-gray-200 h-16 w-16"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (reservations as any[]).length > 0 ? (
                <div className="space-y-4">
                  {(reservations as any[]).map((reservation: any) => (
                    <div key={reservation.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {format(new Date(reservation.date), 'dd/MM/yyyy')}
                          </h3>
                          <p className="text-gray-600">
                            {format(new Date(reservation.date), 'HH:mm')} • {t('Table')} {reservation.tableId} •{' '}
                            {t('Guests')}: {reservation.partySize}
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <span 
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-red-100 text-red-800'
                            }`}
                          >
                            {reservation.status === 'confirmed' ? t('Confirmed') :
                            reservation.status === 'pending' ? t('Pending') : t('Cancelled')}
                          </span>
                          <Button
                            onClick={() => setLocation(`/reservations/${reservation.id}`)}
                            variant="outline"
                            size="sm"
                          >
                            {t('Details')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">{t('NoReservationsYet')}</p>
                  <Button 
                    onClick={() => setLocation('/reservations')}
                    className="bg-brasil-green hover:bg-brasil-green/90"
                  >
                    {t('MakeYourFirstReservation')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="support" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('ContactSupport')}</CardTitle>
              <CardDescription>{t('WeAreHereToHelp')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 rounded-lg border hover:shadow-md transition-shadow">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brasil-yellow/10 flex items-center justify-center">
                    <i className="fas fa-phone text-brasil-yellow text-xl"></i>
                  </div>
                  <h3 className="font-semibold mb-2">{t('CallUs')}</h3>
                  <p className="text-gray-600">+351 912 345 678</p>
                </div>
                <div className="text-center p-4 rounded-lg border hover:shadow-md transition-shadow">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brasil-green/10 flex items-center justify-center">
                    <i className="fas fa-envelope text-brasil-green text-xl"></i>
                  </div>
                  <h3 className="font-semibold mb-2">{t('EmailUs')}</h3>
                  <p className="text-gray-600">suporte@opaquedelicia.pt</p>
                </div>
                <div className="text-center p-4 rounded-lg border hover:shadow-md transition-shadow">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brasil-blue/10 flex items-center justify-center">
                    <i className="fab fa-whatsapp text-brasil-blue text-xl"></i>
                  </div>
                  <h3 className="font-semibold mb-2">WhatsApp</h3>
                  <p className="text-gray-600">+351 912 345 678</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">{t('LeaveUsAMessage')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      {t('Subject')}
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                      <option value="">{t('SelectSubject')}</option>
                      <option value="reservation">{t('ReservationIssue')}</option>
                      <option value="payment">{t('PaymentIssue')}</option>
                      <option value="feedback">{t('Feedback')}</option>
                      <option value="other">{t('Other')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      {t('Priority')}
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                      <option value="normal">{t('Normal')}</option>
                      <option value="high">{t('High')}</option>
                      <option value="urgent">{t('Urgent')}</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      {t('Message')}
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md h-32"
                      placeholder={t('TypeYourMessageHere')}
                    ></textarea>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button className="bg-brasil-green hover:bg-brasil-green/90">
                    {t('SendMessage')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </CustomerLayout>
  );
};

export default CustomerDashboard;