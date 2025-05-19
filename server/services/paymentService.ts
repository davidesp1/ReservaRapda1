import { criarCartao, criarMbway, criarMultibanco, verificarStatusPagamento } from '../integrations/eupago/payments';

// Interface para os dados de pagamento recebidos do frontend
interface PaymentRequestData {
  method: string;
  amount: number;
  reference: string;
  description: string;
  email?: string;
  name?: string;
  phone?: string;
}

// Interface para a resposta de pagamento que será retornada ao frontend
interface PaymentResponseData {
  success: boolean;
  paymentReference: string;
  paymentUrl?: string;
  message?: string;
  expirationDate?: string;
  entity?: string;
  reference?: string;
  status?: string;
  [key: string]: any;
}

/**
 * Processa um pagamento através da API da eupago
 * 
 * @param paymentData Dados do pagamento a ser processado
 * @returns Resultado do processamento do pagamento
 */
export async function processPayment(paymentData: PaymentRequestData): Promise<PaymentResponseData> {
  try {
    // Verificar se a chave da API eupago está definida
    if (!process.env.EUPAGO_API_KEY) {
      throw new Error('EUPAGO_API_KEY não configurada');
    }

    let paymentResult;

    // Processar pagamento conforme o método escolhido
    switch (paymentData.method) {
      case 'card':
        paymentResult = await criarCartao({
          id: paymentData.reference,
          valor: paymentData.amount,
          email: paymentData.email
        });
        break;
        
      case 'mbway':
        if (!paymentData.phone) {
          throw new Error('Número de telefone é obrigatório para pagamento MB WAY');
        }
        paymentResult = await criarMbway(
          paymentData.reference,
          paymentData.amount,
          paymentData.phone
        );
        break;
        
      case 'multibanco':
        paymentResult = await criarMultibanco(
          paymentData.reference,
          paymentData.amount
        );
        break;
        
      default:
        throw new Error(`Método de pagamento não suportado: ${paymentData.method}`);
    }

    // Verificar se o pagamento foi criado com sucesso
    if (!paymentResult.success) {
      throw new Error(paymentResult.message || 'Falha no processamento do pagamento');
    }

    // Em modo de desenvolvimento/sandbox, não há comportamento de redirect real, então:
    if (process.env.NODE_ENV === 'development') {
      // Simulamos a resposta para teste em sandbox
      const simulatedResponse: PaymentResponseData = {
        success: true,
        paymentReference: paymentData.reference,
        status: 'pending',
        message: 'Pagamento criado com sucesso (sandbox)',
      };

      // Adicionar dados específicos por método de pagamento
      if (paymentData.method === 'card') {
        simulatedResponse.paymentUrl = 'https://sandbox.eupago.pt/pagamento?ref=012345678901';
        simulatedResponse.expirationDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      } else if (paymentData.method === 'mbway') {
        simulatedResponse.phone = paymentData.phone;
        simulatedResponse.expirationDate = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      } else if (paymentData.method === 'multibanco') {
        simulatedResponse.entity = '12345';
        simulatedResponse.reference = '123 456 789';
        simulatedResponse.expirationDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
      }

      return simulatedResponse;
    }

    // Formatar a resposta para o frontend
    const paymentResponse: PaymentResponseData = {
      success: paymentResult.success,
      paymentReference: paymentData.reference,
      message: paymentResult.message,
      entity: paymentResult.entity,
      reference: paymentResult.reference,
      status: paymentResult.status,
      expirationDate: paymentResult.expirationDate,
      paymentUrl: paymentResult.paymentUrl
    };

    return paymentResponse;
  } catch (error: any) {
    console.error('Erro ao processar pagamento:', error);
    return {
      success: false,
      paymentReference: paymentData.reference,
      message: error.message || 'Ocorreu um erro ao processar o pagamento',
    };
  }
}

/**
 * Verifica o status de um pagamento
 * 
 * @param reference Referência do pagamento a verificar
 * @returns Status atualizado do pagamento
 */
export async function checkPaymentStatus(reference: string): Promise<PaymentResponseData> {
  try {
    // Verificar status do pagamento com o serviço do Eupago
    const statusResult = await verificarStatusPagamento(reference);

    // Em ambiente de desenvolvimento, simulamos um pagamento concluído
    if (process.env.NODE_ENV === 'development') {
      return {
        success: true,
        paymentReference: reference,
        status: 'paid', // Simulando um pagamento concluído
        message: 'Pagamento concluído com sucesso',
      };
    }

    // Formatar a resposta para o frontend
    const paymentResponse: PaymentResponseData = {
      success: statusResult.success,
      paymentReference: reference,
      status: statusResult.status,
      message: statusResult.message,
      entity: statusResult.entity,
      reference: statusResult.reference,
      expirationDate: statusResult.expirationDate,
      paymentUrl: statusResult.paymentUrl
    };

    return paymentResponse;
  } catch (error: any) {
    console.error('Erro ao verificar status de pagamento:', error);
    return {
      success: false,
      paymentReference: reference,
      message: error.message || 'Ocorreu um erro ao verificar o status do pagamento',
      status: 'error',
    };
  }
}