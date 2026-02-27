import request from "@/utils/request";
import type {
  Expense,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  ExpenseSearchParams,
} from "@/types/expense";
import type { PageResponse } from "@/types";

export const expenseApi = {
  /**
   * Create expense
   * Roles: ADMIN only
   */
  create(data: CreateExpenseRequest) {
    return request.post<Expense>("/expenses", data);
  },

  /**
   * Get expense by ID
   * Roles: ADMIN
   */
  getById(id: string) {
    return request.get<Expense>(`/expenses/${id}`);
  },

  /**
   * Search expenses
   * Roles: ADMIN
   */
  search(params: ExpenseSearchParams) {
    return request.get<PageResponse<Expense>>("/expenses", { params });
  },

  /**
   * Update expense
   * Roles: ADMIN
   */
  update(id: string, data: UpdateExpenseRequest) {
    return request.put<Expense>(`/expenses/${id}`, data);
  },

  /**
   * Delete expense (soft delete)
   * Roles: ADMIN
   */
  delete(id: string) {
    return request.delete<void>(`/expenses/${id}`);
  },
};
