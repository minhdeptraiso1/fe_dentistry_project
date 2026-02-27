import request from "@/utils/request";
import type {
  DashboardSummary,
  TimePointAmount,
  CategoryAmount,
  DateRangeParams,
} from "@/types/dashboard";

export const dashboardApi = {
  summary(params: DateRangeParams) {
    return request.get<DashboardSummary>("/dashboard/summary", { params });
  },

  revenueByDay(params: DateRangeParams) {
    return request.get<TimePointAmount[]>("/dashboard/revenue-by-day", {
      params,
    });
  },

  revenueByServiceType(params: DateRangeParams) {
    return request.get<CategoryAmount[]>("/dashboard/revenue-by-service-type", {
      params,
    });
  },

  medicineImportCostByDay(params: DateRangeParams) {
    return request.get<TimePointAmount[]>(
      "/dashboard/medicine-import-cost-by-day",
      { params },
    );
  },

  medicineDispensedByDay(params: DateRangeParams) {
    return request.get<TimePointAmount[]>(
      "/dashboard/medicine-dispensed-by-day",
      { params },
    );
  },

  topDispensedMedicines(params: DateRangeParams) {
    return request.get<CategoryAmount[]>("/dashboard/top-dispensed-medicines", {
      params,
    });
  },
};
