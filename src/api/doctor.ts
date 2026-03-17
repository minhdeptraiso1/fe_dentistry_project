import request from "@/utils/request";
import type { MedicalRecord, TreatmentPlan, Prescription } from "@/types";

/**
 * Doctor-specific APIs
 * Prefix: /doctor/* or /my/*
 * Backend automatically gets doctorId from token (CurrentUser)
 */

// ==================== LỊCH HẸN CỦA BÁC SĨ ====================

export interface DoctorAppointmentQuery {
  date?: string;
  shift?: string;
  status?: string;
  page?: number;
  size?: number;
}

export const doctorApi = {
  // Lấy danh sách lịch hẹn của bác sĩ (tự động lấy doctorId từ token)
  getMyAppointments: (params?: DoctorAppointmentQuery) => {
    return request.get<any>("/doctor/appointments", { params });
  },

  // Bắt đầu khám bệnh
  startAppointment: (appointmentId: number) => {
    return request.post<any>(`/doctor/appointments/${appointmentId}/start`);
  },

  // Hoàn thành khám bệnh
  finishAppointment: (appointmentId: number) => {
    return request.post<any>(`/doctor/appointments/${appointmentId}/finish`);
  },

  // ==================== HỒ SƠ KHÁM / ĐIỀU TRỊ ====================

  // Tạo hồ sơ khám mới
  createMedicalRecord: (data: {
    patientId: number;
    appointmentId?: number;
    diagnosis: string;
    symptoms: string;
    notes?: string;
  }) => {
    return request.post<MedicalRecord>("/doctor/medical-records", data);
  },

  // Lấy danh sách hồ sơ khám
  getMedicalRecords: (params?: {
    date?: string;
    patientId?: number;
    page?: number;
    size?: number;
  }) => {
    return request.get<any>("/doctor/medical-records", { params });
  },

  // Tạo kế hoạch điều trị
  createTreatmentPlan: (data: {
    medicalRecordId: number;
    patientId: number;
    description: string;
    estimatedCost?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
  }) => {
    return request.post<TreatmentPlan>("/doctor/treatment-plans", data);
  },

  // Cập nhật kế hoạch điều trị
  updateTreatmentPlan: (id: number, data: Partial<TreatmentPlan>) => {
    return request.put<TreatmentPlan>(`/doctor/treatment-plans/${id}`, data);
  },

  // ==================== ĐƠN THUỐC (BÁC SĨ KÊ) ====================

  // Tạo đơn thuốc
  createPrescription: (data: {
    patientId: number;
    medicalRecordId?: number;
    appointmentId?: number;
    notes?: string;
    items: Array<{
      medicineId: number;
      quantity: number;
      dosage: string;
      instructions: string;
    }>;
  }) => {
    return request.post<Prescription>("/doctor/prescriptions", data);
  },

  // Cập nhật đơn thuốc
  updatePrescription: (id: number, data: Partial<Prescription>) => {
    return request.put<Prescription>(`/doctor/prescriptions/${id}`, data);
  },
};
