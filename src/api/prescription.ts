import request from "@/utils/request";
import type {
  Prescription,
  CreatePrescriptionRequest,
  UpdatePrescriptionRequest,
  DispenseRequest,
  PrescriptionSearchParams,
} from "@/types/prescription";
import type { PageResponse } from "@/types";

export const prescriptionApi = {
  /**
   * Create prescription
   * Roles: DOCTOR, ADMIN
   */
  create(data: CreatePrescriptionRequest) {
    return request.post<Prescription>("/prescriptions", data);
  },

  /**
   * Get prescription detail
   * Roles: ADMIN, DOCTOR, CASHIER
   */
  getById(id: string) {
    return request.get<Prescription>(`/prescriptions/${id}`);
  },

  /**
   * Search prescriptions
   * Roles: ADMIN, DOCTOR, CASHIER
   */
  search(params: PrescriptionSearchParams) {
    return request.get<PageResponse<Prescription>>("/prescriptions", {
      params,
    });
  },

  /**
   * Update prescription
   * Replace items if provided
   * Roles: DOCTOR, ADMIN
   */
  update(id: string, data: UpdatePrescriptionRequest) {
    return request.put<Prescription>(`/prescriptions/${id}`, data);
  },

  /**
   * Issue prescription (DRAFT -> ISSUED)
   * Roles: DOCTOR, ADMIN
   */
  issue(id: string) {
    return request.put<Prescription>(`/prescriptions/${id}`, {
      status: "ISSUED",
    });
  },

  /**
   * Dispense prescription (deduct stock FIFO)
   * Roles: CASHIER, ADMIN
   */
  dispense(id: string, data?: DispenseRequest) {
    return request.post<Prescription>(`/prescriptions/${id}/dispense`, data);
  },

  /**
   * Cancel prescription
   * Roles: DOCTOR, ADMIN
   */
  cancel(id: string, note?: string) {
    return request.post<void>(`/prescriptions/${id}/cancel`, null, {
      params: { note },
    });
  },
};
