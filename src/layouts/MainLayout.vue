<template>
  <div class="main-layout">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ collapsed: appStore.sidebarCollapsed }">
      <div class="sidebar-header">
        <div class="logo">
          <el-icon :size="28"><Tooth /></el-icon>
          <span v-show="!appStore.sidebarCollapsed" class="logo-text"
            >Dental Clinic</span
          >
        </div>
      </div>

      <el-menu
        :default-active="activeMenu"
        :collapse="appStore.sidebarCollapsed"
        :router="true"
        class="sidebar-menu"
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
    <div class="main-container">
      <!-- Header -->
      <header class="header">
        <div class="header-left">
          <el-button circle @click="appStore.toggleSidebar">
            <el-icon
              ><Fold v-if="!appStore.sidebarCollapsed" /><Expand v-else
            /></el-icon>
          </el-button>
          <h2 class="page-title">
            {{ appStore.pageTitle || route.meta.title }}
          </h2>
        </div>

        <div class="header-right">
          <el-dropdown trigger="click">
            <div class="user-profile">
              <el-avatar :size="40" :src="authStore.user?.avatar">
                {{ authStore.user?.fullName?.[0] }}
              </el-avatar>
              <span class="user-name">{{ authStore.user?.fullName }}</span>
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
      <main class="content">
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

<style scoped lang="scss">
.main-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  width: 260px;
  background: #001529;
  transition: width 0.3s;
  display: flex;
  flex-direction: column;

  &.collapsed {
    width: 64px;
  }

  .sidebar-header {
    height: 64px;
    display: flex;
    align-items: center;
    padding: 0 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #fff;
      font-size: 20px;
      font-weight: 600;

      .logo-text {
        white-space: nowrap;
      }
    }
  }

  .sidebar-menu {
    flex: 1;
    border: none;
    background: transparent;

    :deep(.el-menu-item) {
      color: rgba(255, 255, 255, 0.85);

      &:hover {
        background: rgba(255, 255, 255, 0.08);
      }

      &.is-active {
        background: #1890ff;
        color: #fff;
      }
    }
  }
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  height: 64px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  z-index: 10;

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;

    .page-title {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #1f1f1f;
    }
  }

  .header-right {
    .user-profile {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      padding: 4px 12px;
      border-radius: 20px;
      transition: all 0.3s;

      &:hover {
        background: #f5f5f5;
      }

      .user-name {
        font-weight: 500;
        color: #1f1f1f;
      }
    }
  }
}

.content {
  flex: 1;
  overflow-y: auto;
  background: #f0f2f5;
  padding: 24px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
