import React from 'react';
import { useTranslation } from 'react-i18next';
import Logo from '@/components/Logo';
import { RESTAURANT_INFO, SUPPORTED_LANGUAGES } from '@/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const Footer: React.FC = () => {
  const { t, i18n } = useTranslation();
  
  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
  };

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <div className="flex items-center mb-6">
              <Logo textSize="text-3xl" withLink={true} />
            </div>
            <p className="text-gray-400 mb-6">
              {t('Trazendo os autênticos sabores do Brasil para Portugal desde')} {RESTAURANT_INFO.founded}.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-brasil-yellow transition-colors duration-300" aria-label="Facebook">
                <i className="fab fa-facebook-f text-xl"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-brasil-yellow transition-colors duration-300" aria-label="Instagram">
                <i className="fab fa-instagram text-xl"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-brasil-yellow transition-colors duration-300" aria-label="Twitter">
                <i className="fab fa-twitter text-xl"></i>
              </a>
              <a href={`https://wa.me/${RESTAURANT_INFO.whatsapp.replace(/\+|\s+/g, '')}`} className="text-gray-400 hover:text-brasil-yellow transition-colors duration-300" aria-label="WhatsApp">
                <i className="fab fa-whatsapp text-xl"></i>
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-montserrat font-bold text-xl mb-6">{t('QuickLinks')}</h3>
            <ul className="space-y-3">
              <li><a href="#home" className="text-gray-400 hover:text-brasil-yellow transition-colors duration-300">{t('Home')}</a></li>
              <li><a href="#sobre" className="text-gray-400 hover:text-brasil-yellow transition-colors duration-300">{t('About')}</a></li>
              <li><a href="#menu" className="text-gray-400 hover:text-brasil-yellow transition-colors duration-300">{t('Menu')}</a></li>
              <li><a href="#contato" className="text-gray-400 hover:text-brasil-yellow transition-colors duration-300">{t('Contact')}</a></li>
              <li><a href="#" className="text-gray-400 hover:text-brasil-yellow transition-colors duration-300">{t('Reservations')}</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-montserrat font-bold text-xl mb-6">{t('Contact')}</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <i className="fas fa-map-marker-alt text-brasil-yellow mr-3 mt-1"></i>
                <span className="text-gray-400">{RESTAURANT_INFO.name}, Rua das Marinhas do Tejo nº 51, 2690-366 Santa Iria de Azóia, Portugal</span>
              </li>
              <li className="flex items-center">
                <i className="fas fa-phone-alt text-brasil-yellow mr-3"></i>
                <span className="text-gray-400">{RESTAURANT_INFO.phone}</span>
              </li>
              <li className="flex items-center">
                <i className="fas fa-envelope text-brasil-yellow mr-3"></i>
                <span className="text-gray-400">{RESTAURANT_INFO.email}</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-montserrat font-bold text-xl mb-6">{t('Languages')}</h3>
            <div className="space-y-3">
              {SUPPORTED_LANGUAGES.map(lang => (
                <button 
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`flex items-center ${i18n.language === lang.code ? 'text-brasil-yellow' : 'text-gray-400'} hover:text-brasil-yellow transition-colors duration-300`}
                >
                  <img src={`https://flagcdn.com/w40/${lang.flag}.png`} alt={lang.name} className="w-6 h-auto mr-2" />
                  {lang.name}
                </button>
              ))}
            </div>
            
            <h3 className="font-montserrat font-bold text-xl mb-3 mt-6">{t('Newsletter')}</h3>
            <div className="flex">
              <Input 
                type="email" 
                placeholder={t('YourEmail')} 
                className="bg-gray-800 text-white rounded-l-lg py-2 px-4 w-full focus:outline-none focus:ring-2 focus:ring-brasil-yellow" 
              />
              <Button className="bg-brasil-yellow hover:bg-yellow-400 text-brasil-blue font-bold py-2 px-4 rounded-r-lg transition-colors duration-300">
                <i className="fas fa-paper-plane"></i>
              </Button>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-center md:text-left">© {new Date().getFullYear()} {RESTAURANT_INFO.name}. {t('AllRightsReserved')}.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="#" className="text-gray-500 hover:text-brasil-yellow transition-colors duration-300">{t('PrivacyPolicy')}</a>
            <a href="#" className="text-gray-500 hover:text-brasil-yellow transition-colors duration-300">{t('TermsOfUse')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
