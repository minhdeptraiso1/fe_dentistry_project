export type WorkShift = "MORNING" | "AFTERNOON";

export type AppointmentStatus =
  | "WAITING"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "DONE"
  | "CANCELLED";

export interface Appointment {
  id: string;
  appointmentCode: string;
  patientId: string;
  patientName?: string;
  doctorId?: string;
  doctorName?: string;
  workDate: string; // LocalDate
  shift: WorkShift;
  status: AppointmentStatus;
  note?: string;
  cancellationNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentRequest {
  patientId: string;
  workDate: string; // YYYY-MM-DD
  shift: WorkShift;
  doctorId?: string; // Optional - assign immediately
  note?: string;
}

export interface AssignDoctorRequest {
  doctorId: string;
}

export interface AppointmentSearchParams {
  date?: string; // YYYY-MM-DD
  doctorId?: string;
  status?: AppointmentStatus;
  shift?: WorkShift;
  page?: number;
  size?: number;
}

export interface AvailableDoctor {
  doctorId: string;
  doctorName: string;
  maxPatients: number;
  currentPatients: number;
  remaining: number;
  isFull: boolean;
}

export interface SetDoctorShiftCapacityRequest {
  doctorId: string;
  workDate: string; // YYYY-MM-DD
  shift: WorkShift;
  maxPatients: number;
}
