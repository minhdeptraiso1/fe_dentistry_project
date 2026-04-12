// Common Types
export interface ApiResponse<T = any> {
  data: T;
  message: string;
  status: number;
  success: boolean;
}

export interface PaginationParams {
  page: number;
  size: number;
  total?: number;
}

export interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    offset: number;
  };
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// User & Auth Types
export interface User {
  id?: string; // Optional - not always returned
  username: string;
  email: string;
  fullName?: string; // Optional - not in /users/me response
  phone?: string;
  role: "ADMIN" | "DOCTOR" | "CASHIER" | "PATIENT"; // Match backend UserRole enum
  enabled?: boolean; // From /users/me response
  avatar?: string;
  createdAt?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user?: User;
  // Backend might return user data directly
  id?: string;
  username?: string;
  email?: string;
  fullName?: string;
  role?: string;
}

// Patient Types
export interface Patient {
  id: string;
  patientCode: string;
  fullName: string;
  gender?: string;
  phone?: string;
  dob?: string; // LocalDate from backend
  address?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePatientRequest {
  fullName: string;
  gender?: string;
  phone?: string;
  dob?: string;
  address?: string;
  note?: string;
}

export interface UpdatePatientRequest {
  fullName?: string;
  gender?: string;
  phone?: string;
  dob?: string;
  address?: string;
  note?: string;
}

export interface PatientSearchParams {
  keyword?: string;
  phone?: string;
  page?: number;
  size?: number;
}

// Medical Record Types (imported from medicalRecord module)
export * from "./medicalRecord";

// Treatment Types
export interface Treatment {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  diagnosis: string;
  treatment: string;
  prescription?: string;
  notes?: string;
  cost: number;
  status: "IN_PROGRESS" | "COMPLETED";
  createdAt: string;
  updatedAt: string;
}

// Service Types
export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number; // minutes
  category: string;
  isActive: boolean;
  createdAt: string;
}

// Payment Types
export interface Payment {
  id: string;
  patientId: string;
  treatmentId?: string;
  amount: number;
  paymentMethod: "CASH" | "CARD" | "TRANSFER";
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  paymentDate: string;
  notes?: string;
  createdAt: string;
}

// Re-export module types
export * from "./medicalRecord";
export * from "./service";
export * from "./treatmentPlan";
export * from "./invoice";
export * from "./medicine";
export * from "./prescription";
export * from "./appointment";
export * from "./notification";
export * from "./publicContent";
