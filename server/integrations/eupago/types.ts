export interface EupagoResponse {
  success?: boolean;
  message?: string;
  entity?: string;
  reference?: string;
  paymentUrl?: string;
  paymentReference?: string;
  expirationDate?: string;
  phone?: string;
  method?: string;
  value?: number;
  amount?: number;
  [key: string]: any;
}