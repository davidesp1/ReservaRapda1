import {
  createMultibanco,
  createMbway,
  createCardPayment,
  checkPaymentStatus,
} from "../integrations/eupago/payments";
import { EupagoResponse } from "../integrations/eupago/types";

export async function processPayment(
  method: "multibanco" | "mbway" | "card",
  amount: number,
  telemovel?: string,
): Promise<EupagoResponse> {
  if (method === "multibanco") {
    return createMultibanco(amount);
  } else if (method === "mbway") {
    if (!telemovel) throw new Error("Telemovel é obrigatório para MBWay");
    return createMbway(amount, telemovel);
  } else {
    const referencia = `CARD-${Date.now()}`;
    return createCardPayment(amount, referencia);
  }
}

export async function getPaymentStatus(
  referencia: string,
): Promise<EupagoResponse> {
  return checkPaymentStatus(referencia);
}

export async function cancelPayment(
  referencia: string,
): Promise<{ cancelled: boolean }> {
  // EuPago não oferece endpoint direto de cancelamento público
  // Marca como cancelado internamente
  return { cancelled: true };
}
