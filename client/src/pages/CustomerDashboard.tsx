import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useRoute } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import CustomerSidebar from '@/components/customer/Sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { User, CreditCard, FileText, MessageSquare } from 'lucide-react';
import { Helmet } from 'react-helmet';

const CustomerDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, user, isLoading } = useAuth();
  const [_, setLocation] = useLocation();
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/');
    }
  }, [isAuthenticated, isLoading, setLocation]);
  
  // Fetch user reservations
  const { data: reservations, isLoading: reservationsLoading } = useQuery({
    queryKey: ['/api/reservations'],
    enabled: isAuthenticated,
  });
  
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
        <title>{t('Dashboard')} - Opa que delicia</title>
        <meta name="description" content="Gerencie suas reservas e perfil no Opa que delicia." />
      </Helmet>
      
      <div className="flex flex-col md:flex-row">
        <CustomerSidebar />
        
        <main className="flex-1 p-6">
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
                        (reservations?.filter((r: any) => r.status === 'confirmed')?.length || 0)
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
                        reservations && reservations.length > 0
                          ? format(new Date(reservations[0].date), 'dd/MM/yyyy')
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
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>{t('UpcomingReservations')}</CardTitle>
                    <CardDescription>{t('YourNextReservations')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {reservationsLoading ? (
                      <div className="space-y-4">
                        {[1, 2].map(i => (
                          <div key={i} className="animate-pulse flex space-x-4">
                            <div className="h-12 w-12 rounded-full bg-gray-200"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : reservations && reservations.length > 0 ? (
                      <ul className="space-y-4">
                        {reservations.slice(0, 3).map((reservation: any) => (
                          <li key={reservation.id} className="flex items-center justify-between border-b pb-2">
                            <div>
                              <p className="font-semibold">
                                {format(new Date(reservation.date), 'dd/MM/yyyy - HH:mm')}
                              </p>
                              <p className="text-sm text-gray-500">
                                {t('Table')}: {reservation.tableId} - {t('Guests')}: {reservation.partySize}
                              </p>
                            </div>
                            <div>
                              <span className={`inline-block px-2 py-1 rounded-full text-xs text-white ${
                                reservation.status === 'confirmed' ? 'bg-green-500' :
                                reservation.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                              }`}>
                                {reservation.status === 'confirmed' ? t('Confirmed') :
                                 reservation.status === 'pending' ? t('Pending') : t('Cancelled')}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-gray-500">{t('NoReservations')}</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => setLocation('/reservations')}
                        >
                          {t('MakeReservation')}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>{t('Availability')}</CardTitle>
                    <CardDescription>{t('ChooseDateForReservation')}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <Calendar
                      mode="single"
                      className="rounded-md border"
                    />
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>{t('CustomerSupport')}</CardTitle>
                  <CardDescription>{t('ContactUsForAssistance')}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center md:flex-row md:justify-around py-6">
                  <div className="text-center mb-4 md:mb-0">
                    <div className="rounded-full bg-brasil-green/10 p-3 w-16 h-16 flex items-center justify-center mx-auto mb-2">
                      <i className="fas fa-phone-alt text-brasil-green text-xl"></i>
                    </div>
                    <h3 className="font-montserrat font-semibold mb-1">{t('Phone')}</h3>
                    <p className="text-gray-600">+351 912 345 678</p>
                  </div>
                  
                  <div className="text-center mb-4 md:mb-0">
                    <div className="rounded-full bg-brasil-yellow/10 p-3 w-16 h-16 flex items-center justify-center mx-auto mb-2">
                      <i className="fas fa-envelope text-brasil-yellow text-xl"></i>
                    </div>
                    <h3 className="font-montserrat font-semibold mb-1">Email</h3>
                    <p className="text-gray-600">suporte@opaquedelicia.pt</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="rounded-full bg-brasil-blue/10 p-3 w-16 h-16 flex items-center justify-center mx-auto mb-2">
                      <i className="fab fa-whatsapp text-brasil-blue text-xl"></i>
                    </div>
                    <h3 className="font-montserrat font-semibold mb-1">WhatsApp</h3>
                    <p className="text-gray-600">+351 912 345 678</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('PersonalInformation')}</CardTitle>
                  <CardDescription>{t('ManageYourPersonalDetails')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  
                  <Button variant="outline">
                    {t('EditProfile')}
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>{t('Preferences')}</CardTitle>
                  <CardDescription>{t('ManageYourPreferences')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        {t('PreferredLanguage')}
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <option value="pt">Português</option>
                        <option value="en">English</option>
                        <option value="es">Español</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-2">
                        {t('NotificationPreferences')}
                      </label>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="email-notifications"
                            className="mr-2"
                            defaultChecked
                          />
                          <label htmlFor="email-notifications">
                            {t('EmailNotifications')}
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="sms-notifications"
                            className="mr-2"
                            defaultChecked
                          />
                          <label htmlFor="sms-notifications">
                            {t('SMSNotifications')}
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button className="mt-6" variant="outline">
                    {t('SavePreferences')}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="reservations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('MyReservations')}</CardTitle>
                  <CardDescription>{t('ManageYourReservations')}</CardDescription>
                </CardHeader>
                <CardContent>
                  {reservationsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse border rounded-md p-4">
                          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        </div>
                      ))}
                    </div>
                  ) : reservations && reservations.length > 0 ? (
                    <div className="divide-y">
                      {reservations.map((reservation: any) => (
                        <div key={reservation.id} className="py-4 first:pt-0 last:pb-0">
                          <div className="flex flex-col md:flex-row justify-between">
                            <div>
                              <p className="font-semibold text-lg">
                                {format(new Date(reservation.date), 'dd/MM/yyyy - HH:mm')}
                              </p>
                              <p className="text-gray-600">
                                {t('Table')}: {reservation.tableId} - {t('Guests')}: {reservation.partySize}
                              </p>
                              {reservation.notes && (
                                <p className="text-gray-600">
                                  <span className="font-medium">{t('Notes')}:</span> {reservation.notes}
                                </p>
                              )}
                            </div>
                            <div className="mt-2 md:mt-0 flex md:flex-col items-center md:items-end">
                              <span className={`inline-block px-2 py-1 rounded-full text-xs text-white ${
                                reservation.status === 'confirmed' ? 'bg-green-500' :
                                reservation.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                              }`}>
                                {reservation.status === 'confirmed' ? t('Confirmed') :
                                 reservation.status === 'pending' ? t('Pending') : t('Cancelled')}
                              </span>
                              
                              <div className="flex space-x-2 mt-2">
                                {reservation.status !== 'cancelled' && (
                                  <>
                                    <Button size="sm" variant="outline">
                                      <i className="fas fa-edit mr-1"></i> {t('Edit')}
                                    </Button>
                                    <Button size="sm" variant="destructive">
                                      <i className="fas fa-times mr-1"></i> {t('Cancel')}
                                    </Button>
                                  </>
                                )}
                              </div>
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
                      >
                        {t('MakeReservation')}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Button
                onClick={() => setLocation('/reservations')}
                className="bg-brasil-green hover:bg-green-700 text-white"
              >
                <i className="fas fa-plus mr-2"></i> {t('NewReservation')}
              </Button>
            </TabsContent>
            
            <TabsContent value="support" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('CustomerSupport')}</CardTitle>
                  <CardDescription>{t('GetHelpWithYourReservations')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="rounded-lg border p-4 bg-gray-50">
                    <h3 className="font-montserrat font-bold text-lg mb-2">{t('ContactUs')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div className="text-center p-4 rounded-lg border bg-white">
                        <i className="fas fa-phone text-brasil-green text-xl mb-2"></i>
                        <h4 className="font-semibold">{t('Phone')}</h4>
                        <p>+351 912 345 678</p>
                      </div>
                      <div className="text-center p-4 rounded-lg border bg-white">
                        <i className="fas fa-envelope text-brasil-yellow text-xl mb-2"></i>
                        <h4 className="font-semibold">Email</h4>
                        <p>suporte@opaquedelicia.pt</p>
                      </div>
                      <div className="text-center p-4 rounded-lg border bg-white">
                        <i className="fab fa-whatsapp text-brasil-blue text-xl mb-2"></i>
                        <h4 className="font-semibold">WhatsApp</h4>
                        <p>+351 912 345 678</p>
                      </div>
                    </div>
                  </div>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle>{t('SendMessage')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700 block mb-1">
                            {t('Subject')}
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder={t('EnterSubject')}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700 block mb-1">
                            {t('Message')}
                          </label>
                          <textarea
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            rows={5}
                            placeholder={t('WriteYourMessage')}
                          ></textarea>
                        </div>
                        <Button className="w-full">
                          <MessageSquare className="mr-2 h-4 w-4" /> {t('SendMessage')}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default CustomerDashboard;
