/**
 * Expense Types
 */

// Expense Category as const object (compatible with erasableSyntaxOnly)
export const ExpenseCategory = {
  RENT: "RENT",
  SALARY: "SALARY",
  ELECTRIC: "ELECTRIC",
  WATER: "WATER",
  SUPPLIES: "SUPPLIES",
  OTHER: "OTHER",
} as const;

// Export type from the const object
export type ExpenseCategory =
  (typeof ExpenseCategory)[keyof typeof ExpenseCategory];

// Expense Category Labels
export const ExpenseCategoryLabels: Record<ExpenseCategory, string> = {
  [ExpenseCategory.RENT]: "Tiền thuê",
  [ExpenseCategory.SALARY]: "Lương",
  [ExpenseCategory.ELECTRIC]: "Điện",
  [ExpenseCategory.WATER]: "Nước",
  [ExpenseCategory.SUPPLIES]: "Vật tư",
  [ExpenseCategory.OTHER]: "Khác",
};

// Expense Response
export interface Expense {
  id: string;
  expenseCode: string;
  category: ExpenseCategory;
  name: string;
  amount: number;
  expenseDate: string; // ISO date string
  note?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// Create Expense Request
export interface CreateExpenseRequest {
  category: ExpenseCategory;
  name: string;
  amount: number;
  expenseDate: string; // ISO date string "YYYY-MM-DD"
  note?: string;
}

// Update Expense Request
export interface UpdateExpenseRequest {
  category?: ExpenseCategory;
  name?: string;
  amount?: number;
  expenseDate?: string; // ISO date string "YYYY-MM-DD"
  note?: string;
}

// Expense Search Parameters
export interface ExpenseSearchParams {
  keyword?: string;
  category?: ExpenseCategory;
  fromDate?: string; // ISO date string "YYYY-MM-DD"
  toDate?: string; // ISO date string "YYYY-MM-DD"
  page?: number;
  size?: number;
}
