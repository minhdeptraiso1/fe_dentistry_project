import request from "@/utils/request";
import type { LoginRequest, LoginResponse, User, ApiResponse } from "@/types";

export const authApi = {
  // Login
  login(data: LoginRequest) {
    return request.post<ApiResponse<LoginResponse>>("/auth/login", data);
  },

  // Register
  register(data: any) {
    return request.post<ApiResponse>("/auth/register", data);
  },

  // Logout
  logout() {
    return request.post<ApiResponse>("/auth/logout");
  },

  // Get current user info
  getCurrentUser() {
    return request.get<User>("/users/me");
  },

  // Refresh token
  refreshToken(refreshToken: string) {
    return request.post<ApiResponse>("/auth/refresh", { refreshToken });
  },

  // Change password
  changePassword(data: { oldPassword: string; newPassword: string }) {
    return request.post<ApiResponse>("/auth/change-password", data);
  },
};
