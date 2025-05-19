import "dotenv/config";
import fetch from 'node-fetch';
import { EupagoResponse } from './types';

// Cria o cliente para a API do Eupago
const eupagoClient = {
  baseURL: process.env.EUPAGO_BASE_URL || 'https://sandbox.eupago.pt/api',
  apiKey: process.env.EUPAGO_API_KEY,

  // Método genérico para fazer requisições à API do Eupago
  async request(endpoint: string, data: any): Promise<EupagoResponse> {
    if (!this.apiKey) {
      throw new Error('EUPAGO_API_KEY não configurada');
    }

    const url = `${this.baseURL}${endpoint}`;
    
    try {
      // Verificar se estamos em modo de simulação
      const isSimulation = process.env.NODE_ENV === 'development' && process.env.EUPAGO_SIMULATION === 'true';
      
      if (isSimulation) {
        // Simulação de resposta para desenvolvimento local
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
      }
      
      // Chamada real à API EuPago
      console.log(`Fazendo requisição real para ${url} com os dados:`, data);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json() as EupagoResponse;
      
      console.log(`Resposta da API EuPago:`, result);
      
      if (!response.ok || !result.sucesso) {
        throw new Error((result.mensagem as string) || 'Erro na API EuPago');
      }
      
      return result;
    } catch (error: any) {
      console.error(`Erro na requisição à API do Eupago (${endpoint}):`, error);
      throw error;
    }
  }
};

export default eupagoClient;