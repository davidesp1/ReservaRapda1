import fetch from "node-fetch";

// Definir a URL base do EuPago baseado no ambiente (sandbox ou produção)
const API_BASE_URL = process.env.EUPAGO_BASE_URL || "https://sandbox.eupago.pt/clientes/rest_api";
const API_KEY = process.env.EUPAGO_API_KEY || "demo-36a89-2b75-42";

// Cliente para a API EuPago
const eupagoClient = {
  // Métodos específicos por tipo de pagamento
  multibanco(data: { valor: number, per_dup?: number }) {
    return this.request('/clientes/rest_api/multibanco/create', {
      valor: data.valor,
      per_dup: data.per_dup || 0
    });
  },
  
  mbway(data: { valor: number, telemovel: string }) {
    return this.request('/clientes/rest_api/mbway/create', {
      valor: data.valor,
      telemovel: data.telemovel
    });
  },
  
  card(data: { valor: number, referencia?: string }) {
    const ref = data.referencia || `REF-${Date.now()}`;
    return this.request('/clientes/rest_api/pagamentovpos/create', {
      valor: data.valor,
      referencia: ref
    });
  },

  // Método para fazer requisições à API
  async request(endpoint: string, data: Record<string, any> = {}): Promise<any> {
    const url = API_BASE_URL + (endpoint.startsWith('/') ? endpoint.substring(1) : endpoint);
    
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