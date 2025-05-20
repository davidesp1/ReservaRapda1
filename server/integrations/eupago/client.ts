import fetch from "node-fetch";

// Verificar se estamos em modo de simulação
const SIMULATION_MODE = process.env.EUPAGO_SIMULATION === 'true';

// Funções de simulação para testes offline
const simulatePayment = (method: string, data: any) => {
  console.log(`[SIMULAÇÃO] Processando pagamento via ${method}`, data);
  
  // Gerar referências simuladas para os diferentes métodos de pagamento
  const now = new Date();
  const timestamp = now.getTime();
  
  // Respostas simuladas por método
  if (method === 'multibanco') {
    return {
      success: true,
      method: 'multibanco',
      entity: '11111',
      reference: '123 456 789',
      value: data.amount || 10,
      expirationDate: new Date(now.getTime() + 72 * 3600 * 1000).toISOString(),
      paymentUrl: null,
      paymentReference: `MB-SIM-${timestamp}`
    };
  } 
  else if (method === 'mbway') {
    return {
      success: true,
      method: 'mbway',
      phone: data.phone || '912345678',
      value: data.amount || 10,
      paymentUrl: null,
      paymentReference: `MBWAY-SIM-${timestamp}`
    };
  }
  else if (method === 'card') {
    // Para cartão, incluir URL simulada para redirecionamento
    return {
      success: true,
      method: 'card',
      value: data.amount || 10,
      paymentUrl: 'https://sandbox.eupago.pt/clientes/simulacao/pagamento-cartao?ref=SIM-1234567890',
      paymentReference: `CARD-SIM-${timestamp}`
    };
  }
  
  // Método não suportado
  return {
    success: false,
    error: 'Método de pagamento não suportado'
  };
};

const eupagoClient = {
  apiKey: process.env.EUPAGO_API_KEY!,
  baseURL: process.env.EUPAGO_BASE_URL || "https://api.eupago.pt",
  simulationMode: SIMULATION_MODE,

  async request(endpoint: string, data: any) {
    // Se estamos em modo de simulação, não fazemos a chamada real à API
    if (this.simulationMode) {
      console.log('[SIMULAÇÃO] EuPago API em modo de simulação');
      
      // Extrair o método de pagamento do endpoint ou dados
      let paymentMethod = '';
      
      if (endpoint.includes('multibanco')) {
        paymentMethod = 'multibanco';
      } else if (endpoint.includes('mbway')) {
        paymentMethod = 'mbway';
      } else if (endpoint.includes('card') || endpoint.includes('cartao')) {
        paymentMethod = 'card';
      } else {
        // Tentar extrair do payload
        paymentMethod = data.method || 'multibanco';
      }
      
      // Simular resposta de pagamento
      return simulatePayment(paymentMethod, data);
    }
    
    // Verificar se a chave API está configurada
    if (!this.apiKey) {
      throw new Error("EUPAGO_API_KEY não configurada");
    }
    
    // Fazer a chamada real à API
    try {
      const url = `${this.baseURL}${endpoint}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `EuPago ${endpoint} falhou: ${response.status} - ${text}`,
        );
      }
      
      return response.json();
    } catch (error: any) {
      // Se em produção, lançar o erro
      if (!this.simulationMode) {
        throw error;
      }
      
      // Fallback para simulação em caso de erro de rede
      console.log('[SIMULAÇÃO] Fallback para simulação devido a erro:', error.message);
      const method = data.method || 'multibanco';
      return simulatePayment(method, data);
    }
  },
};

export default eupagoClient;
