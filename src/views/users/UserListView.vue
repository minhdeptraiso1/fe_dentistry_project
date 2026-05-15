<template>
  <div class="user-list-view">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Quản lý người dùng</h1>
        <p class="page-subtitle">Quản lý tài khoản và phân quyền</p>
      </div>
      <button @click="handleCreate" class="add-button">
        <component :is="PlusIcon" />
        <span>Thêm người dùng</span>
      </button>
    </div>

    <!-- Search Card -->
    <div class="search-card">
      <div class="search-header">
        <component :is="SearchIcon" class="search-header-icon" />
        <span class="search-header-text">Tìm kiếm người dùng</span>
      </div>
      <div class="search-content">
        <div class="search-row">
          <el-input
            v-model="filterForm.keyword"
            placeholder="Tên đăng nhập, email, tên..."
            clearable
            class="search-input"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <component :is="SearchIcon" style="width: 16px; height: 16px" />
            </template>
          </el-input>

          <el-select
            v-model="filterForm.role"
            placeholder="Tất cả vai trò"
            clearable
            class="search-select"
            @change="handleSearch"
          >
            <el-option
              v-for="(label, key) in UserRoleLabels"
              :key="key"
              :label="label"
              :value="key"
            />
          </el-select>

          <el-select
            v-model="filterForm.enabled"
            placeholder="Trạng thái"
            clearable
            class="search-select"
            @change="handleSearch"
          >
            <el-option label="Đang hoạt động" :value="true" />
            <el-option label="Đã khóa" :value="false" />
          </el-select>
        </div>

        <div class="search-actions">
          <button @click="handleSearch" class="search-button primary">
            <component :is="SearchIcon" />
            <span>Tìm kiếm</span>
          </button>
          <button @click="handleReset" class="search-button secondary">
            <component :is="RefreshIcon" />
            <span>Đặt lại</span>
          </button>
        </div>
      </div>
    </div>

    <!-- User Cards Grid -->
    <div v-loading="loading" class="users-grid">
      <div
        v-for="user in users"
        :key="user.id"
        class="user-card"
        @click="handleViewDetail(user)"
      >
        <!-- Status Indicator -->
        <div
          class="status-indicator"
          :class="user.enabled ? 'active' : 'inactive'"
        ></div>

        <div class="card-header">
          <div class="user-avatar">
            <img v-if="user.img" :src="user.img" alt="Avatar" />
            <component v-else :is="UserIcon" />
          </div>
          <div class="user-basic-info">
            <h3 class="user-name">{{ user.name }}</h3>
            <p class="user-username">@{{ user.username }}</p>
          </div>
        </div>

        <div class="card-body">
          <div class="info-row">
            <component :is="MailIcon" class="info-icon" />
            <span class="info-text">{{ user.email }}</span>
          </div>
          <div class="info-row">
            <el-tag
              :type="getRoleTagType(user.role)"
              effect="dark"
              size="small"
            >
              {{ UserRoleLabels[user.role] }}
            </el-tag>
          </div>
        </div>

        <div class="card-footer">
          <div class="action-buttons" @click.stop>
            <el-button
              type="primary"
              size="small"
              :icon="EditIcon"
              @click="handleEdit(user)"
              class="action-button edit-button"
            >
              Sửa
            </el-button>
            <el-button
              type="info"
              size="small"
              :icon="EyeIcon"
              @click="handleViewDetail(user)"
              class="action-button info-button"
            >
              Xem chi tiết
            </el-button>
            <el-button
              type="danger"
              size="small"
              :icon="TrashIcon"
              @click="handleDelete(user)"
              class="action-button delete-button"
            >
              Xóa
            </el-button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <el-empty
        v-if="!loading && users.length === 0"
        description="Không tìm thấy người dùng"
        class="empty-state"
      >
        <template #image>
          <component
            :is="UserIcon"
            style="width: 80px; height: 80px; color: #d1d5db"
          />
        </template>
      </el-empty>
    </div>

    <!-- Pagination -->
    <div v-if="users.length > 0" class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[12, 24, 48, 96]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadUsers"
        @current-change="loadUsers"
      />
    </div>

    <!-- User Form Dialog -->
    <UserFormDialog
      v-if="dialogVisible"
      v-model="dialogVisible"
      :user="currentUser"
      @success="handleSuccess"
    />

    <!-- User Detail Dialog -->
    <UserDetailDialog
      v-if="detailDialogVisible"
      v-model="detailDialogVisible"
      :user-id="currentUserId"
      @refresh="loadUsers"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { userApi } from "@/api/user";
import { sortByCreatedAtDesc } from "@/utils/sort";
import type { User, UserSearchRequest, UserRole } from "@/types/user";
import { UserRoleLabels } from "@/types/user";
import UserFormDialog from "./components/UserFormDialog.vue";
import UserDetailDialog from "./components/UserDetailDialog.vue";

// Custom Icons
const PlusIcon = () =>
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
      h("line", { x1: "12", y1: "5", x2: "12", y2: "19" }),
      h("line", { x1: "5", y1: "12", x2: "19", y2: "12" }),
    ],
  );

const SearchIcon = () =>
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
      h("circle", { cx: "11", cy: "11", r: "8" }),
      h("path", { d: "m21 21-4.35-4.35" }),
    ],
  );

const RefreshIcon = () =>
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
      h("path", { d: "M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }),
      h("path", { d: "M3 3v5h5" }),
      h("path", { d: "M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" }),
      h("path", { d: "M16 21h5v-5" }),
    ],
  );

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

const EditIcon = () =>
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
      h("path", { d: "M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" }),
      h("path", { d: "m15 5 4 4" }),
    ],
  );

const TrashIcon = () =>
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
      h("path", { d: "M3 6h18" }),
      h("path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }),
      h("path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" }),
    ],
  );

const ResetPasswordIcon = () =>
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
      h("rect", { x: "3", y: "11", width: "18", height: "11", rx: "2", ry: "2" }),
      h("path", { d: "M7 11V7a5 5 0 0 1 10 0v4" }),
    ],
  );

const EyeIcon = () =>
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
      h("path", { d: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" }),
      h("circle", { cx: "12", cy: "12", r: "3" }),
    ],
  );

// State
const loading = ref(false);
const users = ref<User[]>([]);
const dialogVisible = ref(false);
const detailDialogVisible = ref(false);
const currentUser = ref<User | null>(null);
const currentUserId = ref<string>("");

const filterForm = reactive<UserSearchRequest>({
  keyword: "",
  role: undefined,
  enabled: undefined,
});

const pagination = reactive({
  page: 1,
  size: 12,
  total: 0,
});

// Methods
const loadUsers = async () => {
  try {
    loading.value = true;
    const response = await userApi.search(
      filterForm,
      pagination.page - 1,
      pagination.size,
    );
    users.value = sortByCreatedAtDesc(response.content || []);
    pagination.total = response.totalElements;
  } catch (error: any) {
    ElMessage.error(error.message || "Không thể tải danh sách người dùng");
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.page = 1;
  loadUsers();
};

const handleReset = () => {
  filterForm.keyword = "";
  filterForm.role = undefined;
  filterForm.enabled = undefined;
  handleSearch();
};

const handleCreate = () => {
  currentUser.value = null;
  dialogVisible.value = true;
};

const handleEdit = (user: User) => {
  currentUser.value = user;
  dialogVisible.value = true;
};

const handleViewDetail = (user: User) => {
  currentUserId.value = user.id;
  detailDialogVisible.value = true;
};

const handleDelete = async (user: User) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa người dùng "${user.name}" (@${user.username})?`,
      "Xác nhận xóa",
      {
        confirmButtonText: "Xóa",
        cancelButtonText: "Hủy",
        customClass: "danger-confirm-dialog",
      },
    );

    await userApi.delete(user.id);
    ElMessage.success("Xóa người dùng thành công");
    loadUsers();
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(error.message || "Không thể xóa người dùng");
    }
  }
};

const handleSuccess = () => {
  dialogVisible.value = false;
  loadUsers();
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

onMounted(() => {
  loadUsers();
});
</script>

<style scoped lang="scss">
.user-list-view {
  padding: 24px;
  max-width: 1600px;
  margin: 0 auto;
}

// Page Header
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 4px;
}

.page-subtitle {
  font-size: 14px;
  color: #6b7280;
}

.add-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);

  svg {
    width: 18px;
    height: 18px;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(20, 184, 166, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
}

// Search Card
.search-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
  overflow: hidden;
}

.search-header {
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  padding: 16px 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;

  .search-header-icon {
    width: 20px;
    height: 20px;
  }

  .search-header-text {
    font-size: 16px;
    font-weight: 600;
  }
}

.search-content {
  padding: 24px;
}

.search-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.search-actions {
  display: flex;
  gap: 12px;
}

.search-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;

  svg {
    width: 16px;
    height: 16px;
  }

  &.primary {
    background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
    color: white;
    box-shadow: 0 2px 8px rgba(20, 184, 166, 0.3);

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(20, 184, 166, 0.4);
    }
  }

  &.secondary {
    background: #f3f4f6;
    color: #6b7280;

    &:hover {
      background: #e5e7eb;
    }
  }
}

// Users Grid
.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
  min-height: 400px;
}

.user-card {
  position: relative;
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    border-color: #14b8a6;
  }
}

.status-indicator {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  box-shadow: 0 0 0 2px white;
  z-index: 10;

  &.active {
    background: #10b981;
  }

  &.inactive {
    background: #ef4444;
  }
}

.card-header {
  background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%);
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-avatar {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;

  svg {
    width: 32px;
    height: 32px;
    color: white;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.user-basic-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-username {
  font-size: 14px;
  color: #6b7280;
}

.card-body {
  padding: 20px 24px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }

  .info-icon {
    width: 16px;
    height: 16px;
    color: #6b7280;
    flex-shrink: 0;
  }

  .info-text {
    font-size: 14px;
    color: #374151;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.card-footer {
  padding: 16px 24px;
  border-top: 1px solid #f3f4f6;
  display: flex;
  justify-content: center;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

:deep(.el-button.action-button) {
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  border: none;

  &.edit-button {
    background: #eff6ff;
    color: #3b82f6;

    &:hover {
      background: #dbeafe;
      transform: translateY(-1px);
    }
  }

  &.delete-button {
    background: #fef2f2;
    color: #ef4444;

    &:hover {
      background: #fee2e2;
      transform: translateY(-1px);
    }
  }

  &.info-button {
    background: #cff0f5;
    color: #0891b2;

    &:hover {
      background: #a5e8f5;
      transform: translateY(-1px);
    }
  }
}

// Empty State
.empty-state {
  grid-column: 1 / -1;
  padding: 60px 20px;
}

// Pagination
.pagination-container {
  display: flex;
  justify-content: flex-end;
  padding: 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>
