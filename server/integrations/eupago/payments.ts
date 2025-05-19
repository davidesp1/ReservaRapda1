import eupagoClient from './client';
import { PaymentResult, CardPaymentData } from './types';

/**
 * Cria um pagamento Multibanco
 * @param orderId ID do pedido
 * @param amount Valor a ser pago
 * @returns Resultado do pagamento com referência Multibanco
 */
export async function criarMultibanco(orderId: string, amount: number): Promise<PaymentResult> {
  console.log("Criando simulação de pagamento Multibanco", orderId, amount);
  
  // Simulação direta sem tentar conectar com API externa
  return {
    success: true,
    reference: "999 999 999",
    entity: "11111",
    value: amount.toString(),
    status: 'pending',
    expirationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    message: 'Multibanco criado com sucesso (ambiente de teste)'
  };
}

/**
 * Cria um pagamento MB WAY
 * @param orderId ID do pedido
 * @param amount Valor a ser pago
 * @param telefone Número de telefone para MB WAY
 * @returns Resultado do pagamento MB WAY
 */
export async function criarMbway(orderId: string, amount: number, telefone: string): Promise<PaymentResult> {
  console.log("Criando simulação de pagamento MBWay", orderId, amount, telefone);
  
  // Simulação direta sem tentar conectar com API externa
  return {
    success: true,
    reference: `MBWAY-${orderId}`,
    value: amount.toString(),
    status: 'pending',
    message: 'Pagamento MB WAY solicitado. Verifique o seu telemóvel. (ambiente de teste)',
    phone: telefone
  };
}

/**
 * Cria um pagamento com cartão de crédito
 * @param data Dados do cartão e do pagamento
 * @returns Resultado do pagamento com cartão
 */
export async function criarCartao(data: {
  id: string;
  valor: number;
  cartao_numero?: string;
  cartao_validade?: string;
  cartao_cvc?: string;
  email?: string;
}): Promise<PaymentResult> {
  console.log("Criando simulação de pagamento com Cartão", data.id, data.valor);
  
  // Simulação direta sem tentar conectar com API externa
  return {
    success: true,
    reference: `CARD-${data.id}`,
    value: data.valor.toString(),
    status: 'pending',
    paymentUrl: 'https://sandbox.eupago.pt/pagamento?simulacao=1',
    message: 'Redirecionando para a página de pagamento com cartão (ambiente de teste)',
  };
}

/**
 * Verifica o status de um pagamento
 * @param reference Referência do pagamento
 * @returns Status atual do pagamento
 */
export async function verificarStatusPagamento(reference: string): Promise<PaymentResult> {
  console.log("Verificando simulação de status do pagamento", reference);
  
  // Simulação direta sem tentar conectar com API externa
  return {
    success: true,
    reference: reference,
    status: 'paid',
    message: 'Pagamento concluído com sucesso (ambiente de teste)',
  };
}