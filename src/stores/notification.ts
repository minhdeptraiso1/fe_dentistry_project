import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { notificationSocketService } from "@/services/notificationSocket";
import { notificationApi } from "@/api/notification";
import { notification } from "@/utils/notification";
import type {
  NotificationItem,
  NotificationPayload,
} from "@/types/notification";

const toNotificationItem = (payload: NotificationPayload): NotificationItem => {
  const createdAt = payload.createdAt || new Date().toISOString();
  const title = payload.title || "Thông báo mới";
  const content = payload.content || "Bạn có thông báo mới";

  return {
    id: payload.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title,
    content,
    read: Boolean(payload.read ?? payload.isRead ?? false),
    createdAt,
  };
};

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

export const useNotificationStore = defineStore(
  "notification",
  () => {
    const items = ref<NotificationItem[]>([]);
    const connectedUserId = ref("");

    const unreadCount = computed(
      () => items.value.filter((item) => !item.read).length,
    );
    const unreadItems = computed(() =>
      items.value.filter((item) => !item.read),
    );
    const latestItems = computed(() => items.value.slice(0, 5));

    const pushOrUpdate = (newItem: NotificationItem) => {
      const index = items.value.findIndex((n) => n.id === newItem.id);
      if (index >= 0) {
        items.value[index] = newItem;
      } else {
        items.value.unshift(newItem);
      }
      items.value.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      if (items.value.length > 100) {
        items.value = items.value.slice(0, 100);
      }
    };

    const loadMyNotifications = async () => {
      try {
        const response = await notificationApi.getMy(0, 10);
        const list = response.content || [];
        items.value = list
          .map((item: any) => ({
            id: String(item.id),
            title: item.title || "Thông báo",
            content: item.content || "Bạn có thông báo mới",
            read: Boolean(item.read ?? item.isRead ?? false),
            createdAt: item.createdAt || new Date().toISOString(),
          }))
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
      } catch (error) {
        console.error("Failed to load notifications:", error);
      }
    };

    const startRealtime = (userId: string) => {
      if (!userId) return;
      if (connectedUserId.value === userId) return;

      connectedUserId.value = userId;
      loadMyNotifications();
      notificationSocketService.connect(userId, (payload) => {
        const item = toNotificationItem(payload);
        pushOrUpdate(item);
        notification.realtime(item.content, item.title);
      });
    };

    const stopRealtime = () => {
      connectedUserId.value = "";
      notificationSocketService.disconnect();
    };

    const markAsRead = async (id: string) => {
      const target = items.value.find((item) => item.id === id);
      if (!target) return;

      if (!isUuid(id)) {
        target.read = true;
        return;
      }

      try {
        await notificationApi.markAsRead(id);
        target.read = true;
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    };

    const markAllAsRead = async () => {
      const unread = items.value.filter((item) => !item.read);
      const readable = unread.filter((item) => isUuid(item.id));

      try {
        await Promise.all(
          readable.map((item) => notificationApi.markAsRead(item.id)),
        );
        items.value = items.value.map((item) => ({ ...item, read: true }));
        await loadMyNotifications();
      } catch (error) {
        console.error("Failed to mark all notifications as read:", error);
      }
    };

    const clearAll = () => {
      items.value = [];
    };

    return {
      items,
      unreadItems,
      latestItems,
      unreadCount,
      startRealtime,
      stopRealtime,
      loadMyNotifications,
      markAsRead,
      markAllAsRead,
      clearAll,
    };
  },
  {
    persist: {
      key: "dental-notifications",
      storage: localStorage,
      pick: ["items"],
    },
  },
);
