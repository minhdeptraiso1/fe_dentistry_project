<template>
  <el-dialog
    v-model="visible"
    width="90%"
    :show-close="false"
    @close="handleClose"
    class="prescription-detail-dialog"
  >
    <template #header>
      <div class="dialog-header">
        <component :is="DetailIcon" class="header-icon" />
        <span class="header-title">Chi tiết đơn thuốc</span>
      </div>
    </template>
    <div v-loading="loading" v-if="prescriptionDetail">
      <!-- Prescription Info -->
      <el-descriptions :column="3" border class="mb-4">
        <el-descriptions-item
          label="Mã đơn thuốc"
          label-class-name="font-semibold"
        >
          <span class="text-lg font-bold text-blue-600">
            {{ prescriptionDetail.prescriptionCode }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="Trạng thái">
          <el-tag :type="getStatusType(prescriptionDetail.status)" size="large">
            {{ getStatusLabel(prescriptionDetail.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="Bệnh nhân">
          <div>
            <div class="font-semibold">
              {{ prescriptionDetail.patientName }}
            </div>
            <div class="text-sm text-gray-500">
              {{ prescriptionDetail.patientCode }}
            </div>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="Bác sĩ kê đơn">
          {{ prescriptionDetail.doctorUsername }}
        </el-descriptions-item>
        <el-descriptions-item label="Ngày tạo">
          {{ formatDateTime(prescriptionDetail.createdAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="Ngày cập nhật">
          {{ formatDateTime(prescriptionDetail.updatedAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="Ghi chú" :span="3">
          {{ prescriptionDetail.note || "N/A" }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- Items Table -->
      <div class="mb-4">
        <h3 class="text-lg font-semibold mb-2">Danh sách thuốc</h3>
        <el-table :data="prescriptionDetail.items" border stripe>
          <el-table-column type="index" label="STT" width="60" />
          <el-table-column prop="medicineCode" label="Mã thuốc" width="120" />
          <el-table-column
            prop="medicineName"
            label="Tên thuốc"
            min-width="200"
          />
          <el-table-column prop="unit" label="ĐVT" width="80" />
          <el-table-column prop="dosage" label="Liều dùng" min-width="200" />
          <el-table-column
            prop="quantity"
            label="Số lượng"
            width="100"
            align="center"
          />
          <el-table-column prop="note" label="Ghi chú" min-width="150" />
        </el-table>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button
          v-if="
            prescriptionDetail.status === 'DRAFT' &&
            (authStore.isDoctor || authStore.isAdmin)
          "
          class="action-button primary-button"
          @click="handleIssue"
        >
          <component :is="SendIcon" />
          <span>Phát hành</span>
        </button>
        <button
          v-if="
            prescriptionDetail.status === 'ISSUED' &&
            (authStore.isCashier || authStore.isAdmin)
          "
          class="action-button success-button"
          @click="handleDispense"
        >
          <component :is="CheckIcon" />
          <span>Xuất thuốc</span>
        </button>
        <button
          v-if="
            prescriptionDetail.status === 'DISPENSED' &&
            (authStore.isCashier || authStore.isAdmin)
          "
          class="action-button info-button"
          @click="handleCreateInvoice"
        >
          <component :is="DocumentIcon" />
          <span>Tạo hóa đơn</span>
        </button>
        <button
          v-if="
            prescriptionDetail.status !== 'DISPENSED' &&
            prescriptionDetail.status !== 'CANCELLED' &&
            (authStore.isDoctor || authStore.isAdmin)
          "
          class="action-button danger-button"
          @click="handleCancel"
        >
          <component :is="XCircleIcon" />
          <span>Hủy đơn</span>
        </button>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <button @click="handleClose" class="footer-button close-button">
          <component :is="CloseIcon" />
          <span>Đóng</span>
        </button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, h } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { prescriptionApi } from "@/api/prescription";
import { invoiceApi } from "@/api/invoice";
import { useAuthStore } from "@/stores/auth";
import type { Prescription, PrescriptionStatus } from "@/types/prescription";

const DetailIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    [
      h("path", {
        d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z",
      }),
      h("polyline", { points: "14 2 14 8 20 8" }),
      h("line", { x1: "16", y1: "13", x2: "8", y2: "13" }),
      h("line", { x1: "16", y1: "17", x2: "8", y2: "17" }),
      h("polyline", { points: "10 9 9 9 8 9" }),
    ],
  );

const SendIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "16",
      height: "16",
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
      width: "16",
      height: "16",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    [h("polyline", { points: "20 6 9 17 4 12" })],
  );

const DocumentIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "16",
      height: "16",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    [
      h("path", {
        d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z",
      }),
      h("polyline", { points: "14 2 14 8 20 8" }),
      h("line", { x1: "16", y1: "13", x2: "8", y2: "13" }),
      h("line", { x1: "16", y1: "17", x2: "8", y2: "17" }),
      h("line", { x1: "10", y1: "9", x2: "8", y2: "9" }),
    ],
  );

const XCircleIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "16",
      height: "16",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    [
      h("circle", { cx: "12", cy: "12", r: "10" }),
      h("line", { x1: "15", y1: "9", x2: "9", y2: "15" }),
      h("line", { x1: "9", y1: "9", x2: "15", y2: "15" }),
    ],
  );

const CloseIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "20",
      height: "20",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    [
      h("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
      h("line", { x1: "6", y1: "6", x2: "18", y2: "18" }),
    ],
  );

interface Props {
  modelValue: boolean;
  prescription?: Prescription;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "success"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const authStore = useAuthStore();

const loading = ref(false);
const prescriptionDetail = ref<Prescription>();

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const loadPrescriptionDetail = async () => {
  if (!props.prescription?.id) return;

  try {
    loading.value = true;
    prescriptionDetail.value = await prescriptionApi.getById(
      props.prescription.id,
    );
  } catch (error) {
    console.error("Failed to load prescription detail:", error);
    ElMessage.error("Không thể tải thông tin đơn thuốc");
  } finally {
    loading.value = false;
  }
};

// Watch for prescription changes to reload detail
watch(
  () => props.prescription,
  (prescription) => {
    if (prescription) {
      loadPrescriptionDetail();
    }
  },
  { immediate: true },
);

const handleIssue = async () => {
  if (!prescriptionDetail.value) return;

  try {
    await ElMessageBox.confirm(
      `Xác nhận phát hành đơn "${prescriptionDetail.value.prescriptionCode}"?`,
      "Phát hành đơn thuốc",
      {
        confirmButtonText: "Phát hành",
        cancelButtonText: "Hủy",
        type: "info",
      },
    );

    await prescriptionApi.issue(prescriptionDetail.value.id);
    ElMessage.success("Phát hành đơn thuốc thành công");
    emit("success");
    handleClose();
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("Failed to issue prescription:", error);
      ElMessage.error("Phát hành đơn thuốc thất bại");
    }
  }
};

const handleDispense = async () => {
  if (!prescriptionDetail.value) return;

  try {
    const result = await ElMessageBox.prompt(
      `Xác nhận xuất thuốc cho đơn "${prescriptionDetail.value.prescriptionCode}"?`,
      "Xuất thuốc",
      {
        confirmButtonText: "Xuất thuốc",
        cancelButtonText: "Hủy",
        inputPlaceholder: "Nhập ghi chú (tùy chọn)",
        inputType: "textarea",
      },
    );

    const note = typeof result === "string" ? result : (result as any).value;
    await prescriptionApi.dispense(prescriptionDetail.value.id, {
      note: note || undefined,
    });

    ElMessage.success("Xuất thuốc thành công. Vui lòng tạo hóa đơn sau.");
    emit("success");
    handleClose();
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("Failed to dispense:", error);
      ElMessage.error("Xuất thuốc thất bại");
    }
  }
};

const handleCreateInvoice = async () => {
  if (!prescriptionDetail.value) return;

  try {
    await ElMessageBox.confirm(
      "Tạo hóa đơn cho đơn thuốc này?",
      "Tạo hóa đơn",
      {
        confirmButtonText: "Tạo hóa đơn",
        cancelButtonText: "Hủy",
        type: "info",
      },
    );

    await invoiceApi.createFromPrescription({
      prescriptionId: prescriptionDetail.value.id,
    });

    ElMessage.success("Tạo hóa đơn thành công");
    emit("success");
    handleClose();
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("Failed to create invoice:", error);
      ElMessage.error("Tạo hóa đơn thất bại");
    }
  }
};

const handleCancel = async () => {
  if (!prescriptionDetail.value) return;

  try {
    const result = await ElMessageBox.prompt(
      `Xác nhận hủy đơn thuốc "${prescriptionDetail.value.prescriptionCode}"?`,
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
    await prescriptionApi.cancel(
      prescriptionDetail.value.id,
      note || undefined,
    );
    ElMessage.success("Hủy đơn thuốc thành công");
    emit("success");
    handleClose();
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("Failed to cancel prescription:", error);
      ElMessage.error("Hủy đơn thuốc thất bại");
    }
  }
};

const handleClose = () => {
  visible.value = false;
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
</script>

<style scoped lang="scss">
.prescription-detail-dialog {
  :deep(.el-dialog__header) {
    padding: 0;
    margin: 0;
  }

  :deep(.el-dialog__body) {
    padding: 20px;
  }

  :deep(.el-dialog__footer) {
    padding: 0;
  }

  .dialog-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
    color: white;

    .header-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      flex-shrink: 0;
    }

    .header-title {
      font-size: 16px;
      font-weight: 600;
      line-height: 1;
    }
  }

  .action-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 16px;

    .action-button {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      outline: none;
      color: white;

      &:hover {
        transform: translateY(-1px);
      }

      &:active {
        transform: translateY(0);
      }

      &.primary-button {
        background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
        box-shadow: 0 2px 4px rgba(20, 184, 166, 0.2);

        &:hover {
          box-shadow: 0 4px 8px rgba(20, 184, 166, 0.3);
        }
      }

      &.success-button {
        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
        box-shadow: 0 2px 4px rgba(34, 197, 94, 0.2);

        &:hover {
          box-shadow: 0 4px 8px rgba(34, 197, 94, 0.3);
        }
      }

      &.info-button {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);

        &:hover {
          box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
        }
      }

      &.danger-button {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);

        &:hover {
          box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
        }
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    padding: 12px 16px;
    border-top: 1px solid #e5e7eb;

    .footer-button {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      outline: none;

      &.close-button {
        background: white;
        color: #6b7280;
        border: 1px solid #d1d5db;

        &:hover {
          background: #f9fafb;
          color: #374151;
          border-color: #9ca3af;
        }
      }
    }
  }
}
</style>
