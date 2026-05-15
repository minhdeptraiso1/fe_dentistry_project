import request from "@/utils/request";
import type {
  User,
  UserDetail,
  UserSearchRequest,
  CreateUserRequest,
  UpdateUserRequest,
  ChangePasswordRequest,
} from "@/types/user";
import type { PageResponse } from "@/types";

export const userApi = {
  // Get current user
  getMe(): Promise<User> {
    return request.get("/users/me");
  },

  // Search users with pagination
  search(
    params: UserSearchRequest,
    page: number = 0,
    size: number = 10,
  ): Promise<PageResponse<User>> {
    return request.get("/users", {
      params: {
        ...params,
        page,
        size,
      },
    });
  },

  // Get user by ID (returns UserDetail with audit fields)
  getById(id: string): Promise<UserDetail> {
    return request.get(`/users/${id}`);
  },

  // Get user by patient ID
  getByPatientId(patientId: string): Promise<UserDetail> {
    return request.get(`/users/by-patient/${patientId}`);
  },

  // Create new user
  create(data: CreateUserRequest): Promise<User> {
    return request.post("/users", data);
  },

  // Update user
  update(id: string, data: UpdateUserRequest): Promise<User> {
    return request.put(`/users/${id}`, data);
  },

  // Toggle user enabled status
  toggleEnabled(id: string, enabled: boolean): Promise<User> {
    return request.put(`/users/${id}`, { enabled });
  },

  // Change password
  changePassword(id: string, data: ChangePasswordRequest): Promise<void> {
    return request.put(`/users/${id}/password`, data);
  },

  // Delete user
  delete(id: string): Promise<void> {
    return request.delete(`/users/${id}`);
  },
};
