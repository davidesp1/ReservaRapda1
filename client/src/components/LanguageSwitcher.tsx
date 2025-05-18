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

  // Language flags with country codes for flag API
  const languageFlagCodes: Record<string, string> = {
    pt: 'pt',
    en: 'gb',
    es: 'es'
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2 flex items-center gap-1">
          <img 
            src={`https://flagcdn.com/w20/${languageFlagCodes[currentLanguage]}.png`}
            alt={languageNames[currentLanguage]}
            className="w-5 h-auto mr-1"
          />
          <Globe className="h-4 w-4" />
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
            <img 
              src={`https://flagcdn.com/w20/${languageFlagCodes[langCode]}.png`}
              alt={languageNames[langCode]}
              className="w-5 h-auto mr-2"
            />
            {languageNames[langCode]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;