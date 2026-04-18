import request from "@/utils/request";
import type {
  Patient,
  CreatePatientRequest,
  UpdatePatientRequest,
  PatientSearchParams,
  PageResponse,
} from "@/types";
import type {
  PatientResponse,
  ActiveDoctorResponse,
  InvoiceMyResponse,
  InvoiceDetailResponse,
  MedicalRecordResponse,
  PrescriptionResponse,
} from "@/types/patient";

export const patientApi = {
  /**
   * Search patients with pagination
   * GET /patients?keyword=&phone=&page=&size=
   */
  search(params?: PatientSearchParams) {
    return request.get<PageResponse<Patient>>("/patients", {
      params,
    });
  },

  /**
   * Get patient by ID
   * GET /patients/{id}
   */
  getById(id: string) {
    return request.get<Patient>(`/patients/${id}`);
  },

  /**
   * Create new patient
   * POST /patients
   */
  create(data: CreatePatientRequest) {
    return request.post<Patient>("/patients", data);
  },

  /**
   * Update patient
   * PUT /patients/{id}
   */
  update(id: string, data: UpdatePatientRequest) {
    return request.put<Patient>(`/patients/${id}`, data);
  },

  /**
   * Delete patient (soft delete)
   * DELETE /patients/{id}
   */
  delete(id: string) {
    return request.delete<void>(`/patients/${id}`);
  },

  // ===== Patient Personal Endpoints =====

  /**
   * Get patient's own profile
   * GET /patients/me
   */
  getMyProfile() {
    return request.get<PatientResponse>("/patients/me");
  },

  /**
   * Get active doctors for patient booking screen
   * GET /patients/me/active-doctors
   */
  getActiveDoctors() {
    return request.get<ActiveDoctorResponse[]>("/patients/me/active-doctors");
  },

  /**
   * Get patient's invoices
   * GET /invoices/my
   */
  getMyInvoices() {
    return request.get<InvoiceMyResponse[]>("/invoices/my");
  },

  /**
   * Get patient's invoice detail
   * GET /invoices/my/{id}
   */
  getMyInvoiceDetail(id: string) {
    return request.get<InvoiceDetailResponse>(`/invoices/my/${id}`);
  },

  /**
   * Get patient's medical records
   * GET /medical-records/my
   */
  getMyMedicalRecords() {
    return request.get<MedicalRecordResponse[]>("/medical-records/my");
  },

  /**
   * Get patient's medical record detail
   * GET /medical-records/my/{id}
   */
  getMyMedicalRecordDetail(id: string) {
    return request.get<MedicalRecordResponse>(`/medical-records/my/${id}`);
  },

  /**
   * Get patient's prescriptions
   * GET /prescriptions/my
   */
  getMyPrescriptions() {
    return request.get<PrescriptionResponse[]>("/prescriptions/my");
  },

  /**
   * Get patient's prescription detail
   * GET /prescriptions/my/{id}
   */
  getMyPrescriptionDetail(id: string) {
    return request.get<PrescriptionResponse>(`/prescriptions/my/${id}`);
  },
};
