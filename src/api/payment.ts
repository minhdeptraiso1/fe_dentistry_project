import axios from "axios";
import request from "@/utils/request";

export interface CreateVnPayPaymentRequest {
  invoiceId: string;
  bankCode?: string;
  language?: string;
}

export interface VnPayCreatePaymentResponse {
  code: string;
  message: string;
  paymentUrl: string;
}

export interface VnPayReturnResponse {
  success: boolean;
  verified: boolean;
  message: string;
  invoiceId: string;
  responseCode: string;
}

export const VNPAY_RETURN_TO_KEY = "vnpay:returnTo";
export const VNPAY_INVOICE_ID_KEY = "vnpay:invoiceId";

export const paymentApi = {
  createVnPayPayment(data: CreateVnPayPaymentRequest) {
    return request.post<VnPayCreatePaymentResponse>(
      "/payments/vnpay/create",
      data,
    );
  },

  async processVnPayReturn(params: Record<string, any>) {
    const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
    const response = await axios.get<VnPayReturnResponse>(
      `${baseURL}/payments/vnpay/return`,
      { params },
    );
    return response.data;
  },
};
