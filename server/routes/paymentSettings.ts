import { Request, Response } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { paymentService } from "../services/paymentService";

// Schema para validação das configurações de pagamento
const paymentSettingsSchema = z.object({
  eupagoApiKey: z.string().min(1, "API key do EuPago é obrigatória"),
  enabledPaymentMethods: z.array(
    z.enum(["card", "mbway", "multibanco", "bankTransfer", "cash"])
  ).min(1, "Pelo menos um método de pagamento deve estar habilitado"),
});

// Schema para validação do teste de API key
const testApiKeySchema = z.object({
  apiKey: z.string().min(1, "API key é obrigatória"),
});

/**
 * Rota para obter as configurações de pagamento
 */
export async function getPaymentSettings(req: Request, res: Response) {
  try {
    const settings = await storage.getPaymentSettings();
    
    if (!settings) {
      // Retornar configurações padrão se não existirem ainda
      return res.json({
        eupagoApiKey: "",
        enabledPaymentMethods: ["card", "mbway", "multibanco", "bankTransfer", "cash"],
      });
    }
    
    return res.json(settings);
  } catch (error: any) {
    console.error("Erro ao buscar configurações de pagamento:", error);
    return res.status(500).json({ message: error.message || "Erro ao buscar configurações de pagamento" });
  }
}

/**
 * Rota para atualizar as configurações de pagamento
 */
export async function updatePaymentSettings(req: Request, res: Response) {
  try {
    const validationResult = paymentSettingsSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: "Dados de configuração inválidos",
        errors: validationResult.error.format() 
      });
    }
    
    const settings = validationResult.data;
    
    // Salvar as configurações no banco de dados
    const updatedSettings = await storage.updatePaymentSettings(settings);
    
    return res.json(updatedSettings);
  } catch (error: any) {
    console.error("Erro ao atualizar configurações de pagamento:", error);
    return res.status(500).json({ message: error.message || "Erro ao atualizar configurações de pagamento" });
  }
}

/**
 * Rota para testar a conexão com a API do EuPago
 */
export async function testPaymentConnection(req: Request, res: Response) {
  try {
    const validationResult = testApiKeySchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: "API key inválida",
        errors: validationResult.error.format() 
      });
    }
    
    const { apiKey } = validationResult.data;
    
    // Testar a conexão com a API do EuPago
    const isValid = await paymentService.testConnection(apiKey);
    
    if (!isValid) {
      return res.status(400).json({ message: "API key inválida ou erro de conexão com o EuPago" });
    }
    
    return res.json({ message: "Conexão bem-sucedida com a API do EuPago" });
  } catch (error: any) {
    console.error("Erro ao testar conexão com EuPago:", error);
    return res.status(500).json({ message: error.message || "Erro ao testar conexão com EuPago" });
  }
}