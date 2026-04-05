<template>
  <div class="profile-view">
    <div v-loading="loading" class="profile-container">
      <div v-if="user" class="profile-content">
        <!-- HERO SECTION -->
        <div class="profile-hero">
          <div class="hero-bg">
            <div class="hero-orb hero-orb-1"></div>
            <div class="hero-orb hero-orb-2"></div>
            <div class="hero-orb hero-orb-3"></div>
            <div class="hero-grid"></div>
          </div>

          <div class="hero-body">
            <!-- AVATAR -->
            <div class="avatar-ring-outer">
              <div class="avatar-ring-inner">
                <div
                  class="avatar-wrapper"
                  @click="handleAvatarClick"
                  title="Nhấp để thay đổi ảnh đại diện"
                >
                  <img
                    v-if="user.img"
                    :src="user.img"
                    alt="Avatar"
                    class="avatar-img"
                  />
                  <component v-else :is="UserIcon" class="avatar-icon" />
                  <div class="avatar-overlay">
                    <component :is="CameraIcon" class="camera-icon" />
                  </div>
                </div>
              </div>
              <div class="avatar-status-dot"></div>
            </div>

            <!-- Hidden file input -->
            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              style="display: none"
              @change="handleFileChange"
            />

            <!-- USER META -->
            <div class="hero-meta">
              <div class="hero-name-row">
                <h1 class="hero-name">{{ user.name }}</h1>
                <span class="hero-verified">
                  <component :is="CheckIcon" class="verified-icon" />
                </span>
              </div>
              <p class="hero-handle">@{{ user.username }}</p>

              <div class="hero-tags">
                <span
                  class="tag-role"
                  :class="`role-${user.role?.toLowerCase()}`"
                >
                  <component :is="getRoleIcon(user.role)" class="tag-icon" />
                  {{ UserRoleLabels[user.role] }}
                </span>
                <span
                  class="tag-status"
                  :class="user.enabled ? 'status-active' : 'status-locked'"
                >
                  <span class="status-pulse" v-if="user.enabled"></span>
                  {{ user.enabled ? "Đang hoạt động" : "Đã khóa" }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- CONTENT AREA -->
        <div class="content-grid">
          <!-- CONTACT CARD -->
          <div class="glass-card contact-card">
            <div class="glass-card-header">
              <div class="card-icon-wrap">
                <component :is="MailIcon" class="card-icon" />
              </div>
              <div>
                <p class="card-label">Liên hệ</p>
                <h3 class="card-title">Thông tin Email</h3>
              </div>
            </div>
            <div class="glass-card-body">
              <div class="field-block">
                <span class="field-label">Địa chỉ email</span>
                <div class="field-value-row">
                  <span class="field-value">{{ user.email }}</span>
                  <button
                    class="copy-btn"
                    @click="copyEmail(user.email)"
                    title="Sao chép"
                  >
                    <component :is="CopyIcon" class="copy-icon" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- SECURITY CARD -->
          <div class="glass-card security-card">
            <div class="glass-card-header">
              <div class="card-icon-wrap">
                <component :is="ShieldIcon" class="card-icon" />
              </div>
              <div>
                <p class="card-label">Bảo mật</p>
                <h3 class="card-title">Quản lý mật khẩu</h3>
              </div>
            </div>
            <div class="glass-card-body">
              <p class="security-hint">
                Thay đổi mật khẩu định kỳ để bảo vệ tài khoản của bạn.
              </p>
              <button
                class="change-password-btn"
                @click="openChangePasswordDialog"
              >
                <component :is="KeyIcon" class="btn-icon" />
                <span>Đổi mật khẩu</span>
                <component :is="ArrowRightIcon" class="btn-arrow" />
              </button>
            </div>
          </div>

          <!-- ACCOUNT INFO CARD -->
          <div class="glass-card account-card">
            <div class="glass-card-header">
              <div class="card-icon-wrap">
                <component :is="InfoIcon" class="card-icon" />
              </div>
              <div>
                <p class="card-label">Tài khoản</p>
                <h3 class="card-title">Thông tin hệ thống</h3>
              </div>
            </div>
            <div class="glass-card-body">
              <div class="info-list">
                <div class="info-item">
                  <span class="info-item-label">Vai trò</span>
                  <span class="info-item-value highlight">{{
                    UserRoleLabels[user.role]
                  }}</span>
                </div>
                <div class="info-item">
                  <span class="info-item-label">Trạng thái</span>
                  <span
                    class="info-item-value"
                    :class="user.enabled ? 'text-green' : 'text-red'"
                  >
                    {{ user.enabled ? "Đang hoạt động" : "Đã khóa" }}
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-item-label">Username</span>
                  <span class="info-item-value">{{ user.username }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- CHANGE PASSWORD DIALOG -->
    <ChangePasswordDialog
      v-if="passwordDialogVisible && user"
      v-model="passwordDialogVisible"
      :user-id="user.id"
      @success="handlePasswordChanged"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from "vue";
import { ElMessage } from "element-plus";
import { userApi } from "@/api/user";
import type { User, UserRole } from "@/types/user";
import { UserRoleLabels } from "@/types/user";
import ChangePasswordDialog from "@/views/users/components/ChangePasswordDialog.vue";

/* ─── ICONS ─── */

const UserIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "1.5",
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
      "stroke-width": "1.5",
    },
    [
      h("rect", { width: "20", height: "16", x: "2", y: "4", rx: "2" }),
      h("path", { d: "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" }),
    ],
  );

const ShieldIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "1.5",
    },
    [h("path", { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" })],
  );

const KeyIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "1.5",
    },
    [
      h("circle", { cx: "7.5", cy: "15.5", r: "5.5" }),
      h("path", { d: "m21 2-9.6 9.6" }),
      h("path", { d: "m15.5 7.5 3 3L22 7l-3-3" }),
    ],
  );

const CheckIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "currentColor",
    },
    [
      h("path", {
        d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
      }),
    ],
  );

const CopyIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
    },
    [
      h("rect", {
        width: "14",
        height: "14",
        x: "8",
        y: "8",
        rx: "2",
        ry: "2",
      }),
      h("path", {
        d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",
      }),
    ],
  );

const CameraIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
    },
    [
      h("path", {
        d: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z",
      }),
      h("circle", { cx: "12", cy: "13", r: "4" }),
    ],
  );

const ArrowRightIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
    },
    [h("path", { d: "M5 12h14" }), h("path", { d: "m12 5 7 7-7 7" })],
  );

const InfoIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "1.5",
    },
    [
      h("circle", { cx: "12", cy: "12", r: "10" }),
      h("path", { d: "M12 16v-4" }),
      h("path", { d: "M12 8h.01" }),
    ],
  );

const AdminIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "1.5",
    },
    [h("path", { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" })],
  );

const DoctorIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "1.5",
    },
    [
      h("path", { d: "M8 2v4" }),
      h("path", { d: "M16 2v4" }),
      h("rect", { x: "3", y: "4", width: "18", height: "18", rx: "2" }),
      h("path", { d: "M12 8v8" }),
      h("path", { d: "M8 12h8" }),
    ],
  );

const CashierIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "1.5",
    },
    [
      h("rect", { x: "2", y: "5", width: "20", height: "14", rx: "2" }),
      h("path", { d: "M2 10h20" }),
    ],
  );

const PatientIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "1.5",
    },
    [
      h("circle", { cx: "12", cy: "8", r: "4" }),
      h("path", { d: "M4 20a8 8 0 0 1 16 0" }),
    ],
  );

/* ─── STATE ─── */

const loading = ref(false);
const user = ref<User | null>(null);
const passwordDialogVisible = ref(false);
const fileInputRef = ref<HTMLInputElement>();

/* ─── METHODS ─── */

const loadUserProfile = async () => {
  try {
    loading.value = true;
    user.value = await userApi.getMe();
  } catch (error: any) {
    ElMessage.error(error.message || "Không thể tải thông tin cá nhân");
  } finally {
    loading.value = false;
  }
};

const getRoleIcon = (role: UserRole) => {
  const icons: Record<UserRole, any> = {
    ADMIN: AdminIcon,
    DOCTOR: DoctorIcon,
    CASHIER: CashierIcon,
    PATIENT: PatientIcon,
  };
  return icons[role] || UserIcon;
};

const copyEmail = (email: string) => {
  navigator.clipboard.writeText(email).then(() => {
    ElMessage.success("Đã sao chép email");
  });
};

const openChangePasswordDialog = () => {
  passwordDialogVisible.value = true;
};

const handlePasswordChanged = () => {
  ElMessage.success("Đổi mật khẩu thành công");
  passwordDialogVisible.value = false;
};

const handleAvatarClick = () => {
  fileInputRef.value?.click();
};

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file || !user.value) return;

  // Validate file type
  if (!file.type.startsWith("image/")) {
    ElMessage.error("Vui lòng chọn file ảnh");
    return;
  }

  // Validate file size (max 20MB)
  if (file.size > 20 * 1024 * 1024) {
    ElMessage.error("Kích thước file không được vượt quá 20MB");
    return;
  }

  // Convert to base64
  const reader = new FileReader();
  reader.onload = async (e) => {
    const imgBase64 = e.target?.result as string;

    if (!user.value) return; // Double check

    try {
      loading.value = true;
      // Call API update with only img field
      await userApi.update(user.value.id, { img: imgBase64 });

      // Update local user data
      user.value.img = imgBase64;

      ElMessage.success("Cập nhật ảnh đại diện thành công");
    } catch (error: any) {
      ElMessage.error(error.message || "Không thể cập nhật ảnh đại diện");
    } finally {
      loading.value = false;
    }
  };
  reader.readAsDataURL(file);

  // Reset input
  target.value = "";
};

/* ─── LIFECYCLE ─── */

onMounted(() => {
  loadUserProfile();
});
</script>

<style scoped lang="scss">
@import url("https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Sans:wght@300;400;500&display=swap");

* {
  box-sizing: border-box;
}

.profile-view {
  font-family: "DM Sans", sans-serif;
  padding: 32px;
  min-height: 100vh;
  background: #f0f4f8;
}

/* ─── HERO ─── */

.profile-hero {
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  margin-bottom: 24px;
  background: #0b1120;
  min-height: 340px;
  display: flex;
  align-items: flex-end;
}

.hero-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.hero-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(14, 165, 164, 0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(14, 165, 164, 0.07) 1px, transparent 1px);
  background-size: 40px 40px;
}

.hero-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.45;
}

.hero-orb-1 {
  width: 380px;
  height: 380px;
  background: radial-gradient(circle, #0ea5a4, transparent 70%);
  top: -120px;
  left: -80px;
}

.hero-orb-2 {
  width: 280px;
  height: 280px;
  background: radial-gradient(circle, #0369a1, transparent 70%);
  top: -60px;
  right: 10%;
}

.hero-orb-3 {
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, #7c3aed, transparent 70%);
  bottom: -40px;
  right: 15%;
  opacity: 0.3;
}

.hero-body {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 36px;
  padding: 48px;
  width: 100%;
}

/* ─── AVATAR ─── */

.avatar-ring-outer {
  position: relative;
  flex-shrink: 0;
}

.avatar-ring-inner {
  padding: 4px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0ea5a4, #0369a1, #7c3aed);
  box-shadow:
    0 0 40px rgba(14, 165, 164, 0.5),
    0 0 80px rgba(14, 165, 164, 0.2);
}

.avatar-wrapper {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0ea5a4, #0891b2);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4px solid #0b1120;
  cursor: pointer;
  position: relative;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.05);

    .avatar-overlay {
      opacity: 1;
    }
  }
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-icon {
  width: 72px;
  height: 72px;
  color: #ffffff;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.camera-icon {
  width: 40px;
  height: 40px;
  color: #ffffff;
}

.avatar-status-dot {
  position: absolute;
  bottom: 10px;
  right: 10px;
  width: 20px;
  height: 20px;
  background: #22c55e;
  border-radius: 50%;
  border: 3px solid #0b1120;
  box-shadow: 0 0 10px rgba(34, 197, 94, 0.6);

  &::after {
    content: "";
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    border: 2px solid rgba(34, 197, 94, 0.3);
    animation: pulse-ring 2s ease-out infinite;
  }
}

@keyframes pulse-ring {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(1.8);
    opacity: 0;
  }
}

/* ─── HERO META ─── */

.hero-meta {
  flex: 1;
}

.hero-name-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.hero-name {
  font-family: "Sora", sans-serif;
  font-size: 34px;
  font-weight: 700;
  color: #fff;
  margin: 0;
  letter-spacing: -0.5px;
  line-height: 1.1;
}

.hero-verified {
  display: flex;
  align-items: center;
  color: #0ea5a4;
  flex-shrink: 0;
}

.verified-icon {
  width: 26px;
  height: 26px;
}

.hero-handle {
  color: rgba(255, 255, 255, 0.4);
  font-size: 15px;
  margin: 0 0 20px 0;
  letter-spacing: 0.5px;
}

.hero-tags {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.tag-role,
.tag-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 100px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.tag-role {
  background: rgba(14, 165, 164, 0.15);
  border: 1px solid rgba(14, 165, 164, 0.4);
  color: #2dd4bf;
}

.role-admin {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.35);
  color: #fca5a5;
}

.role-doctor {
  background: rgba(34, 197, 94, 0.12);
  border-color: rgba(34, 197, 94, 0.35);
  color: #86efac;
}

.role-cashier {
  background: rgba(234, 179, 8, 0.12);
  border-color: rgba(234, 179, 8, 0.35);
  color: #fde047;
}

.role-patient {
  background: rgba(14, 165, 164, 0.12);
  border-color: rgba(14, 165, 164, 0.35);
  color: #67e8f9;
}

.tag-icon {
  width: 14px;
  height: 14px;
}

.tag-status {
  position: relative;
}

.status-active {
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(34, 197, 94, 0.35);
  color: #86efac;
}

.status-locked {
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: #fca5a5;
}

.status-pulse {
  width: 7px;
  height: 7px;
  background: #22c55e;
  border-radius: 50%;
  display: inline-block;
  animation: blink 1.8s ease-in-out infinite;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

/* ─── CONTENT GRID ─── */

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20px;
}

/* ─── GLASS CARDS ─── */

.glass-card {
  background: #fff;
  border-radius: 18px;
  border: 1px solid #e2eaf3;
  overflow: hidden;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }
}

.glass-card-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 22px 24px 16px;
  border-bottom: 1px solid #f1f5f9;
}

.card-icon-wrap {
  width: 44px;
  height: 44px;
  background: linear-gradient(
    135deg,
    rgba(14, 165, 164, 0.12),
    rgba(3, 105, 161, 0.08)
  );
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid rgba(14, 165, 164, 0.15);
}

.card-icon {
  width: 20px;
  height: 20px;
  color: #0ea5a4;
}

.card-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #94a3b8;
  margin: 0 0 2px 0;
}

.card-title {
  font-family: "Sora", sans-serif;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.glass-card-body {
  padding: 20px 24px 24px;
}

/* ─── CONTACT ─── */

.field-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #94a3b8;
}

.field-value-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 11px 14px;
}

.field-value {
  font-size: 14px;
  font-weight: 500;
  color: #334155;
}

.copy-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  color: #94a3b8;
  display: flex;
  align-items: center;
  transition:
    color 0.15s,
    background 0.15s;

  &:hover {
    color: #0ea5a4;
    background: rgba(14, 165, 164, 0.08);
  }
}

.copy-icon {
  width: 16px;
  height: 16px;
}

/* ─── SECURITY ─── */

.security-hint {
  font-size: 13px;
  color: #64748b;
  line-height: 1.6;
  margin: 0 0 16px 0;
}

.change-password-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 18px;
  background: linear-gradient(135deg, #0ea5a4, #0891b2);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition:
    opacity 0.2s,
    transform 0.15s,
    box-shadow 0.2s;
  box-shadow: 0 4px 14px rgba(14, 165, 164, 0.35);

  span {
    flex: 1;
    text-align: left;
  }

  &:hover {
    opacity: 0.92;
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(14, 165, 164, 0.45);
  }

  &:active {
    transform: translateY(0);
  }
}

.btn-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.btn-arrow {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  opacity: 0.7;
}

/* ─── ACCOUNT INFO ─── */

.info-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 11px 0;
  border-bottom: 1px solid #f1f5f9;

  &:last-child {
    border-bottom: none;
  }
}

.info-item-label {
  font-size: 13px;
  color: #94a3b8;
  font-weight: 500;
}

.info-item-value {
  font-size: 13px;
  font-weight: 600;
  color: #334155;

  &.highlight {
    color: #0ea5a4;
    background: rgba(14, 165, 164, 0.08);
    padding: 3px 10px;
    border-radius: 100px;
    font-size: 12px;
    letter-spacing: 0.3px;
  }

  &.text-green {
    color: #16a34a;
  }
  &.text-red {
    color: #dc2626;
  }
}

/* ─── RESPONSIVE ─── */

@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr 1fr;
  }
  .account-card {
    grid-column: 1 / -1;
  }
}

@media (max-width: 640px) {
  .profile-view {
    padding: 16px;
  }

  .hero-body {
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 32px 24px;
  }

  .hero-name {
    font-size: 26px;
  }

  .hero-name-row {
    justify-content: center;
  }
  .hero-tags {
    justify-content: center;
  }

  .avatar-wrapper {
    width: 130px;
    height: 130px;
  }

  .content-grid {
    grid-template-columns: 1fr;
  }
  .account-card {
    grid-column: auto;
  }
}
</style>
