import "dotenv/config";
import fetch from 'node-fetch';
import { EupagoResponse } from './types';

// Função de simulação unificada
function simulate(endpoint: string, data: any): EupagoResponse {
  console.log(`Simulando requisição para ${endpoint} com os dados:`, data);
  
  // Simulação para Multibanco
  if (endpoint === '/reference/create') {
    return {
      sucesso: true,
      entidade: '11111',
      referencia: '999 999 999',
      valor: data.valor || 0,
      estado: 'pendente',
      dataLimite: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    };
  } 
  
  // Simulação para MBWay
  if (endpoint === '/mbway/create') {
    return {
      sucesso: true,
      referencia: 'mbw_' + Date.now(),
      valor: data.valor || 0,
      estado: 'pendente',
      telemovel: data.telemovel || '',
    };
  } 
  
  // Simulação para verificação de status
  if (endpoint === '/payments/status') {
    return {
      sucesso: true,
      referencia: data.referencia || '',
      valor: data.valor || 0,
      estado: 'pago',
      dataPagamento: new Date().toISOString(),
    };
  }
  
  // Simulação para pagamento com cartão
  if (endpoint === '/card/create') {
    const cardBaseUrl = process.env.EUPAGO_CARD_BASE_URL || 'https://sandbox.eupago.pt/clientes/rest_api';
    return {
      sucesso: true,
      referencia: 'card_' + Date.now(),
      valor: data.valor || 0,
      estado: 'pendente',
      url: `${cardBaseUrl}/pagamento?ref=${Date.now()}`,
    };
  }
  
  // Resposta padrão para outros endpoints
  return {
    sucesso: true,
    referencia: 'ref_' + Date.now(),
    valor: data.valor || 0,
    estado: 'pendente',
  };
}

// Cliente unificado para a API do Eupago
const eupagoClient = {
  baseURL: process.env.EUPAGO_BASE_URL || 'https://sandbox.eupago.pt/api',
  apiKey: process.env.EUPAGO_API_KEY,

  // Método genérico para fazer requisições à API do Eupago
  async request(endpoint: string, data: any): Promise<EupagoResponse> {
    if (!this.apiKey) {
      throw new Error('EUPAGO_API_KEY não configurada');
    }

    // Verificar se estamos em modo de simulação
    if (process.env.EUPAGO_SIMULATION === 'true') {
      return simulate(endpoint, data);
    }
    
    try {
      const url = `${this.baseURL}${endpoint}`;
      console.log(`Fazendo requisição real para ${url} com os dados:`, data);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`EuPago ${endpoint} falhou: ${response.status}`);
      }
      
      const result = await response.json() as EupagoResponse;
      console.log(`Resposta da API EuPago:`, result);
      
      return result;
    } catch (error: any) {
      console.error(`Erro na requisição à API do Eupago (${endpoint}):`, error);
      throw error;
    }
  }
};

export default eupagoClient;