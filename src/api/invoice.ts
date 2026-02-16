import request from "@/utils/request";
import type {
  Invoice,
  CreateInvoiceRequest,
  IssueInvoiceRequest,
  AddPaymentRequest,
  CreateInvoiceFromPrescriptionRequest,
  InvoiceSearchParams,
} from "@/types/invoice";
import type { PageResponse } from "@/types";

export const invoiceApi = {
  /**
   * Create invoice
   * Option A: pass treatmentPlanId => auto import DONE treatment items
   * Option B: pass items manually
   */
  create(data: CreateInvoiceRequest) {
    return request.post<Invoice>("/invoices", data);
  },

  /**
   * Get invoice detail
   * Returns invoice with items & payments
   */
  getById(id: string) {
    return request.get<Invoice>(`/invoices/${id}`);
  },

  /**
   * Search invoices
   */
  search(params: InvoiceSearchParams) {
    return request.get<PageResponse<Invoice>>("/invoices", { params });
  },

  /**
   * Issue invoice
   * Confirm/issue invoice (DRAFT → ISSUED)
   * Only DRAFT can be issued
   */
  issue(id: string, data?: IssueInvoiceRequest) {
    return request.post<Invoice>(`/invoices/${id}/issue`, data);
  },

  /**
   * Add payment to invoice
   * Only ISSUED/PARTIALLY_PAID can accept payment
   * Auto update status: PARTIALLY_PAID / PAID
   */
  addPayment(id: string, data: AddPaymentRequest) {
    return request.post<Invoice>(`/invoices/${id}/payments`, data);
  },

  /**
   * Cancel invoice
   * PAID invoice cannot be cancelled
   * Admin only
   */
  cancel(id: string, note?: string) {
    return request.post<void>(`/invoices/${id}/cancel`, null, {
      params: { note },
    });
  },

  /**
   * Create invoice from dispensed prescription
   * Pricing: unitPrice = importPrice * markupRate (default 1.2)
   */
  createFromPrescription(data: CreateInvoiceFromPrescriptionRequest) {
    return request.post<Invoice>("/invoices/from-prescription", data);
  },
};
