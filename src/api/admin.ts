import request from "@/utils/request";
import type { User, Service, Medicine } from "@/types";

/**
 * Admin-specific APIs
 * Prefix: /admin/*
 */

// ==================== QUẢN TRỊ NGƯỜI DÙNG ====================

export const adminApi = {
  // Lấy danh sách người dùng
  getUsers: (params?: {
    role?: string;
    status?: string;
    search?: string;
    page?: number;
    size?: number;
  }) => {
    return request<any>({
      url: "/admin/users",
      method: "get",
      params,
    });
  },

  // Tạo người dùng mới
  createUser: (data: {
    username: string;
    email: string;
    password: string;
    fullName: string;
    role: "ADMIN" | "DOCTOR" | "CASHIER";
    phone?: string;
    specialization?: string;
  }) => {
    return request<User>({
      url: "/admin/users",
      method: "post",
      data,
    });
  },

  // Cập nhật người dùng
  updateUser: (id: number, data: Partial<User>) => {
    return request<User>({
      url: `/admin/users/${id}`,
      method: "put",
      data,
    });
  },

  // Xóa người dùng
  deleteUser: (id: number) => {
    return request<void>({
      url: `/admin/users/${id}`,
      method: "delete",
    });
  },

  // ==================== CẤU HÌNH CÔNG SUẤT BÁC SĨ ====================

  // Cập nhật công suất bác sĩ (set quota theo ngày/ca)
  updateDoctorCapacity: (data: {
    doctorId: number;
    date: string;
    shift: string;
    maxAppointments: number;
  }) => {
    return request<any>({
      url: "/admin/doctor-capacities",
      method: "put",
      data,
    });
  },

  // ==================== DANH MỤC DỊCH VỤ ====================

  // Tạo dịch vụ mới
  createService: (data: {
    name: string;
    description?: string;
    price: number;
    duration?: number;
    category?: string;
  }) => {
    return request<Service>({
      url: "/admin/services",
      method: "post",
      data,
    });
  },

  // Cập nhật dịch vụ
  updateService: (id: number, data: Partial<Service>) => {
    return request<Service>({
      url: `/admin/services/${id}`,
      method: "put",
      data,
    });
  },

  // Xóa dịch vụ
  deleteService: (id: number) => {
    return request<void>({
      url: `/admin/services/${id}`,
      method: "delete",
    });
  },

  // Lấy danh sách dịch vụ (tất cả roles có thể đọc)
  getServices: (params?: {
    category?: string;
    search?: string;
    page?: number;
    size?: number;
  }) => {
    return request<any>({
      url: "/admin/services",
      method: "get",
      params,
    });
  },

  // ==================== THUỐC: SET GIÁ BÁN ====================

  // Cập nhật giá bán thuốc
  updateMedicineSalePrice: (medicineId: number, salePrice: number) => {
    return request<Medicine>({
      url: `/admin/medicines/${medicineId}/sale-price`,
      method: "put",
      data: { salePrice },
    });
  },

  // Lấy lịch sử giá thuốc
  getMedicinePriceHistory: (medicineId: number) => {
    return request<any>({
      url: `/admin/medicines/${medicineId}/price-histories`,
      method: "get",
    });
  },

  // ==================== CHI PHÍ ====================

  // Lấy danh sách chi phí
  getExpenses: (params?: {
    startDate?: string;
    endDate?: string;
    category?: string;
    page?: number;
    size?: number;
  }) => {
    return request<any>({
      url: "/admin/expenses",
      method: "get",
      params,
    });
  },

  // Tạo chi phí mới
  createExpense: (data: {
    description: string;
    amount: number;
    category: string;
    date: string;
    notes?: string;
  }) => {
    return request<any>({
      url: "/admin/expenses",
      method: "post",
      data,
    });
  },

  // Cập nhật chi phí
  updateExpense: (id: number, data: any) => {
    return request<any>({
      url: `/admin/expenses/${id}`,
      method: "put",
      data,
    });
  },

  // Xóa chi phí
  deleteExpense: (id: number) => {
    return request<void>({
      url: `/admin/expenses/${id}`,
      method: "delete",
    });
  },

  // ==================== DASHBOARD/REPORT ====================

  // Lấy tổng quan dashboard
  getDashboardOverview: (params?: { startDate?: string; endDate?: string }) => {
    return request<any>({
      url: "/admin/dashboard/overview",
      method: "get",
      params,
    });
  },

  // Lấy báo cáo doanh thu
  getRevenueReport: (params?: {
    startDate?: string;
    endDate?: string;
    groupBy?: string;
  }) => {
    return request<any>({
      url: "/admin/dashboard/revenue",
      method: "get",
      params,
    });
  },

  // Lấy báo cáo hiệu suất bác sĩ
  getDoctorPerformanceReport: (params?: {
    startDate?: string;
    endDate?: string;
  }) => {
    return request<any>({
      url: "/admin/dashboard/doctor-performance",
      method: "get",
      params,
    });
  },
};
