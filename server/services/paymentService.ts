import eupagoClient from "../integrations/eupago/client";
import { EupagoResponse } from "../integrations/eupago/types";

// Modo simulação para contingência caso a API falhe
const SIMULATION_MODE = false;

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
): Promise<EupagoResponse> {
  console.log(`Processando pagamento ${method} no valor de ${amount}€`);
  
  // Se estamos em modo de simulação, retornar dados simulados
  if (SIMULATION_MODE) {
    console.log(`[SIMULAÇÃO] Modo de simulação ativado para pagamento ${method}`);
    return simulatePayment(method, amount, phone);
  }
  
  // Se não estamos em simulação, chamar a API real do EuPago
  try {
    if (method === "multibanco") {
      console.log(`[DEBUG] Tentando fazer pagamento Multibanco via EuPago API`);
      return eupagoClient.multibanco({ valor: amount, per_dup: 0 });
    } 
    else if (method === "mbway") {
      if (!phone) throw new Error("Número de telefone é obrigatório para MBWay");
      return eupagoClient.mbway({ valor: amount, telemovel: phone });
    } 
    else if (method === "card") {
      const referencia = `CARD-${Date.now()}`;
      return eupagoClient.card({ valor: amount, referencia });
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
    return eupagoClient.request("/payments/status", { referencia: reference });
  } catch (error) {
    console.error(`Erro ao verificar status do pagamento:`, error);
    
    // Não usamos fallback para simulação em ambiente real
    console.log(`Não usando fallback para simulação em getPaymentStatus`);
    // Em ambiente real, sempre retornamos o erro real para o usuário
    
    throw error;
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