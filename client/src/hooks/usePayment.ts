import { apiRequest } from '../lib/queryClient';
import { useMutation, useQuery } from '@tanstack/react-query';

// Interfaces para parâmetros de requisição
interface MultibancoPaymentParams {
  valor: number;
  idempotencia: string;
  descricao?: string;
}

interface MBWayPaymentParams {
  valor: number;
  telemovel: string; // Formato: 9XXXXXXXX (ex: 914123456)
  idempotencia: string;
  descricao?: string;
}

interface StatusCheckParams {
  referencia: string;
}

// Interfaces para respostas da API
interface EupagoResponse {
  sucesso: boolean;
  referencia?: string;
  entidade?: string;
  valor?: string | number;
  estado?: string;
  dataLimite?: string;
  telemovel?: string;
  alias?: string;
  url?: string;
  mensagem?: string;
  [key: string]: any;
}

// Interface para detalhes de pagamento formatados
export interface PaymentDetails {
  entity?: string;
  reference?: string;
  expirationDate?: string;
  phone?: string;
  status?: string;
  amount?: number;
  url?: string;
}

// Função para mapear resposta da API para o formato de detalhes do pagamento
function formatPaymentDetails(response: EupagoResponse, method: string): PaymentDetails {
  const details: PaymentDetails = {
    status: response.estado || 'pendente'
  };
  
  if (typeof response.valor === 'string') {
    details.amount = parseFloat(response.valor);
  } else if (typeof response.valor === 'number') {
    details.amount = response.valor;
  }
  
  if (method === 'multibanco') {
    details.entity = response.entidade;
    details.reference = response.referencia;
    details.expirationDate = response.dataLimite;
  } else if (method === 'mbway') {
    details.phone = response.telemovel;
    details.reference = response.referencia;
  } else if (method === 'card') {
    details.reference = response.referencia;
    details.url = response.url;
  }
  
  return details;
}

// Função para criar um pagamento Multibanco
export async function createMultibanco(params: MultibancoPaymentParams): Promise<PaymentDetails> {
  const response = await apiRequest('POST', '/api/payments/multibanco', params) as unknown as EupagoResponse;
  return formatPaymentDetails(response, 'multibanco');
}

// Função para criar um pagamento MBWay
export async function createMBWay(params: MBWayPaymentParams): Promise<PaymentDetails> {
  const response = await apiRequest('POST', '/api/payments/mbway', params) as unknown as EupagoResponse;
  return formatPaymentDetails(response, 'mbway');
}

// Função para verificar o status de um pagamento
export async function checkPaymentStatus(params: StatusCheckParams): Promise<{ status: string }> {
  const response = await apiRequest('POST', '/api/payments/status', params) as unknown as EupagoResponse;
  return { status: response.estado || 'desconhecido' };
}

// Hooks para usar com React Query
export function useCreateMultibanco() {
  return useMutation({
    mutationFn: (params: MultibancoPaymentParams) => createMultibanco(params)
  });
}

export function useCreateMBWay() {
  return useMutation({
    mutationFn: (params: MBWayPaymentParams) => createMBWay(params)
  });
}

export function useCheckPaymentStatus(referencia: string, enabled = true) {
  return useQuery({
    queryKey: ['/api/payments/status', referencia],
    queryFn: () => checkPaymentStatus({ referencia }),
    enabled: enabled && !!referencia,
    refetchInterval: 5000, // Verificar a cada 5 segundos
    refetchIntervalInBackground: true
  });
}