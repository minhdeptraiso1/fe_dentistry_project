import request from "@/utils/request";
import type {
  ServiceCatalog,
  CreateServiceRequest,
  UpdateServiceRequest,
  ServiceSearchRequest,
} from "@/types/service";
import type { PageResponse } from "@/types";

export const serviceApi = {
  /**
   * Search services with filters
   */
  search(params: ServiceSearchRequest) {
    return request.get<PageResponse<ServiceCatalog>>("/services", { params });
  },

  /**
   * Get service by ID
   */
  getById(id: string) {
    return request.get<ServiceCatalog>(`/services/${id}`);
  },

  /**
   * Create new service
   */
  create(data: CreateServiceRequest) {
    return request.post<ServiceCatalog>("/services", data);
  },

  /**
   * Update service
   */
  update(id: string, data: UpdateServiceRequest) {
    return request.put<ServiceCatalog>(`/services/${id}`, data);
  },

  /**
   * Delete service
   */
  delete(id: string) {
    return request.delete<void>(`/services/${id}`);
  },
};
