import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';

interface ProcessPaymentProps {
  method: string;
  amount: number;
  reference: string;
  description: string;
  phone?: string;
}

interface CancelPaymentProps {
  reference: string;
}

export function useProcessPayment() {
  return useMutation({
    mutationFn: (data: ProcessPaymentProps) => 
      apiRequest('POST', '/api/payments/process', data)
        .then(res => res.json())
  });
}

export function usePaymentStatus(reference: string) {
  return useQuery({
    queryKey: ['paymentStatus', reference],
    queryFn: () => 
      apiRequest('GET', `/api/payments/status/${reference}`)
        .then(res => res.json()),
    refetchInterval: 15000,
    enabled: !!reference
  });
}

export function useCancelPayment() {
  return useMutation({
    mutationFn: (reference: string) => 
      apiRequest('POST', '/api/payments/cancel', { reference })
        .then(res => res.json())
  });
}
