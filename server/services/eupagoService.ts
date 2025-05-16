import fetch from 'node-fetch';
import { URLSearchParams } from 'url';

// Create a function to convert URLSearchParams to string
const urlSearchParamsToString = (params: URLSearchParams): string => {
  return params.toString();
};

interface EupagoPaymentRequest {
  amount: number;
  reference: string;
  description: string;
  email: string;
  name?: string;
  phone?: string;
}

interface EupagoCardPaymentRequest extends EupagoPaymentRequest {
  returnUrl: string;
  cancelUrl: string;
}

interface EupagoMbwayPaymentRequest extends EupagoPaymentRequest {
  phoneNumber: string; // Format: 9xxxxxxxx (ex: 914123456)
}

interface EupagoMultibancoPaymentRequest extends EupagoPaymentRequest {
  validDays?: number; // Default: 30
}

interface EupagoTransferPaymentRequest extends EupagoPaymentRequest {
  validDays?: number; // Default: 30
}

interface EupagoPaymentResponse {
  success: boolean;
  message?: string;
  paymentUrl?: string;
  reference?: string;
  entity?: string;
  status?: string;
  mbwayAlias?: string;
  amount?: number;
  transactionId?: string;
  method?: string;
}

class EupagoService {
  private apiKey: string;
  private baseUrl: string = 'https://sandbox.eupago.pt/clientes/rest_api';

  constructor() {
    const apiKey = process.env.EUPAGO_API_KEY;
    if (!apiKey) {
      throw new Error('EUPAGO_API_KEY environment variable is not set');
    }
    this.apiKey = apiKey;
  }

  /**
   * Creates a card payment request
   */
  async createCardPayment(request: EupagoCardPaymentRequest): Promise<EupagoPaymentResponse> {
    try {
      const params = new URLSearchParams();
      params.append('chave', this.apiKey);
      params.append('valor', request.amount.toFixed(2));
      params.append('id', request.reference);
      params.append('descricao', request.description);
      params.append('email', request.email);
      params.append('url_retorno', request.returnUrl);
      params.append('url_cancelamento', request.cancelUrl);
      
      if (request.name) params.append('nome', request.name);
      if (request.phone) params.append('contacto', request.phone);

      const response = await fetch(`${this.baseUrl}/multibanco/criar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: urlSearchParamsToString(params),
      });

      const data = await response.json();
      return this.formatResponse(data, 'card');
    } catch (error) {
      console.error('Error creating card payment:', error);
      return {
        success: false,
        message: 'Error creating card payment',
      };
    }
  }

  /**
   * Creates an MBWay payment request
   */
  async createMbwayPayment(request: EupagoMbwayPaymentRequest): Promise<EupagoPaymentResponse> {
    try {
      const params = new URLSearchParams();
      params.append('chave', this.apiKey);
      params.append('valor', request.amount.toFixed(2));
      params.append('id', request.reference);
      params.append('descricao', request.description);
      params.append('alias', request.phoneNumber);
      params.append('email', request.email);
      
      if (request.name) params.append('nome', request.name);

      const response = await fetch(`${this.baseUrl}/mbway/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: urlSearchParamsToString(params),
      });

      const data = await response.json();
      return this.formatResponse(data, 'mbway');
    } catch (error) {
      console.error('Error creating MBWay payment:', error);
      return {
        success: false,
        message: 'Error creating MBWay payment',
      };
    }
  }

  /**
   * Creates a Multibanco payment reference
   */
  async createMultibancoPayment(request: EupagoMultibancoPaymentRequest): Promise<EupagoPaymentResponse> {
    try {
      const params = new URLSearchParams();
      params.append('chave', this.apiKey);
      params.append('valor', request.amount.toFixed(2));
      params.append('id', request.reference);
      params.append('descricao', request.description);
      params.append('email', request.email);
      
      if (request.name) params.append('nome', request.name);
      if (request.phone) params.append('contacto', request.phone);
      if (request.validDays) params.append('validade', request.validDays.toString());

      const response = await fetch(`${this.baseUrl}/multibanco/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: urlSearchParamsToString(params),
      });

      const data = await response.json();
      return this.formatResponse(data, 'multibanco');
    } catch (error) {
      console.error('Error creating Multibanco payment:', error);
      return {
        success: false,
        message: 'Error creating Multibanco payment',
      };
    }
  }

  /**
   * Creates a Bank Transfer payment
   */
  async createTransferPayment(request: EupagoTransferPaymentRequest): Promise<EupagoPaymentResponse> {
    try {
      const params = new URLSearchParams();
      params.append('chave', this.apiKey);
      params.append('valor', request.amount.toFixed(2));
      params.append('id', request.reference);
      params.append('descricao', request.description);
      params.append('email', request.email);
      
      if (request.name) params.append('nome', request.name);
      if (request.phone) params.append('contacto', request.phone);
      if (request.validDays) params.append('validade', request.validDays.toString());

      const response = await fetch(`${this.baseUrl}/transferenciabancariapt/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: urlSearchParamsToString(params),
      });

      const data = await response.json();
      return this.formatResponse(data, 'transfer');
    } catch (error) {
      console.error('Error creating Bank Transfer payment:', error);
      return {
        success: false,
        message: 'Error creating Bank Transfer payment',
      };
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(reference: string, method: string): Promise<EupagoPaymentResponse> {
    try {
      const params = new URLSearchParams();
      params.append('chave', this.apiKey);
      params.append('referencia', reference);

      const url = method === 'mbway' 
        ? `${this.baseUrl}/mbway/get`
        : method === 'multibanco'
          ? `${this.baseUrl}/multibanco/get`
          : method === 'transfer'
            ? `${this.baseUrl}/transferenciabancariapt/get`
            : `${this.baseUrl}/pagamentos/get`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: urlSearchParamsToString(params),
      });

      const data = await response.json() as any;
      return {
        success: true,
        reference: data.referencia || '',
        status: data.estado || 'pending',
        amount: data.valor ? parseFloat(data.valor) : 0,
        transactionId: data.transacao || '',
        method: method,
      };
    } catch (error) {
      console.error('Error checking payment status:', error);
      return {
        success: false,
        message: 'Error checking payment status',
      };
    }
  }

  /**
   * Format the API response to a standardized format
   */
  private formatResponse(data: any, method: string): EupagoPaymentResponse {
    if (data.resposta === 'error' || !data.sucesso) {
      return {
        success: false,
        message: data.resposta_descricao || 'Error processing payment',
      };
    }

    const response: EupagoPaymentResponse = {
      success: true,
      method: method,
    };

    // Format based on payment method
    if (method === 'card') {
      response.paymentUrl = data.url;
      response.reference = data.referencia;
    } else if (method === 'mbway') {
      response.reference = data.referencia;
      response.mbwayAlias = data.alias;
      response.status = data.estado_mbway;
    } else if (method === 'multibanco') {
      response.reference = data.referencia;
      response.entity = data.entidade;
      response.amount = parseFloat(data.valor);
    } else if (method === 'transfer') {
      response.reference = data.referencia;
      response.entity = data.entidade;
      response.amount = parseFloat(data.valor);
    }

    return response;
  }
}

export default new EupagoService();