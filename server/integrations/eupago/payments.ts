import eupagoClient from './client';
import { PaymentResult } from './types';

/**
 * Cria um pagamento Multibanco
 * @param valor Valor a ser pago
 * @param idempotencia Identificador único da transação
 * @param descricao Descrição opcional do pagamento
 * @returns Resultado do pagamento com referência Multibanco
 */
export async function createMultibanco(valor: number, idempotencia: string, descricao?: string): Promise<PaymentResult> {
  console.log("Criando pagamento Multibanco", idempotencia, valor);
  
  const response = await eupagoClient.request('/reference/create', {
    valor,
    idempotencia,
    descricao: descricao || `Reserva ${idempotencia}`
  });
  
  return {
    success: true,
    reference: response.referencia,
    entity: response.entidade,
    value: response.valor?.toString(),
    status: response.estado || 'pending',
    expirationDate: response.dataLimite,
    message: 'Multibanco criado com sucesso'
  };
}

/**
 * Cria um pagamento MB WAY
 * @param valor Valor a ser pago
 * @param telemovel Número de telefone para MB WAY (formato: 9XXXXXXXX)
 * @param idempotencia Identificador único da transação
 * @param descricao Descrição opcional do pagamento
 * @returns Resultado do pagamento MB WAY
 */
export async function createMbway(valor: number, telemovel: string, idempotencia: string, descricao?: string): Promise<PaymentResult> {
  console.log("Criando pagamento MBWay", idempotencia, valor, telemovel);
  
  const response = await eupagoClient.request('/mbway/create', {
    valor,
    telemovel,
    idempotencia,
    descricao: descricao || `Reserva ${idempotencia}`
  });
  
  return {
    success: true,
    reference: response.referencia,
    value: response.valor?.toString(),
    status: response.estado || 'pending',
    message: 'Pagamento MB WAY solicitado. Verifique o seu telemóvel.',
    phone: telemovel
  };
}

/**
 * Cria um pagamento com cartão de crédito
 * @param valor Valor a ser pago
 * @param idempotencia Identificador único da transação
 * @param callbackUrl URL de retorno após o pagamento
 * @param descricao Descrição opcional do pagamento
 * @returns Resultado do pagamento com cartão
 */
export async function createCardPayment(valor: number, idempotencia: string, callbackUrl: string, descricao?: string): Promise<PaymentResult> {
  console.log("Criando pagamento com Cartão", idempotencia, valor);
  
  const response = await eupagoClient.request('/card/create', {
    valor,
    idempotencia,
    url_retorno: callbackUrl,
    descricao: descricao || `Reserva ${idempotencia}`
  });
  
  return {
    success: true,
    reference: response.referencia || `CARD-${idempotencia}`,
    value: response.valor?.toString(),
    status: response.estado || 'pending',
    paymentUrl: response.url,
    message: 'Redirecionando para a página de pagamento com cartão',
  };
}

/**
 * Verifica o status de um pagamento
 * @param referencia Referência do pagamento
 * @returns Status atual do pagamento
 */
export async function checkPaymentStatus(referencia: string): Promise<PaymentResult> {
  console.log("Verificando status do pagamento", referencia);
  
  const response = await eupagoClient.request('/payments/status', { referencia });
  
  return {
    success: true,
    reference: referencia,
    status: response.estado || 'unknown',
    message: response.estado === 'pago' 
      ? 'Pagamento concluído com sucesso' 
      : 'Pagamento pendente',
  };
}

/**
 * Cancela um pagamento pendente
 * @param referencia Referência do pagamento
 * @returns Resultado do cancelamento
 */
export async function cancelPayment(referencia: string): Promise<PaymentResult> {
  console.log("Cancelando pagamento", referencia);
  
  try {
    const response = await eupagoClient.request('/payments/cancel', { referencia });
    
    return {
      success: true,
      reference: referencia,
      status: 'cancelled',
      message: 'Pagamento cancelado com sucesso',
    };
  } catch (error) {
    console.error("Erro ao cancelar pagamento:", error);
    return {
      success: false,
      reference: referencia,
      status: 'error',
      message: 'Não foi possível cancelar o pagamento',
    };
  }
}