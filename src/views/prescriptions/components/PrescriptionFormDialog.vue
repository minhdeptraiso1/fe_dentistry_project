<template>
  <el-dialog
    v-model="visible"
    width="90%"
    :show-close="false"
    :close-on-click-modal="false"
    @close="handleClose"
    class="prescription-form-dialog"
  >
    <template #header>
      <div class="dialog-header">
        <component :is="PrescriptionIcon" class="header-icon" />
        <span class="header-title">
          {{ isEdit ? "Cập nhật đơn thuốc" : "Tạo đơn thuốc" }}
        </span>
      </div>
    </template>
    <el-form
      v-loading="loading"
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="140px"
      label-position="left"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="Bệnh án" prop="medicalRecordId">
            <el-select
              v-model="form.medicalRecordId"
              placeholder="Chọn bệnh án"
              filterable
              style="width: 100%"
            >
              <el-option
                v-for="record in medicalRecordOptions"
                :key="record.id"
                :label="`${record.recordCode} - ${record.patientName}`"
                :value="record.id"
              />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="Ghi chú">
            <el-input v-model="form.note" placeholder="Nhập ghi chú..." />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="Danh sách thuốc">
        <div class="w-full">
          <div class="mb-4">
            <button @click.prevent="handleAddItem" class="add-item-button">
              <component :is="PlusIcon" />
              <span>Thêm thuốc</span>
            </button>
          </div>

          <el-table :data="form.items" border stripe style="width: 100%">
            <el-table-column type="index" label="STT" width="60" />
            <el-table-column
              prop="medicineName"
              label="Tên thuốc"
              min-width="200"
            />
            <el-table-column prop="medicineCode" label="Mã thuốc" width="120" />
            <el-table-column prop="unit" label="ĐVT" width="80" />
            <el-table-column prop="dosage" label="Liều dùng" min-width="150" />
            <el-table-column
              prop="quantity"
              label="Số lượng"
              width="100"
              align="center"
            />
            <el-table-column prop="note" label="Ghi chú" min-width="150" />
            <el-table-column label="Thao tác" width="100" align="center">
              <template #default="{ $index }">
                <button
                  @click="handleRemoveItem($index)"
                  class="delete-button"
                  title="Xóa"
                >
                  <component :is="TrashIcon" />
                  <span>Xóa</span>
                </button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <button @click="handleClose" class="footer-button cancel-button">
          <component :is="XIcon" />
          <span>Hủy</span>
        </button>
        <button
          @click="handleSubmit"
          :disabled="submitting"
          class="footer-button submit-button"
        >
          <component :is="submitting ? LoadingIcon : CheckIcon" />
          <span>{{
            submitting
              ? isEdit
                ? "Đang cập nhật..."
                : "Đang tạo..."
              : isEdit
                ? "Cập nhật"
                : "Tạo đơn thuốc"
          }}</span>
        </button>
      </div>
    </template>

    <!-- Add Item Dialog -->
    <PrescriptionItemDialog
      v-if="itemDialogVisible"
      v-model="itemDialogVisible"
      @confirm="handleItemConfirm"
    />
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, h } from "vue";
import { ElMessage } from "element-plus";
import { prescriptionApi } from "@/api/prescription";
import { medicalRecordApi } from "@/api/medicalRecord";
import type { MedicalRecord } from "@/types/medicalRecord";
import type {
  CreatePrescriptionItemRequest,
  Prescription,
} from "@/types/prescription";
import type { FormInstance, FormRules } from "element-plus";
import PrescriptionItemDialog from "./PrescriptionItemDialog.vue";

// Custom Icons
const PrescriptionIcon = () =>
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
        d: "M11 2h2a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z",
      }),
      h("path", { d: "M6 8h12" }),
      h("path", { d: "M6 12h12" }),
      h("path", { d: "M6 16h12" }),
    ],
  );

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

const XIcon = () =>
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
      h("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
      h("line", { x1: "6", y1: "6", x2: "18", y2: "18" }),
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

const LoadingIcon = () =>
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
      class: "animate-spin",
    },
    [h("path", { d: "M21 12a9 9 0 1 1-6.219-8.56" })],
  );

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "success"): void;
}

const props = defineProps<{
  modelValue: boolean;
  prescription?: Prescription;
}>();

const emit = defineEmits<Emits>();

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const isEdit = computed(() => !!props.prescription);

const formRef = ref<FormInstance>();
const submitting = ref(false);
const loading = ref(false);
const medicalRecordOptions = ref<MedicalRecord[]>([]);
const itemDialogVisible = ref(false);

const form = reactive<{
  medicalRecordId: string;
  note: string;
  items: Array<
    CreatePrescriptionItemRequest & {
      medicineName: string;
      medicineCode: string;
      unit: string;
    }
  >;
}>({
  medicalRecordId: "",
  note: "",
  items: [],
});

const rules: FormRules = {
  medicalRecordId: [
    {
      required: true,
      message: "Vui lòng chọn bệnh án",
      trigger: "change",
    },
  ],
};

const loadMedicalRecords = async () => {
  try {
    const response = await medicalRecordApi.search({
      page: 0,
      size: 100,
    });
    medicalRecordOptions.value = response.content || [];
  } catch (error) {
    console.error("Failed to load medical records:", error);
  }
};

const loadPrescriptionDetail = async (prescriptionId: string) => {
  try {
    loading.value = true;
    const prescription = await prescriptionApi.getById(prescriptionId);

    form.medicalRecordId = prescription.medicalRecordId;
    form.note = prescription.note || "";

    // Clear and repopulate items array to ensure reactivity
    form.items.splice(0, form.items.length);
    const items =
      prescription.items?.map((item) => ({
        medicineId: item.medicineId,
        medicineName: item.medicineName,
        medicineCode: item.medicineCode,
        unit: item.unit || "",
        quantity: item.quantity,
        dosage: item.dosage,
        note: item.note || "",
      })) || [];
    form.items.push(...items);
  } catch (error) {
    console.error("Failed to load prescription detail:", error);
    ElMessage.error("Không thể tải thông tin đơn thuốc");
  } finally {
    loading.value = false;
  }
};

const handleAddItem = () => {
  itemDialogVisible.value = true;
};

const handleItemConfirm = (
  item: CreatePrescriptionItemRequest & {
    medicineName: string;
    medicineCode: string;
    unit: string;
  },
) => {
  form.items.push(item);
};

const handleRemoveItem = (index: number) => {
  form.items.splice(index, 1);
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();

    if (form.items.length === 0) {
      ElMessage.warning("Vui lòng thêm ít nhất một loại thuốc");
      return;
    }

    submitting.value = true;

    const payload = {
      medicalRecordId: form.medicalRecordId,
      note: form.note || undefined,
      items: form.items.map((item) => ({
        medicineId: item.medicineId,
        quantity: item.quantity,
        dosage: item.dosage,
        note: item.note,
      })),
    };

    if (isEdit.value && props.prescription) {
      await prescriptionApi.update(props.prescription.id, payload);
      ElMessage.success("Cập nhật đơn thuốc thành công");
    } else {
      await prescriptionApi.create(payload);
      ElMessage.success("Tạo đơn thuốc thành công");
    }

    emit("success");
    handleClose();
  } catch (error) {
    console.error("Failed to save prescription:", error);
    ElMessage.error(
      isEdit.value ? "Cập nhật thất bại" : "Tạo đơn thuốc thất bại",
    );
  } finally {
    submitting.value = false;
  }
};

const handleClose = () => {
  visible.value = false;
  formRef.value?.resetFields();
  form.medicalRecordId = "";
  form.note = "";
  form.items = [];
};

// Load medical records on mount
loadMedicalRecords();

// Watch for dialog open to load data
watch(
  [() => props.modelValue, () => props.prescription],
  ([isVisible, prescription]) => {
    if (isVisible && prescription) {
      // Load full data with items when dialog opens in edit mode
      loadPrescriptionDetail(prescription.id);
      loadMedicalRecords();
    } else if (isVisible && !prescription) {
      // Load medical records for create mode
      loadMedicalRecords();
    }
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
.prescription-form-dialog {
  :deep(.el-dialog__header) {
    padding: 0;
    margin: 0;
  }

  :deep(.el-dialog__body) {
    padding: 24px;
  }

  :deep(.el-dialog__footer) {
    padding: 0;
  }
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  color: white;

  .header-icon {
    width: 48px;
    height: 48px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    svg {
      width: 24px;
      height: 24px;
      stroke: white;
    }
  }

  .header-title {
    font-size: 20px;
    font-weight: 700;
    color: white;
  }
}

.add-item-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 20px;
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);

  svg {
    width: 20px;
    height: 20px;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(20, 184, 166, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
}

.delete-button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  background: #fef2f2;
  color: #dc2626;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  svg {
    width: 14px;
    height: 14px;
  }

  &:hover {
    background: #fee2e2;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  background: white;
  border-top: 1px solid #f3f4f6;

  .footer-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 24px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;

    svg {
      width: 20px;
      height: 20px;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .cancel-button {
    background: white;
    color: #6b7280;
    border: 1px solid #d1d5db;

    &:hover:not(:disabled) {
      background: #f9fafb;
      border-color: #9ca3af;
    }
  }

  .submit-button {
    background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);

    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(20, 184, 166, 0.4);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
