/**
 * Patient Types
 */

export interface PatientResponse {
  id: string;
  patientCode: string;
  fullName: string;
  phone: string;
  dob?: string;
  gender?: "MALE" | "FEMALE" | "OTHER" | "Nam" | "Nữ" | "Nu";
  address?: string;
  note?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterPatientRequest {
  username: string;
  password: string;
  email: string;
  patientCode?: string;
  fullName?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  phone?: string;
  dob?: string;
  address?: string;
}

export interface ActiveDoctorResponse {
  id: string;
  name: string;
  img?: string;
}

export interface InvoiceItemResponse {
  id: string;
  serviceId: string;
  serviceCode: string;
  itemName: string;
  serviceType: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  lineTotal: number;
  note?: string;
}

export interface InvoiceMyResponse {
  id: string;
  invoiceCode: string;
  patientId: string;
  patientCode: string;
  patientName: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  issuedAt: string;
  items?: InvoiceItemResponse[];
}

export interface InvoiceDetailResponse extends InvoiceMyResponse {
  items: InvoiceItemResponse[];
}

export interface MedicalRecordResponse {
  id: string;
  recordCode: string;
  patientId: string;
  patientName: string;
  doctorUsername: string;
  visitDate: string;
  symptom?: string;
  diagnosis?: string;
  note?: string;
  createdAt: string;
}

export interface PrescriptionResponse {
  id: string;
  prescriptionCode: string;
  medicalRecordId: string;
  patientId: string;
  patientCode?: string;
  patientName: string;
  doctorId?: string;
  doctorUsername: string;
  status: string;
  note?: string;
  items?: PrescriptionItemResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionItemResponse {
  id: string;
  medicineId: string;
  medicineCode: string;
  medicineName: string;
  unit: string;
  dosage?: string;
  quantity: number;
  note?: string;
}
