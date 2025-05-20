import eupagoClient from "./client";
import { EupagoResponse } from "./types";

export async function createMultibanco(valor: number): Promise<EupagoResponse> {
  return eupagoClient.request("/reference/create", { valor });
}

export async function createMbway(
  valor: number,
  telemovel: string,
): Promise<EupagoResponse> {
  return eupagoClient.request("/mbway/create", { valor, telemovel });
}

export async function createCardPayment(
  valor: number,
  referencia: string,
): Promise<EupagoResponse> {
  // referencia gerada pelo backend
  return eupagoClient.request("/card/create", { valor, referencia });
}

export async function checkPaymentStatus(
  referencia: string,
): Promise<EupagoResponse> {
  return eupagoClient.request("/payments/status", { referencia });
}
