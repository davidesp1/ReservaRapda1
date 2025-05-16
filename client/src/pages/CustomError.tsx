import React from 'react';
import { useTranslation } from 'react-i18next';
import { useRoute, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, ArrowLeft, Home } from 'lucide-react';
import Logo from '@/components/Logo';
import { Helmet } from 'react-helmet';

const CustomError: React.FC = () => {
  const { t } = useTranslation();
  const [match, params] = useRoute('/error/:code');
  
  const errorCode = match ? params.code : '404';
  
  // Define error messages based on code
  const getErrorInfo = () => {
    switch (errorCode) {
      case '401':
        return {
          title: t('Unauthorized'),
          message: t('YouNeedToLogin'),
          icon: 'fa-lock'
        };
      case '403':
        return {
          title: t('Forbidden'),
          message: t('YouDontHavePermission'),
          icon: 'fa-ban'
        };
      case '404':
        return {
          title: t('NotFound'),
          message: t('ThePageYouAreRequestingNotExists'),
          icon: 'fa-search'
        };
      case '500':
        return {
          title: t('ServerError'),
          message: t('ServerErrorOccurred'),
          icon: 'fa-exclamation-triangle'
        };
      default:
        return {
          title: t('Error'),
          message: t('AnErrorOccurred'),
          icon: 'fa-exclamation-circle'
        };
    }
  };
  
  const errorInfo = getErrorInfo();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Helmet>
        <title>{errorInfo.title} - Opa que delicia</title>
      </Helmet>
      
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-10 pb-8 px-10">
          <div className="flex justify-center mb-6">
            <Logo />
          </div>
          
          <div className="flex mb-4 gap-2 items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">
              {errorCode} - {errorInfo.title}
            </h1>
          </div>

          <p className="mt-4 text-sm text-gray-600 text-center mb-8">
            {errorInfo.message}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('GoBack')}
            </Button>
            <Button asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                {t('GoHome')}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomError;
