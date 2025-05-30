import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCollaborator: boolean;
  isFinanceiro: boolean;
  isStaff: boolean;
  login: (username: string, password: string) => Promise<User>;
  loginWithPin: (credentials: { userId: string; pin: string }) => Promise<User>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  birthDate?: string;
  profilePicture?: string;
  biography?: string;
  role: string;
  preferences?: {
    language: string;
    dietaryRestrictions?: string[];
    favoriteItems?: number[];
    allergies?: string[];
    spicePreference?: 'mild' | 'medium' | 'hot';
    preferredSeating?: 'indoor' | 'outdoor' | 'no-preference';
    preferredDiningTimes?: string[];
    theme?: 'light' | 'dark' | 'system';
    notifications?: {
      email?: boolean;
      sms?: boolean;
      promotions?: boolean;
      reservationReminders?: boolean;
    };
  };
  memberSince?: string;
  lastLogin?: string;
  status?: string;
  loyaltyPoints?: number;
}

interface RegisterData {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [sessionTimer, setSessionTimer] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Configuração de timeout da sessão (1 hora)
  const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hora em milissegundos

  // Função para resetar o timer de sessão
  const resetSessionTimer = () => {
    if (sessionTimer) {
      clearTimeout(sessionTimer);
    }
    
    if (user) {
      const newTimer = setTimeout(() => {
        handleAutoLogout();
      }, SESSION_TIMEOUT);
      setSessionTimer(newTimer);
    }
  };

  // Função para logout automático
  const handleAutoLogout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout');
      setUser(null);
      queryClient.clear();
      toast({
        title: "Sessão Expirada",
        description: "Sua sessão expirou por inatividade. Faça login novamente.",
        variant: "destructive",
      });
    } catch (error) {
      console.error('Erro no logout automático:', error);
    }
  };

  // Fetch current user on mount com atualização periódica
  const { isLoading, isError } = useQuery<User>({
    queryKey: ['/api/auth/me'],
    refetchOnWindowFocus: true,
    refetchInterval: 60000, // Atualiza os dados do usuário a cada 60 segundos
    refetchIntervalInBackground: true,
    staleTime: 30000, // Considera os dados obsoletos após 30 segundos
    retry: 1
  });

  // Update user state when the query data changes
  useEffect(() => {
    if (isError) {
      setUser(null);
    } else if (!isLoading) {
      const userData = queryClient.getQueryData<User>(['/api/auth/me']);
      if (userData) {
        setUser(userData);
        resetSessionTimer();
      }
    }
  }, [isLoading, isError]);

  // Sistema de logout automático temporariamente desabilitado para evitar conflitos
  // TODO: Reimplementar de forma que não interfira com a navegação
  /*
  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const resetTimer = () => {
      resetSessionTimer();
    };

    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
      if (sessionTimer) {
        clearTimeout(sessionTimer);
      }
    };
  }, [user, sessionTimer]);
  */

  // Login mutation
  const loginMutation = useMutation<User, Error, { email?: string; username?: string; password: string }>({
    mutationFn: async (credentials: { email?: string; username?: string; password: string }) => {
      const response = await apiRequest('POST', '/api/auth/login', credentials);
      return response.json();
    },
    onSuccess: (data) => {
      setUser(data);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "Login bem-sucedido",
        description: `Bem-vindo, ${data.firstName}!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Falha no login",
        description: error.message || "Credenciais inválidas. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Login with PIN mutation
  const loginWithPinMutation = useMutation({
    mutationFn: async (credentials: { userId: string; pin: string }) => {
      const response = await apiRequest('POST', '/api/auth/login-pin', credentials);
      return response.json();
    },
    onSuccess: (data) => {
      setUser(data);
      resetSessionTimer();
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "Login realizado",
        description: `Bem-vindo de volta, ${data.firstName}!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "PIN inválido",
        description: "PIN incorreto. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const response = await apiRequest('POST', '/api/auth/register', userData);
      return response.json();
    },
    onSuccess: (data) => {
      setUser(data);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "Registro bem-sucedido",
        description: `Bem-vindo, ${data.firstName}!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Falha no registro",
        description: error.message || "Não foi possível criar a conta. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/auth/logout', {});
      return response.json();
    },
    onSuccess: () => {
      setUser(null);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Falha ao fazer logout",
        description: error.message || "Não foi possível desconectar. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  const login = async (usernameOrEmail: string, password: string): Promise<User> => {
    console.log('Tentando login com:', { usernameOrEmail, isEmail: usernameOrEmail.includes('@') });
    
    // Verificar se o valor fornecido parece um email (contém @)
    const isEmail = usernameOrEmail.includes('@');
    const credentials = isEmail 
      ? { email: usernameOrEmail, password } 
      : { username: usernameOrEmail, password };
    
    console.log('Enviando credenciais:', JSON.stringify(credentials));
    const userData = await loginMutation.mutateAsync(credentials);
    return userData;
  };

  const register = async (userData: RegisterData) => {
    await registerMutation.mutateAsync(userData);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const isAuthenticated = !!user;
  const isAdmin = isAuthenticated && user?.role === 'admin';
  const isCollaborator = isAuthenticated && user?.role === 'collaborator';
  const isFinanceiro = isAuthenticated && user?.role === 'financeiro';
  const isStaff = isAuthenticated && user?.role === 'staff';

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        isAdmin,
        isCollaborator,
        isFinanceiro,
        isStaff,
        login,
        loginWithPin: (credentials: { userId: string; pin: string }) => loginWithPinMutation.mutateAsync(credentials),
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Return default values instead of throwing error during development
    return {
      user: null,
      isLoading: false,
      isAuthenticated: false,
      isAdmin: false,
      isCollaborator: false,
      isFinanceiro: false,
      isStaff: false,
      login: async () => ({ id: 0, username: '', email: '', firstName: '', lastName: '', role: '' } as User),
      loginWithPin: async () => ({ id: 0, username: '', email: '', firstName: '', lastName: '', role: '' } as User),
      register: async () => {},
      logout: async () => {}
    };
  }
  return context;
}
