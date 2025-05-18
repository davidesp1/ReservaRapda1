import fetch from 'node-fetch';

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
    const apiKey = process.env.EUPAGO_API_KEY;
    if (!apiKey) {
      throw new Error('EUPAGO_API_KEY não configurada');
    }

    // Determinar a URL da API com base no método de pagamento
    let apiUrl = '';
    let payload: any = {
      valor: paymentData.amount.toFixed(2),
      chave: apiKey,
      referencia: paymentData.reference,
      descricao: paymentData.description,
    };

    // Configurar parâmetros específicos por tipo de pagamento
    switch (paymentData.method) {
      case 'card':
        apiUrl = 'https://sandbox.eupago.pt/clientes/rest_api/credit_card/create';
        payload = {
          ...payload,
          email: paymentData.email,
          valor: paymentData.amount.toFixed(2),
          por_defeito: true,
          formato: 'json',
        };
        break;
        
      case 'mbway':
        apiUrl = 'https://sandbox.eupago.pt/clientes/rest_api/mbway/create';
        payload = {
          ...payload,
          valor: paymentData.amount.toFixed(2),
          alias: paymentData.phone || '9123456789', // Número de telefone necessário para MBWay
          formato: 'json',
        };
        break;
        
      case 'multibanco':
        apiUrl = 'https://sandbox.eupago.pt/clientes/rest_api/reference/create';
        // O payload padrão já contém os campos necessários para Multibanco
        payload.formato = 'json';
        break;
        
      default:
        throw new Error(`Método de pagamento não suportado: ${paymentData.method}`);
    }

    // Chamar a API eupago
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    // Verificar erros na resposta da API
    if (!response.ok || (typeof result === 'object' && 'erro' in result)) {
      const errorMessage = typeof result === 'object' && 'erro' in result 
        ? String(result.erro) 
        : 'Erro no processamento do pagamento';
      throw new Error(errorMessage);
    }

    // Em modo de sandbox, simular uma resposta de sucesso para teste
    // Em produção, este bloco seria removido
    if (process.env.NODE_ENV === 'development') {
      // Criar resposta baseada no método de pagamento
      let paymentResponse: PaymentResponseData = {
        success: true,
        paymentReference: paymentData.reference,
        status: 'pending',
        message: 'Pagamento criado com sucesso',
      };

      if (paymentData.method === 'card') {
        paymentResponse = {
          ...paymentResponse,
          paymentUrl: 'https://sandbox.eupago.pt/pagamento?ref=012345678901',
          expirationDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };
      } else if (paymentData.method === 'mbway') {
        paymentResponse = {
          ...paymentResponse,
          phone: paymentData.phone || '9123456789',
          expirationDate: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        };
      } else if (paymentData.method === 'multibanco') {
        paymentResponse = {
          ...paymentResponse,
          entity: '12345',
          reference: '123 456 789',
          expirationDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        };
      }

      return paymentResponse;
    }

    // Formatar a resposta conforme o método de pagamento
    const paymentResponse: PaymentResponseData = {
      success: true,
      paymentReference: paymentData.reference,
      message: 'Pagamento criado com sucesso',
      ...(typeof result === 'object' ? result : {}),
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
    // Verificar se a chave da API eupago está definida
    const apiKey = process.env.EUPAGO_API_KEY;
    if (!apiKey) {
      throw new Error('EUPAGO_API_KEY não configurada');
    }

    // URL para verificar o status do pagamento
    const apiUrl = 'https://sandbox.eupago.pt/clientes/rest_api/payment/check';

    // Chamar a API eupago
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chave: apiKey,
        referencia: reference,
        formato: 'json',
      }),
    });

    const result = await response.json();

    // Verificar erros na resposta da API
    if (!response.ok || (typeof result === 'object' && 'erro' in result)) {
      const errorMessage = typeof result === 'object' && 'erro' in result 
        ? String(result.erro) 
        : 'Erro ao verificar o status do pagamento';
      throw new Error(errorMessage);
    }

    // Em modo de sandbox, simular uma resposta de sucesso para teste
    if (process.env.NODE_ENV === 'development') {
      return {
        success: true,
        paymentReference: reference,
        status: 'paid', // Simulando um pagamento concluído
        message: 'Pagamento concluído com sucesso',
      };
    }

    // Formatar a resposta
    const paymentResponse: PaymentResponseData = {
      success: true,
      paymentReference: reference,
      status: typeof result === 'object' && 'estado' in result ? String(result.estado) : 'unknown',
      message: typeof result === 'object' && 'estado' in result && result.estado === 'paga' 
        ? 'Pagamento concluído com sucesso' 
        : 'Pagamento pendente',
      ...(typeof result === 'object' ? result as Record<string, any> : {}),
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