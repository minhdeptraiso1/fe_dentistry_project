// Treatment Plan Types - matching backend DTOs

export type TreatmentPlanStatus =
  | "DRAFT"
  | "APPROVED"
  | "IN_PROGRESS"
  | "DONE"
  | "CANCELLED";
export type TreatmentItemStatus = "PLANNED" | "DONE" | "CANCELLED";

export interface TreatmentPlan {
  id: string;
  planCode: string;

  medicalRecordId: string;
  patientId: string;
  patientCode: string;
  patientName: string;

  doctorId: string;
  doctorUsername: string;

  status: TreatmentPlanStatus;
  note?: string;

  totalAmount: number;
  discountAmount: number;
  finalAmount: number;

  items: TreatmentItem[];

  createdAt: string;
  updatedAt: string;
}

export interface TreatmentItem {
  id: string;
  serviceId: string;
  serviceCode: string;
  itemName: string;
  serviceType: string; // "SINGLE" | "PACKAGE"
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  lineTotal: number;
  toothNo?: string; // Số răng (VD: "11", "21", "36")
  toothSurface?: string; // Mặt răng (VD: "M", "D", "O", "B", "L")
  status: TreatmentItemStatus;
  note?: string;
}

export interface CreateTreatmentPlanRequest {
  medicalRecordId: string; // required
  note?: string;
  items?: CreateTreatmentItemRequest[];
}

export interface CreateTreatmentItemRequest {
  serviceId: string; // required
  quantity?: number; // default 1
  unitPrice?: number; // null => lấy basePrice của service
  discountAmount?: number; // default 0
  toothNo?: string;
  toothSurface?: string;
  note?: string;
}

export interface UpdateTreatmentPlanRequest {
  note?: string;
  status?: TreatmentPlanStatus; // Theo rule workflow
  items?: CreateTreatmentItemRequest[]; // Replace toàn bộ nếu gửi
}

export interface TreatmentPlanSearchRequest {
  patientId?: string;
  status?: TreatmentPlanStatus;
  page?: number;
  size?: number;
}
