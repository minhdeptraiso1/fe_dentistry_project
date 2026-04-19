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

export interface YearMonthParams {
  year: number;
  month: number;
}

export interface MedicineProcurementSuggestion {
  medicineName?: string;
  suggestion?: string;
  [key: string]: any;
}

export interface DashboardAiInsightResponse {
  periodLabel: string;
  executiveSummary: string;
  highlights: string[];
  risks: string[];
  recommendations: string[];
  dataQualityNotes: string[];
  procurementSuggestions: MedicineProcurementSuggestion[];
}

export interface DashboardAiContextResponse {
  periodLabel: string;
  growthMetrics: Record<string, any>;
  procurementSuggestions?: MedicineProcurementSuggestion[];
  [key: string]: any;
}
