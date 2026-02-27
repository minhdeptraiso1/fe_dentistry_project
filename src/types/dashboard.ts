export interface DashboardSummary {
  grossRevenue: number;
  discountAmount: number;
  netRevenue: number;
  paidAmount: number;
  unpaidAmount: number;
  operatingExpenses: number;
  medicineImportCost: number;
  totalCosts: number;
  estimatedProfit: number;
}

export interface TimePointAmount {
  date: string;
  amount: number;
}

export interface CategoryAmount {
  category: string;
  amount: number;
}

export interface DateRangeParams {
  from: string;
  to: string;
}
