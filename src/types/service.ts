// Service Catalog Types - matching backend DTOs

export type ServiceType = "SINGLE" | "PACKAGE";

export interface ServiceCatalog {
  id: string;
  code: string;
  name: string;
  type: ServiceType;
  category?: string;
  description?: string;
  basePrice: number;
  unit?: string; // VD: "lần", "răng", "ca"
  durationMin?: number; // Thời gian dự kiến (phút)
  active: boolean;
  steps?: ServiceStep[]; // Chỉ có khi type=PACKAGE
  createdAt: string;
  updatedAt: string;
}

export interface ServiceStep {
  id: string;
  stepNo: number;
  stepName: string;
  stepDesc?: string;
  price: number;
  quantity: number;
}

export interface CreateServiceRequest {
  name: string; // required
  type: ServiceType; // required
  category?: string;
  description?: string;
  basePrice: number; // required
  unit?: string;
  durationMin?: number;
  steps?: CreateServiceStepRequest[]; // Chỉ dùng khi type=PACKAGE
}

export interface CreateServiceStepRequest {
  stepNo: number;
  stepName: string;
  stepDesc?: string;
  price: number;
  quantity: number;
}

export interface UpdateServiceRequest {
  name?: string;
  category?: string;
  description?: string;
  basePrice?: number;
  unit?: string;
  durationMin?: number;
  active?: boolean;
  steps?: CreateServiceStepRequest[]; // Update theo kiểu replace toàn bộ steps
}

export interface ServiceSearchRequest {
  keyword?: string; // Search by name or code
  type?: ServiceType;
  category?: string;
  active?: boolean;
  page?: number;
  size?: number;
}
