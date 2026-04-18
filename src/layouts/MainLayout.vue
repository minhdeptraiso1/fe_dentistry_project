<template>
  <div class="flex h-screen overflow-hidden bg-gray-50">
    <!-- Sidebar -->
    <aside
      class="bg-gradient-to-b from-teal-600 to-teal-700 transition-[width] duration-300 flex flex-col shadow-xl"
      :class="appStore.sidebarCollapsed ? 'w-20' : 'w-72'"
    >
      <div
        class="h-28 flex items-center justify-center px-4 border-b border-white/10"
      >
        <div class="flex items-center gap-3 text-white">
          <img
            :src="logoImg"
            alt="Logo"
            class="h-20 w-20 rounded-full shadow-lg border-2 border-white/20 object-cover"
            v-show="!appStore.sidebarCollapsed"
          />
          <div
            v-show="appStore.sidebarCollapsed"
            class="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg"
          >
            <img
              :src="logoImg"
              alt="Logo"
              class="h-12 w-12 rounded-full object-cover"
            />
          </div>
        </div>
      </div>

      <nav class="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        <a
          v-for="item in menuItems"
          :key="item.path"
          :href="item.path"
          @click.prevent="router.push(item.route)"
          :class="[
            'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative',
            activeMenu === item.path
              ? 'bg-white/20 text-white shadow-lg'
              : 'text-white/80 hover:bg-white/10 hover:text-white',
          ]"
        >
          <component
            :is="item.icon"
            class="w-5 h-5 flex-shrink-0"
            :class="appStore.sidebarCollapsed ? 'mx-auto' : ''"
          />
          <span v-show="!appStore.sidebarCollapsed" class="text-sm font-medium">
            {{ item.label }}
          </span>
          <div
            v-if="activeMenu === item.path"
            class="absolute right-0 w-1 h-8 bg-white rounded-l-full"
          ></div>
        </a>
      </nav>
    </aside>

    <!-- Main content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <header
        class="h-24 bg-white border-b border-gray-200 flex items-center justify-between px-8 z-10"
      >
        <div class="flex items-center gap-6">
          <button
            @click="appStore.toggleSidebar"
            class="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center text-gray-600"
          >
            <el-icon :size="20">
              <Fold v-if="!appStore.sidebarCollapsed" />
              <Expand v-else />
            </el-icon>
          </button>
          <div>
            <h1 class="text-2xl font-bold text-gray-900">
              {{ appStore.pageTitle || route.meta.title }}
            </h1>
            <p class="text-sm text-gray-500 mt-0.5">{{ getCurrentDate() }}</p>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <el-dropdown
            ref="notificationDropdownRef"
            v-model:visible="notificationDropdownVisible"
            trigger="click"
            placement="bottom-end"
            class="notification-dropdown"
          >
            <button class="notification-bell" type="button">
              <el-icon :size="20"><Bell /></el-icon>
              <span
                v-if="notificationStore.unreadCount > 0"
                class="notification-badge"
              >
                {{
                  notificationStore.unreadCount > 99
                    ? "99+"
                    : notificationStore.unreadCount
                }}
              </span>
            </button>

            <template #dropdown>
              <div class="notification-menu">
                <div class="notification-menu-header">
                  <div class="title">Thông báo</div>
                  <button
                    class="mark-read-btn"
                    type="button"
                    @click.stop="handleMarkAllAndClose"
                    :disabled="notificationStore.unreadCount === 0"
                  >
                    Đọc hết
                  </button>
                </div>

                <div
                  v-if="notificationStore.latestItems.length"
                  class="notification-items"
                >
                  <button
                    v-for="item in notificationStore.latestItems"
                    :key="item.id"
                    type="button"
                    class="notification-item"
                    :class="{ unread: !item.read }"
                    @click.stop="handleOpenNotification(item.id)"
                  >
                    <div class="item-top">
                      <div class="item-title-wrap">
                        <span v-if="!item.read" class="item-unread-dot"></span>
                        <div class="item-title">{{ item.title }}</div>
                      </div>
                      <div class="item-time">
                        {{ formatNotificationTime(item.createdAt) }}
                      </div>
                    </div>
                    <div class="item-message">{{ item.content }}</div>
                  </button>
                </div>
                <div v-else class="notification-empty">Chưa có thông báo</div>

                <button
                  class="view-all-btn"
                  type="button"
                  @click.stop="handleViewAllAndClose"
                >
                  Xem tất cả
                </button>
              </div>
            </template>
          </el-dropdown>

          <el-dropdown trigger="click">
            <div
              class="flex items-center gap-4 cursor-pointer px-5 py-3 rounded-2xl hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 transition-all border border-gray-200 shadow-sm hover:shadow-md hover:border-teal-200"
            >
              <el-avatar
                :size="44"
                :src="authStore.user?.avatar"
                class="bg-gradient-to-br from-teal-500 to-teal-600 ring-2 ring-teal-100"
              >
                {{ avatarInitial }}
              </el-avatar>
              <div class="text-left">
                <div class="font-semibold text-gray-900 text-sm leading-tight">
                  {{ displayName }}
                </div>
                <div
                  class="text-xs text-teal-600 font-medium uppercase tracking-wide mt-0.5"
                >
                  {{ authStore.user?.role || "User" }}
                </div>
              </div>
              <el-icon class="text-gray-400 ml-1"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu class="w-56">
                <el-dropdown-item
                  @click="router.push({ name: 'Profile' })"
                  class="!py-3 !px-4 hover:!bg-teal-50 transition-colors group"
                >
                  <div class="flex items-center gap-3">
                    <component
                      :is="UserProfileIcon"
                      class="text-teal-600 group-hover:text-teal-700 transition-colors"
                    />
                    <span
                      class="text-sm font-medium text-gray-700 group-hover:text-gray-900"
                    >
                      Thông tin cá nhân
                    </span>
                  </div>
                </el-dropdown-item>
                <el-dropdown-item
                  divided
                  @click="handleLogout"
                  class="!py-3 !px-4 hover:!bg-red-50 transition-colors group"
                >
                  <div class="flex items-center gap-3">
                    <component
                      :is="LogoutIcon"
                      class="text-red-600 group-hover:text-red-700 transition-colors"
                    />
                    <span
                      class="text-sm font-medium text-gray-700 group-hover:text-gray-900"
                    >
                      Đăng xuất
                    </span>
                  </div>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- Page content -->
      <main class="flex-1 overflow-y-auto bg-gray-50 p-8">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useAppStore } from "@/stores/app";
import { useNotificationStore } from "@/stores/notification";
import { ElMessageBox } from "element-plus";
import { Fold, Expand, ArrowDown, Bell } from "@element-plus/icons-vue";
import logoImg from "@/assets/logo.png";

// Custom SVG Icons
const DashboardIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "stroke-width": "2",
      stroke: "currentColor",
      class: "w-5 h-5",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
      }),
    ],
  );

const PatientIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "stroke-width": "2",
      stroke: "currentColor",
      class: "w-5 h-5",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
      }),
    ],
  );

const MedicalRecordIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "stroke-width": "2",
      stroke: "currentColor",
      class: "w-5 h-5",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
      }),
    ],
  );

const ServiceIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "stroke-width": "2",
      stroke: "currentColor",
      class: "w-5 h-5",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
      }),
    ],
  );

const PlanIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "stroke-width": "2",
      stroke: "currentColor",
      class: "w-5 h-5",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
      }),
    ],
  );

const InvoiceIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "stroke-width": "2",
      stroke: "currentColor",
      class: "w-5 h-5",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z",
      }),
    ],
  );

const MedicineIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "stroke-width": "2",
      stroke: "currentColor",
      class: "w-5 h-5",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
      }),
    ],
  );

const PrescriptionIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "stroke-width": "2",
      stroke: "currentColor",
      class: "w-5 h-5",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
      }),
    ],
  );

const InventoryIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "stroke-width": "2",
      stroke: "currentColor",
      class: "w-5 h-5",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
      }),
    ],
  );

const ExpenseIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "stroke-width": "2",
      stroke: "currentColor",
      class: "w-5 h-5",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z",
      }),
    ],
  );

const UserIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "stroke-width": "2",
      stroke: "currentColor",
      class: "w-5 h-5",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
      }),
    ],
  );

const UserProfileIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "stroke-width": "2",
      stroke: "currentColor",
      class: "w-5 h-5",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
      }),
    ],
  );

const LogoutIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "stroke-width": "2",
      stroke: "currentColor",
      class: "w-5 h-5",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
      }),
    ],
  );

const AppointmentIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "stroke-width": "2",
      stroke: "currentColor",
      class: "w-5 h-5",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
      }),
    ],
  );

const CalendarCheckIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "stroke-width": "2",
      stroke: "currentColor",
      class: "w-5 h-5",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
      }),
    ],
  );

const ScheduleIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "stroke-width": "2",
      stroke: "currentColor",
      class: "w-5 h-5",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
      }),
    ],
  );

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const appStore = useAppStore();
const notificationStore = useNotificationStore();
const notificationDropdownVisible = ref(false);
const notificationDropdownRef = ref<any>(null);

const activeMenu = computed(() => route.path);

// Menu items configuration
const menuItems = computed(() => {
  const items = [];

  if (authStore.isAdmin) {
    items.push({
      path: "/admin",
      route: { name: "AdminDashboard" },
      label: "Dashboard",
      icon: h(DashboardIcon),
    });
  }

  // Public site shortcuts
  items.push({
    path: "/public",
    route: { path: "/public", query: { returnTo: route.fullPath } },
    label: "Giới thiệu",
    icon: h(DashboardIcon),
  });

  // ========== ADMIN MENU ==========
  if (authStore.isAdmin) {
    items.push(
      {
        path: "/users",
        route: { name: "Users" },
        label: "Người dùng",
        icon: h(UserIcon),
      },
      {
        path: "/appointments",
        route: { name: "Appointments" },
        label: "Lịch khám",
        icon: h(AppointmentIcon),
      },
      {
        path: "/doctor-capacities",
        route: { name: "DoctorCapacities" },
        label: "Phân công làm việc",
        icon: h(ScheduleIcon),
      },
      {
        path: "/admin/doctor-schedule-requests",
        route: { name: "DoctorScheduleApprovals" },
        label: "Duyệt lịch bác sĩ",
        icon: h(CalendarCheckIcon),
      },
      {
        path: "/patients",
        route: { name: "Patients" },
        label: "Bệnh nhân",
        icon: h(PatientIcon),
      },
      {
        path: "/medical-records",
        route: { name: "MedicalRecords" },
        label: "Phiếu khám",
        icon: h(MedicalRecordIcon),
      },
      {
        path: "/services",
        route: { name: "Services" },
        label: "Dịch vụ",
        icon: h(ServiceIcon),
      },
      {
        path: "/public-contents",
        route: { name: "PublicContents" },
        label: "Thông tin công khai",
        icon: h(ServiceIcon),
      },
      {
        path: "/treatment-plans",
        route: { name: "TreatmentPlans" },
        label: "Kế hoạch điều trị",
        icon: h(PlanIcon),
      },
      {
        path: "/invoices",
        route: { name: "Invoices" },
        label: "Hóa đơn",
        icon: h(InvoiceIcon),
      },
      {
        path: "/medicines",
        route: { name: "Medicines" },
        label: "Thuốc",
        icon: h(MedicineIcon),
      },
      {
        path: "/prescriptions",
        route: { name: "Prescriptions" },
        label: "Đơn thuốc",
        icon: h(PrescriptionIcon),
      },
      {
        path: "/inventory-report",
        route: { name: "InventoryReport" },
        label: "Báo cáo tồn kho",
        icon: h(InventoryIcon),
      },
      {
        path: "/expenses",
        route: { name: "Expenses" },
        label: "Chi phí",
        icon: h(ExpenseIcon),
      },
    );
  }

  // ========== CASHIER MENU ==========
  if (authStore.isCashier) {
    items.push(
      {
        path: "/appointments",
        route: { name: "Appointments" },
        label: "Quản lý lịch khám",
        icon: h(AppointmentIcon),
      },
      {
        path: "/patients",
        route: { name: "Patients" },
        label: "Bệnh nhân",
        icon: h(PatientIcon),
      },
      {
        path: "/invoices",
        route: { name: "Invoices" },
        label: "Hóa đơn",
        icon: h(InvoiceIcon),
      },
      {
        path: "/medicines",
        route: { name: "Medicines" },
        label: "Kho thuốc",
        icon: h(MedicineIcon),
      },
      {
        path: "/prescriptions",
        route: { name: "Prescriptions" },
        label: "Đơn thuốc",
        icon: h(PrescriptionIcon),
      },
      {
        path: "/inventory-report",
        route: { name: "InventoryReport" },
        label: "Báo cáo tồn kho",
        icon: h(InventoryIcon),
      },
      {
        path: "/services",
        route: { name: "Services" },
        label: "Dịch vụ",
        icon: h(ServiceIcon),
      },
      {
        path: "/public-contents",
        route: { name: "PublicContents" },
        label: "Thông tin công khai",
        icon: h(ServiceIcon),
      },
      {
        path: "/expenses",
        route: { name: "Expenses" },
        label: "Chi phí",
        icon: h(ExpenseIcon),
      },
    );
  }

  // ========== DOCTOR MENU ==========
  if (authStore.isDoctor) {
    items.push(
      {
        path: "/my-appointments",
        route: { name: "MyAppointments" },
        label: "Lịch hẹn của tôi",
        icon: h(CalendarCheckIcon),
      },
      {
        path: "/doctor/schedule-requests",
        route: { name: "DoctorScheduleRequests" },
        label: "Đăng ký lịch làm việc",
        icon: h(ScheduleIcon),
      },
      {
        path: "/patients",
        route: { name: "Patients" },
        label: "Bệnh nhân",
        icon: h(PatientIcon),
      },
      {
        path: "/medical-records",
        route: { name: "MedicalRecords" },
        label: "Phiếu khám",
        icon: h(MedicalRecordIcon),
      },
      {
        path: "/treatment-plans",
        route: { name: "TreatmentPlans" },
        label: "Kế hoạch điều trị",
        icon: h(PlanIcon),
      },
      {
        path: "/prescriptions",
        route: { name: "Prescriptions" },
        label: "Đơn thuốc",
        icon: h(PrescriptionIcon),
      },
      {
        path: "/services",
        route: { name: "Services" },
        label: "Dịch vụ",
        icon: h(ServiceIcon),
      },
    );
  }

  // ========== PATIENT MENU ==========
  if (authStore.isPatient) {
    items.push(
      {
        path: "/patient",
        route: { name: "PatientDashboard" },
        label: "Hồ sơ của tôi",
        icon: h(PatientIcon),
      },
      {
        path: "/patient/appointments",
        route: { name: "PatientAppointments" },
        label: "Đặt lịch khám",
        icon: h(AppointmentIcon),
      },
    );
  }

  return items;
});

// Display name with fallback: fullName -> username -> email
const displayName = computed(() => {
  const user = authStore.user;
  return user?.fullName || user?.username || user?.email || "User";
});

// Avatar initial with fallback
const avatarInitial = computed(() => {
  const user = authStore.user;
  const name = user?.fullName || user?.username || user?.email || "?";
  return name[0]?.toUpperCase() || "?";
});

const getCurrentDate = () => {
  return new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm(
      "Bạn có chắc chắn muốn đăng xuất?",
      "Xác nhận đăng xuất",
      {
        confirmButtonText: "Đăng xuất",
        cancelButtonText: "Hủy",
        customClass: "modern-logout-dialog",
        confirmButtonClass: "modern-logout-confirm-button",
        cancelButtonClass: "modern-cancel-button",
      },
    );
    await authStore.logout();
    notificationStore.stopRealtime();
    router.push({ name: "Login" });
  } catch (error) {
    // User cancelled
  }
};

const closeNotificationDropdown = () => {
  notificationDropdownVisible.value = false;
  notificationDropdownRef.value?.handleClose?.();
  void nextTick(() => {
    notificationDropdownVisible.value = false;
  });
};

const goToNotificationPage = () => {
  closeNotificationDropdown();
  if (route.name !== "Notifications") {
    void router.push({ name: "Notifications" });
  }
};

const handleOpenNotification = (id: string) => {
  closeNotificationDropdown();
  void notificationStore.markAsRead(id);
  void notificationStore.loadMyNotifications();
  if (route.name !== "Notifications") {
    void router.push({ name: "Notifications" });
  }
};

const handleMarkAllAndClose = async () => {
  await notificationStore.markAllAsRead();
  closeNotificationDropdown();
};

const handleViewAllAndClose = () => {
  goToNotificationPage();
};

const formatNotificationTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

watch(
  () => authStore.user?.id,
  (userId) => {
    if (userId && authStore.isAuthenticated) {
      notificationStore.startRealtime(userId);
    } else {
      notificationStore.stopRealtime();
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  notificationStore.stopRealtime();
});
</script>

<style scoped>
/* Scrollbar styling */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.notification-bell {
  position: relative;
  width: 52px;
  height: 52px;
  border-radius: 16px;
  border: 1px solid #bfdbfe;
  background: linear-gradient(135deg, #e0f2fe, #dbeafe);
  color: #0f766e;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.notification-bell:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(14, 116, 144, 0.2);
}

.notification-badge {
  position: absolute;
  right: -6px;
  top: -8px;
  min-width: 22px;
  height: 22px;
  border-radius: 999px;
  background: #ef4444;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 0 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #fff;
}

.notification-menu {
  width: 370px;
  max-width: calc(100vw - 32px);
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.16);
  overflow: hidden;
}

.notification-menu-header {
  padding: 12px 14px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #f0fdfa, #f0f9ff);
}

.notification-menu-header .title {
  font-weight: 700;
  color: #0f172a;
  font-size: 15px;
  letter-spacing: 0.2px;
}

.mark-read-btn {
  border: none;
  background: #e0f2fe;
  color: #0c4a6e;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 10px;
  cursor: pointer;
}

.mark-read-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.notification-items {
  max-height: 300px;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.notification-item {
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  text-align: left;
  padding: 10px 11px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.notification-item:hover {
  border-color: #99f6e4;
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.08);
  transform: translateY(-1px);
}

.notification-item.unread {
  background: linear-gradient(135deg, #f0fdfa, #f8fafc);
  border-color: #99f6e4;
}

.item-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.item-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #14b8a6;
  flex-shrink: 0;
}

.item-title {
  color: #0f172a;
  font-weight: 700;
  font-size: 14px;
}

.item-time {
  color: #64748b;
  font-size: 12px;
  white-space: nowrap;
}

.item-message {
  color: #334155;
  font-size: 14px;
  line-height: 1.4;
  margin-top: 5px;
}

.notification-empty {
  padding: 32px 14px;
  text-align: center;
  color: #64748b;
  font-size: 14px;
}

.view-all-btn {
  width: 100%;
  border: none;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  color: #0f766e;
  font-weight: 600;
  padding: 12px;
  cursor: pointer;
  border-top: 1px solid #e2e8f0;
}

.view-all-btn:hover {
  background: #f1f5f9;
}
</style>
