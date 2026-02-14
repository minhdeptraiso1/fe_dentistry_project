<template>
  <div class="flex h-screen overflow-hidden">
    <!-- Sidebar -->
    <aside
      class="bg-[#001529] transition-[width] duration-300 flex flex-col"
      :class="appStore.sidebarCollapsed ? 'w-16' : 'w-64'"
    >
      <div class="h-16 flex items-center px-4 border-b border-white/10">
        <div class="flex items-center gap-3 text-white text-xl font-semibold">
          <el-icon :size="28"><Tooth /></el-icon>
          <span v-show="!appStore.sidebarCollapsed" class="whitespace-nowrap"
            >Dental Clinic</span
          >
        </div>
      </div>

      <el-menu
        :default-active="activeMenu"
        :collapse="appStore.sidebarCollapsed"
        :router="true"
        class="flex-1 border-none bg-transparent"
      >
        <el-menu-item index="/" :route="{ name: 'Dashboard' }">
          <el-icon><HomeFilled /></el-icon>
          <span>Tổng quan</span>
        </el-menu-item>

        <el-menu-item index="/patients" :route="{ name: 'Patients' }">
          <el-icon><User /></el-icon>
          <span>Bệnh nhân</span>
        </el-menu-item>

        <el-menu-item index="/appointments" :route="{ name: 'Appointments' }">
          <el-icon><Calendar /></el-icon>
          <span>Lịch hẹn</span>
        </el-menu-item>

        <el-menu-item index="/treatments" :route="{ name: 'Treatments' }">
          <el-icon><Document /></el-icon>
          <span>Điều trị</span>
        </el-menu-item>

        <el-menu-item
          v-if="authStore.isAdmin"
          index="/services"
          :route="{ name: 'Services' }"
        >
          <el-icon><Grid /></el-icon>
          <span>Dịch vụ</span>
        </el-menu-item>
      </el-menu>
    </aside>

    <!-- Main content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <header
        class="h-16 bg-white shadow-sm flex items-center justify-between px-6 z-10"
      >
        <div class="flex items-center gap-4">
          <el-button circle @click="appStore.toggleSidebar">
            <el-icon
              ><Fold v-if="!appStore.sidebarCollapsed" /><Expand v-else
            /></el-icon>
          </el-button>
          <h2 class="m-0 text-xl font-semibold text-gray-900">
            {{ appStore.pageTitle || route.meta.title }}
          </h2>
        </div>

        <div>
          <el-dropdown trigger="click">
            <div
              class="flex items-center gap-3 cursor-pointer px-3 py-1 rounded-full hover:bg-gray-100 transition-all"
            >
              <el-avatar :size="40" :src="authStore.user?.avatar">
                {{ authStore.user?.fullName?.[0] }}
              </el-avatar>
              <span class="font-medium text-gray-900">{{
                authStore.user?.fullName
              }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="router.push({ name: 'Profile' })">
                  <el-icon><User /></el-icon>
                  Thông tin cá nhân
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">
                  <el-icon><SwitchButton /></el-icon>
                  Đăng xuất
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- Page content -->
      <main class="flex-1 overflow-y-auto bg-gray-100 p-6">
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
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useAppStore } from "@/stores/app";
import { ElMessageBox } from "element-plus";
import {
  HomeFilled,
  User,
  Calendar,
  Document,
  Grid,
  Fold,
  Expand,
  ArrowDown,
  SwitchButton,
} from "@element-plus/icons-vue";

// Fake icon for demo - replace with actual tooth icon
const Tooth = HomeFilled;

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const appStore = useAppStore();

const activeMenu = computed(() => route.path);

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm("Bạn có chắc chắn muốn đăng xuất?", "Xác nhận", {
      confirmButtonText: "Đăng xuất",
      cancelButtonText: "Hủy",
      type: "warning",
    });
    await authStore.logout();
    router.push({ name: "Login" });
  } catch (error) {
    // User cancelled
  }
};
</script>

<style scoped>
/* Element Plus menu custom styles */
:deep(.el-menu-item) {
  color: rgba(255, 255, 255, 0.85);
}

:deep(.el-menu-item:hover) {
  background: rgba(255, 255, 255, 0.08) !important;
}

:deep(.el-menu-item.is-active) {
  background: #1890ff !important;
  color: #fff !important;
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
</style>
