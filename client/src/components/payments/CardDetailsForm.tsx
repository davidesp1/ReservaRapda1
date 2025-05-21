import { useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';

interface CardDetailsFormProps {
  cardDetails: {
    cardNumber: string;
    cardholderName: string;
    expiryDate: string;
    cvv: string;
  };
  onChange: (details: {
    cardNumber: string;
    cardholderName: string;
    expiryDate: string;
    cvv: string;
  }) => void;
}

export default function CardDetailsForm({ cardDetails, onChange }: CardDetailsFormProps) {
  const { t } = useTranslation();
  
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const formatted = value
      .replace(/(\d{4})/g, '$1 ')
      .trim()
      .substring(0, 19); // 16 digits + 3 spaces
      
    onChange({ ...cardDetails, cardNumber: formatted });
  };
  
  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    let formatted = value;
    
    // Format as MM/YY
    if (value.length > 2) {
      formatted = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    
    onChange({ ...cardDetails, expiryDate: formatted });
  };
  
  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 3);
    onChange({ ...cardDetails, cvv: value });
  };
  
  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-md bg-card relative overflow-hidden min-h-[180px]">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-20"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div className="text-lg font-semibold text-white/80 drop-shadow">{t('payment.creditCard')}</div>
            <div className="text-xs text-white/70 bg-white/10 px-2 py-1 rounded backdrop-blur-sm">
              {cardDetails.cardNumber.startsWith('4') ? 'VISA' : 
               cardDetails.cardNumber.startsWith('5') ? 'MASTERCARD' : 
               cardDetails.cardNumber.startsWith('3') ? 'AMEX' : 'CARD'}
            </div>
          </div>
          
          <div className="mb-4 font-mono tracking-wider text-white/90 text-lg drop-shadow">
            {cardDetails.cardNumber || '**** **** **** ****'}
          </div>
          
          <div className="flex justify-between">
            <div className="text-xs text-white/80">
              <div className="uppercase mb-1">{t('payment.cardHolder')}</div>
              <div className="font-medium truncate max-w-[140px]">
                {cardDetails.cardholderName || t('payment.cardholderPlaceholder')}
              </div>
            </div>
            
            <div className="text-xs text-white/80">
              <div className="uppercase mb-1">{t('payment.expiryDate')}</div>
              <div className="font-medium">
                {cardDetails.expiryDate || 'MM/YY'}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="cardNumber">{t('payment.cardNumber')}</Label>
          <Input
            id="cardNumber"
            placeholder="1234 5678 9012 3456"
            value={cardDetails.cardNumber}
            onChange={handleCardNumberChange}
            maxLength={19}
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="cardholderName">{t('payment.cardHolder')}</Label>
          <Input
            id="cardholderName"
            placeholder={t('payment.cardholderPlaceholder')}
            value={cardDetails.cardholderName}
            onChange={(e) => onChange({ ...cardDetails, cardholderName: e.target.value })}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="expiryDate">{t('payment.expiryDate')}</Label>
            <Input
              id="expiryDate"
              placeholder="MM/YY"
              value={cardDetails.expiryDate}
              onChange={handleExpiryDateChange}
              maxLength={5}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="cvv">{t('payment.cvv')}</Label>
            <Input
              id="cvv"
              placeholder="123"
              value={cardDetails.cvv}
              onChange={handleCvvChange}
              maxLength={3}
              type="password"
            />
          </div>
        </div>
      </div>
    </div>
  );
}