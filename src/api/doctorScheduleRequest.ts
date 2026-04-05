import request from "@/utils/request";
import type { PageResponse } from "@/types";
import type {
  CreateDoctorScheduleRequest,
  DoctorScheduleRequestItem,
  DoctorScheduleRequestSearchParams,
} from "@/types";

export const doctorScheduleRequestApi = {
  create(data: CreateDoctorScheduleRequest) {
    return request.post<void>("/doctor-schedule-requests", data);
  },

  getAll(
    params: DoctorScheduleRequestSearchParams = {},
    page: number = 0,
    size: number = 10,
  ) {
    return request.get<PageResponse<DoctorScheduleRequestItem>>(
      "/doctor-schedule-requests",
      {
        params: {
          ...params,
          page,
          size,
          sort: "createdAt,desc",
        },
      },
    );
  },

  approve(id: string) {
    return request.post<void>(`/doctor-schedule-requests/${id}/approve`);
  },

  reject(id: string) {
    return request.post<void>(`/doctor-schedule-requests/${id}/reject`);
  },
};
