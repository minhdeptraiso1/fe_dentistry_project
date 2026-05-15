<template>
  <div class="service-list-view">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Danh mục dịch vụ</h1>
        <p class="page-subtitle">Quản lý danh mục dịch vụ nha khoa</p>
      </div>
      <button v-if="authStore.isAdmin" @click="handleCreate" class="add-button">
        <component :is="PlusIcon" />
        <span>Thêm dịch vụ</span>
      </button>
    </div>

    <!-- Search Card -->
    <div class="search-card">
      <div class="search-header">
        <component :is="SearchIcon" class="search-header-icon" />
        <span class="search-header-text">Tìm kiếm dịch vụ</span>
      </div>
      <div class="search-content">
        <div class="search-row">
          <el-input
            v-model="searchParams.keyword"
            placeholder="Tên hoặc mã dịch vụ..."
            clearable
            @clear="handleSearch"
            class="search-input"
          >
            <template #prefix>
              <component :is="SearchIcon" class="input-icon" />
            </template>
          </el-input>

          <el-select
            v-model="searchParams.type"
            placeholder="Loại dịch vụ"
            clearable
            @change="handleSearch"
            class="search-select"
          >
            <el-option label="Đơn lẻ" value="SINGLE" />
            <el-option label="Gói dịch vụ" value="PACKAGE" />
          </el-select>

          <el-input
            v-model="searchParams.category"
            placeholder="Danh mục..."
            clearable
            @clear="handleSearch"
            class="search-input"
          >
            <template #prefix>
              <component :is="CategoryIcon" class="input-icon" />
            </template>
          </el-input>

          <el-select
            v-model="searchParams.active"
            placeholder="Trạng thái"
            clearable
            @change="handleSearch"
            class="search-select"
          >
            <el-option label="Hoạt động" :value="true" />
            <el-option label="Ngừng hoạt động" :value="false" />
          </el-select>
        </div>

        <div class="search-actions">
          <button @click="handleSearch" class="search-button">
            <component :is="SearchIcon" />
            <span>Tìm kiếm</span>
          </button>
          <button @click="handleReset" class="reset-button">
            <component :is="ResetIcon" />
            <span>Đặt lại</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Table Card -->
    <div class="table-card">
      <el-table
        v-loading="loading"
        :data="services"
        stripe
        class="modern-table"
      >
        <el-table-column prop="code" label="Mã dịch vụ" width="120" />
        <el-table-column prop="name" label="Tên dịch vụ" min-width="200" />
        <el-table-column label="Loại" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.type === 'SINGLE'" type="info" effect="light">
              Đơn lẻ
            </el-tag>
            <el-tag v-else type="success" effect="light">Gói dịch vụ</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="Danh mục" width="150">
          <template #default="{ row }">
            <span class="text-gray-600">{{ row.category || "-" }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Giá" width="150" align="right">
          <template #default="{ row }">
            <span class="text-gray-900 font-medium">{{
              formatCurrency(row.basePrice)
            }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="unit" label="Đơn vị" width="100">
          <template #default="{ row }">
            <span class="text-gray-600">{{ row.unit || "-" }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Thời gian" width="110" align="center">
          <template #default="{ row }">
            <span class="text-gray-600">{{
              row.durationMin ? `${row.durationMin} phút` : "-"
            }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Trạng thái" width="130" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.active" type="success" effect="light">
              Hoạt động
            </el-tag>
            <el-tag v-else type="danger" effect="light">Ngừng</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="Thao tác"
          width="260"
          align="center"
          fixed="right"
        >
          <template #default="{ row }">
            <div class="action-buttons">
              <button
                @click="handleView(row)"
                class="action-btn action-btn-info"
              >
                <component :is="EyeIcon" />
                <span>Xem</span>
              </button>
              <button
                v-if="authStore.isAdmin"
                @click="handleEdit(row)"
                class="action-btn action-btn-primary"
              >
                <component :is="EditIcon" />
                <span>Sửa</span>
              </button>
              <button
                v-if="authStore.isAdmin"
                @click="handleDelete(row)"
                class="action-btn action-btn-danger"
              >
                <component :is="TrashIcon" />
                <span>Xóa</span>
              </button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="searchParams.page"
          v-model:page-size="searchParams.size"
          :total="totalElements"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="loadServices"
          @size-change="loadServices"
        />
      </div>
    </div>

    <!-- Form Dialog -->
    <ServiceFormDialog
      v-model="dialogVisible"
      :service="selectedService"
      @success="handleSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h } from "vue";
import { useRouter } from "vue-router";
import { ElMessageBox } from "element-plus";
import { notification } from "@/utils/notification";
import { serviceApi } from "@/api/service";
import { sortByCreatedAtDesc } from "@/utils/sort";
import { useAuthStore } from "@/stores/auth";
import ServiceFormDialog from "./components/ServiceFormDialog.vue";
import type { ServiceCatalog, ServiceSearchRequest } from "@/types/service";

// Custom Icons
const PlusIcon = () =>
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
        d: "M12 4v16m8-8H4",
      }),
    ],
  );

const SearchIcon = () =>
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
        d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
      }),
    ],
  );

const CategoryIcon = () =>
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
        d: "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z",
      }),
    ],
  );

const ResetIcon = () =>
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
        d: "M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99",
      }),
    ],
  );

const EyeIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "stroke-width": "2",
      stroke: "currentColor",
      class: "w-4 h-4",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z",
      }),
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z",
      }),
    ],
  );

const EditIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "stroke-width": "2",
      stroke: "currentColor",
      class: "w-4 h-4",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10",
      }),
    ],
  );

const TrashIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "stroke-width": "2",
      stroke: "currentColor",
      class: "w-4 h-4",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0",
      }),
    ],
  );

const router = useRouter();
const authStore = useAuthStore();

const loading = ref(false);
const services = ref<ServiceCatalog[]>([]);
const totalElements = ref(0);
const dialogVisible = ref(false);
const selectedService = ref<ServiceCatalog | null>(null);

const searchParams = reactive<ServiceSearchRequest>({
  keyword: "",
  type: undefined,
  category: "",
  active: undefined,
  page: 1,
  size: 10,
});

/**
 * Format currency
 */
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

/**
 * Load services from API
 */
const loadServices = async () => {
  try {
    loading.value = true;

    // Build params, filter out empty values
    const params: any = {
      page: (searchParams.page || 1) - 1, // Backend uses 0-based index
      size: searchParams.size || 10,
    };

    if (searchParams.keyword?.trim()) {
      params.keyword = searchParams.keyword.trim();
    }
    if (searchParams.type) {
      params.type = searchParams.type;
    }
    if (searchParams.category?.trim()) {
      params.category = searchParams.category.trim();
    }
    if (searchParams.active !== undefined && searchParams.active !== null) {
      params.active = searchParams.active;
    }

    const pageData = await serviceApi.search(params);
    services.value = sortByCreatedAtDesc(pageData.content || []);
    totalElements.value = pageData.totalElements;
  } catch (error: any) {
    console.error("Load services error:", error);
    notification.error("Không thể tải danh sách dịch vụ");
  } finally {
    loading.value = false;
  }
};

/**
 * Handle search
 */
const handleSearch = () => {
  searchParams.page = 1; // Reset to first page
  loadServices();
};

/**
 * Handle reset filters
 */
const handleReset = () => {
  searchParams.keyword = "";
  searchParams.type = undefined;
  searchParams.category = "";
  searchParams.active = undefined;
  searchParams.page = 1;
  loadServices();
};

/**
 * Handle create
 */
const handleCreate = () => {
  selectedService.value = null;
  dialogVisible.value = true;
};

/**
 * Handle view
 */
const handleView = (service: ServiceCatalog) => {
  router.push({ name: "ServiceDetail", params: { id: service.id } });
};

/**
 * Handle edit
 */
const handleEdit = (service: ServiceCatalog) => {
  selectedService.value = service;
  dialogVisible.value = true;
};

/**
 * Handle delete
 */
const handleDelete = async (service: ServiceCatalog) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa dịch vụ "${service.name}"?`,
      "Xác nhận xóa",
      {
        confirmButtonText: "Xóa",
        cancelButtonText: "Hủy",
        customClass: "modern-confirm-dialog",
        confirmButtonClass: "modern-confirm-button",
        cancelButtonClass: "modern-cancel-button",
      },
    );

    loading.value = true;
    await serviceApi.delete(service.id);
    notification.success("Xóa dịch vụ thành công!");
    await loadServices();
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("Delete service error:", error);
      notification.error(error?.message || "Không thể xóa dịch vụ");
    }
  } finally {
    loading.value = false;
  }
};

/**
 * Handle success (after create/update)
 */
const handleSuccess = () => {
  dialogVisible.value = false;
  loadServices();
};

/**
 * Load services on mount
 */
onMounted(() => {
  loadServices();
});
</script>

<style scoped lang="scss">
.service-list-view {
  padding: 24px;
  background: #f9fafb;
  min-height: 100vh;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding: 24px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    .page-title {
      font-size: 28px;
      font-weight: 700;
      background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin: 0 0 4px 0;
    }

    .page-subtitle {
      font-size: 14px;
      color: #6b7280;
      margin: 0;
    }

    .add-button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(20, 184, 166, 0.4);
      }
    }
  }

  .search-card {
    background: white;
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    .search-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 2px solid #f3f4f6;

      .search-header-icon {
        width: 24px;
        height: 24px;
        color: #14b8a6;
      }

      .search-header-text {
        font-size: 18px;
        font-weight: 600;
        color: #111827;
      }
    }

    .search-content {
      .search-row {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        margin-bottom: 16px;

        .search-input,
        .search-select {
          :deep(.el-input__wrapper) {
            border-radius: 10px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;

            &:hover {
              box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
            }

            &.is-focus {
              box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
            }
          }
        }
      }

      .search-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-start;

        button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .search-button {
          background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(20, 184, 166, 0.4);
          }
        }

        .reset-button {
          background: white;
          color: #6b7280;
          border: 1px solid #e5e7eb;

          &:hover {
            background: #f9fafb;
            border-color: #d1d5db;
            color: #374151;
          }
        }
      }
    }
  }

  .table-card {
    background: white;
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    .modern-table {
      :deep(.el-table__header) {
        th {
          background: #f9fafb;
          color: #374151;
          font-weight: 600;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      }

      :deep(.el-table__row) {
        transition: all 0.2s ease;

        &:hover {
          background: #f0fdfa !important;
        }
      }
    }

    .action-buttons {
      display: flex;
      gap: 6px;
      justify-content: center;
      flex-wrap: nowrap;
    }

    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;

      &.action-btn-info {
        background: #eff6ff;
        color: #2563eb;

        &:hover {
          background: #dbeafe;
          transform: translateY(-1px);
        }
      }

      &.action-btn-primary {
        background: #ecfdf5;
        color: #14b8a6;

        &:hover {
          background: #d1fae5;
          transform: translateY(-1px);
        }
      }

      &.action-btn-danger {
        background: #fef2f2;
        color: #ef4444;

        &:hover {
          background: #fee2e2;
          transform: translateY(-1px);
        }
      }
    }
  }

  .pagination-wrapper {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #f3f4f6;
    display: flex;
    justify-content: center;

    :deep(.el-pagination) {
      .btn-prev,
      .btn-next,
      .el-pager li {
        border-radius: 8px;
        font-weight: 500;

        &:hover {
          color: #14b8a6;
        }

        &.is-active {
          background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
          color: white;
        }
      }
    }
  }

  .input-icon {
    width: 16px;
    height: 16px;
    color: #9ca3af;
  }
}
</style>
