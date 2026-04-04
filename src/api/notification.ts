import request from "@/utils/request";
import type { NotificationItem } from "@/types/notification";

export const notificationApi = {
  getMy() {
    return request.get<NotificationItem[]>("/notifications/my");
  },

  getUnreadCount() {
    return request.get<number>("/notifications/my/unread-count");
  },

  markAsRead(id: string) {
    return request.patch<void>(`/notifications/my/${id}/read`);
  },
};
