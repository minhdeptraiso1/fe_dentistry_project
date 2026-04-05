import request from "@/utils/request";
import type { NotificationItem } from "@/types/notification";
import type { PageResponse } from "@/types";

export const notificationApi = {
  getMy(page: number = 0, size: number = 10) {
    return request.get<PageResponse<NotificationItem>>("/notifications/my", {
      params: {
        page,
        size,
        sort: "createdAt,desc",
      },
    });
  },

  getUnreadCount() {
    return request.get<number>("/notifications/my/unread-count");
  },

  markAsRead(id: string) {
    return request.patch<void>(`/notifications/my/${id}/read`);
  },
};
