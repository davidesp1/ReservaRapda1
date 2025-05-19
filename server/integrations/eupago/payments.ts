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
    const response = await eupagoClient.request('/reference/create', {
      referencia: orderId,
      valor: amount.toFixed(2),
    });

    return {
      success: true,
      reference: response && typeof response === 'object' ? response.referencia : undefined,
      entity: response && typeof response === 'object' ? response.entidade : undefined,
      value: response && typeof response === 'object' ? response.valor : undefined,
      status: 'pending',
      expirationDate: response && typeof response === 'object' && response.data_fim ? response.data_fim : undefined,
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
    const response = await eupagoClient.request('/mbway/create', {
      referencia: orderId,
      valor: amount.toFixed(2),
      alias: telefone,
    });

    return {
      success: true,
      reference: response && typeof response === 'object' ? response.referencia : undefined,
      value: response && typeof response === 'object' ? response.valor : undefined,
      status: 'pending',
      message: 'Pagamento MB WAY solicitado. Verifique o seu telemóvel.',
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
    // No ambiente de produção, enviaríamos dados do cartão
    // No ambiente de sandbox, vamos apenas simular o pagamento
    const response = await eupagoClient.request('/credit_card/create', {
      referencia: data.id,
      valor: data.valor.toFixed(2),
      por_defeito: true,
      email: data.email || '',
    });

    return {
      success: true,
      reference: response.referencia,
      value: response.valor,
      status: 'pending',
      paymentUrl: response.url || 'https://sandbox.eupago.pt/pagamento',
      message: 'Redirecionando para a página de pagamento com cartão',
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