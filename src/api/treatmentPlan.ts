import request from "@/utils/request";
import type {
  TreatmentPlan,
  CreateTreatmentPlanRequest,
  UpdateTreatmentPlanRequest,
} from "@/types/treatmentPlan";
import type { PageResponse } from "@/types";

export const treatmentPlanApi = {
  /**
   * Create treatment plan
   */
  create(data: CreateTreatmentPlanRequest) {
    return request.post<TreatmentPlan>("/treatment-plans", data);
  },

  /**
   * Get treatment plan by ID
   */
  getById(id: string) {
    return request.get<TreatmentPlan>(`/treatment-plans/${id}`);
  },

  /**
   * List treatment plans by patient
   */
  listByPatient(patientId: string, params?: { page?: number; size?: number }) {
    return request.get<PageResponse<TreatmentPlan>>(
      `/treatment-plans/by-patient/${patientId}`,
      { params },
    );
  },

  /**
   * Update treatment plan
   */
  update(id: string, data: UpdateTreatmentPlanRequest) {
    return request.put<TreatmentPlan>(`/treatment-plans/${id}`, data);
  },

  /**
   * Delete treatment plan
   */
  delete(id: string) {
    return request.delete<void>(`/treatment-plans/${id}`);
  },

  /**
   * Mark treatment item as DONE
   */
  markItemDone(planId: string, itemId: string) {
    return request.post<TreatmentPlan>(
      `/treatment-plans/${planId}/items/${itemId}/done`,
    );
  },
};
