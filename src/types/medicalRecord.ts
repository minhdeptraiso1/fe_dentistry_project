// Medical Record Types - matching backend DTOs

export interface MedicalRecord {
  id: string;
  recordCode: string;
  patientId: string;
  patientCode: string;
  patientName: string;
  doctorId: string;
  doctorUsername: string;
  visitDate: string; // ISO 8601 timestamp
  symptom?: string;
  diagnosis?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMedicalRecordRequest {
  patientId: string; // required
  doctorId: string; // required
  visitDate?: string; // ISO 8601, defaults to now if not provided
  symptom?: string;
  diagnosis?: string;
  note?: string;
}

export interface UpdateMedicalRecordRequest {
  doctorId?: string; // optional - allow changing doctor
  visitDate?: string;
  symptom?: string;
  diagnosis?: string;
  note?: string;
}

export interface MedicalRecordSearchRequest {
  keyword?: string;
  patientId?: string;
  doctorId?: string;
  fromDate?: string; // ISO 8601
  toDate?: string; // ISO 8601
  page?: number;
  size?: number;
}
