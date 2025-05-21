import fetch from "node-fetch";

/**
 * Cliente para a API EuPago
 * Documentação: https://www.eupago.pt/documentacao
 */
export class EuPagoClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl || "https://sandbox.eupago.pt/api";
  }

  /**
   * Verifica se a API key é válida fazendo uma requisição simples
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/ping`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `ApiKey ${this.apiKey}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error("Erro ao validar API key:", error);
      return false;
    }
  }

  /**
   * Cria um pagamento Multibanco
   */
  async createMultibancoPayment(options: {
    amount: number;
    description: string;
    clientName?: string;
    clientEmail?: string;
    clientPhone?: string;
    reference?: string;
    validDays?: number;
  }): Promise<{
    entity: string;
    reference: string;
    status: string;
    expirationDate: string;
  }> {
    try {
      const { amount, description, clientName, clientEmail, clientPhone, reference, validDays } = options;

      const payload = {
        payment: {
          amount: (amount / 100).toFixed(2),
          description,
          type: "multibanco",
          client: clientName,
          email: clientEmail,
          phone: clientPhone,
          reference,
          validDays: validDays || 3
        }
      };

      const response = await fetch(`${this.baseUrl}/v1.02/references/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `ApiKey ${this.apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json() as { message: string };
        throw new Error(errorData.message || "Erro ao criar pagamento Multibanco");
      }

      const data = await response.json() as { 
        entity: string; 
        reference: string; 
        status: string; 
        expirationDate: string;
      };
      return {
        entity: data.entity,
        reference: data.reference,
        status: data.status,
        expirationDate: data.expirationDate
      };
    } catch (error) {
      console.error("Erro ao criar pagamento Multibanco:", error);
      throw error;
    }
  }

  /**
   * Cria um pagamento MBWay
   */
  async createMBWayPayment(options: {
    amount: number;
    description: string;
    phoneNumber: string;
    clientName?: string;
    clientEmail?: string;
  }): Promise<{
    status: string;
    mbwayAlias: string;
  }> {
    try {
      const { amount, description, phoneNumber, clientName, clientEmail } = options;

      const payload = {
        payment: {
          amount: (amount / 100).toFixed(2),
          description,
          type: "mbway",
          phone: phoneNumber,
          client: clientName,
          email: clientEmail
        }
      };

      const response = await fetch(`${this.baseUrl}/v1.02/mbway/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `ApiKey ${this.apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json() as { message: string };
        throw new Error(errorData.message || "Erro ao criar pagamento MBWay");
      }

      const data = await response.json() as { 
        status: string; 
        alias: string;
      };
      return {
        status: data.status,
        mbwayAlias: data.alias
      };
    } catch (error) {
      console.error("Erro ao criar pagamento MBWay:", error);
      throw error;
    }
  }

  /**
   * Cria um pagamento com Cartão
   */
  async createCardPayment(options: {
    amount: number;
    description: string;
    returnUrl: string;
    clientName?: string;
    clientEmail?: string;
  }): Promise<{
    paymentUrl: string;
    status: string;
  }> {
    try {
      const { amount, description, returnUrl, clientName, clientEmail } = options;

      const payload = {
        payment: {
          amount: (amount / 100).toFixed(2),
          description,
          type: "credit_card",
          client: clientName,
          email: clientEmail,
          successUrl: returnUrl,
          failUrl: returnUrl,
          backUrl: returnUrl
        }
      };

      const response = await fetch(`${this.baseUrl}/v1.02/payments/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `ApiKey ${this.apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao criar pagamento com cartão");
      }

      const data = await response.json();
      return {
        paymentUrl: data.paymentUrl,
        status: data.status
      };
    } catch (error) {
      console.error("Erro ao criar pagamento com cartão:", error);
      throw error;
    }
  }

  /**
   * Cria detalhes para pagamento por transferência bancária
   */
  async createBankTransferDetails(): Promise<{
    iban: string;
    bankName: string;
    status: string;
  }> {
    // Nota: Normalmente, o EuPago forneceria os detalhes da conta bancária diretamente,
    // mas para este exemplo, estamos retornando dados simulados
    return {
      iban: "PT50000201231234567890154",
      bankName: "Banco Exemplo",
      status: "pending"
    };
  }

  /**
   * Verifica o estado de um pagamento
   */
  async checkPaymentStatus(reference: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/v1.02/references/status/${reference}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `ApiKey ${this.apiKey}`
        }
      });

      if (!response.ok) {
        return "error";
      }

      const data = await response.json();
      return data.status;
    } catch (error) {
      console.error("Erro ao verificar estado do pagamento:", error);
      return "error";
    }
  }
}