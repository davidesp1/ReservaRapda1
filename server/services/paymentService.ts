import { EuPagoClient } from "../integrations/eupago/client";
import { storage } from "../storage";

/**
 * Serviço para gerenciar pagamentos utilizando o EuPago
 */
export class PaymentService {
  private eupagoClient: EuPagoClient | null = null;

  /**
   * Inicializa o cliente EuPago com a chave API
   */
  async initEuPagoClient(): Promise<boolean> {
    try {
      // Buscar configurações de pagamento do banco de dados
      const settings = await storage.getPaymentSettings();
      
      if (!settings?.eupagoApiKey) {
        console.error("API key do EuPago não configurada");
        return false;
      }

      this.eupagoClient = new EuPagoClient(settings.eupagoApiKey);
      return true;
    } catch (error) {
      console.error("Erro ao inicializar o cliente EuPago:", error);
      return false;
    }
  }

  /**
   * Testa a conexão com a API do EuPago
   */
  async testConnection(apiKey: string): Promise<boolean> {
    try {
      const testClient = new EuPagoClient(apiKey);
      return await testClient.validateApiKey();
    } catch (error) {
      console.error("Erro ao testar conexão com EuPago:", error);
      return false;
    }
  }

  /**
   * Cria um novo pagamento
   */
  async createPayment(options: {
    method: "multibanco" | "mbway" | "card" | "bankTransfer" | "cash";
    amount: number;
    userId: number;
    reservationId?: number | null;
    description?: string;
    clientName?: string;
    clientEmail?: string;
    clientPhone?: string;
    returnUrl?: string;
  }): Promise<{
    id: number;
    reference?: string;
    details: any;
    status: string;
  }> {
    if (!this.eupagoClient) {
      const initialized = await this.initEuPagoClient();
      if (!initialized) {
        throw new Error("Não foi possível inicializar o cliente de pagamento");
      }
    }

    const { method, amount, userId, reservationId, description } = options;
    const paymentDescription = 
      description || `Pagamento ${reservationId ? 'reserva #' + reservationId : ''} - Opa que Delícia`;
    
    try {
      let details: any = null;
      let reference: string | null = null;
      let status: "pending" | "completed" | "failed" | "refunded" | null = "pending";
      
      // Para pagamentos em dinheiro, não precisamos processar pelo gateway
      if (method === "cash") {
        status = "completed";
      } 
      // Processar pagamento pelo gateway de acordo com o método
      else if (method === "multibanco" && this.eupagoClient) {
        details = await this.eupagoClient.createMultibancoPayment({
          amount,
          description: paymentDescription,
          clientName: options.clientName,
          clientEmail: options.clientEmail,
          clientPhone: options.clientPhone
        });
        reference = details.reference;
      } 
      else if (method === "mbway" && this.eupagoClient && options.clientPhone) {
        details = await this.eupagoClient.createMBWayPayment({
          amount,
          description: paymentDescription,
          phoneNumber: options.clientPhone,
          clientName: options.clientName,
          clientEmail: options.clientEmail
        });
      } 
      else if (method === "card" && this.eupagoClient && options.returnUrl) {
        details = await this.eupagoClient.createCardPayment({
          amount,
          description: paymentDescription,
          returnUrl: options.returnUrl,
          clientName: options.clientName,
          clientEmail: options.clientEmail
        });
      } 
      else if (method === "bankTransfer" && this.eupagoClient) {
        details = await this.eupagoClient.createBankTransferDetails();
      } 
      else {
        throw new Error(`Método de pagamento inválido ou faltam informações: ${method}`);
      }

      // Salvar o pagamento no banco de dados
      const payment = await storage.createPayment({
        method,
        amount,
        userId,
        reservationId: reservationId || null,
        reference,
        status: status as "pending" | "completed" | "failed" | "refunded" | null,
        details
      });

      return {
        id: payment.id,
        reference: payment.reference || undefined,
        details,
        status: payment.status || "pending",
      };
    } catch (error: any) {
      console.error(`Erro ao criar pagamento ${method}:`, error);
      throw new Error(`Falha ao processar pagamento: ${error.message}`);
    }
  }

  /**
   * Verifica o status de um pagamento
   */
  async checkPaymentStatus(paymentId: number): Promise<string> {
    if (!this.eupagoClient) {
      const initialized = await this.initEuPagoClient();
      if (!initialized) {
        throw new Error("Não foi possível inicializar o cliente de pagamento");
      }
    }

    try {
      // Buscar o pagamento no banco de dados
      const payment = await storage.getPayment(paymentId);
      if (!payment) {
        throw new Error("Pagamento não encontrado");
      }

      // Pagamentos em dinheiro já estão completos
      if (payment.method === "cash") {
        return payment.status || "completed";
      }

      // Para pagamentos online, verificar o status no gateway
      if (payment.reference && this.eupagoClient) {
        const status = await this.eupagoClient.checkPaymentStatus(payment.reference);
        
        // Atualizar status do pagamento se mudou
        if (status !== payment.status) {
          await storage.updatePaymentStatus(paymentId, status);
        }
        
        return status;
      }

      return payment.status || "pending";
    } catch (error: any) {
      console.error("Erro ao verificar status do pagamento:", error);
      throw new Error(`Falha ao verificar pagamento: ${error.message}`);
    }
  }
}

// Exporta uma instância única do serviço de pagamento
export const paymentService = new PaymentService();