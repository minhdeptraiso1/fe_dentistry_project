import request from "@/utils/request";
import type {
  AvailableDoctor,
  SetDoctorShiftCapacityRequest,
  WorkShift,
} from "@/types";

export const doctorCapacityApi = {
  // Set doctor shift capacity
  setCapacity(data: SetDoctorShiftCapacityRequest) {
    return request.put<void>("/doctor-capacities", data);
  },

  // Get available doctors for a date and shift
  async getAvailableDoctors(workDate: string, shift: WorkShift) {
    const response = await request.get<AvailableDoctor[]>(
      "/doctor-capacities/available",
      {
        params: { workDate, shift },
      },
    );
    // Backend returns array directly (already unwrapped by interceptor)
    return Array.isArray(response) ? response : [];
  },
};
