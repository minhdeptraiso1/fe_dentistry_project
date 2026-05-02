import request from "@/utils/request";
import type { LoginRequest, LoginResponse, User, ApiResponse } from "@/types";
import type { RegisterPatientRequest } from "@/types/patient";

export const authApi = {
  // Login
  login(data: LoginRequest) {
    return request.post<ApiResponse<LoginResponse>>("/auth/login", data);
  },

  // Register
  register(data: any) {
    return request.post<ApiResponse>("/auth/register", data);
  },

  // Register Patient
  registerPatient(data: RegisterPatientRequest) {
    return request.post<ApiResponse>("/auth/register-patient", data);
  },

  // Logout
  logout(refreshToken: string) {
    return request.post<ApiResponse>("/auth/logout", null, {
      params: { refreshToken },
    });
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

  // Forgot password - Request OTP
  requestForgotPasswordOtp(data: { identifier: string }) {
    return request.post<string>("/auth/forgot-password/request-otp", data);
  },

  // Forgot password - Reset with OTP
  resetPasswordWithOtp(data: {
    identifier: string;
    otp: string;
    newPassword: string;
  }) {
    return request.post<string>("/auth/forgot-password/reset-with-otp", data);
  },

  // Admin reset password
  adminResetPassword(userId: string, data: { newPassword: string }) {
    return request.put<string>(`/users/${userId}/admin-reset-password`, data);
  },
};
