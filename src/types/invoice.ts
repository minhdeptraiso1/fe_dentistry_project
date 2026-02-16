/**
 * Invoice Types
 */

// Enums
export type InvoiceStatus =
  | "DRAFT"
  | "ISSUED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "CANCELLED";

export type PaymentMethod = "CASH" | "TRANSFER" | "CARD";

// Invoice Item
export interface InvoiceItem {
  id: string;
  serviceId?: string;
  serviceCode?: string;
  itemName: string;
  serviceType?: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  lineTotal: number;
  note?: string;
}

export interface CreateInvoiceItemRequest {
  serviceId?: string;
  itemName: string;
  serviceCode?: string;
  serviceType?: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  note?: string;
}

// Payment
export interface Payment {
  id: string;
  method: PaymentMethod;
  amount: number;
  paidAt: string;
  reference?: string;
  note?: string;
}

export interface AddPaymentRequest {
  method: PaymentMethod;
  amount: number;
  reference?: string;
  note?: string;
}

// Invoice
export interface Invoice {
  id: string;
  invoiceCode: string;

  patientId: string;
  patientCode: string;
  patientName: string;

  cashierId: string;
  cashierUsername: string;

  treatmentPlanId?: string;
  prescriptionId?: string;

  status: InvoiceStatus;
  note?: string;

  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;

  issuedAt?: string;
  paidAt?: string;

  items: InvoiceItem[];
  payments: Payment[];

  createdAt: string;
  updatedAt: string;
}

// Create Invoice Request
export interface CreateInvoiceRequest {
  patientId: string;
  treatmentPlanId?: string; // Optional: auto import DONE items from treatment plan
  note?: string;
  discountAmount?: number;
  items?: CreateInvoiceItemRequest[]; // Optional: manual items if not from treatment plan
}

// Issue Invoice Request
export interface IssueInvoiceRequest {
  note?: string;
}

// Create from Prescription Request
export interface CreateInvoiceFromPrescriptionRequest {
  prescriptionId: string;
  note?: string;
}

// Search params
export interface InvoiceSearchParams {
  patientId?: string;
  status?: InvoiceStatus;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
}
