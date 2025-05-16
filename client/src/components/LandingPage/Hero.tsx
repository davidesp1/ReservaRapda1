import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { EVENT_INFO } from '@/constants';

const Hero: React.FC = () => {
  const { t } = useTranslation();
  
  const scrollToContact = () => {
    const contactSection = document.getElementById('contato');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section 
      id="home"
      className="relative h-screen flex items-center justify-center bg-cover bg-center" 
      style={{backgroundImage: 'url("https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080")'}}
    >
      <div className="hero-gradient absolute inset-0"></div>
      <div className="container mx-auto px-6 relative z-10 text-center animate-fade-in">
        <h1 className="text-4xl md:text-6xl font-montserrat font-bold text-white mb-4">{t('FlavorsOfBrazil')}</h1>
        <h2 className="text-xl md:text-2xl font-light text-white mb-8">{t('AuthenticCuisine')}</h2>
        <div className="bg-white/20 inline-block py-2 px-4 rounded-lg backdrop-blur-sm mb-8">
          <p className="text-white text-lg md:text-xl font-semibold">
            {EVENT_INFO.startDate.split('-')[2]}/{EVENT_INFO.startDate.split('-')[1]} a {EVENT_INFO.endDate.split('-')[2]}/{EVENT_INFO.endDate.split('-')[1]}/{EVENT_INFO.endDate.split('-')[0]}
          </p>
        </div>
        <Button 
          className="bg-brasil-yellow text-brasil-blue text-xl font-bold py-8 px-8 rounded-lg hover:bg-yellow-400 transition-all duration-300 transform hover:scale-105 shadow-lg"
          onClick={scrollToContact}
        >
          {t('BookNowHero')}
        </Button>
      </div>
    </section>
  );
};

export default Hero;
