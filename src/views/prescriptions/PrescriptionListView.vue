<template>
  <div class="prescription-list-view">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Quản lý đơn thuốc</h1>
        <p class="page-subtitle">Quản lý danh sách đơn thuốc và xuất phát</p>
      </div>
      <button
        v-if="authStore.isDoctor || authStore.isAdmin"
        @click="handleCreate"
        class="add-button"
      >
        <component :is="PlusIcon" />
        <span>Tạo đơn thuốc</span>
      </button>
    </div>

    <!-- Search Card -->
    <div class="search-card">
      <div class="search-header">
        <component :is="SearchIcon" class="search-header-icon" />
        <span class="search-header-text">Tìm kiếm đơn thuốc</span>
      </div>
      <div class="search-content">
        <div class="search-row">
          <el-select
            v-model="filterForm.patientId"
            placeholder="Chọn bệnh nhân"
            filterable
            clearable
            @change="handleSearch"
            class="search-select-patient"
          >
            <el-option
              v-for="patient in patientOptions"
              :key="patient.id"
              :label="`${patient.patientCode} - ${patient.fullName}`"
              :value="patient.id"
            />
          </el-select>

          <el-select
            v-model="filterForm.status"
            placeholder="Trạng thái"
            clearable
            @change="handleSearch"
            class="search-select"
          >
            <el-option label="Nháp" value="DRAFT" />
            <el-option label="Đã kê" value="ISSUED" />
            <el-option label="Đã xuất" value="DISPENSED" />
            <el-option label="Đã hủy" value="CANCELLED" />
          </el-select>
        </div>

        <div class="search-actions">
          <button @click="handleSearch" class="search-button">
            <component :is="SearchIcon" />
            <span>Tìm kiếm</span>
          </button>
          <button @click="handleReset" class="reset-button">
            <span>Đặt lại</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Table Card -->
    <div class="table-card">
      <el-table
        v-loading="loading"
        :data="prescriptions"
        stripe
        class="modern-table"
        style="width: 100%"
      >
        <el-table-column type="index" label="STT" width="60" />
        <el-table-column
          prop="prescriptionCode"
          label="Mã đơn thuốc"
          width="140"
        />
        <el-table-column label="Bệnh nhân" min-width="180">
          <template #default="{ row }">
            <div>
              <div class="patient-name">{{ row.patientName }}</div>
              <div class="patient-code">{{ row.patientCode }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Bác sĩ" width="150">
          <template #default="{ row }">
            {{ row.doctorUsername }}
          </template>
        </el-table-column>
        <el-table-column label="Trạng thái" width="130" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Ngày tạo" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column
          label="Thao tác"
          width="250"
          align="center"
          fixed="right"
        >
          <template #default="{ row }">
            <div class="action-buttons">
              <button
                @click="handleView(row)"
                class="action-btn-info"
                title="Xem chi tiết"
              >
                <component :is="EyeIcon" />
                <span>Chi tiết</span>
              </button>
              <button
                v-if="
                  row.status === 'DRAFT' &&
                  (authStore.isDoctor || authStore.isAdmin)
                "
                @click="handleEdit(row)"
                class="action-btn-warning"
                title="Chỉnh sửa"
              >
                <component :is="EditIcon" />
                <span>Sửa</span>
              </button>
              <button
                v-if="
                  row.status === 'DRAFT' &&
                  (authStore.isDoctor || authStore.isAdmin)
                "
                @click="handleIssue(row)"
                class="action-btn-primary"
                title="Phát hành đơn"
              >
                <component :is="SendIcon" />
                <span>Phát hành</span>
              </button>
              <button
                v-if="
                  row.status === 'ISSUED' &&
                  (authStore.isCashier || authStore.isAdmin)
                "
                @click="handleDispense(row)"
                class="action-btn-success"
                title="Xuất thuốc"
              >
                <component :is="CheckIcon" />
                <span>Xuất thuốc</span>
              </button>
              <button
                v-if="
                  row.status !== 'DISPENSED' &&
                  row.status !== 'CANCELLED' &&
                  (authStore.isDoctor || authStore.isAdmin)
                "
                @click="handleCancel(row)"
                class="action-btn-danger"
                title="Hủy đơn"
              >
                <component :is="CancelIcon" />
                <span>Hủy</span>
              </button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSearch"
          @current-change="handleSearch"
        />
      </div>
    </div>

    <!-- Dialogs -->
    <PrescriptionFormDialog
      v-if="formDialogVisible"
      v-model="formDialogVisible"
      :prescription="selectedPrescription"
      @success="handleSearch"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { prescriptionApi } from "@/api/prescription";
import { patientApi } from "@/api/patient";
import { sortByCreatedAtDesc } from "@/utils/sort";
import { useAuthStore } from "@/stores/auth";
import type { Prescription, PrescriptionStatus } from "@/types/prescription";
import type { Patient } from "@/types";
import PrescriptionFormDialog from "./components/PrescriptionFormDialog.vue";

const router = useRouter();

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
        d: "M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z",
      }),
    ],
  );

const SendIcon = () =>
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
      h("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
      h("polyline", { points: "17 8 12 3 7 8" }),
      h("line", { x1: "12", y1: "3", x2: "12", y2: "15" }),
    ],
  );

const CheckIcon = () =>
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
    [h("polyline", { points: "20 6 9 17 4 12" })],
  );

const CancelIcon = () =>
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
      h("path", { d: "m15 9-6 6" }),
      h("path", { d: "m9 9 6 6" }),
    ],
  );

const authStore = useAuthStore();

const loading = ref(false);
const prescriptions = ref<Prescription[]>([]);
const patientOptions = ref<Patient[]>([]);

const filterForm = reactive({
  patientId: "",
  status: "" as PrescriptionStatus | "",
});

const pagination = reactive({
  page: 1,
  size: 20,
  total: 0,
});

const formDialogVisible = ref(false);
const selectedPrescription = ref<Prescription | undefined>();

const loadPrescriptions = async () => {
  try {
    loading.value = true;
    const response = await prescriptionApi.search({
      patientId: filterForm.patientId || undefined,
      status: filterForm.status || undefined,
      page: pagination.page - 1,
      size: pagination.size,
    });

    prescriptions.value = sortByCreatedAtDesc(response.content || []);
    pagination.total = response.totalElements || 0;
  } catch (error) {
    console.error("Failed to load prescriptions:", error);
    ElMessage.error("Không thể tải danh sách đơn thuốc");
  } finally {
    loading.value = false;
  }
};

const loadPatients = async () => {
  try {
    const response = await patientApi.search({
      page: 0,
      size: 1000,
    });
    patientOptions.value = response.content || [];
  } catch (error) {
    console.error("Failed to load patients:", error);
  }
};

const handleSearch = () => {
  pagination.page = 1;
  loadPrescriptions();
};

const handleReset = () => {
  filterForm.patientId = "";
  filterForm.status = "";
  handleSearch();
};

const handleCreate = () => {
  selectedPrescription.value = undefined;
  formDialogVisible.value = true;
};

const handleView = (prescription: Prescription) => {
  router.push(`/prescriptions/${prescription.id}`);
};

const handleEdit = (prescription: Prescription) => {
  selectedPrescription.value = prescription;
  formDialogVisible.value = true;
};

const handleIssue = async (prescription: Prescription) => {
  try {
    await ElMessageBox.confirm(
      `Xác nhận phát hành đơn "${prescription.prescriptionCode}"?`,
      "Phát hành đơn thuốc",
      {
        confirmButtonText: "Phát hành",
        cancelButtonText: "Hủy",
        type: "info",
      },
    );

    await prescriptionApi.issue(prescription.id);
    ElMessage.success("Phát hành đơn thuốc thành công");
    handleSearch();
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("Failed to issue prescription:", error);
      ElMessage.error("Phát hành đơn thuốc thất bại");
    }
  }
};

const handleDispense = async (prescription: Prescription) => {
  try {
    const result = await ElMessageBox.prompt(
      `Xác nhận xuất thuốc cho đơn "${prescription.prescriptionCode}"?`,
      "Xuất thuốc",
      {
        confirmButtonText: "Xuất thuốc",
        cancelButtonText: "Hủy",
        inputPlaceholder: "Nhập ghi chú (tùy chọn)",
        inputType: "textarea",
      },
    );

    const note = typeof result === "string" ? result : (result as any).value;
    await prescriptionApi.dispense(prescription.id, {
      note: note || undefined,
    });

    ElMessage.success("Xuất thuốc thành công. Vui lòng tạo hóa đơn sau.");
    handleSearch();
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("Failed to dispense:", error);
      ElMessage.error("Xuất thuốc thất bại");
    }
  }
};

const handleCancel = async (prescription: Prescription) => {
  try {
    const result = await ElMessageBox.prompt(
      `Xác nhận hủy đơn thuốc "${prescription.prescriptionCode}"?`,
      "Lý do hủy",
      {
        confirmButtonText: "Hủy đơn",
        cancelButtonText: "Đóng",
        inputPlaceholder: "Nhập lý do hủy (tùy chọn)",
        inputType: "textarea",
        type: "error",
        customClass: "danger-confirm-dialog",
      },
    );

    const note = typeof result === "string" ? result : (result as any).value;
    await prescriptionApi.cancel(prescription.id, note || undefined);
    ElMessage.success("Hủy đơn thuốc thành công");
    handleSearch();
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("Failed to cancel prescription:", error);
      ElMessage.error("Hủy đơn thuốc thất bại");
    }
  }
};

const getStatusType = (status: PrescriptionStatus) => {
  const typeMap: Record<PrescriptionStatus, any> = {
    DRAFT: "info",
    ISSUED: "warning",
    DISPENSED: "success",
    CANCELLED: "danger",
  };
  return typeMap[status];
};

const getStatusLabel = (status: PrescriptionStatus) => {
  const labelMap: Record<PrescriptionStatus, string> = {
    DRAFT: "Nháp",
    ISSUED: "Đã kê",
    DISPENSED: "Đã xuất",
    CANCELLED: "Đã hủy",
  };
  return labelMap[status];
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString("vi-VN");
};

onMounted(() => {
  loadPrescriptions();
  loadPatients();
});
</script>

<style scoped>
.prescription-list-view {
  padding: 24px;
  background: #f3f4f6;
  min-height: 100vh;
}

.page-header {
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

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
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);
}

.add-button svg {
  width: 20px;
  height: 20px;
}

.add-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(20, 184, 166, 0.4);
}

.add-button:active {
  transform: translateY(0);
}

/* Search Card */
.search-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.search-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f3f4f6;
}

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

.search-content {
  padding: 24px;
}

.search-row {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.search-select-patient {
  flex: 1;
  min-width: 300px;
}

.search-select {
  width: 200px;
}

.search-actions {
  display: flex;
  gap: 12px;
}

.search-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  border: none;
  padding: 10px 24px;
  border-radius: 10px;
  color: white;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(20, 184, 166, 0.3);
}

.search-button svg {
  width: 16px;
  height: 16px;
}

.search-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.4);
}

.reset-button {
  padding: 10px 24px;
  border-radius: 10px;
  background: white;
  border: 1px solid #d1d5db;
  color: #6b7280;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.reset-button:hover {
  border-color: #14b8a6;
  color: #14b8a6;
  background: #f0fdfa;
}

/* Table Card */
.table-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.table-card :deep(.el-table__header) {
  th {
    background: #f9fafb;
    color: #374151;
    font-weight: 600;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}

.table-card :deep(.el-table__row) {
  transition: all 0.2s ease;

  &:hover {
    background: #f0fdfa !important;
  }
}

.patient-name {
  font-weight: 600;
  color: #111827;
}

.patient-code {
  font-size: 13px;
  color: #6b7280;
  margin-top: 2px;
}

.item-count {
  color: #2563eb;
  font-weight: 600;
  font-size: 15px;
}

/* Action Buttons */
.action-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
  max-width: 200px;
  margin: 0 auto;

  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;

    svg {
      width: 14px;
      height: 14px;
    }

    &:hover {
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
    }
  }

  .action-btn-info {
    background: #eff6ff;
    color: #2563eb;

    &:hover {
      background: #dbeafe;
    }
  }

  .action-btn-warning {
    background: #fffbeb;
    color: #ea580c;

    &:hover {
      background: #fef3c7;
    }
  }

  .action-btn-primary {
    background: #f0fdfa;
    color: #14b8a6;

    &:hover {
      background: #ccfbf1;
    }
  }

  .action-btn-success {
    background: #f0fdf4;
    color: #16a34a;

    &:hover {
      background: #dcfce7;
    }
  }

  .action-btn-danger {
    background: #fef2f2;
    color: #dc2626;

    &:hover {
      background: #fee2e2;
    }
  }
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
}
</style>
