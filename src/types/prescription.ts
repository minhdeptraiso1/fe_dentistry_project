/**
 * Prescription Types
 */

// Enums
export type PrescriptionStatus = "DRAFT" | "ISSUED" | "DISPENSED" | "CANCELLED";

// Prescription Item
export interface PrescriptionItem {
  id: string;
  medicineId: string;
  medicineCode: string;
  medicineName: string;
  unit?: string;
  dosage?: string;
  quantity: number;
  note?: string;
}

export interface CreatePrescriptionItemRequest {
  medicineId: string;
  quantity: number;
  dosage?: string;
  note?: string;
}

// Prescription
export interface Prescription {
  id: string;
  prescriptionCode: string;
  medicalRecordId: string;
  patientId: string;
  patientCode: string;
  patientName: string;
  doctorId: string;
  doctorUsername: string;
  status: PrescriptionStatus;
  note?: string;
  items: PrescriptionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePrescriptionRequest {
  medicalRecordId: string;
  note?: string;
  items?: CreatePrescriptionItemRequest[];
}

export interface UpdatePrescriptionRequest {
  note?: string;
  status?: PrescriptionStatus;
  items?: CreatePrescriptionItemRequest[];
}

export interface DispenseRequest {
  note?: string;
}

// Search params
export interface PrescriptionSearchParams {
  medicalRecordId?: string;
  patientId?: string;
  status?: PrescriptionStatus;
  page?: number;
  size?: number;
}
