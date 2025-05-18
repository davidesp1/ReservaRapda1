import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<string>(i18n.language);

  useEffect(() => {
    // Update the component state when the language changes
    setCurrentLanguage(i18n.language);
    
    // Store the language preference in local storage
    localStorage.setItem('preferredLanguage', i18n.language);
  }, [i18n.language]);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  // Mapping language codes to language names
  const languageNames: Record<string, string> = {
    pt: 'Português',
    en: 'English',
    es: 'Español'
  };

  // Language flag emojis
  const languageFlags: Record<string, string> = {
    pt: '🇵🇹',
    en: '🇬🇧',
    es: '🇪🇸'
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full">
          <Globe className="h-5 w-5" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.keys(languageNames).map((langCode) => (
          <DropdownMenuItem
            key={langCode}
            onClick={() => changeLanguage(langCode)}
            className={`flex items-center ${currentLanguage === langCode ? 'font-bold bg-muted' : ''}`}
          >
            <span className="mr-2">{languageFlags[langCode]}</span>
            {languageNames[langCode]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;