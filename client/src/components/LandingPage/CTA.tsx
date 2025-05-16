import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

const CTA: React.FC = () => {
  const { t } = useTranslation();
  
  const scrollToContact = () => {
    const contactSection = document.getElementById('contato');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="py-16 bg-brasil-blue">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-montserrat font-bold text-white mb-6 animate-slide-up">
          {t('EnjoyBrazil')}
        </h2>
        <p className="text-lg text-white/90 mb-8 max-w-3xl mx-auto animate-fade-in">
          {t('GuaranteeTable')}
        </p>
        <Button 
          className="bg-brasil-yellow hover:bg-yellow-400 text-brasil-blue text-xl font-bold py-8 px-10 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg animate-slide-up"
          onClick={scrollToContact}
        >
          {t('BookNow')}
        </Button>
      </div>
    </section>
  );
};

export default CTA;
