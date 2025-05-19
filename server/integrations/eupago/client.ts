import fetch from 'node-fetch';
import { EupagoResponse } from './types';

// Cria o cliente para a API do Eupago
const eupagoClient = {
  baseURL: process.env.EUPAGO_BASE_URL || 'https://sandbox.eupago.pt/clientes/rest_api',
  apiKey: process.env.EUPAGO_API_KEY,

  // Método genérico para fazer requisições à API do Eupago
  async request(endpoint: string, data: any): Promise<EupagoResponse> {
    if (!this.apiKey) {
      throw new Error('EUPAGO_API_KEY não configurada');
    }

    const url = `${this.baseURL}${endpoint}`;
    
    try {
      // Simulação de resposta para desenvolvimento local
      // Não precisamos fazer requisições reais à API em ambiente de desenvolvimento
      console.log(`Simulando requisição para ${endpoint} com os dados:`, data);
      
      // Simular diferentes respostas com base no endpoint
      if (endpoint === '/reference/create') {
        return {
          sucesso: true,
          entidade: '11111',
          referencia: '999 999 999',
          valor: data.valor || 0,
          estado: 'pendente',
          dataLimite: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
        } as EupagoResponse;
      } else if (endpoint === '/mbway/create') {
        return {
          sucesso: true,
          referencia: 'mbw_' + Date.now(),
          valor: data.valor || 0,
          estado: 'pendente',
          telemovel: data.telemovel || '',
        } as EupagoResponse;
      } else if (endpoint === '/payments/status') {
        return {
          sucesso: true,
          referencia: data.referencia || '',
          valor: data.valor || 0,
          estado: 'pago',
          dataPagamento: new Date().toISOString(),
        } as EupagoResponse;
      }
      
      // Resposta padrão para outros endpoints
      return {
        sucesso: true,
        referencia: 'ref_' + Date.now(),
        valor: data.valor || 0,
        estado: 'pendente',
      } as EupagoResponse;
      
    } catch (error: any) {
      console.error(`Erro na requisição à API do Eupago (${endpoint}):`, error);
      throw error;
    }
  }
};

export default eupagoClient;