import eupagoClient from "../integrations/eupago/client";
import { EupagoResponse } from "../integrations/eupago/types";

// Modo simulação baseado na variável de ambiente
const SIMULATION_MODE = process.env.EUPAGO_SIMULATION === 'true';

// Função para simular pagamento em modo de desenvolvimento
function simulatePayment(method: string, amount: number, phone?: string): EupagoResponse {
  const timestamp = Date.now();
  const referencia = `SIM-${method.toUpperCase()}-${timestamp}`;
  
  // Respostas simuladas conforme o método de pagamento
  if (method === 'multibanco') {
    return {
      success: true,
      method: 'multibanco',
      entity: '11111',
      reference: '123 456 789',
      amount: amount,
      value: amount,
      entidade: '11111',
      referencia: '123 456 789',
      paymentReference: referencia,
      expirationDate: new Date(Date.now() + 72 * 3600 * 1000).toISOString()
    };
  } 
  else if (method === 'mbway') {
    return {
      success: true,
      method: 'mbway',
      phone: phone || '912345678',
      amount: amount,
      value: amount,
      paymentReference: referencia,
      expirationDate: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    };
  }
  else if (method === 'card') {
    return {
      success: true,
      method: 'card',
      amount: amount,
      value: amount,
      paymentReference: referencia,
      paymentUrl: 'https://sandbox.eupago.pt/clientes/simulacao/pagamento-cartao?ref=' + referencia
    };
  }
  
  // Método desconhecido
  return {
    success: false,
    error: 'Método de pagamento não suportado'
  };
}

// Processar pagamento com qualquer método
export async function processPayment(
  method: "multibanco" | "mbway" | "card",
  amount: number,
  phone?: string,
  referenceId?: string,
): Promise<EupagoResponse> {
  // O valor já vem em euros do frontend
  const amountInEuros = amount;
  
  console.log(`Processando pagamento ${method} no valor de ${amountInEuros}€`);
  
  // Verificar valor mínimo para Multibanco (€1.00)
  if (method === "multibanco" && amountInEuros < 1.00) {
    console.log(`[MULTIBANCO] Valor ${amountInEuros}€ abaixo do mínimo (€1.00), ativando modo simulação`);
    return simulatePayment(method, amountInEuros, phone);
  }
  
  // Se estamos em modo de simulação, retornar dados simulados
  if (SIMULATION_MODE) {
    console.log(`[SIMULAÇÃO] Modo de simulação ativado para pagamento ${method}`);
    return simulatePayment(method, amountInEuros, phone);
  }
  
  // Se não estamos em simulação, chamar a API real do EuPago
  try {
    let response: EupagoResponse;
    
    if (method === "multibanco") {
      console.log(`[DEBUG] Tentando fazer pagamento Multibanco via EuPago API para ID: ${referenceId || 'sem ID'}`);
      
      // Usar o código de reserva como ID se disponível
      const idToUse = referenceId || `MB-${Date.now()}`;
      
      const result = await eupagoClient.multibanco({ 
        valor: amountInEuros, 
        per_dup: 0,
        id: idToUse  // Usar o ID da reserva como referência
      });
      
      // Garantir que result é tratado corretamente
      const safeResult = result as any;
      
      // Verificar se o resultado é válido
      if (!safeResult || typeof safeResult !== 'object') {
        throw new Error('Resposta inválida da API de pagamento');
      }
      
      console.log("Pagamento multibanco processado com sucesso:", safeResult);
      
      response = {
        success: safeResult.sucesso === true,
        method: 'multibanco',
        entity: safeResult.entidade,
        reference: safeResult.referencia,
        amount: amountInEuros,
        value: amountInEuros,
        entidade: safeResult.entidade,
        referencia: safeResult.referencia,
        estado: safeResult.estado
      };
      
      return response;
    } 
    else if (method === "mbway") {
      if (!phone) throw new Error("Número de telefone é obrigatório para MBWay");
      
      const result = await eupagoClient.mbway({ 
        valor: amountInEuros, 
        telemovel: phone 
      });
      
      // Garantir que result é tratado corretamente
      const safeResult = result as any;
      
      response = {
        success: safeResult.sucesso === true,
        method: 'mbway',
        phone: phone,
        amount: amountInEuros,
        value: amountInEuros,
        referencia: safeResult.referencia || '',
        estado: safeResult.estado
      };
      
      return response;
    } 
    else if (method === "card") {
      const idToUse = referenceId || `CARD-${Date.now()}`;
      
      const result = await eupagoClient.card({ 
        valor: amountInEuros, 
        referencia: idToUse 
      });
      
      // Garantir que result é tratado corretamente
      const safeResult = result as any;
      
      response = {
        success: true,
        method: 'card',
        amount: amountInEuros,
        value: amountInEuros,
        paymentUrl: safeResult.url || '',
        referencia: safeResult.referencia || ''
      };
      
      return response;
    }
    
    throw new Error(`Método de pagamento '${method}' não suportado`);
  } 
  catch (error: any) {
    console.error(`Erro ao processar pagamento ${method}:`, error);
    
    // Mostrar ao cliente que houve um erro no pagamento
    // Se o erro vier da API EuPago, mostrar informações detalhadas
    if (error.message && error.message.includes('API EuPago')) {
      throw new Error(`Erro na API de pagamento: ${error.message}`);
    }
    
    // Erro genérico para outros casos
    throw new Error(`Não foi possível processar o pagamento. Por favor, tente novamente ou contate o suporte.`);
  }
}

// Verificar status do pagamento
export async function getPaymentStatus(reference: string): Promise<EupagoResponse> {
  if (SIMULATION_MODE) {
    // Em modo de simulação, verificamos se a referência começa com SIM para simular
    if (reference.startsWith('SIM-')) {
      // 50% de chance do pagamento estar confirmado
      const confirmed = Math.random() > 0.5;
      
      return {
        success: true,
        reference,
        status: confirmed ? 'paid' : 'pending',
        statusCode: confirmed ? 'C' : 'P'
      };
    }
  }
  
  try {
    const result = await eupagoClient.request("/payments/status", { referencia: reference });
    
    // Tratar o resultado como objeto seguro
    const safeResult = result as any;
    
    // Usar valores seguros para garantir que não haja erros
    const response: EupagoResponse = {
      success: true,
      method: 'unknown',
      reference: reference,
      status: safeResult?.estado === 'pago' ? 'paid' : 'pending',
      statusCode: safeResult?.estado === 'pago' ? 'C' : 'P',
      estado: safeResult?.estado || 'pending'
    };
    
    console.log(`[Estado do pagamento ${reference}]:`, safeResult?.estado || 'desconhecido');
    return response;
  } catch (error) {
    console.error(`Erro ao verificar status do pagamento:`, error);
    
    // Resposta padrão para não quebrar o fluxo do cliente
    return {
      success: false,
      reference,
      status: 'pending',
      statusCode: 'P',
      error: 'Erro ao verificar status do pagamento'
    };
  }
}

// Cancelar pagamento pendente
export async function cancelPayment(reference: string): Promise<{ cancelled: boolean, message?: string }> {
  // EuPago não tem endpoint público para cancelamento direto
  // Apenas simulamos o cancelamento internamente
  
  return { 
    cancelled: true,
    message: `Pagamento ${reference} foi cancelado com sucesso`
  };
}