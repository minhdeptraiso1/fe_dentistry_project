/**
 * Medicine Types
 */

// Medicine
export interface Medicine {
  id: string;
  code: string;
  name: string;
  ingredient?: string;
  unit?: string;
  usageGuide?: string;
  active: boolean;
  salePrice?: number;
  stockRemaining?: number;
}

export interface CreateMedicineRequest {
  name: string;
  ingredient?: string;
  unit?: string;
  usageGuide?: string;
}

export interface SetMedicinePriceRequest {
  newPrice: number;
  reason?: string;
}

// Medicine Batch
export interface MedicineBatch {
  id: string;
  medicineId: string;
  medicineCode: string;
  medicineName: string;
  batchNo?: string;
  importDate: string; // ISO date string
  expiryDate?: string; // ISO date string
  importPrice: number;
  quantityIn: number;
  quantityRemaining: number;
}

export interface ImportBatchRequest {
  medicineId: string;
  batchNo?: string;
  importDate: string; // ISO date string "YYYY-MM-DD"
  expiryDate?: string; // ISO date string "YYYY-MM-DD"
  importPrice: number;
  quantityIn: number;
}

// Medicine Price History
export interface MedicinePriceHistory {
  id: string;
  medicineId: string;
  oldPrice?: number;
  newPrice: number;
  reason?: string;
  changedBy: string;
  changedAt: string;
}

// Search params
export interface MedicineSearchParams {
  keyword?: string;
  active?: boolean;
  page?: number;
  size?: number;
}
