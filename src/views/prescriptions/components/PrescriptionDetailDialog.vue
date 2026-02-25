<template>
  <el-dialog
    v-model="visible"
    title="Chi tiết đơn thuốc"
    width="90%"
    @close="handleClose"
  >
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
      <div class="flex justify-end gap-2">
        <el-button
          v-if="
            prescriptionDetail.status === 'DRAFT' &&
            (authStore.isDoctor || authStore.isAdmin)
          "
          type="primary"
          @click="handleIssue"
        >
          Phát hành
        </el-button>
        <el-button
          v-if="
            prescriptionDetail.status === 'ISSUED' &&
            (authStore.isCashier || authStore.isAdmin)
          "
          type="success"
          @click="handleDispense"
        >
          <el-icon class="mr-1"><Check /></el-icon>
          Xuất thuốc
        </el-button>
        <el-button
          v-if="
            prescriptionDetail.status === 'DISPENSED' &&
            (authStore.isCashier || authStore.isAdmin)
          "
          type="primary"
          @click="handleCreateInvoice"
        >
          <el-icon class="mr-1"><Document /></el-icon>
          Tạo hóa đơn
        </el-button>
        <el-button
          v-if="
            prescriptionDetail.status !== 'DISPENSED' &&
            prescriptionDetail.status !== 'CANCELLED' &&
            (authStore.isDoctor || authStore.isAdmin)
          "
          type="danger"
          @click="handleCancel"
        >
          <el-icon class="mr-1"><Close /></el-icon>
          Hủy đơn
        </el-button>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">Đóng</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Check, Close, Document } from "@element-plus/icons-vue";
import { prescriptionApi } from "@/api/prescription";
import { invoiceApi } from "@/api/invoice";
import { useAuthStore } from "@/stores/auth";
import type { Prescription, PrescriptionStatus } from "@/types/prescription";

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
    ElMessage.success("Xuất thuốc thành công");
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
