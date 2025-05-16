import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuRadioGroup, 
  DropdownMenuRadioItem 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '@/constants';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;

  const handleLanguageChange = (value: string) => {
    i18n.changeLanguage(value);
  };

  // Find current language object
  const currentLangObj = SUPPORTED_LANGUAGES.find(lang => lang.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-1">
          <img 
            src={`https://flagcdn.com/w20/${currentLangObj.flag}.png`} 
            alt={currentLangObj.name} 
            className="w-4 h-auto mr-1" 
          />
          <Globe className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={currentLanguage} onValueChange={handleLanguageChange}>
          {SUPPORTED_LANGUAGES.map(lang => (
            <DropdownMenuRadioItem 
              key={lang.code} 
              value={lang.code}
              className="flex items-center cursor-pointer"
            >
              <img 
                src={`https://flagcdn.com/w20/${lang.flag}.png`} 
                alt={lang.name} 
                className="w-4 h-auto mr-2" 
              />
              {lang.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
