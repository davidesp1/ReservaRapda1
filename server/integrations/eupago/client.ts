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
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          chave: this.apiKey,
          formato: 'json',
        }),
      });

      const result = await response.json();

      // Verificar erros na resposta da API
      if (!response.ok || (result && typeof result === 'object' && 'erro' in result)) {
        const errorMessage = result && typeof result === 'object' && 'erro' in result 
          ? String(result.erro) 
          : 'Erro na requisição à API do Eupago';
        throw new Error(errorMessage);
      }

      return result as EupagoResponse;
    } catch (error: any) {
      console.error(`Erro na requisição à API do Eupago (${endpoint}):`, error);
      throw error;
    }
  }
};

export default eupagoClient;