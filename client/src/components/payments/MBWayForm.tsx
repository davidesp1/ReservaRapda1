import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Smartphone } from 'lucide-react';
import { Dispatch, SetStateAction } from 'react';

interface MBWayFormProps {
  phoneNumber: string;
  setPhoneNumber: Dispatch<SetStateAction<string>>;
}

export default function MBWayForm({ phoneNumber, setPhoneNumber }: MBWayFormProps) {
  const { t } = useTranslation();
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setPhoneNumber(value);
  };
  
  return (
    <div className="space-y-4">
      <div className="p-6 border rounded-md bg-gradient-to-r from-green-50 to-emerald-50 flex flex-col items-center">
        <Smartphone className="h-14 w-14 text-emerald-500 mb-2" />
        <h3 className="text-lg font-semibold text-emerald-700">{t('payment.mbway')}</h3>
        <p className="text-sm text-center text-emerald-600 mt-1">
          {t('payment.mbwayDescription')}
        </p>
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="phoneNumber">{t('payment.phoneNumber')}</Label>
        <Input
          id="phoneNumber"
          placeholder="9XXXXXXXX"
          value={phoneNumber}
          onChange={handlePhoneChange}
          maxLength={9}
          className="text-center text-lg tracking-wide"
        />
        <p className="text-xs text-muted-foreground text-center">
          {t('payment.enterMobileNumber')}
        </p>
      </div>
    </div>
  );
}