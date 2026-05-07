<template>
  <div class="treatment-plan-detail-view">
    <!-- Header -->
    <div class="detail-header">
      <button @click="handleBack" class="back-button">
        <component :is="BackIcon" />
        <span>Quay lại</span>
      </button>

      <div v-if="canCreateFollowUp || canEdit || authStore.isAdmin" class="header-actions">
        <button
          v-if="canCreateFollowUp"
          @click="handleCreateFollowUp"
          class="action-button action-button-primary"
        >
          <component :is="CalendarIcon" />
          <span>Tạo tái khám</span>
        </button>
        <button
          v-if="canEdit"
          @click="handleEdit"
          class="action-button action-button-warning"
        >
          <component :is="EditIcon" />
          <span>Chỉnh sửa</span>
        </button>
        <button
          v-if="authStore.isAdmin"
          @click="handleDelete"
          class="action-button action-button-danger"
        >
          <component :is="TrashIcon" />
          <span>Xóa</span>
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Đang tải thông tin kế hoạch điều trị...</p>
    </div>

    <!-- Treatment Plan Detail -->
    <div v-if="treatmentPlan" class="detail-card">
      <div class="card-title">
        <component :is="PlanIcon" class="title-icon" />
        <h2>{{ treatmentPlan.planCode }}</h2>
        <el-tag :type="getStatusType(treatmentPlan.status)" class="status-tag">
          {{ getStatusLabel(treatmentPlan.status) }}
        </el-tag>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">
            <component :is="PatientIcon" />
            <span>Mã bệnh nhân</span>
          </div>
          <div class="info-value">{{ treatmentPlan.patientCode }}</div>
        </div>

        <div class="info-item">
          <div class="info-label">
            <component :is="UserIcon" />
            <span>Tên bệnh nhân</span>
          </div>
          <div class="info-value">
            <router-link
              :to="`/patients/${treatmentPlan.patientId}`"
              class="link-text"
            >
              {{ treatmentPlan.patientName }}
            </router-link>
          </div>
        </div>

        <div class="info-item">
          <div class="info-label">
            <component :is="DoctorIcon" />
            <span>Bác sĩ</span>
          </div>
          <div class="info-value">{{ treatmentPlan.doctorUsername }}</div>
        </div>

        <div class="info-item">
          <div class="info-label">
            <component :is="RecordIcon" />
            <span>Mã hồ sơ</span>
          </div>
          <div class="info-value">
            <router-link
              :to="`/medical-records/${treatmentPlan.medicalRecordId}`"
              class="link-text"
            >
              {{ treatmentPlan.medicalRecordId }}
            </router-link>
          </div>
        </div>

        <div class="info-item">
          <div class="info-label">
            <component :is="ClockIcon" />
            <span>Ngày tạo</span>
          </div>
          <div class="info-value">
            {{ formatDateTime(treatmentPlan.createdAt) }}
          </div>
        </div>

        <div class="info-item">
          <div class="info-label">
            <component :is="ClockIcon" />
            <span>Cập nhật lần cuối</span>
          </div>
          <div class="info-value">
            {{ formatDateTime(treatmentPlan.updatedAt) }}
          </div>
        </div>

        <div v-if="treatmentPlan.note" class="info-item full-width">
          <div class="info-label">
            <component :is="NoteIcon" />
            <span>Ghi chú</span>
          </div>
          <div class="info-value whitespace-pre-wrap">
            {{ treatmentPlan.note }}
          </div>
        </div>
      </div>
    </div>

    <!-- Treatment Items Card -->
    <div v-if="treatmentPlan && treatmentPlan.items" class="detail-card">
      <div class="card-title">
        <component :is="ServiceIcon" class="title-icon" />
        <h2>Danh sách dịch vụ điều trị</h2>
      </div>

      <div class="items-table">
        <el-table
          :data="treatmentPlan.items"
          border
          stripe
          style="width: 100%"
          class="modern-table"
        >
          <el-table-column type="index" label="STT" width="60" align="center" />
          <el-table-column prop="serviceCode" label="Mã DV" width="100" />
          <el-table-column
            prop="itemName"
            label="Tên dịch vụ"
            min-width="180"
          />
          <el-table-column label="Loại" width="100" align="center">
            <template #default="{ row }">
              <el-tag
                :type="row.serviceType === 'SINGLE' ? 'success' : 'warning'"
                size="small"
              >
                {{ row.serviceType === "SINGLE" ? "Đơn lẻ" : "Gói" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="quantity"
            label="SL"
            width="70"
            align="center"
          />
          <el-table-column label="Đơn giá" width="130" align="right">
            <template #default="{ row }">
              {{ formatCurrency(row.unitPrice) }}
            </template>
          </el-table-column>
          <el-table-column label="Giảm giá" width="120" align="right">
            <template #default="{ row }">
              <span class="text-red-600">
                {{ formatCurrency(row.discountAmount) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="Thành tiền" width="140" align="right">
            <template #default="{ row }">
              <span class="price-highlight font-semibold">
                {{ formatCurrency(row.lineTotal) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="Số răng" width="90">
            <template #default="{ row }">
              {{ row.toothNo || "—" }}
            </template>
          </el-table-column>
          <el-table-column label="Mặt răng" width="90">
            <template #default="{ row }">
              {{ row.toothSurface || "—" }}
            </template>
          </el-table-column>
          <el-table-column label="Trạng thái" width="120">
            <template #default="{ row }">
              <el-tag :type="getItemStatusType(row.status)" size="small">
                {{ getItemStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="Ghi chú" min-width="150">
            <template #default="{ row }">
              {{ row.note || "—" }}
            </template>
          </el-table-column>
          <el-table-column label="Thao tác" width="130" fixed="right" align="center">
            <template #default="{ row }">
              <button
                v-if="canMarkDone(row.status)"
                @click="handleMarkDone(row.id)"
                class="done-btn"
              >
                <component :is="CheckIcon" />
                <span>Hoàn thành</span>
              </button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- Total Summary -->
      <div class="summary-section">
        <div class="summary-card">
          <div class="summary-row">
            <span class="summary-label">Tổng tiền:</span>
            <span class="summary-value">
              {{ formatCurrency(treatmentPlan.totalAmount) }}
            </span>
          </div>
          <div class="summary-row discount-row">
            <span class="summary-label">Tổng giảm giá:</span>
            <span class="summary-value discount-value">
              {{ formatCurrency(treatmentPlan.discountAmount) }}
            </span>
          </div>
          <div class="summary-row total-row">
            <span class="summary-label">Thành tiền:</span>
            <span class="summary-value final-value">
              {{ formatCurrency(treatmentPlan.finalAmount) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="!loading" class="detail-card">
      <el-empty description="Không tìm thấy thông tin kế hoạch điều trị" />
    </div>

    <!-- Form Dialog -->
    <TreatmentPlanFormDialog
      v-if="formDialogVisible"
      v-model="formDialogVisible"
      :treatment-plan="treatmentPlan"
      @success="loadTreatmentPlan"
    />

    <!-- Follow-up Appointment Dialog -->
    <CreateFollowUpAppointmentDialog
      v-if="followUpDialogVisible"
      v-model="followUpDialogVisible"
      :appointment-id="selectedAppointmentId"
      @success="handleFollowUpSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { treatmentPlanApi } from "@/api/treatmentPlan";
import { appointmentApi } from "@/api/appointment";
import { useAuthStore } from "@/stores/auth";
import type {
  TreatmentPlan,
  TreatmentPlanStatus,
  TreatmentItemStatus,
} from "@/types/treatmentPlan";
import TreatmentPlanFormDialog from "./components/TreatmentPlanFormDialog.vue";
import CreateFollowUpAppointmentDialog from "./components/CreateFollowUpAppointmentDialog.vue";

// Custom Icons
const BackIcon = () =>
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
      h("path", { d: "m12 19-7-7 7-7" }),
      h("path", { d: "M19 12H5" }),
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
      h("rect", { width: "18", height: "18", x: "3", y: "4", rx: "2", ry: "2" }),
      h("line", { x1: "16", x2: "16", y1: "2", y2: "6" }),
      h("line", { x1: "8", x2: "8", y1: "2", y2: "6" }),
      h("line", { x1: "3", x2: "21", y1: "10", y2: "10" }),
    ],
  );

const PlanIcon = () =>
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
      h("path", { d: "M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" }),
      h("polyline", { points: "14 2 14 8 20 8" }),
      h("line", { x1: "16", x2: "8", y1: "13", y2: "13" }),
      h("line", { x1: "16", x2: "8", y1: "17", y2: "17" }),
      h("line", { x1: "10", x2: "8", y1: "9", y2: "9" }),
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
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    [
      h("path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }),
      h("circle", { cx: "9", cy: "7", r: "4" }),
      h("path", { d: "M22 21v-2a4 4 0 0 0-3-3.87" }),
      h("path", { d: "M16 3.13a4 4 0 0 1 0 7.75" }),
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

const DoctorIcon = () =>
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
      h("path", { d: "M22 12h-4l-3 9L9 3l-3 9H2" }),
    ],
  );

const RecordIcon = () =>
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
      h("path", { d: "M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" }),
      h("polyline", { points: "14 2 14 8 20 8" }),
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

const NoteIcon = () =>
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
      h("path", { d: "M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" }),
      h("polyline", { points: "14 2 14 8 20 8" }),
      h("line", { x1: "16", x2: "8", y1: "13", y2: "13" }),
      h("line", { x1: "16", x2: "8", y1: "17", y2: "17" }),
      h("line", { x1: "10", x2: "8", y1: "9", y2: "9" }),
    ],
  );

const ServiceIcon = () =>
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
      h("rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2" }),
      h("line", { x1: "3", x2: "21", y1: "9", y2: "9" }),
      h("line", { x1: "9", x2: "9", y1: "21", y2: "9" }),
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

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const loading = ref(false);
const treatmentPlan = ref<TreatmentPlan | null>(null);
const formDialogVisible = ref(false);
const followUpDialogVisible = ref(false);
const selectedAppointmentId = ref<string>("");

const canEdit = computed(() => {
  if (!treatmentPlan.value) return false;
  return (
    (authStore.isDoctor || authStore.isAdmin) &&
    (treatmentPlan.value.status === "DRAFT" ||
      treatmentPlan.value.status === "APPROVED")
  );
});

const canCreateFollowUp = computed(() => {
  if (!treatmentPlan.value) return false;
  return (
    (authStore.isDoctor || authStore.isAdmin) &&
    (treatmentPlan.value.status === "DRAFT" ||
      treatmentPlan.value.status === "APPROVED" ||
      treatmentPlan.value.status === "IN_PROGRESS")
  );
});

const canMarkDone = (status: TreatmentItemStatus) => {
  return (authStore.isDoctor || authStore.isAdmin) && status === "PLANNED";
};

const loadTreatmentPlan = async () => {
  const id = route.params.id as string;
  if (!id) return;

  try {
    loading.value = true;
    treatmentPlan.value = await treatmentPlanApi.getById(id);
  } catch (error) {
    console.error("Failed to load treatment plan:", error);
    ElMessage.error("Tải kế hoạch điều trị thất bại");
  } finally {
    loading.value = false;
  }
};

const handleBack = () => {
  router.back();
};

const handleEdit = () => {
  formDialogVisible.value = true;
};

const handleDelete = async () => {
  if (!treatmentPlan.value) return;

  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa kế hoạch điều trị "${treatmentPlan.value.planCode}"?`,
      "Xác nhận xóa",
      {
        confirmButtonText: "Xóa",
        cancelButtonText: "Hủy",
        customClass: "modern-confirm-dialog",
        confirmButtonClass: "modern-confirm-button",
        cancelButtonClass: "modern-cancel-button",
      },
    );

    await treatmentPlanApi.delete(treatmentPlan.value.id);
    ElMessage.success("Xóa kế hoạch điều trị thành công");
    router.push("/treatment-plans");
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("Failed to delete treatment plan:", error);
      ElMessage.error("Xóa kế hoạch điều trị thất bại");
    }
  }
};

const handleMarkDone = async (itemId: string) => {
  if (!treatmentPlan.value) return;

  try {
    await ElMessageBox.confirm(
      "Bạn có chắc chắn muốn đánh dấu dịch vụ này đã hoàn thành?",
      "Xác nhận hoàn thành",
      {
        confirmButtonText: "Xác nhận",
        cancelButtonText: "Hủy",
        customClass: "modern-confirm-dialog",
        confirmButtonClass: "modern-confirm-button",
        cancelButtonClass: "modern-cancel-button",
      },
    );

    treatmentPlan.value = await treatmentPlanApi.markItemDone(
      treatmentPlan.value.id,
      itemId,
    );
    ElMessage.success("Đánh dấu hoàn thành thành công");
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("Failed to mark item done:", error);
      ElMessage.error("Đánh dấu hoàn thành thất bại");
    }
  }
};

const handleCreateFollowUp = async () => {
  if (!treatmentPlan.value) return;

  try {
    // Get appointments for this treatment plan
    const response = await appointmentApi.search({
      treatmentPlanId: treatmentPlan.value.id,
      page: 0,
      size: 100,
    });

    const appointments = response.content || [];
    if (appointments.length === 0) {
      ElMessage.error("Chưa có lịch khám nào cho kế hoạch điều trị này");
      return;
    }

    // Use the first appointment to create follow-up
    selectedAppointmentId.value = appointments[0].id;
    followUpDialogVisible.value = true;
  } catch (error: any) {
    ElMessage.error("Không thể tải dữ liệu lịch khám");
  }
};

const handleFollowUpSuccess = () => {
  ElMessage.success("Tạo lịch tái khám thành công");
  followUpDialogVisible.value = false;
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

const getItemStatusType = (status: TreatmentItemStatus) => {
  const typeMap: Record<TreatmentItemStatus, any> = {
    PLANNED: "info",
    DONE: "success",
    CANCELLED: "danger",
  };
  return typeMap[status];
};

const getItemStatusLabel = (status: TreatmentItemStatus) => {
  const labelMap: Record<TreatmentItemStatus, string> = {
    PLANNED: "Kế hoạch",
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

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString("vi-VN");
};

onMounted(() => {
  loadTreatmentPlan();
});
</script>

<style scoped lang="scss">
.treatment-plan-detail-view {
  padding: 0;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  .back-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    color: #6b7280;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: #f9fafb;
      border-color: #14b8a6;
      color: #14b8a6;
      transform: translateX(-4px);
    }

    svg {
      width: 20px;
      height: 20px;
    }
  }

  .header-actions {
    display: flex;
    gap: 12px;
  }

  .action-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 500;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;

    svg {
      width: 20px;
      height: 20px;
    }

    &.action-button-primary {
      background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(20, 184, 166, 0.4);
      }
    }

    &.action-button-warning {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
      }
    }

    &.action-button-danger {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
      }
    }

    &:active {
      transform: translateY(0);
    }
  }
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  .loading-spinner {
    width: 48px;
    height: 48px;
    border: 4px solid #f3f4f6;
    border-top-color: #14b8a6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  p {
    margin-top: 16px;
    color: #6b7280;
    font-size: 15px;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.detail-card {
  background: white;
  border-radius: 16px;
  padding: 28px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  .card-title {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
    padding-bottom: 20px;
    border-bottom: 2px solid #f3f4f6;

    .title-icon {
      width: 28px;
      height: 28px;
      color: #14b8a6;
    }

    h2 {
      flex: 1;
      font-size: 22px;
      font-weight: 700;
      color: #111827;
      margin: 0;
    }

    .status-tag {
      font-size: 13px;
      font-weight: 600;
      padding: 6px 16px;
    }
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 8px;

      &.full-width {
        grid-column: 1 / -1;
      }

      .info-label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        font-weight: 500;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;

        svg {
          width: 18px;
          height: 18px;
          color: #14b8a6;
        }
      }

      .info-value {
        font-size: 15px;
        font-weight: 500;
        color: #111827;
        padding: 12px 16px;
        background: #f9fafb;
        border-radius: 10px;
        border: 1px solid #e5e7eb;

        &.whitespace-pre-wrap {
          white-space: pre-wrap;
        }

        .link-text {
          color: #3b82f6;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s ease;

          &:hover {
            color: #2563eb;
            text-decoration: underline;
          }
        }
      }
    }
  }

  .items-table {
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
        }

        td {
          border-bottom: 1px solid #f3f4f6;
          padding: 14px 12px;
        }
      }
    }

    .done-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);

      svg {
        width: 16px;
        height: 16px;
      }

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
      }

      &:active {
        transform: translateY(0);
      }
    }
  }

  .summary-section {
    margin-top: 28px;
    display: flex;
    justify-content: flex-end;

    .summary-card {
      min-width: 400px;
      padding: 24px;
      background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%);
      border-radius: 12px;
      border: 2px solid #14b8a6;

      .summary-row {
        display: flex;
        justify-content: space-between;
        padding: 12px 0;
        border-bottom: 1px solid #99f6e4;

        &:last-child {
          border-bottom: none;
          padding-top: 16px;
          margin-top: 8px;
        }

        &.discount-row {
          .discount-value {
            color: #dc2626;
          }
        }

        &.total-row {
          border-top: 2px solid #14b8a6;

          .final-value {
            font-size: 24px;
            font-weight: 700;
            color: #059669;
          }
        }

        .summary-label {
          font-size: 15px;
          font-weight: 500;
          color: #0f766e;
        }

        .summary-value {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
        }
      }
    }
  }
}

.price-highlight {
  color: #059669;
  font-weight: 600;
}
</style>
