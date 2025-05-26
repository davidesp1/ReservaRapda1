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
  const { login, loginWithPin } = useAuth();
  const [_, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPinLogin, setShowPinLogin] = useState(false);
  const [pin, setPin] = useState('');
  const [isPinSubmitting, setIsPinSubmitting] = useState(false);

  const loginSchema = z.object({
    email: z.string().min(1, { message: 'Username ou email é obrigatório' }),
    password: z.string().min(1, { message: 'Senha é obrigatória' }),
  });

  type LoginFormValues = z.infer<typeof loginSchema>;

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsSubmitting(true);
      console.log('Enviando login com:', data);
      const userData = await login(data.email, data.password);
      console.log('Login bem-sucedido, dados do usuário:', userData);
      onClose();
      
      // Redirecionar baseado no papel do usuário
      if (userData && userData.role === 'admin') {
        setLocation('/admin/dashboard');
      } else if (userData && userData.role === 'collaborator') {
        setLocation('/collaborator');
      } else {
        setLocation('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) return;
    
    try {
      setIsPinSubmitting(true);
      const userData = await loginWithPin(pin);
      onClose();
      
      // Redirecionar baseado no papel do usuário
      if (userData && userData.role === 'admin') {
        setLocation('/admin/dashboard');
      } else if (userData && userData.role === 'collaborator') {
        setLocation('/collaborator');
      } else {
        setLocation('/dashboard');
      }
    } catch (error) {
      console.error('PIN login error:', error);
    } finally {
      setIsPinSubmitting(false);
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
          <DialogTitle className="text-2xl font-montserrat">
            {showPinLogin ? 'Login com PIN' : t('AccessAccount')}
          </DialogTitle>
          <DialogDescription>
            {showPinLogin ? 'Digite seu PIN de 4 dígitos' : t('EnterYourCredentials')}
          </DialogDescription>
        </DialogHeader>
        
        {showPinLogin ? (
          <div className="space-y-6">
            <form onSubmit={onPinSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="pin">PIN de 4 dígitos</Label>
                <Input
                  id="pin"
                  type="number"
                  placeholder="0000"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  maxLength={4}
                  className="w-full px-4 py-3 rounded-lg border text-center text-2xl font-mono"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-brasil-green hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg"
                disabled={isPinSubmitting || pin.length !== 4}
              >
                {isPinSubmitting ? <i className="fas fa-spinner fa-spin mr-2"></i> : null}
                Entrar com PIN
              </Button>
            </form>
            
            <div className="text-center">
              <Button
                variant="link"
                className="text-brasil-green hover:text-green-700"
                onClick={() => {
                  setShowPinLogin(false);
                  setPin('');
                }}
              >
                ← Voltar para login normal
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Email')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="exemplo@email.com" 
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
            
            <div className="text-center">
              <Button
                variant="outline"
                className="w-full border-brasil-green text-brasil-green hover:bg-brasil-green hover:text-white"
                onClick={() => setShowPinLogin(true)}
              >
                🔢 Logar com PIN
              </Button>
            </div>
          </div>
        )}
        
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
