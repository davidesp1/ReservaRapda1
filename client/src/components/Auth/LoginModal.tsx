import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
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
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import Logo from '@/components/Logo';
import { X } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterClick: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onRegisterClick }) => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [_, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loginSchema = z.object({
    username: z.string().min(1, { message: 'Username is required' }),
    password: z.string().min(1, { message: 'Password is required' }),
  });

  type LoginFormValues = z.infer<typeof loginSchema>;

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsSubmitting(true);
      const user = await login(data.username, data.password);
      onClose();
      
      // Redirecionar baseado no papel do usuário
      if (user && user.role === 'admin') {
        setLocation('/admin/dashboard');
      } else {
        setLocation('/customer/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
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
          <DialogTitle className="text-2xl font-montserrat">{t('AccessAccount')}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  <div className="flex justify-end mt-1">
                    <a href="#" className="text-sm text-brasil-green hover:text-green-700">
                      {t('ForgotPassword')}
                    </a>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full bg-brasil-green hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? <i className="fas fa-spinner fa-spin mr-2"></i> : null}
              {t('Login')}
            </Button>
          </form>
        </Form>
        
        <DialogFooter className="sm:justify-center">
          <div className="mt-4 text-center text-sm text-gray-600">
            {t('DontHaveAccount')} {' '}
            <Button 
              variant="link" 
              className="text-brasil-green font-semibold hover:text-green-700 p-0"
              onClick={onRegisterClick}
            >
              {t('Register')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
