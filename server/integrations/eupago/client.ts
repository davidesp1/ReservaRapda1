import fetch from "node-fetch";

const eupagoClient = {
  apiKey: process.env.EUPAGO_API_KEY!,
  baseURL: process.env.EUPAGO_BASE_URL || "https://api.eupago.pt",

  async request(endpoint: string, data: any) {
    if (!this.apiKey) {
      throw new Error("EUPAGO_API_KEY não configurada");
    }
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
  },
};

export default eupagoClient;
