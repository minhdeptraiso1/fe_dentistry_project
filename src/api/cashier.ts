import request from "@/utils/request";
import type { Appointment, Invoice } from "@/types";

/**
 * Cashier-specific APIs
 * Prefix: /cashier/*
 */

// ==================== TIẾP NHẬN + XẾP LỊCH + PHÂN BÁC SĨ ====================

export const cashierApi = {
  // Tạo phiếu khám (tiếp nhận bệnh nhân)
  createAppointment: (data: {
    patientId: number;
    appointmentDate: string;
    shift: string;
    serviceId?: number;
    notes?: string;
  }) => {
    return request.post<Appointment>("/cashier/appointments", data);
  },

  // Phân bác sĩ cho lịch hẹn
  assignDoctor: (appointmentId: number, doctorId: number) => {
    return request.post<Appointment>(
      `/cashier/appointments/${appointmentId}/assign`,
      { doctorId },
    );
  },

  // Lấy danh sách lịch hẹn (có filter)
  getAppointments: (params?: {
    date?: string;
    shift?: string;
    doctorId?: number;
    status?: string;
    page?: number;
    size?: number;
  }) => {
    return request.get<any>("/cashier/appointments", { params });
  },

  // ==================== HÓA ĐƠN + THANH TOÁN ====================

  // Tạo hóa đơn
  createInvoice: (data: {
    patientId: number;
    appointmentId?: number;
    items: Array<{
      serviceId?: number;
      medicineId?: number;
      quantity: number;
      unitPrice: number;
      description?: string;
    }>;
    notes?: string;
  }) => {
    return request.post<Invoice>("/cashier/invoices", data);
  },

  // Xuất hóa đơn chính thức (issue)
  issueInvoice: (invoiceId: number) => {
    return request.post<Invoice>(`/cashier/invoices/${invoiceId}/issue`);
  },

  // Ghi nhận thanh toán
  recordPayment: (
    invoiceId: number,
    data: {
      amount: number;
      paymentMethod: string;
      notes?: string;
    },
  ) => {
    return request.post<any>(`/cashier/invoices/${invoiceId}/payments`, data);
  },

  // Tạo hóa đơn từ đơn thuốc
  createInvoiceFromPrescription: (prescriptionId: number) => {
    return request.post<Invoice>("/cashier/invoices/from-prescription", {
      prescriptionId,
    });
  },

  // ==================== KHO THUỐC ====================

  // Nhập lô thuốc
  importMedicineBatch: (data: {
    medicineId: number;
    quantity: number;
    batchNumber: string;
    manufacturingDate: string;
    expiryDate: string;
    purchasePrice: number;
    supplier?: string;
  }) => {
    return request.post<any>("/cashier/medicines/batches", data);
  },

  // Xuất thuốc theo đơn
  dispensePrescription: (
    prescriptionId: number,
    data?: {
      notes?: string;
    },
  ) => {
    return request.post<any>(
      `/cashier/prescriptions/${prescriptionId}/dispense`,
      data,
    );
  },

  // Hủy lô thuốc hết hạn
  disposeBatch: (
    batchId: number,
    data: {
      reason: string;
      notes?: string;
    },
  ) => {
    return request.post<any>(
      `/cashier/medicines/batches/${batchId}/dispose`,
      data,
    );
  },
};
