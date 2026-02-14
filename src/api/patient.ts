import request from "@/utils/request";
import type {
  Patient,
  CreatePatientRequest,
  UpdatePatientRequest,
  PatientSearchParams,
  PageResponse,
} from "@/types";

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
};
