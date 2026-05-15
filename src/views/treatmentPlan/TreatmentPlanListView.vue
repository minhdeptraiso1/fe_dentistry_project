<template>
  <div class="treatment-plan-list-container">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Kế hoạch điều trị</h1>
        <p class="page-subtitle">Quản lý kế hoạch điều trị cho bệnh nhân</p>
      </div>
    </div>

    <!-- Search Card -->
    <div class="search-card">
      <div class="search-header">
        <component :is="SearchIcon" class="search-header-icon" />
        <h3 class="search-title">Tìm kiếm kế hoạch điều trị</h3>
      </div>

      <div class="search-content">
        <div class="search-row">
          <el-select
            v-model="searchForm.patientId"
            placeholder="Chọn bệnh nhân"
            clearable
            filterable
            :loading="patientLoading"
            @change="handleSearch"
            @clear="handleSearch"
            class="search-select"
          >
            <el-option
              v-for="patient in patientOptions"
              :key="patient.id"
              :label="`${patient.patientCode} - ${patient.fullName}`"
              :value="patient.id"
            />
          </el-select>

          <el-select
            v-model="searchForm.status"
            placeholder="Trạng thái"
            clearable
            @change="handleSearch"
            class="search-select"
          >
            <el-option label="Nháp" value="DRAFT" />
            <el-option label="Đã duyệt" value="APPROVED" />
            <el-option label="Đang thực hiện" value="IN_PROGRESS" />
            <el-option label="Hoàn thành" value="DONE" />
            <el-option label="Đã hủy" value="CANCELLED" />
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
        :data="tableData"
        stripe
        style="width: 100%"
        class="modern-table"
      >
        <el-table-column prop="planCode" label="Mã KH" width="120" />
        <el-table-column prop="patientCode" label="Mã BN" width="100" />
        <el-table-column prop="patientName" label="Bệnh nhân" min-width="150" />
        <el-table-column prop="doctorUsername" label="Bác sĩ" width="120" />
        <el-table-column label="Trạng thái" width="140">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Tổng tiền" width="140" align="right">
          <template #default="{ row }">
            {{ formatCurrency(row.totalAmount) }}
          </template>
        </el-table-column>
        <el-table-column label="Giảm giá" width="120" align="right">
          <template #default="{ row }">
            {{ formatCurrency(row.discountAmount) }}
          </template>
        </el-table-column>
        <el-table-column label="Thành tiền" width="140" align="right">
          <template #default="{ row }">
            <span class="font-semibold text-green-600">
              {{ formatCurrency(row.finalAmount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="Ngày tạo" width="110">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
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
                @click="handleView(row.id)"
                class="action-btn action-btn-info"
              >
                <component :is="EyeIcon" />
                <span>Xem</span>
              </button>
              <button
                v-if="canEdit(row.status)"
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
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="searchForm.page"
          v-model:page-size="searchForm.size"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handleSearch"
          @size-change="handleSearch"
        />
      </div>
    </div>

    <!-- Form Dialog -->
    <TreatmentPlanFormDialog
      v-if="formDialogVisible"
      v-model="formDialogVisible"
      :treatment-plan="currentTreatmentPlan"
      @success="handleSearch"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { treatmentPlanApi } from "@/api/treatmentPlan";
import { patientApi } from "@/api/patient";
import { sortByCreatedAtDesc } from "@/utils/sort";
import { useAuthStore } from "@/stores/auth";
import type { TreatmentPlan, TreatmentPlanStatus } from "@/types/treatmentPlan";
import type { Patient } from "@/types";
import TreatmentPlanFormDialog from "./components/TreatmentPlanFormDialog.vue";

// Custom Icons
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

const ResetIcon = () =>
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
      h("path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" }),
      h("path", { d: "M21 3v5h-5" }),
      h("path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" }),
      h("path", { d: "M3 21v-5h5" }),
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
      h("path", { d: "M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" }),
      h("circle", { cx: "12", cy: "12", r: "3" }),
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
      h("path", {
        d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",
      }),
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
      h("line", { x1: "10", x2: "10", y1: "11", y2: "17" }),
      h("line", { x1: "14", x2: "14", y1: "11", y2: "17" }),
    ],
  );

const router = useRouter();
const authStore = useAuthStore();

const loading = ref(false);
const tableData = ref<TreatmentPlan[]>([]);
const total = ref(0);
const formDialogVisible = ref(false);
const currentTreatmentPlan = ref<TreatmentPlan | null>(null);

const patientLoading = ref(false);
const patientOptions = ref<Patient[]>([]);

const searchForm = reactive({
  patientId: "",
  status: "",
  page: 1,
  size: 10,
});

// Load all patients for filter dropdown
const loadPatients = async () => {
  try {
    patientLoading.value = true;
    const response = await patientApi.search({
      page: 0,
      size: 1000, // Load all patients
    });
    patientOptions.value = response.content || [];
  } catch (error) {
    console.error("Failed to load patients:", error);
  } finally {
    patientLoading.value = false;
  }
};

// Load treatment plans
const loadTreatmentPlans = async () => {
  if (!searchForm.patientId) {
    tableData.value = [];
    total.value = 0;
    return;
  }

  try {
    loading.value = true;
    const response = await treatmentPlanApi.listByPatient(
      searchForm.patientId,
      {
        page: searchForm.page - 1,
        size: searchForm.size,
      },
    );

    // Filter by status if selected
    let content = response.content || [];
    if (searchForm.status) {
      content = content.filter(
        (plan: TreatmentPlan) => plan.status === searchForm.status,
      );
    }

    tableData.value = sortByCreatedAtDesc(content);
    total.value = response.totalElements || 0;
  } catch (error) {
    console.error("Failed to load treatment plans:", error);
    ElMessage.error("Tải danh sách kế hoạch điều trị thất bại");
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  searchForm.page = 1;
  loadTreatmentPlans();
};

const handleReset = () => {
  searchForm.patientId = "";
  searchForm.status = "";
  searchForm.page = 1;
  searchForm.size = 10;
  tableData.value = [];
  total.value = 0;
  // Keep patientOptions loaded for reuse
};

const handleView = (id: string) => {
  router.push(`/treatment-plans/${id}`);
};

const handleEdit = (plan: TreatmentPlan) => {
  currentTreatmentPlan.value = plan;
  formDialogVisible.value = true;
};

const handleDelete = async (plan: TreatmentPlan) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa kế hoạch điều trị "${plan.planCode}"?`,
      "Xác nhận xóa",
      {
        confirmButtonText: "Xóa",
        cancelButtonText: "Hủy",
        customClass: "modern-confirm-dialog",
        confirmButtonClass: "modern-confirm-button",
        cancelButtonClass: "modern-cancel-button",
      },
    );

    await treatmentPlanApi.delete(plan.id);
    ElMessage.success("Xóa kế hoạch điều trị thành công");
    loadTreatmentPlans();
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("Failed to delete treatment plan:", error);
      ElMessage.error("Xóa kế hoạch điều trị thất bại");
    }
  }
};

const canEdit = (status: TreatmentPlanStatus) => {
  return (
    (authStore.isDoctor || authStore.isAdmin) &&
    (status === "DRAFT" || status === "APPROVED")
  );
};

const getStatusType = (status: TreatmentPlanStatus) => {
  const typeMap: Record<TreatmentPlanStatus, any> = {
    DRAFT: "info",
    APPROVED: "success",
    IN_PROGRESS: "warning",
    DONE: "success",
    CANCELLED: "danger",
  };
  return typeMap[status];
};

const getStatusLabel = (status: TreatmentPlanStatus) => {
  const labelMap: Record<TreatmentPlanStatus, string> = {
    DRAFT: "Nháp",
    APPROVED: "Đã duyệt",
    IN_PROGRESS: "Đang thực hiện",
    DONE: "Hoàn thành",
    CANCELLED: "Đã hủy",
  };
  return labelMap[status];
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("vi-VN");
};

onMounted(() => {
  // Load patients list for filter dropdown
  loadPatients();

  // Load initial data if patientId is in route query
  const patientId = router.currentRoute.value.query.patientId as string;
  const medicalRecordId = router.currentRoute.value.query
    .medicalRecordId as string;

  if (patientId) {
    searchForm.patientId = patientId;
    handleSearch();
  }

  // If medicalRecordId is provided, open form dialog to create new treatment plan
  if (medicalRecordId) {
    // Create a mock treatment plan object with just the medicalRecordId
    // This will be used by the form dialog to pre-fill the medical record
    currentTreatmentPlan.value = {
      medicalRecordId,
    } as any;
    formDialogVisible.value = true;
  }
});
</script>

<style scoped lang="scss">
.treatment-plan-list-container {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
    margin: 0 0 4px 0;
  }

  .page-subtitle {
    font-size: 14px;
    color: #6b7280;
    margin: 0;
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

    .search-title {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }
  }

  .search-content {
    .search-row {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;

      .search-select {
        flex: 1;
        min-width: 200px;

        :deep(.el-input__wrapper) {
          border-radius: 10px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;

          &:hover {
            box-shadow: 0 2px 8px rgba(20, 184, 166, 0.15);
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

      button {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 20px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        border: none;

        svg {
          width: 18px;
          height: 18px;
        }

        &.search-button {
          background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(20, 184, 166, 0.4);
          }

          &:active {
            transform: translateY(0);
          }
        }

        &.reset-button {
          background: white;
          color: #6b7280;
          border: 1px solid #e5e7eb;

          &:hover {
            background: #f9fafb;
            border-color: #d1d5db;
            color: #374151;
          }

          &:active {
            background: #f3f4f6;
          }
        }
      }
    }
  }
}

.table-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
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
        border-bottom: 2px solid #e5e7eb;
      }
    }

    :deep(.el-table__row) {
      transition: all 0.3s ease;

      &:hover {
        background: #f0fdfa !important;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(20, 184, 166, 0.1);
      }

      td {
        border-bottom: 1px solid #f3f4f6;
        padding: 16px 12px;
      }
    }
  }

  .pagination-container {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #f3f4f6;
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

  svg {
    width: 16px;
    height: 16px;
  }

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
</style>
