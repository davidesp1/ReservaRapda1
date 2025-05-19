// Interfaces para tipagem em integrações com o Eupago

// Resposta da API Eupago
export interface EupagoResponse {
  referencia?: string;
  entidade?: string;
  valor?: string;
  data_fim?: string;
  estado?: string;
  url?: string;
  erro?: string;
  [key: string]: any;
}

// Resultado de processamento de pagamento
export interface PaymentResult {
  success: boolean;
  reference?: string;
  entity?: string;
  value?: string;
  message?: string;
  paymentUrl?: string;
  status?: string;
  expirationDate?: string;
  [key: string]: any;
}

// Dados para pagamento com cartão
export interface CardPaymentData {
  id: string;
  valor: number;
  cartao_numero?: string;
  cartao_validade?: string;
  cartao_cvc?: string;
  email?: string;
}