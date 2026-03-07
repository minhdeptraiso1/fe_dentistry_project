<template>
  <div class="patient-list-container">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Quản lý bệnh nhân</h1>
        <p class="page-subtitle">Quản lý thông tin bệnh nhân</p>
      </div>
      <button @click="handleCreate" class="add-button">
        <component :is="PlusIcon" />
        <span>Thêm bệnh nhân</span>
      </button>
    </div>

    <!-- Search Section -->
    <div class="search-card">
      <div class="search-header">
        <component :is="SearchIcon" class="search-header-icon" />
        <span class="search-header-text">Tìm kiếm bệnh nhân</span>
      </div>
      <div class="search-content">
        <div class="search-row">
          <el-input
            v-model="searchParams.keyword"
            placeholder="Tìm kiếm theo mã BN, tên bệnh nhân..."
            class="search-input"
            clearable
            @clear="loadPatients"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <component
                :is="SearchIcon"
                style="width: 16px; height: 16px; color: #9ca3af"
              />
            </template>
          </el-input>
          <el-input
            v-model="searchParams.phone"
            placeholder="Số điện thoại..."
            class="search-input"
            clearable
            @clear="loadPatients"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <component
                :is="PhoneIcon"
                style="width: 16px; height: 16px; color: #9ca3af"
              />
            </template>
          </el-input>
        </div>
        <div class="search-actions">
          <button @click="handleSearch" class="search-button">
            <component :is="SearchIcon" />
            <span>Tìm kiếm</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Patient table -->
    <div class="table-card">
      <el-table :data="patients" v-loading="loading" class="modern-table">
        <el-table-column type="index" label="STT" width="60" align="center" />
        <el-table-column prop="patientCode" label="Mã BN" width="120" />
        <el-table-column label="Họ tên" min-width="180">
          <template #default="{ row }">
            <div class="flex items-center gap-3">
              <el-avatar
                :size="36"
                class="bg-gradient-to-br from-teal-500 to-teal-600"
              >
                {{ row.fullName[0] }}
              </el-avatar>
              <span class="font-medium text-gray-900">{{ row.fullName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="Số điện thoại" width="140">
          <template #default="{ row }">
            <span class="text-gray-700">{{ row.phone }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Giới tính" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.gender === 'Nam' ? 'primary' : 'danger'"
              size="small"
              effect="light"
            >
              {{ row.gender || "-" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Ngày sinh" width="120">
          <template #default="{ row }">
            <span class="text-gray-600">{{
              row.dob ? formatDate(row.dob) : "-"
            }}</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="address"
          label="Địa chỉ"
          min-width="200"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span class="text-gray-600">{{ row.address }}</span>
          </template>
        </el-table-column>
        <el-table-column
          label="Thao tác"
          width="260"
          fixed="right"
          align="center"
        >
          <template #default="{ row }">
            <div class="action-buttons">
              <button
                @click="viewDetail(row.id)"
                class="action-btn action-btn-info"
              >
                <component :is="EyeIcon" />
                <span>Chi tiết</span>
              </button>
              <button
                @click="handleEdit(row)"
                class="action-btn action-btn-primary"
              >
                <component :is="EditIcon" />
                <span>Sửa</span>
              </button>
              <button
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
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="totalElements"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- Add/Edit Dialog -->
    <PatientFormDialog
      v-model="dialogVisible"
      :patient="selectedPatient"
      @success="handleFormSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h } from "vue";
import { useRouter } from "vue-router";
import { ElMessageBox } from "element-plus";
import { notification } from "@/utils/notification";
import { patientApi } from "@/api/patient";
import { formatDate } from "@/utils/date";
import PatientFormDialog from "./components/PatientFormDialog.vue";
import type { Patient } from "@/types";

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

const PhoneIcon = () =>
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
        d: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
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
const loading = ref(false);
const dialogVisible = ref(false);
const selectedPatient = ref<Patient | null>(null);

const searchParams = reactive({
  keyword: "",
  phone: "",
});

// Pagination
const currentPage = ref(1);
const pageSize = ref(10);
const totalElements = ref(0);
const totalPages = ref(0);

const patients = ref<Patient[]>([]);

/**
 * Load patients from backend
 */
const loadPatients = async () => {
  try {
    loading.value = true;
    const pageData = await patientApi.search({
      ...searchParams,
      page: currentPage.value - 1, // Backend uses 0-based page index
      size: pageSize.value,
    });

    // pageData is PageResponse<Patient> (axios interceptor unwrapped ApiResponse)
    patients.value = pageData.content;
    totalElements.value = pageData.totalElements;
    totalPages.value = pageData.totalPages;
  } catch (error: any) {
    console.error("Load patients error:", error);
    notification.error(error?.message || "Không thể tải danh sách bệnh nhân");
  } finally {
    loading.value = false;
  }
};

/**
 * Handle search
 */
const handleSearch = () => {
  currentPage.value = 1; // Reset to first page
  loadPatients();
};

/**
 * Handle page change
 */
const handlePageChange = (page: number) => {
  currentPage.value = page;
  loadPatients();
};

/**
 * Handle page size change
 */
const handlePageSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1; // Reset to first page
  loadPatients();
};

/**
 * View patient detail
 */
const viewDetail = (id: string) => {
  router.push(`/patients/${id}`);
};

/**
 * Handle create new patient
 */
const handleCreate = () => {
  selectedPatient.value = null;
  dialogVisible.value = true;
};

/**
 * Handle edit patient
 */
const handleEdit = (patient: Patient) => {
  selectedPatient.value = patient;
  dialogVisible.value = true;
};

/**
 * Handle delete patient
 */
const handleDelete = async (patient: Patient) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa bệnh nhân "${patient.fullName}"?`,
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
    await patientApi.delete(patient.id);
    notification.success("Xóa bệnh nhân thành công!");
    loadPatients();
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("Delete patient error:", error);
      notification.error(error?.message || "Không thể xóa bệnh nhân");
    }
  } finally {
    loading.value = false;
  }
};

/**
 * Handle form success (create/update)
 */
const handleFormSuccess = () => {
  dialogVisible.value = false;
  loadPatients();
};

onMounted(() => {
  loadPatients();
});
</script>
<style scoped lang="scss">
.patient-list-container {
  padding: 0;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding: 20px 24px;
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
    margin: 0;
    line-height: 1.2;
  }

  .page-subtitle {
    font-size: 14px;
    color: #6b7280;
    margin: 4px 0 0 0;
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
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(20, 184, 166, 0.4);
      background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
    }

    &:active {
      transform: translateY(0);
    }

    svg {
      width: 20px;
      height: 20px;
    }
  }
}

.search-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;

  .search-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #f3f4f6;

    .search-header-icon {
      color: #14b8a6;
      width: 20px;
      height: 20px;
    }

    .search-header-text {
      font-size: 16px;
      font-weight: 600;
      color: #374151;
    }
  }

  .search-content {
    .search-row {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;

      .search-input {
        flex: 1;
        min-width: 200px;

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

      .search-button {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 20px;
        background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
        color: white;
        border: none;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(20, 184, 166, 0.3);

        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(20, 184, 166, 0.4);
        }

        &:active {
          transform: translateY(0);
        }

        svg {
          width: 18px;
          height: 18px;
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
  border: 1px solid #e5e7eb;

  .modern-table {
    :deep(.el-table__header) {
      th {
        background: #f9fafb;
        color: #374151;
        font-weight: 600;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 2px solid #e5e7eb;
      }
    }

    :deep(.el-table__row) {
      transition: all 0.3s ease;

      &:hover {
        background: #f9fafb;
        transform: scale(1.001);
      }

      td {
        padding: 16px 0;
        border-bottom: 1px solid #f3f4f6;
      }
    }
  }

  .action-buttons {
    display: flex;
    gap: 6px;
    justify-content: center;
    flex-wrap: nowrap;

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
}
</style>
