import { Request, Response } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { paymentService } from "../services/paymentService";

// Schema para validação de criação de pagamento
const createPaymentSchema = z.object({
  method: z.enum(["card", "mbway", "multibanco", "bankTransfer", "cash"]),
  amount: z.number().int().min(1),
  userId: z.number().int().min(1),
  reservationId: z.number().int().optional().nullable(),
  description: z.string().optional(),
  clientName: z.string().optional(),
  clientEmail: z.string().email().optional(),
  clientPhone: z.string().optional(),
  returnUrl: z.string().url().optional(),
});

// Schema para validação de status de pagamento
const paymentStatusSchema = z.object({
  paymentId: z.number().int().min(1),
});

// Schema para validação de cancelamento de pagamento
const cancelPaymentSchema = z.object({
  paymentId: z.number().int().min(1),
  reason: z.string().optional(),
});

/**
 * Rota para processar um pagamento
 */
export async function processPayment(req: Request, res: Response) {
  try {
    const validationResult = createPaymentSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: "Dados de pagamento inválidos",
        errors: validationResult.error.format() 
      });
    }
    
    const paymentDetails = validationResult.data;
    
    // Processar o pagamento usando o serviço de pagamento
    const result = await paymentService.createPayment(paymentDetails);
    
    return res.json(result);
  } catch (error: any) {
    console.error("Erro ao processar pagamento:", error);
    return res.status(500).json({ message: error.message || "Erro ao processar pagamento" });
  }
}

/**
 * Rota para verificar o status de um pagamento
 */
export async function getPaymentStatus(req: Request, res: Response) {
  try {
    const { paymentId } = req.params;
    const id = parseInt(paymentId, 10);
    
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ message: "ID de pagamento inválido" });
    }
    
    // Verificar o status do pagamento
    const status = await paymentService.checkPaymentStatus(id);
    
    // Buscar os detalhes completos do pagamento
    const paymentDetails = await storage.getPayment(id);
    
    if (!paymentDetails) {
      return res.status(404).json({ message: "Pagamento não encontrado" });
    }
    
    return res.json({
      id: paymentDetails.id,
      status,
      method: paymentDetails.method,
      amount: paymentDetails.amount,
      details: paymentDetails.details,
      date: paymentDetails.paymentDate || paymentDetails.createdAt,
    });
  } catch (error: any) {
    console.error("Erro ao verificar status do pagamento:", error);
    return res.status(500).json({ message: error.message || "Erro ao verificar status do pagamento" });
  }
}

/**
 * Rota para cancelar um pagamento
 */
export async function cancelPayment(req: Request, res: Response) {
  try {
    const validationResult = cancelPaymentSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: "Dados inválidos para cancelamento",
        errors: validationResult.error.format() 
      });
    }
    
    const { paymentId, reason } = validationResult.data;
    
    // Buscar o pagamento atual
    const payment = await storage.getPayment(paymentId);
    
    if (!payment) {
      return res.status(404).json({ message: "Pagamento não encontrado" });
    }
    
    // Verificar se o pagamento pode ser cancelado
    if (payment.status === "completed") {
      return res.status(400).json({ message: "Não é possível cancelar um pagamento já concluído" });
    }
    
    // Cancelar o pagamento atualizando seu status
    const updatedPayment = await storage.updatePaymentStatus(paymentId, "failed");
    
    if (!updatedPayment) {
      return res.status(500).json({ message: "Falha ao cancelar pagamento" });
    }
    
    return res.json({
      message: "Pagamento cancelado com sucesso",
      payment: {
        id: updatedPayment.id,
        status: updatedPayment.status,
      }
    });
  } catch (error: any) {
    console.error("Erro ao cancelar pagamento:", error);
    return res.status(500).json({ message: error.message || "Erro ao cancelar pagamento" });
  }
}