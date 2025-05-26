import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { CustomerLayout } from '@/components/layouts/CustomerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';

const ProfilePage = () => {
  const { t } = useTranslation();
  const { isCollaborator } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  
  // Buscar dados do usuário
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/auth/me'],
  });

  // Para colaboradores, renderize apenas o conteúdo sem o layout do cliente
  if (isCollaborator) {
    return null; // Será redirecionado para CollaboratorProfile via rota
  }

  return (
    <CustomerLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">{t('Profile')}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage 
                      src={user?.profileImageUrl || ""} 
                      alt={user?.firstName || "User"} 
                    />
                    <AvatarFallback className="text-2xl bg-brasil-blue text-white">
                      {user?.firstName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle>{user?.firstName || 'User'} {user?.lastName || ''}</CardTitle>
                <CardDescription className="mt-1">{user?.email || ''}</CardDescription>
                <div className="mt-2">
                  <Badge variant="outline" className="text-brasil-blue border-brasil-blue">
                    {t('Client')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">
                  {t('MemberSince')}: {new Date().toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500">
                  {t('LoyaltyPoints')}: 120
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Main Content */}
          <div className="md:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="personal">{t('PersonalInformation')}</TabsTrigger>
                <TabsTrigger value="dietary">{t('DietaryPreferences')}</TabsTrigger>
                <TabsTrigger value="notifications">{t('NotificationPreferences')}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="personal">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('PersonalInformation')}</CardTitle>
                    <CardDescription>{t('ManageYourPersonalDetails')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-500 mb-4">{t('PersonalInfoDescription')}</p>
                    <Button 
                      className="w-full bg-brasil-green text-white hover:bg-brasil-green/90"
                    >
                      {t('EditProfile')}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="dietary">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('DietaryPreferences')}</CardTitle>
                    <CardDescription>{t('ManageYourDietaryPreferences')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-500 mb-4">{t('DietaryPreferencesDescription')}</p>
                    <Button 
                      className="w-full bg-brasil-green text-white hover:bg-brasil-green/90"
                    >
                      {t('UpdatePreferences')}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="notifications">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('NotificationPreferences')}</CardTitle>
                    <CardDescription>{t('ManageYourNotifications')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-500 mb-4">{t('NotificationPreferencesDescription')}</p>
                    <Button 
                      className="w-full bg-brasil-green text-white hover:bg-brasil-green/90"
                    >
                      {t('UpdateNotifications')}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
};

export default ProfilePage;