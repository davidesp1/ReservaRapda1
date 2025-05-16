import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotFound: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden bg-gray-50">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Circle decorations */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%]">
          <div className="w-full h-full border-4 border-brasil-green/20 rounded-full animate-pulse"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] border-4 border-brasil-yellow/20 rounded-full animate-pulse"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] border-4 border-brasil-blue/20 rounded-full animate-pulse"></div>
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0">
          <div className="absolute h-6 w-6 rounded-full bg-brasil-green/20 top-[10%] left-[15%] animate-bounce"></div>
          <div className="absolute h-8 w-8 rounded-full bg-brasil-yellow/20 top-[25%] left-[80%] animate-bounce"></div>
          <div className="absolute h-5 w-5 rounded-full bg-brasil-blue/20 top-[60%] left-[25%] animate-bounce"></div>
          <div className="absolute h-10 w-10 rounded-full bg-brasil-green/20 top-[70%] left-[85%] animate-bounce"></div>
          <div className="absolute h-7 w-7 rounded-full bg-brasil-yellow/20 top-[85%] left-[50%] animate-bounce"></div>
          <div className="absolute h-4 w-4 rounded-full bg-brasil-blue/20 top-[40%] left-[40%] animate-bounce"></div>
          <div className="absolute h-9 w-9 rounded-full bg-brasil-green/20 top-[15%] left-[65%] animate-bounce"></div>
          <div className="absolute h-6 w-6 rounded-full bg-brasil-yellow/20 top-[50%] left-[10%] animate-bounce"></div>
        </div>
      </div>

      {/* Main content */}
      <div className="z-10 text-center max-w-2xl mx-auto">
        {/* 404 number with 3D effect */}
        <h1 className="text-[10rem] md:text-[14rem] font-bold leading-none" 
            style={{textShadow: "0 0.05em 0 rgba(0,0,0,0.1), 0 0.05em 0 rgba(0,0,0,0.1), 0 0.1em 0 rgba(0,0,0,0.1), 0 0.15em 0 rgba(0,0,0,0.1), 0 0.2em 0.15em rgba(0,0,0,0.1)"}}>
          <span className="text-brasil-green">4</span>
          <span className="text-brasil-yellow">0</span>
          <span className="text-brasil-blue">4</span>
        </h1>

        {/* Error message */}
        <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-brasil-blue via-brasil-green to-brasil-yellow">
          {t('PageNotFound')}
        </h2>

        <p className="text-lg text-gray-700 mb-8">
          {t('PageNotFoundDescription')}
        </p>

        {/* Home button with hover animation */}
        <Link href="/">
          <Button variant="default" className="bg-brasil-green hover:bg-brasil-blue transition-all px-8 py-6 text-lg">
            <Home className="mr-2 h-5 w-5" />
            {t('BackToHome')}
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;