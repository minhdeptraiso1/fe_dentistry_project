<template>
  <el-dialog
    v-model="dialogVisible"
    width="600px"
    :close-on-click-modal="false"
    :show-close="false"
  >
    <div v-loading="loading" class="user-detail-content">
      <div v-if="user" class="detail-sections">
        <!-- User Avatar & Name -->
        <div class="user-profile-header">
          <div class="profile-avatar">
            <img v-if="user.img" :src="user.img" alt="Avatar" />
            <component v-else :is="UserIcon" />
          </div>
          <div class="profile-info">
            <h2 class="profile-name">{{ user.name }}</h2>
            <p class="profile-username">@{{ user.username }}</p>
            <div class="profile-badges">
              <el-tag
                :type="getRoleTagType(user.role)"
                effect="dark"
                size="small"
              >
                {{ UserRoleLabels[user.role] }}
              </el-tag>
              <el-tag
                :type="user.enabled ? 'success' : 'danger'"
                effect="dark"
                size="small"
              >
                {{ user.enabled ? "Đang hoạt động" : "Đã khóa" }}
              </el-tag>
            </div>
          </div>
        </div>

        <!-- Contact Information -->
        <div class="info-section">
          <div class="section-title">
            <component :is="MailIcon" class="section-icon" />
            <span>Thông tin liên hệ</span>
          </div>
          <div class="info-grid">
            <div class="info-item">
              <label class="info-label">Email</label>
              <div class="info-value">
                <component :is="MailIcon" class="value-icon" />
                <span>{{ user.email }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- System Information -->
        <div class="info-section">
          <div class="section-title">
            <component :is="InfoIcon" class="section-icon" />
            <span>Thông tin hệ thống</span>
          </div>
          <div class="info-grid">
            <div class="info-item">
              <label class="info-label">Ngày tạo</label>
              <div class="info-value">
                <component :is="CalendarIcon" class="value-icon" />
                <span>{{ formatDate(user.createdAt) }}</span>
              </div>
            </div>
            <div class="info-item">
              <label class="info-label">Cập nhật lần cuối</label>
              <div class="info-value">
                <component :is="ClockIcon" class="value-icon" />
                <span>{{ formatDate(user.updatedAt) }}</span>
              </div>
            </div>
            <div v-if="user.createdBy" class="info-item">
              <label class="info-label">Người tạo</label>
              <div class="info-value">
                <component :is="UserIcon" class="value-icon" />
                <span>{{ user.createdBy }}</span>
              </div>
            </div>
            <div v-if="user.updatedBy" class="info-item">
              <label class="info-label">Người cập nhật</label>
              <div class="info-value">
                <component :is="UserIcon" class="value-icon" />
                <span>{{ user.updatedBy }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
          <button @click="handleChangePassword" class="action-btn primary">
            <component :is="KeyIcon" />
            <span>Đổi mật khẩu</span>
          </button>
          <button
            @click="handleToggleEnabled"
            :class="['action-btn', user.enabled ? 'warning' : 'success']"
          >
            <component :is="ToggleIcon" />
            <span>{{ user.enabled ? "Khóa tài khoản" : "Kích hoạt" }}</span>
          </button>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <button @click="handleClose" class="close-button">
          <component :is="XIcon" />
          <span>Đóng</span>
        </button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, h } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { userApi } from "@/api/user";
import { authApi } from "@/api/auth";
import { emailApi } from "@/api/email";
import type { UserDetail, UserRole } from "@/types/user";
import { UserRoleLabels } from "@/types/user";

// Props & Emits
interface Props {
  modelValue: boolean;
  userId: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "refresh"): void;
}>();

// Custom Icons
const UserIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    [
      h("path", { d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" }),
      h("circle", { cx: "12", cy: "7", r: "4" }),
    ],
  );

const MailIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    [
      h("rect", { width: "20", height: "16", x: "2", y: "4", rx: "2" }),
      h("path", { d: "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" }),
    ],
  );

const InfoIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    [
      h("circle", { cx: "12", cy: "12", r: "10" }),
      h("path", { d: "M12 16v-4" }),
      h("path", { d: "M12 8h.01" }),
    ],
  );

const CalendarIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    [
      h("rect", {
        width: "18",
        height: "18",
        x: "3",
        y: "4",
        rx: "2",
        ry: "2",
      }),
      h("line", { x1: "16", x2: "16", y1: "2", y2: "6" }),
      h("line", { x1: "8", x2: "8", y1: "2", y2: "6" }),
      h("line", { x1: "3", x2: "21", y1: "10", y2: "10" }),
    ],
  );

const ClockIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    [
      h("circle", { cx: "12", cy: "12", r: "10" }),
      h("polyline", { points: "12 6 12 12 16 14" }),
    ],
  );

const KeyIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    [
      h("circle", { cx: "7.5", cy: "15.5", r: "5.5" }),
      h("path", { d: "m21 2-9.6 9.6" }),
      h("path", { d: "m15.5 7.5 3 3L22 7l-3-3" }),
    ],
  );

const ToggleIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    [
      h("rect", {
        x: "1",
        y: "5",
        width: "22",
        height: "14",
        rx: "7",
        ry: "7",
      }),
      h("circle", { cx: "16", cy: "12", r: "3" }),
    ],
  );

const XIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    [h("path", { d: "M18 6 6 18" }), h("path", { d: "m6 6 12 12" })],
  );

// State
const loading = ref(false);
const user = ref<UserDetail | null>(null);

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

// Methods
const loadUser = async () => {
  try {
    loading.value = true;
    user.value = await userApi.getById(props.userId);
  } catch (error: any) {
    ElMessage.error(error.message || "Không thể tải thông tin người dùng");
    handleClose();
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getRoleTagType = (role: UserRole): string => {
  const types: Record<UserRole, string> = {
    ADMIN: "danger",
    DOCTOR: "success",
    CASHIER: "warning",
    PATIENT: "info",
  };
  return types[role] || "info";
};

const handleChangePassword = () => {
  ElMessageBox.prompt(
    "Nhập mật khẩu mới cho người dùng (tối thiểu 6 ký tự)",
    "Đổi mật khẩu",
    {
      confirmButtonText: "Đổi mật khẩu",
      cancelButtonText: "Hủy",
      inputType: "password",
      inputPlaceholder: "Mật khẩu mới",
    },
  )
    .then(async (data) => {
      const newPassword = typeof data === "string" ? data : (data as any).value || "";
      if (!newPassword || newPassword.length < 6) {
        ElMessage.error("Mật khẩu phải có ít nhất 6 ký tự");
        return;
      }
      // Gọi API đổi mật khẩu
      try {
        await authApi.adminResetPassword(user.value!.id, { newPassword });
        handlePasswordChanged(newPassword);
      } catch (error: any) {
        ElMessage.error(
          error.message || "Lỗi khi đổi mật khẩu"
        );
      }
    })
    .catch(() => {
      // Người dùng hủy
    });
};

const firePasswordResetEmail = (userEmail: string, password: string, userName: string) => {
  if (!userEmail) return;

  emailApi
    .sendTemplate({
      to: userEmail,
      subject: "Mật khẩu mới của bạn",
      template: "password-reset",
      model: {
        userName: userName || "Người dùng",
        newPassword: password,
      },
    })
    .catch(() => {
      // Best-effort async call only.
    });
};

const handlePasswordChanged = (newPassword: string) => {
  ElMessage.success("Đổi mật khẩu thành công");
  if (user.value?.email) {
    firePasswordResetEmail(user.value.email, newPassword, user.value.name);
  }
  loadUser();
  emit("refresh");
};

const handleToggleEnabled = async () => {
  if (!user.value) return;

  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn ${
        user.value.enabled ? "khóa" : "kích hoạt"
      } tài khoản "${user.value.name}"?`,
      "Xác nhận",
      {
        confirmButtonText: user.value.enabled ? "Khóa" : "Kích hoạt",
        cancelButtonText: "Hủy",
        type: "warning",
      },
    );

    await userApi.toggleEnabled(user.value.id, !user.value.enabled);
    ElMessage.success(
      user.value.enabled
        ? "Đã khóa tài khoản thành công"
        : "Đã kích hoạt tài khoản thành công",
    );
    loadUser();
    emit("refresh");
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(
        error.message || "Không thể thay đổi trạng thái tài khoản",
      );
    }
  }
};

const handleClose = () => {
  dialogVisible.value = false;
};

// Watchers
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && props.userId) {
      loadUser();
    }
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
:deep(.el-dialog__header) {
  padding: 0;
  margin-right: 0;
}

:deep(.el-dialog__body) {
  padding: 24px;
}

:deep(.el-dialog__footer) {
  padding: 0;
}

.dialog-header {
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon-box {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 24px;
    height: 24px;
    color: white;
  }
}

.header-text {
  flex: 1;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin-bottom: 4px;
}

.header-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.user-detail-content {
  min-height: 300px;
}

.detail-sections {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.user-profile-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%);
  border-radius: 12px;
}

.profile-avatar {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;

  svg {
    width: 40px;
    height: 40px;
    color: white;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.profile-info {
  flex: 1;
}

.profile-name {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
}

.profile-username {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 12px;
}

.profile-badges {
  display: flex;
  gap: 8px;
}

.info-section {
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 16px;

  .section-icon {
    width: 18px;
    height: 18px;
    color: #14b8a6;
  }
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-label {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #111827;

  .value-icon {
    width: 16px;
    height: 16px;
    color: #9ca3af;
    flex-shrink: 0;
  }
}

.quick-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;

  svg {
    width: 18px;
    height: 18px;
  }

  &.primary {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    }
  }

  &.success {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
    }
  }

  &.warning {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: white;
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  padding: 16px 24px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
}

.close-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  background: white;
  color: #6b7280;
  border: 1px solid #d1d5db;
  transition: all 0.2s ease;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    background: #f9fafb;
    border-color: #9ca3af;
  }
}
</style>
