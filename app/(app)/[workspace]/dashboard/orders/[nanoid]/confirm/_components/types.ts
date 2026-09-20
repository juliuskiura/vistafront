export type PaymentMethodId = "visa" | "mpesa" | "paypal";

export type CheckoutCurrency = "KES" | "USD" | "EUR";

export interface CardFormData {
  cardNumber: string;
  cardHolder: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  saveCard: boolean;
}

export interface MpesaFormData {
  phoneNumber: string;
  accountReference: string;
  preferredMode: "stk_push" | "paybill";
}

export interface PaypalFormData {
  email: string;
  usePayIn4: boolean;
  rememberAccount: boolean;
}

export interface TransactionReceipt {
  transactionId: string;
  method: PaymentMethodId;
  amount: number;
  currency: string;
  date: string;
  status: "completed" | "processing" | "failed";
  payerInfo: string;
  referenceNumber: string;
}

export interface OrderLine {
  description: string;
  detail?: string;
  quantity?: number;
  total: number;
}