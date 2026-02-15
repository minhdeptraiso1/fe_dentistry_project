import request from "@/utils/request";
import type {
  MedicalRecord,
  CreateMedicalRecordRequest,
  UpdateMedicalRecordRequest,
  MedicalRecordSearchRequest,
  PageResponse,
} from "@/types";

export const medicalRecordApi = {
  /**
   * Search medical records with pagination
   * GET /medical-records?keyword=&patientId=&doctorId=&fromDate=&toDate=&page=&size=
   */
  search(params?: MedicalRecordSearchRequest) {
    return request.get<PageResponse<MedicalRecord>>("/medical-records", {
      params,
    });
  },

  /**
   * Get medical record by ID
   * GET /medical-records/{id}
   */
  getById(id: string) {
    return request.get<MedicalRecord>(`/medical-records/${id}`);
  },

  /**
   * Create new medical record
   * POST /medical-records
   */
  create(data: CreateMedicalRecordRequest) {
    return request.post<MedicalRecord>("/medical-records", data);
  },

  /**
   * Update medical record
   * PUT /medical-records/{id}
   */
  update(id: string, data: UpdateMedicalRecordRequest) {
    return request.put<MedicalRecord>(`/medical-records/${id}`, data);
  },

  /**
   * Delete medical record (soft delete - ADMIN only)
   * DELETE /medical-records/{id}
   */
  delete(id: string) {
    return request.delete<void>(`/medical-records/${id}`);
  },
};
