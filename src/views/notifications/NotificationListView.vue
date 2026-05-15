<template>
  <div class="notification-page">
    <div class="header-card">
      <div class="header-content">
        <h1>Thông báo hệ thống</h1>
        <p>
          Theo dõi các cập nhật lịch khám, hóa đơn, đơn thuốc theo thời gian
          thực.
        </p>
      </div>
      <div class="header-actions">
        <el-button
          class="mark-all-btn"
          @click="notificationStore.markAllAsRead"
          :disabled="!notificationStore.unreadCount"
        >
          Đánh dấu đã đọc tất cả
        </el-button>
      </div>
    </div>

    <div class="content-card">
      <div class="filter-bar">
        <button
          type="button"
          :class="['filter-chip', activeFilter === 'all' ? 'is-active' : '']"
          @click="activeFilter = 'all'"
        >
          Tất cả
          <span>{{ notificationStore.items.length }}</span>
        </button>
        <button
          type="button"
          :class="['filter-chip', activeFilter === 'unread' ? 'is-active' : '']"
          @click="activeFilter = 'unread'"
        >
          Chưa đọc
          <span>{{ notificationStore.unreadCount }}</span>
        </button>
      </div>

      <div
        v-loading="loading"
        class="notification-list"
        v-if="filteredNotifications.length"
      >
        <button
          v-for="item in filteredNotifications"
          :key="item.id"
          type="button"
          class="notification-item"
          :class="{ unread: !item.read }"
          @click="handleMarkAsRead(item.id)"
        >
          <div class="item-top">
            <div class="title-group">
              <span v-if="!item.read" class="status-dot"></span>
              <h3>{{ item.title }}</h3>
            </div>
            <span class="item-time">{{ formatDateTime(item.createdAt) }}</span>
          </div>
          <p>{{ item.content }}</p>
        </button>
      </div>

      <div v-else class="empty-state">
        <h3>Chưa có thông báo</h3>
        <p>Thông báo realtime sẽ hiển thị tại đây khi có sự kiện mới.</p>
      </div>

      <div class="pagination-wrap" v-if="totalElements > 0">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next"
          :current-page="currentPage"
          :page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="totalElements"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useNotificationStore } from "@/stores/notification";
import { notificationApi } from "@/api/notification";
import { sortByCreatedAtDesc } from "@/utils/sort";
import type { NotificationItem } from "@/types/notification";

const notificationStore = useNotificationStore();
const activeFilter = ref<"all" | "unread">("all");
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const totalElements = ref(0);
const pageItems = ref<NotificationItem[]>([]);

const loadNotifications = async () => {
  try {
    loading.value = true;
    const response = await notificationApi.getMy(
      currentPage.value - 1,
      pageSize.value,
    );
    pageItems.value = sortByCreatedAtDesc(response.content || []).map((item: any) => ({
      id: String(item.id),
      title: item.title || "Thông báo",
      content: item.content || "Bạn có thông báo mới",
      read: Boolean(item.read ?? item.isRead ?? false),
      createdAt: item.createdAt || new Date().toISOString(),
    }));
    totalElements.value = response.totalElements || 0;
  } finally {
    loading.value = false;
  }
};

const filteredNotifications = computed(() => {
  if (activeFilter.value === "unread") {
    return pageItems.value.filter((item) => !item.read);
  }
  return pageItems.value;
});

const handleMarkAsRead = async (id: string) => {
  await notificationStore.markAsRead(id);
  pageItems.value = pageItems.value.map((item) =>
    item.id === id ? { ...item, read: true } : item,
  );
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
  loadNotifications();
};

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
  loadNotifications();
};

watch(
  () => notificationStore.items,
  () => {
    loadNotifications();
  },
  { deep: true },
);

onMounted(loadNotifications);

const formatDateTime = (value: string) => {
  return new Date(value).toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};
</script>

<style scoped>
.notification-page {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.header-card {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  flex-wrap: wrap;
  align-items: center;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 20px 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header-content h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-content p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.mark-all-btn {
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  color: #ffffff;
  font-weight: 600;
  min-height: 42px;
  padding: 0 22px;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);
  transition: all 0.25s ease;
}

.mark-all-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 18px rgba(20, 184, 166, 0.4);
}

.mark-all-btn:disabled {
  opacity: 1;
  background: #cbd5e1;
  color: #475569;
  box-shadow: none;
  cursor: not-allowed;
}

.content-card {
  background: #fff;
  border-radius: 18px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.06);
  padding: 20px;
}

.filter-bar {
  display: inline-flex;
  gap: 8px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  padding: 6px;
  width: fit-content;
  margin-bottom: 16px;
}

.filter-chip {
  border: none;
  background: transparent;
  padding: 10px 14px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #475569;
  font-weight: 600;
  cursor: pointer;
}

.filter-chip span {
  min-width: 20px;
  height: 20px;
  border-radius: 999px;
  background: #e2e8f0;
  color: #0f172a;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.filter-chip.is-active {
  background: linear-gradient(135deg, #14b8a6, #0ea5e9);
  color: #fff;
}

.filter-chip.is-active span {
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.notification-item {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  text-align: left;
  padding: 15px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.notification-item:hover {
  border-color: #99f6e4;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}

.notification-item.unread {
  border-color: #7dd3c9;
  background: #ffffff;
}

.item-top {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: baseline;
}

.title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: #14b8a6;
  box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.16);
}

.item-top h3 {
  margin: 0;
  font-size: 16px;
  color: #0f172a;
}

.item-time {
  color: #64748b;
  font-size: 12px;
}

.notification-item p {
  margin: 8px 0 0;
  color: #334155;
  line-height: 1.5;
  font-size: 14px;
}

.empty-state {
  background: #fff;
  border: 1px dashed #cbd5e1;
  border-radius: 16px;
  padding: 40px;
  text-align: center;
}

.empty-state h3 {
  margin: 0 0 8px;
  color: #0f172a;
}

.empty-state p {
  margin: 0;
  color: #64748b;
}

.pagination-wrap {
  width: 100%;
  margin-top: 24px;
  padding-top: 10px;
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .header-content h1 {
    font-size: 28px;
  }

  .header-content p {
    font-size: 14px;
  }

  .notification-item {
    padding: 14px;
  }
}
</style>
