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
  const [userId, setUserId] = useState('');
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

  const onPinSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin.length !== 4 || !userId) return;
    
    try {
      setIsPinSubmitting(true);
      const userData = await loginWithPin({ userId, pin });
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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Acessar Conta</h1>
            <p className="text-gray-500 mb-6">Digite seu ID de usuário e PIN de 4 dígitos</p>
            
            {/* User ID Input */}
            <div className="mb-4">
              <Label htmlFor="userId">ID do Usuário</Label>
              <Input
                id="userId"
                type="number"
                placeholder="Digite seu ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border"
              />
            </div>
            
            {/* PIN Display */}
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">PIN</label>
              <div className="mb-3 p-3 bg-gray-50 border border-gray-300 rounded-lg flex justify-center">
                <div className="flex space-x-2">
                  {[1, 2, 3, 4].map((index) => (
                    <div
                      key={index}
                      className={`w-3 h-3 rounded-full ${
                        pin.length >= index ? 'bg-brasil-green' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              {/* Numeric Keypad */}
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
                  <button
                    key={number}
                    type="button"
                    onClick={() => {
                      if (pin.length < 4) {
                        setPin(prev => prev + number.toString());
                      }
                    }}
                    className="h-14 bg-white border border-gray-300 rounded-lg font-medium text-xl hover:bg-gray-50 transition-colors"
                  >
                    {number}
                  </button>
                ))}
                
                {/* Clear button */}
                <button
                  type="button"
                  onClick={() => setPin(prev => prev.slice(0, -1))}
                  className="h-14 bg-white border border-gray-300 rounded-lg font-medium text-xl hover:bg-gray-50 transition-colors"
                >
                  <i className="fas fa-backspace"></i>
                </button>
                
                {/* Zero */}
                <button
                  type="button"
                  onClick={() => {
                    if (pin.length < 4) {
                      setPin(prev => prev + '0');
                    }
                  }}
                  className="h-14 bg-white border border-gray-300 rounded-lg font-medium text-xl hover:bg-gray-50 transition-colors"
                >
                  0
                </button>
                
                {/* Enter button */}
                <button
                  type="button"
                  onClick={onPinSubmit}
                  disabled={pin.length !== 4 || isPinSubmitting}
                  className="h-14 bg-white border border-gray-300 rounded-lg font-medium text-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <i className="fas fa-check"></i>
                </button>
              </div>
            </div>
            
            {/* Login Button */}
            <Button 
              onClick={onPinSubmit}
              className="w-full bg-brasil-green hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              disabled={isPinSubmitting || pin.length !== 4}
            >
              {isPinSubmitting ? <i className="fas fa-spinner fa-spin mr-2"></i> : null}
              Entrar
            </Button>
            
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
