import request from "@/utils/request";
import type {
  Appointment,
  CreateAppointmentRequest,
  AssignDoctorRequest,
  AppointmentSearchParams,
  PageResponse,
} from "@/types";

export const appointmentApi = {
  // Create appointment
  create(data: CreateAppointmentRequest) {
    return request.post<Appointment>("/appointments", data);
  },

  // Get appointment by ID
  getById(id: string) {
    return request.get<Appointment>(`/appointments/${id}`);
  },

  // Search appointments
  search(params: AppointmentSearchParams) {
    return request.get<PageResponse<Appointment>>("/appointments", { params });
  },

  // Get my appointments (PATIENT)
  getMy(params?: { date?: string; page?: number; size?: number }) {
    return request.get<PageResponse<Appointment>>("/appointments/my", {
      params,
    });
  },

  // Get my appointment detail (PATIENT)
  getMyById(id: string) {
    return request.get<Appointment>(`/appointments/my/${id}`);
  },

  // Create my appointment (PATIENT)
  createMy(data: CreateAppointmentRequest) {
    return request.post<Appointment>("/appointments/my", data);
  },

  // Assign doctor to appointment
  assignDoctor(id: string, data: AssignDoctorRequest) {
    return request.post<Appointment>(`/appointments/${id}/assign`, data);
  },

  // Cancel appointment
  cancel(id: string, note?: string) {
    return request.post<void>(`/appointments/${id}/cancel`, null, {
      params: { note },
    });
  },

  // Doctor starts appointment (IN_PROGRESS)
  start(id: string) {
    return request.post<Appointment>(`/appointments/${id}/start`);
  },

  // Doctor finishes appointment (DONE)
  finish(id: string) {
    return request.post<Appointment>(`/appointments/${id}/finish`);
  },
};
