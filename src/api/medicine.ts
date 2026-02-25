import request from "@/utils/request";
import type {
  Medicine,
  CreateMedicineRequest,
  SetMedicinePriceRequest,
  MedicineBatch,
  ImportBatchRequest,
  MedicinePriceHistory,
  MedicineSearchParams,
} from "@/types/medicine";
import type { PageResponse } from "@/types";

export const medicineApi = {
  /**
   * Create medicine
   * Roles: ADMIN only
   */
  create(data: CreateMedicineRequest) {
    return request.post<Medicine>("/medicines", data);
  },

  /**
   * Get medicine by ID
   * Roles: ADMIN, CASHIER, DOCTOR
   */
  getById(id: string) {
    return request.get<Medicine>(`/medicines/${id}`);
  },

  /**
   * Search medicines
   * Roles: ADMIN, CASHIER, DOCTOR
   */
  search(params: MedicineSearchParams) {
    return request.get<PageResponse<Medicine>>("/medicines", { params });
  },

  /**
   * Import medicine batch
   * FIFO will use expiryDate then importDate
   * Roles: ADMIN, CASHIER
   */
  importBatch(data: ImportBatchRequest) {
    return request.post<MedicineBatch>("/medicines/batches", data);
  },

  /**
   * Set medicine sale price
   * Roles: ADMIN only
   */
  setSalePrice(id: string, data: SetMedicinePriceRequest) {
    return request.put<Medicine>(`/medicines/${id}/sale-price`, data);
  },

  /**
   * Get medicine price history
   * Roles: ADMIN, CASHIER
   */
  priceHistory(id: string, params?: { page?: number; size?: number }) {
    return request.get<PageResponse<MedicinePriceHistory>>(
      `/medicines/${id}/price-histories`,
      { params },
    );
  },
};
