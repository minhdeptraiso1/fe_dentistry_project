export type WorkShift = "MORNING" | "AFTERNOON";

export type AppointmentStatus =
  | "WAITING"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "DONE"
  | "CANCELLED";

export type AppointmentPriority = "NORMAL" | "URGENT";

export interface Appointment {
  id: string;
  appointmentCode: string;
  patientId: string;
  patientCode?: string;
  patientName?: string;
  doctorId?: string;
  doctorName?: string;
  doctorUsername?: string;
  treatmentPlanId?: string;
  treatmentPlanCode?: string;
  parentId?: string;
  sequenceNo?: number;
  workDate: string; // LocalDate
  actualDate?: string;
  shift: WorkShift;
  status: AppointmentStatus;
  priority?: AppointmentPriority;
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

export interface CreateFollowUpAppointmentRequest {
  workDate: string;
  shift: WorkShift;
  doctorId?: string;
  note?: string;
  treatmentPlanId?: string;
}

export interface AppointmentSearchParams {
  date?: string; // YYYY-MM-DD
  doctorId?: string;
  patientId?: string;
  status?: AppointmentStatus;
  shift?: WorkShift;
  sort?: string | string[];
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
  img?: string;
}

export interface SetDoctorShiftCapacityRequest {
  doctorId: string;
  workDate: string; // YYYY-MM-DD
  shift: WorkShift;
  maxPatients: number;
}

export type ScheduleRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface CreateDoctorScheduleRequest {
  workDate: string; // YYYY-MM-DD
  shift: WorkShift;
  maxPatients: number;
}

export interface DoctorScheduleRequestItem {
  id: string;
  doctorId: string;
  doctorName: string;
  workDate: string;
  shift: WorkShift;
  maxPatients: number;
  status: ScheduleRequestStatus;
}

export interface DoctorScheduleRequestSearchParams {
  date?: string; // YYYY-MM-DD
  shift?: WorkShift;
  doctorId?: string;
  status?: ScheduleRequestStatus;
}
