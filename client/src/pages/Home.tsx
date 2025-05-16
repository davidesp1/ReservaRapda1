import React from 'react';
import Header from '@/components/LandingPage/Header';
import Hero from '@/components/LandingPage/Hero';
import About from '@/components/LandingPage/About';
import Menu from '@/components/LandingPage/Menu';
import Testimonials from '@/components/LandingPage/Testimonials';
import Location from '@/components/LandingPage/Location';
import CTA from '@/components/LandingPage/CTA';
import Footer from '@/components/LandingPage/Footer';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { EVENT_INFO } from '@/constants';

const Home: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className="landing-page bg-pattern min-h-screen">
      <Helmet>
        <title>Opa que delicia - {t('FlavorsOfBrazil')}</title>
        <meta name="description" content={`${t('AuthenticCuisine')}. ${EVENT_INFO.startDate.split('-')[2]}/${EVENT_INFO.startDate.split('-')[1]} a ${EVENT_INFO.endDate.split('-')[2]}/${EVENT_INFO.endDate.split('-')[1]}/${EVENT_INFO.endDate.split('-')[0]}`} />
      </Helmet>
      
      <Header />
      <Hero />
      <About />
      <Menu />
      <Testimonials />
      <Location />
      <CTA />
      <Footer />
    </div>
  );
};

export default Home;
