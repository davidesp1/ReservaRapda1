import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import LoginModal from '@/components/Auth/LoginModal';
import RegisterModal from '@/components/Auth/RegisterModal';
import { useAuth } from '@/contexts/AuthContext';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';

const Header: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const openLoginModal = () => {
    setLoginModalOpen(true);
    setMobileMenuOpen(false);
  };

  const openRegisterModal = () => {
    setRegisterModalOpen(true);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center mb-4 md:mb-0">
          <Logo />
        </div>
        
        <div className="md:hidden">
          <Button variant="ghost" onClick={toggleMobileMenu}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>
        
        <nav className={`flex flex-col md:flex-row md:space-x-8 items-center w-full md:w-auto ${mobileMenuOpen ? 'block' : 'hidden md:flex'}`}>
          <a href="#home" className="text-gray-800 hover:text-brasil-green py-2 transition-colors duration-300">
            {t('Home')}
          </a>
          <a href="#sobre" className="text-gray-800 hover:text-brasil-green py-2 transition-colors duration-300">
            {t('About')}
          </a>
          <a href="#menu" className="text-gray-800 hover:text-brasil-green py-2 transition-colors duration-300">
            {t('Menu')}
          </a>
          <a href="#contato" className="text-gray-800 hover:text-brasil-green py-2 transition-colors duration-300">
            {t('Contact')}
          </a>
          
          <div className="mt-4 md:mt-0 flex space-x-3">
            <LanguageSwitcher />
            
            {isAuthenticated ? (
              <Link href={isAdmin ? "/admin" : "/dashboard"}>
                <Button>
                  {isAdmin ? t('AdminPanel') : t('Dashboard')}
                </Button>
              </Link>
            ) : (
              <>
                <Button 
                  className="bg-brasil-green hover:bg-green-700 text-white"
                  onClick={openLoginModal}
                >
                  {t('Login')}
                </Button>
                <Button 
                  className="bg-brasil-yellow hover:bg-yellow-400 text-brasil-blue"
                  onClick={openRegisterModal}
                >
                  {t('Register')}
                </Button>
              </>
            )}
          </div>
        </nav>
      </div>
      
      <LoginModal 
        isOpen={loginModalOpen} 
        onClose={() => setLoginModalOpen(false)}
        onRegisterClick={() => {
          setLoginModalOpen(false);
          setRegisterModalOpen(true);
        }}
      />
      
      <RegisterModal 
        isOpen={registerModalOpen} 
        onClose={() => setRegisterModalOpen(false)}
        onLoginClick={() => {
          setRegisterModalOpen(false);
          setLoginModalOpen(true);
        }}
      />
    </header>
  );
};

export default Header;
