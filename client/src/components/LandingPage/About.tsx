import React from 'react';
import { useTranslation } from 'react-i18next';
import { RESTAURANT_INFO } from '@/constants';

const About: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section id="sobre" className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 animate-slide-up">
          <h2 className="text-4xl font-montserrat font-bold text-gray-800 mb-4">
            {t('AboutUs')}
          </h2>
          <div className="w-20 h-1 bg-brasil-yellow mx-auto"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="animate-slide-up">
            <p className="text-lg text-gray-700 mb-6">
              {t('AboutText1')}
            </p>
            
            <p className="text-lg text-gray-700 mb-6">
              {t('AboutText2')}
            </p>
            
            <div className="bg-brasil-green/10 p-6 rounded-lg border-l-4 border-brasil-green mt-8">
              <h3 className="font-montserrat font-bold text-xl text-gray-800 mb-2">{t('SpecialPartnership')}</h3>
              <p className="text-gray-700">{t('PartnershipText')}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Feijoada */}
            <img 
              src="https://pixabay.com/get/g9cedfd8eeb85893fca3cf83515fddc3863d778a1e52bde908d126b1a9cdc7c8de870a9590592a91f2db7457c57a54c75aa82bdeae8a4ede3959b291b14a1799d_1280.jpg" 
              alt="Feijoada Tradicional" 
              className="rounded-lg shadow-lg w-full h-auto transform transition duration-500 hover:scale-105" 
            />
            
            {/* Moqueca */}
            <img 
              src="https://pixabay.com/get/ga1af815f366f398fd62809b05aba9c4eab96c89d930c796ea4545f2c6cea1dc6dc4841d57784da7242b845555722b45bbac9f09587d5a69ce42dd62bf18b63c9_1280.jpg" 
              alt="Moqueca Baiana" 
              className="rounded-lg shadow-lg w-full h-auto transform transition duration-500 hover:scale-105" 
            />
            
            {/* Pastéis */}
            <img 
              src="https://pixabay.com/get/g7401f7de64cd39237d4e714410440c0d30b2a04ac7fcd1e612127dfff029aa4ed2f5150180c695ca50e88ca44d86205f2ace914813197cb46ce2dff56c0895f0_1280.jpg" 
              alt="Pastéis Brasileiros" 
              className="rounded-lg shadow-lg w-full h-auto transform transition duration-500 hover:scale-105" 
            />
            
            {/* Picanha */}
            <img 
              src="https://pixabay.com/get/g3fbecdfe6c78b5c5ed6b0a71c0d1e01268bcd8d0dd6bd9aba855033d7f34be926217ed2c4778be827197177522a20cbcd0f27d0c980184f9d40c703972aaa90c_1280.jpg" 
              alt="Picanha Brasileira" 
              className="rounded-lg shadow-lg w-full h-auto transform transition duration-500 hover:scale-105" 
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
