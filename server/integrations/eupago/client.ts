import "dotenv/config";
import fetch from 'node-fetch';
import { EupagoResponse } from './types';

const eupagoClient = {
  apiKey: process.env.EUPAGO_API_KEY || '',
  baseURL: process.env.EUPAGO_BASE_URL || 'https://sandbox.eupago.pt/api',
  cardBaseURL: process.env.EUPAGO_CARD_BASE_URL || 'https://sandbox.eupago.pt/clientes/rest_api',
  simulation: process.env.EUPAGO_SIMULATION === 'true',

  // Método genérico para fazer requisições à API do Eupago
  async request(endpoint: string, data: any): Promise<EupagoResponse> {
    if (!this.apiKey) {
      throw new Error('EUPAGO_API_KEY não configurada');
    }

    // Verificar se estamos em modo de simulação
    if (this.simulation) {
      console.log(`[SIM] POST ${endpoint}`, data);
      
      switch (endpoint) {
        case '/reference/create':
          return { 
            sucesso: true, 
            entidade: '11111', 
            referencia: '999 999 999', 
            valor: data.valor, 
            estado: 'pendente', 
            dataLimite: new Date(Date.now() + 72*3600*1000).toISOString() 
          };

        case '/mbway/create':
          return { 
            sucesso: true, 
            referencia: 'MBW-' + Date.now(), 
            valor: data.valor, 
            estado: 'pendente', 
            telemovel: data.telemovel 
          };

        case '/card/create':
          // Construir referência para simulação de cartão
          const referencia = 'CARD-' + Date.now();
          // Construir URL completo para redirecionamento
          const redirectUrl = `${this.cardBaseURL}/pagamento?ref=${referencia}`;
          
          return { 
            sucesso: true, 
            referencia: referencia, 
            valor: data.valor, 
            estado: 'pendente',
            url: redirectUrl
          };

        case '/payments/status':
          return { 
            sucesso: true, 
            referencia: data.referencia, 
            valor: data.valor || 0, 
            estado: 'pago', 
            dataPagamento: new Date().toISOString() 
          };

        default:
          throw new Error(`Endpoint de simulação não implementado: ${endpoint}`);
      }
    }

    // Ambiente real: faça fetch para a API EuPago
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