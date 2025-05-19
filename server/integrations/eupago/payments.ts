import eupagoClient from './client';
import { PaymentResult, CardPaymentData } from './types';

/**
 * Cria um pagamento Multibanco
 * @param orderId ID do pedido
 * @param amount Valor a ser pago
 * @returns Resultado do pagamento com referência Multibanco
 */
export async function criarMultibanco(orderId: string, amount: number): Promise<PaymentResult> {
  try {
    // Simulação para desenvolvimento
    // Retornar dados fictícios para testes sem depender da API externa
    return {
      success: true,
      reference: "999 999 999",
      entity: "11111",
      value: amount.toString(),
      status: 'pending',
      expirationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      message: 'Multibanco criado com sucesso (ambiente de teste)'
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Erro ao criar referência Multibanco',
    };
  }
}

/**
 * Cria um pagamento MB WAY
 * @param orderId ID do pedido
 * @param amount Valor a ser pago
 * @param telefone Número de telefone para MB WAY
 * @returns Resultado do pagamento MB WAY
 */
export async function criarMbway(orderId: string, amount: number, telefone: string): Promise<PaymentResult> {
  try {
    // Simulação para desenvolvimento
    // Retornar dados fictícios para testes sem depender da API externa
    return {
      success: true,
      reference: `MBWAY-${orderId}`,
      value: amount.toString(),
      status: 'pending',
      message: 'Pagamento MB WAY solicitado. Verifique o seu telemóvel. (ambiente de teste)',
      phone: telefone
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Erro ao criar pagamento MB WAY',
    };
  }
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
  try {
    // Simulação para desenvolvimento
    // Retornar dados fictícios para testes sem depender da API externa
    return {
      success: true,
      reference: `CARD-${data.id}`,
      value: data.valor.toString(),
      status: 'pending',
      paymentUrl: 'https://sandbox.eupago.pt/pagamento?simulacao=1',
      message: 'Redirecionando para a página de pagamento com cartão (ambiente de teste)',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Erro ao criar pagamento com cartão',
    };
  }
}

/**
 * Verifica o status de um pagamento
 * @param reference Referência do pagamento
 * @returns Status atual do pagamento
 */
export async function verificarStatusPagamento(reference: string): Promise<PaymentResult> {
  try {
    const response = await eupagoClient.request('/payment/check', {
      referencia: reference,
    });

    return {
      success: true,
      reference: response.referencia,
      status: response.estado || 'pending',
      message: response.estado === 'paga' 
        ? 'Pagamento concluído com sucesso' 
        : 'Pagamento pendente',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Erro ao verificar status do pagamento',
      status: 'error',
    };
  }
}