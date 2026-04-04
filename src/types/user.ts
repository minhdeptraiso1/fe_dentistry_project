export const UserRole = {
  ADMIN: "ADMIN",
  DOCTOR: "DOCTOR",
  CASHIER: "CASHIER",
  PATIENT: "PATIENT",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  img?: string;
  role: UserRole;
  enabled: boolean;
}

export interface UserDetail extends User {
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface UserSearchRequest {
  keyword?: string;
  role?: UserRole;
  enabled?: boolean;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  name: string;
  img?: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  password?: string;
  name?: string;
  img?: string;
  role?: UserRole;
  enabled?: boolean;
}

export interface ChangePasswordRequest {
  oldPassword?: string;
  newPassword: string;
}

export const UserRoleLabels: Record<UserRole, string> = {
  [UserRole.ADMIN]: "Quản trị viên",
  [UserRole.DOCTOR]: "Bác sĩ",
  [UserRole.CASHIER]: "Nhân viên",
  [UserRole.PATIENT]: "Bệnh nhân",
};
