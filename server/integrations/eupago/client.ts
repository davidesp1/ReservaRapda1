import fetch from "node-fetch";

// Definir a URL base do EuPago para ambiente real
const API_BASE_URL = process.env.EUPAGO_BASE_URL || "https://api.eupago.pt";
const API_KEY = process.env.EUPAGO_API_KEY || "demo-1408-87fc-3618-cc0";

// Cliente para a API EuPago
const eupagoClient = {
  // Métodos específicos por tipo de pagamento
  multibanco(data: { valor: number, per_dup?: number }) {
    return this.request('/api/reference/create', {
      valor: data.valor,
      per_dup: data.per_dup || 0
    });
  },
  
  mbway(data: { valor: number, telemovel: string }) {
    return this.request('/api/mbway/create', {
      valor: data.valor,
      telemovel: data.telemovel
    });
  },
  
  card(data: { valor: number, referencia?: string }) {
    const ref = data.referencia || `REF-${Date.now()}`;
    const CARD_API_URL = process.env.EUPAGO_CARD_BASE_URL || "https://sandbox.eupago.pt";
    return this.request('/api/pagamento/gerar', {
      valor: data.valor,
      referencia: ref,
      // URL específica para cartões
      callback_url: `${CARD_API_URL}/api/pagamento/callback`
    });
  },

  // Método para fazer requisições à API
  async request(endpoint: string, data: Record<string, any> = {}): Promise<any> {
    const url = API_BASE_URL + (endpoint.startsWith('/') ? endpoint : '/' + endpoint);
    
    // Incluir a API key no corpo da requisição
    const requestData = {
      chave: API_KEY,
      ...data,
    };
    
    console.log(`[EuPago] Enviando requisição para ${endpoint}:`, requestData);
    
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[EuPago] Erro na resposta (${response.status}):`, errorText);
        throw new Error(`Erro na API EuPago: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log(`[EuPago] Resposta recebida:`, responseData);
      
      return responseData;
    } catch (error) {
      console.error(`[EuPago] Erro ao fazer requisição:`, error);
      throw error;
    }
  }
};

export default eupagoClient;