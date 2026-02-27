import request from "@/utils/request";
import type {
  MedicineStockSummary,
  BatchExpiryWarning,
  StockSummaryParams,
  ExpiryWarningsParams,
} from "@/types/inventory";

export const inventoryApi = {
  stockSummary(params?: StockSummaryParams) {
    return request.get<MedicineStockSummary[]>(
      "/inventory-reports/stock-summary",
      { params },
    );
  },

  expiryWarnings(params?: ExpiryWarningsParams) {
    return request.get<BatchExpiryWarning[]>(
      "/inventory-reports/expiry-warnings",
      { params },
    );
  },
};
