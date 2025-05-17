import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import Logo from '@/components/Logo';
import { X } from 'lucide-react';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginClick: () => void;
}

const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose, onLoginClick }) => {
  const { t } = useTranslation();
  const { register } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const registerSchema = z.object({
    firstName: z.string().min(1, { message: 'First name is required' }),
    lastName: z.string().min(1, { message: 'Last name is required' }),
    username: z.string().min(3, { message: 'Username must be at least 3 characters' }),
    email: z.string().email({ message: 'Invalid email address' }),
    phone: z.string().optional(),
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
    confirmPassword: z.string().min(1, { message: 'Confirm your password' }),
    terms: z.boolean().refine(val => val === true, {
      message: 'You must agree to the terms',
    }),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

  type RegisterFormValues = z.infer<typeof registerSchema>;

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Prepare the user data for registration
      const userData = {
        username: data.username,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        role: "customer",
        status: "active",
        // Definir algumas preferências básicas para evitar problemas com a estrutura esperada
        preferences: { 
          language: navigator.language.split('-')[0] || 'pt'
        }
      };
      
      await register(userData);
      onClose();
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
          <div className="flex items-center justify-center mb-6">
            <Logo />
          </div>
          <DialogTitle className="text-2xl font-montserrat">{t('CreateAccount')}</DialogTitle>
          <DialogDescription>{t('FillTheFormToRegister')}</DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('FirstName')}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={t('FirstName')} 
                        {...field} 
                        className="w-full px-4 py-3 rounded-lg border"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('LastName')}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={t('LastName')} 
                        {...field} 
                        className="w-full px-4 py-3 rounded-lg border"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Username')}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="user123" 
                      {...field} 
                      className="w-full px-4 py-3 rounded-lg border"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Email')}</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="your@email.com" 
                      {...field} 
                      className="w-full px-4 py-3 rounded-lg border"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Phone')}</FormLabel>
                  <FormControl>
                    <Input 
                      type="tel" 
                      placeholder="+351912345678" 
                      {...field} 
                      className="w-full px-4 py-3 rounded-lg border"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Password')}</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="•••••••••" 
                      {...field} 
                      className="w-full px-4 py-3 rounded-lg border"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('ConfirmPassword')}</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="•••••••••" 
                      {...field} 
                      className="w-full px-4 py-3 rounded-lg border"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm text-gray-600">
                      {t('AgreeTerms')} <a href="#" className="text-brasil-green hover:text-green-700">{t('TermsAndPolicy')}</a>
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full bg-brasil-yellow hover:bg-yellow-400 text-brasil-blue font-bold py-3 px-4 rounded-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? <i className="fas fa-spinner fa-spin mr-2"></i> : null}
              {t('Register')}
            </Button>
          </form>
        </Form>
        
        <DialogFooter className="sm:justify-center">
          <div className="mt-4 text-center text-sm text-gray-600">
            {t('AlreadyHaveAccount')} {' '}
            <Button 
              variant="link" 
              className="text-brasil-green font-semibold hover:text-green-700 p-0"
              onClick={onLoginClick}
            >
              {t('Login')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RegisterModal;
