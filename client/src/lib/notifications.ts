import Swal from 'sweetalert2';

// Configuração padrão do SweetAlert2 com tema brasileiro
const defaultConfig = {
  customClass: {
    popup: 'bg-white rounded-lg shadow-xl',
    title: 'text-xl font-bold text-gray-800',
    content: 'text-gray-600',
    confirmButton: 'bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors',
    cancelButton: 'bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors',
    denyButton: 'bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg transition-colors'
  },
  buttonsStyling: false,
  showClass: {
    popup: 'animate__animated animate__fadeInDown animate__faster'
  },
  hideClass: {
    popup: 'animate__animated animate__fadeOutUp animate__faster'
  }
};

// Notificação de sucesso
export const showSuccess = (title: string, message?: string) => {
  return Swal.fire({
    ...defaultConfig,
    icon: 'success',
    title,
    text: message,
    iconColor: '#10B981', // Verde Brasil
    confirmButtonText: 'OK',
    timer: 3000,
    timerProgressBar: true
  });
};

// Notificação de erro
export const showError = (title: string, message?: string) => {
  return Swal.fire({
    ...defaultConfig,
    icon: 'error',
    title,
    text: message,
    iconColor: '#EF4444', // Vermelho
    confirmButtonText: 'Entendi',
    allowOutsideClick: false
  });
};

// Notificação de aviso
export const showWarning = (title: string, message?: string) => {
  return Swal.fire({
    ...defaultConfig,
    icon: 'warning',
    title,
    text: message,
    iconColor: '#F59E0B', // Amarelo Brasil
    confirmButtonText: 'OK',
    showCancelButton: true,
    cancelButtonText: 'Cancelar'
  });
};

// Notificação de informação
export const showInfo = (title: string, message?: string) => {
  return Swal.fire({
    ...defaultConfig,
    icon: 'info',
    title,
    text: message,
    iconColor: '#3B82F6', // Azul Brasil
    confirmButtonText: 'Entendi'
  });
};

// Confirmação com duas opções
export const showConfirm = (title: string, message: string, confirmText = 'Sim', cancelText = 'Não') => {
  return Swal.fire({
    ...defaultConfig,
    icon: 'question',
    title,
    text: message,
    iconColor: '#3B82F6',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true
  });
};

// Loading/Carregamento
export const showLoading = (title: string, message?: string) => {
  return Swal.fire({
    ...defaultConfig,
    title,
    text: message,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });
};

// Toast rápido (canto da tela)
export const showToast = (type: 'success' | 'error' | 'warning' | 'info', title: string) => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
  });

  const icons = {
    success: { icon: 'success' as const, background: '#10B981' },
    error: { icon: 'error' as const, background: '#EF4444' },
    warning: { icon: 'warning' as const, background: '#F59E0B' },
    info: { icon: 'info' as const, background: '#3B82F6' }
  };

  return Toast.fire({
    icon: icons[type].icon,
    title,
    background: '#FFFFFF',
    color: '#374151',
    iconColor: icons[type].background
  });
};

// Fechar qualquer notificação aberta
export const closeNotification = () => {
  Swal.close();
};

// Notificação personalizada para impressoras
export const showPrinterNotification = (type: 'detected' | 'connected' | 'error', count?: number) => {
  const messages = {
    detected: {
      title: 'Impressoras Detectadas! 🖨️',
      text: `${count || 0} impressora(s) encontrada(s) no sistema`,
      icon: 'success' as const
    },
    connected: {
      title: 'Impressora Conectada! ✅',
      text: 'Conexão estabelecida com sucesso',
      icon: 'success' as const
    },
    error: {
      title: 'Erro na Impressora ❌',
      text: 'Falha na conexão ou detecção',
      icon: 'error' as const
    }
  };

  return showToast(messages[type].icon, messages[type].title);
};