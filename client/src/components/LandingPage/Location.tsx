import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { EVENT_INFO, RESTAURANT_INFO } from '@/constants';

const Location: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section id="contato" className="py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 animate-slide-up">
          <h2 className="text-4xl font-montserrat font-bold text-gray-800 mb-4">{t('LocationContact')}</h2>
          <div className="w-20 h-1 bg-brasil-yellow mx-auto"></div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="rounded-xl overflow-hidden shadow-lg h-96 animate-fade-in">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3095.67219869279!2d-9.1021583!3d38.8269446!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd1933a3eeeeeee7%3A0x327e6c53c54cc99f!2sRua%20das%20Marinhas%20do%20Tejo%2051%2C%202690-366%20Santa%20Iria%20de%20Azoia!5e0!3m2!1spt-PT!2spt!4v1651234567890!5m2!1spt-PT!2spt" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="Event Location"
            ></iframe>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-lg animate-slide-up">
            <h3 className="font-montserrat font-bold text-2xl text-brasil-green mb-6">{t('EventInfo')}</h3>
            
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="bg-brasil-yellow p-3 rounded-lg mr-4">
                  <i className="fas fa-map-marker-alt text-brasil-blue"></i>
                </div>
                <div>
                  <h4 className="font-montserrat font-bold text-lg mb-1">{t('Address')}</h4>
                  <p className="text-gray-700">
                    {EVENT_INFO.name}, {EVENT_INFO.address}<br/>
                    {EVENT_INFO.postalCode} {EVENT_INFO.city}, {EVENT_INFO.country}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-brasil-yellow p-3 rounded-lg mr-4">
                  <i className="fas fa-calendar-alt text-brasil-blue"></i>
                </div>
                <div>
                  <h4 className="font-montserrat font-bold text-lg mb-1">{t('EventDate')}</h4>
                  <p className="text-gray-700">
                    {EVENT_INFO.startDate.split('-')[2]}/{EVENT_INFO.startDate.split('-')[1]} a {EVENT_INFO.endDate.split('-')[2]}/{EVENT_INFO.endDate.split('-')[1]}/{EVENT_INFO.endDate.split('-')[0]}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-brasil-yellow p-3 rounded-lg mr-4">
                  <i className="fas fa-clock text-brasil-blue"></i>
                </div>
                <div>
                  <h4 className="font-montserrat font-bold text-lg mb-1">{t('Hours')}</h4>
                  <p className="text-gray-700">{EVENT_INFO.hours}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-brasil-yellow p-3 rounded-lg mr-4">
                  <i className="fas fa-phone-alt text-brasil-blue"></i>
                </div>
                <div>
                  <h4 className="font-montserrat font-bold text-lg mb-1">{t('Contact')}</h4>
                  <p className="text-gray-700">
                    {t('Phone')}: {RESTAURANT_INFO.phone}<br/>
                    Email: {RESTAURANT_INFO.email}<br/>
                    WhatsApp: {RESTAURANT_INFO.whatsapp}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <a href={`https://wa.me/${RESTAURANT_INFO.whatsapp.replace(/\+|\s+/g, '')}`} target="_blank" rel="noopener noreferrer">
                <Button className="w-full bg-brasil-green hover:bg-green-700 text-white font-montserrat font-bold py-3 px-6 rounded-lg transition-colors duration-300 flex items-center justify-center">
                  <i className="fab fa-whatsapp mr-2 text-lg"></i> {t('WhatsAppContact')}
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Location;
