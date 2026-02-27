export interface MedicineStockSummary {
  medicineId: string;
  medicineCode: string;
  medicineName: string;
  unit: string;
  totalRemaining: number;
  totalBatches: number;
  nearestExpiryDate: string | null;
  expiredBatchesCount: number;
  nearExpiryBatchesCount: number;
  lowStock: boolean;
  hasExpired: boolean;
  hasNearExpiry: boolean;
}

export interface BatchExpiryWarning {
  batchId: string;
  medicineId: string;
  medicineCode: string;
  medicineName: string;
  batchNo: string;
  importDate: string;
  expiryDate: string;
  quantityRemaining: number;
  warningType: "EXPIRED" | "NEAR_EXPIRY";
}

export interface StockSummaryParams {
  nearDays?: number;
  lowStockThreshold?: number;
  activeOnly?: boolean;
}

export interface ExpiryWarningsParams {
  nearDays?: number;
}
