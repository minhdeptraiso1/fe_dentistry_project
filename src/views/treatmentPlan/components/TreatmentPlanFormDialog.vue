<template>
  <el-dialog
    v-model="visible"
    :show-close="false"
    width="90%"
    :close-on-click-modal="false"
    @close="handleClose"
    class="modern-treatment-dialog"
  >
    <template #header>
      <div class="dialog-header">
        <component :is="TreatmentPlanIcon" class="header-icon" />
        <h3 class="header-title">
          {{ isEdit ? "Cập nhật kế hoạch điều trị" : "Tạo kế hoạch điều trị" }}
        </h3>
      </div>
    </template>
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="140px"
      label-position="left"
      class="modern-form"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="Hồ sơ bệnh án" prop="medicalRecordId">
            <el-select
              v-model="form.medicalRecordId"
              placeholder="Chọn hồ sơ bệnh án"
              filterable
              remote
              :remote-method="searchMedicalRecords"
              :loading="medicalRecordLoading"
              :disabled="isEdit"
              style="width: 100%"
              size="large"
              @change="handleMedicalRecordChange"
            >
              <template #prefix>
                <component :is="RecordIcon" class="input-icon" />
              </template>
              <el-option
                v-for="record in medicalRecordOptions"
                :key="record.id"
                :label="`${record.recordCode} - ${record.patientName} (${formatDate(record.visitDate)})`"
                :value="record.id"
              />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="Trạng thái" prop="status">
            <el-select
              v-model="form.status"
              placeholder="Chọn trạng thái"
              style="width: 100%"
              size="large"
            >
              <template #prefix>
                <component :is="StatusIcon" class="input-icon" />
              </template>
              <el-option label="Nháp" value="DRAFT" />
              <el-option label="Đã duyệt" value="APPROVED" />
              <el-option label="Đang thực hiện" value="IN_PROGRESS" />
              <el-option label="Hoàn thành" value="DONE" />
              <el-option label="Đã hủy" value="CANCELLED" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="Ghi chú">
        <el-input
          v-model="form.note"
          type="textarea"
          :rows="3"
          placeholder="Nhập ghi chú"
          size="large"
        >
          <template #prefix>
            <component :is="NoteIcon" class="input-icon" />
          </template>
        </el-input>
      </el-form-item>

      <div class="section-divider">
        <component :is="ServiceIcon" class="section-icon" />
        <span class="section-title">Danh sách dịch vụ điều trị</span>
      </div>

      <div class="mb-4">
        <button @click.prevent="handleAddItem" class="add-item-button">
          <component :is="PlusIcon" />
          <span>Thêm dịch vụ</span>
        </button>
      </div>

      <div class="table-container">
        <el-table
          :data="form.items"
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
          <el-table-column label="SL" width="96" align="center">
            <template #default="{ row }">
              <el-input-number
                v-model="row.quantity"
                :min="1"
                :max="100"
                :step="1"
                :controls="false"
                size="small"
                class="quantity-number-input"
                @change="calculateLineTotal(row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="Đơn giá" width="150" align="right">
            <template #default="{ row }">
              <el-input-number
                v-model="row.unitPrice"
                :min="0"
                :step="1000"
                size="small"
                controls-position="right"
                style="width: 100%"
                @change="calculateLineTotal(row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="Giảm giá" width="150" align="right">
            <template #default="{ row }">
              <el-input-number
                v-model="row.discountAmount"
                :min="0"
                :max="row.unitPrice * row.quantity"
                :step="1000"
                size="small"
                controls-position="right"
                style="width: 100%"
                @change="calculateLineTotal(row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="Thành tiền" width="150" align="right">
            <template #default="{ row }">
              <span class="amount-text">
                {{ formatCurrency(row.lineTotal || 0) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="Số răng" width="100">
            <template #default="{ row }">
              <el-input
                v-model="row.toothNo"
                size="small"
                placeholder="VD: 11"
              />
            </template>
          </el-table-column>
          <el-table-column label="Mặt răng" width="100">
            <template #default="{ row }">
              <el-input
                v-model="row.toothSurface"
                size="small"
                placeholder="VD: M"
              />
            </template>
          </el-table-column>
          <el-table-column label="Ghi chú" min-width="150">
            <template #default="{ row }">
              <el-input v-model="row.note" size="small" placeholder="Ghi chú" />
            </template>
          </el-table-column>
          <el-table-column
            label="Thao tác"
            width="80"
            fixed="right"
            align="center"
          >
            <template #default="{ $index }">
              <button
                @click="handleRemoveItem($index)"
                class="delete-item-btn"
                title="Xóa"
              >
                <component :is="TrashIcon" />
              </button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="summary-section">
        <div class="summary-card">
          <div class="summary-row">
            <span class="summary-label">Tổng tiền:</span>
            <span class="summary-value">{{ formatCurrency(totalAmount) }}</span>
          </div>
          <div class="summary-row discount-row">
            <span class="summary-label">Tổng giảm giá:</span>
            <span class="summary-value discount-value">
              {{ formatCurrency(totalDiscount) }}
            </span>
          </div>
          <div class="summary-row total-row">
            <span class="summary-label">Thành tiền:</span>
            <span class="summary-value final-value">
              {{ formatCurrency(finalAmount) }}
            </span>
          </div>
        </div>
      </div>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <button @click="handleClose" class="cancel-button">
          <component :is="CloseIcon" />
          <span>Hủy</span>
        </button>
        <button
          @click="handleSubmit"
          class="submit-button"
          :disabled="submitting"
        >
          <component :is="submitting ? LoadingIcon : CheckIcon" />
          <span>{{ submitting ? "Đang lưu..." : "Lưu" }}</span>
        </button>
      </div>
    </template>

    <!-- Item Dialog -->
    <TreatmentPlanItemDialog
      v-if="itemDialogVisible"
      v-model="itemDialogVisible"
      :item="currentItem"
      @confirm="handleItemConfirm"
    />
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, h } from "vue";
import { ElMessage } from "element-plus";
import { treatmentPlanApi } from "@/api/treatmentPlan";
import { medicalRecordApi } from "@/api/medicalRecord";
import type {
  TreatmentPlan,
  CreateTreatmentPlanRequest,
  UpdateTreatmentPlanRequest,
  CreateTreatmentItemRequest,
} from "@/types/treatmentPlan";
import type { MedicalRecord } from "@/types/medicalRecord";
import type { FormInstance, FormRules } from "element-plus";
import TreatmentPlanItemDialog from "./TreatmentPlanItemDialog.vue";

// Header Icons
const TreatmentPlanIcon = () =>
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
      style: { width: "24px", height: "24px" },
    },
    [
      h("path", {
        d: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2",
      }),
      h("rect", { x: "9", y: "3", width: "6", height: "4", rx: "1" }),
      h("path", { d: "M9 12h6" }),
      h("path", { d: "M9 16h6" }),
    ],
  );

const CloseIcon = () =>
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
      style: { width: "20px", height: "20px" },
    },
    [h("path", { d: "M18 6 6 18" }), h("path", { d: "m6 6 12 12" })],
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
      style: { width: "20px", height: "20px" },
    },
    [h("polyline", { points: "20 6 9 17 4 12" })],
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
      style: { width: "20px", height: "20px" },
    },
    [
      h("line", { x1: "12", y1: "2", x2: "12", y2: "6" }),
      h("line", { x1: "12", y1: "18", x2: "12", y2: "22" }),
      h("line", { x1: "4.93", y1: "4.93", x2: "7.76", y2: "7.76" }),
      h("line", { x1: "16.24", y1: "16.24", x2: "19.07", y2: "19.07" }),
      h("line", { x1: "2", y1: "12", x2: "6", y2: "12" }),
      h("line", { x1: "18", y1: "12", x2: "22", y2: "12" }),
      h("line", { x1: "4.93", y1: "19.07", x2: "7.76", y2: "16.24" }),
      h("line", { x1: "16.24", y1: "7.76", x2: "19.07", y2: "4.93" }),
    ],
  );

// Form Icons
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
      h("path", {
        d: "M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z",
      }),
      h("polyline", { points: "14 2 14 8 20 8" }),
    ],
  );

const StatusIcon = () =>
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
      h("path", { d: "M22 11.08V12a10 10 0 1 1-5.93-9.14" }),
      h("polyline", { points: "22 4 12 14.01 9 11.01" }),
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
      h("path", {
        d: "M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z",
      }),
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
      h("rect", {
        width: "18",
        height: "18",
        x: "3",
        y: "3",
        rx: "2",
        ry: "2",
      }),
      h("line", { x1: "3", x2: "21", y1: "9", y2: "9" }),
      h("line", { x1: "9", x2: "9", y1: "21", y2: "9" }),
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
    [h("path", { d: "M5 12h14" }), h("path", { d: "M12 5v14" })],
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

interface Props {
  modelValue: boolean;
  treatmentPlan?: TreatmentPlan | null;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "success"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const isEdit = computed(() => !!props.treatmentPlan?.id);

const formRef = ref<FormInstance>();
const submitting = ref(false);
const medicalRecordLoading = ref(false);
const medicalRecordOptions = ref<MedicalRecord[]>([]);
const itemDialogVisible = ref(false);
const currentItem = ref<CreateTreatmentItemRequest | null>(null);

interface FormItem extends CreateTreatmentItemRequest {
  serviceCode?: string;
  itemName?: string;
  lineTotal?: number;
}

const form = reactive<{
  medicalRecordId: string;
  status: string;
  note: string;
  items: FormItem[];
}>({
  medicalRecordId: "",
  status: "DRAFT",
  note: "",
  items: [],
});

const rules: FormRules = {
  medicalRecordId: [
    {
      required: true,
      message: "Vui lòng chọn hồ sơ bệnh án",
      trigger: "change",
    },
  ],
  status: [
    { required: true, message: "Vui lòng chọn trạng thái", trigger: "change" },
  ],
};

// Calculate totals
const totalAmount = computed(() => {
  return form.items.reduce((sum, item) => {
    return sum + (item.unitPrice || 0) * (item.quantity || 1);
  }, 0);
});

const totalDiscount = computed(() => {
  return form.items.reduce((sum, item) => {
    return sum + (item.discountAmount || 0);
  }, 0);
});

const finalAmount = computed(() => {
  return totalAmount.value - totalDiscount.value;
});

// Search medical records
const searchMedicalRecords = async (keyword: string) => {
  if (!keyword) {
    medicalRecordOptions.value = [];
    return;
  }

  try {
    medicalRecordLoading.value = true;
    const response = await medicalRecordApi.search({
      keyword,
      page: 1,
      size: 20,
    });
    medicalRecordOptions.value = response.content || [];
  } catch (error) {
    console.error("Failed to search medical records:", error);
  } finally {
    medicalRecordLoading.value = false;
  }
};

const handleMedicalRecordChange = () => {
  // Can add logic to load patient info or existing services
};

const calculateLineTotal = (item: FormItem) => {
  if (!item.quantity || item.quantity < 1) {
    item.quantity = 1;
  }
  const subtotal = (item.unitPrice || 0) * (item.quantity || 1);
  item.lineTotal = subtotal - (item.discountAmount || 0);
};

const handleAddItem = () => {
  currentItem.value = null;
  itemDialogVisible.value = true;
};

const handleItemConfirm = (item: FormItem) => {
  if (!item.quantity || item.quantity < 1) {
    item.quantity = 1;
  }
  calculateLineTotal(item);
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
      ElMessage.warning("Vui lòng thêm ít nhất một dịch vụ điều trị");
      return;
    }

    submitting.value = true;

    if (isEdit.value && props.treatmentPlan) {
      // Update
      const updateData: UpdateTreatmentPlanRequest = {
        note: form.note,
        status: form.status as any,
        items: form.items.map((item) => ({
          serviceId: item.serviceId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountAmount: item.discountAmount,
          toothNo: item.toothNo,
          toothSurface: item.toothSurface,
          note: item.note,
        })),
      };

      await treatmentPlanApi.update(props.treatmentPlan.id, updateData);
      ElMessage.success("Cập nhật kế hoạch điều trị thành công");
    } else {
      // Create
      const createData: CreateTreatmentPlanRequest = {
        medicalRecordId: form.medicalRecordId,
        note: form.note,
        items: form.items.map((item) => ({
          serviceId: item.serviceId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountAmount: item.discountAmount,
          toothNo: item.toothNo,
          toothSurface: item.toothSurface,
          note: item.note,
        })),
      };

      await treatmentPlanApi.create(createData);
      ElMessage.success("Tạo kế hoạch điều trị thành công");
    }

    emit("success");
    handleClose();
  } catch (error: any) {
    console.error("Failed to submit treatment plan:", error);
    if (error.response?.data?.message) {
      ElMessage.error(error.response.data.message);
    } else {
      ElMessage.error(
        isEdit.value
          ? "Cập nhật kế hoạch điều trị thất bại"
          : "Tạo kế hoạch điều trị thất bại",
      );
    }
  } finally {
    submitting.value = false;
  }
};

const handleClose = () => {
  visible.value = false;
  formRef.value?.resetFields();
  form.items = [];
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

// Initialize form when editing or creating with pre-filled medicalRecordId
watch(
  () => props.treatmentPlan,
  (plan) => {
    if (plan) {
      form.medicalRecordId = plan.medicalRecordId;
      form.status = plan.status || "DRAFT";
      form.note = plan.note || "";

      // If editing, load items
      if (plan.items && plan.items.length > 0) {
        form.items = plan.items.map((item) => ({
          serviceId: item.serviceId,
          serviceCode: item.serviceCode,
          itemName: item.itemName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountAmount: item.discountAmount,
          toothNo: item.toothNo,
          toothSurface: item.toothSurface,
          note: item.note,
          lineTotal: item.lineTotal,
        }));
      }

      // Load medical record for display
      if (plan.medicalRecordId) {
        medicalRecordApi
          .getById(plan.medicalRecordId)
          .then((res) => {
            medicalRecordOptions.value = [res];
          })
          .catch((error) => {
            console.error("Failed to load medical record:", error);
          });
      }
    }
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
.modern-treatment-dialog {
  :deep(.el-dialog) {
    border-radius: 16px;
    overflow: hidden;
  }

  .dialog-header {
    display: flex;
    align-items: center;
    gap: 12px;
    background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
    padding: 24px 28px;
    color: white;

    .header-icon {
      width: 24px;
      height: 24px;
      color: white;
    }

    .header-title {
      font-size: 20px;
      font-weight: 700;
      color: white;
      margin: 0;
    }
  }

  :deep(.el-dialog__body) {
    padding: 28px;
    background: #f9fafb;
  }

  :deep(.el-dialog__footer) {
    padding: 20px 28px;
    background: #f9fafb;
    border-top: 1px solid #e5e7eb;
  }
}

.modern-form {
  :deep(.el-form-item__label) {
    font-weight: 500;
    color: #374151;
  }

  :deep(.el-input__wrapper) {
    border-radius: 10px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 2px 4px rgba(20, 184, 166, 0.1);
    }

    &.is-focus {
      box-shadow: 0 0 0 2px rgba(20, 184, 166, 0.2);
    }
  }

  :deep(.el-select .el-input__wrapper) {
    border-radius: 10px;
  }

  :deep(.el-textarea__inner) {
    border-radius: 10px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

    &:hover {
      box-shadow: 0 2px 4px rgba(20, 184, 166, 0.1);
    }

    &:focus {
      box-shadow: 0 0 0 2px rgba(20, 184, 166, 0.2);
    }
  }
}

.input-icon {
  width: 16px;
  height: 16px;
  color: #9ca3af;
}

.section-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 28px 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid #e5e7eb;

  .section-icon {
    width: 24px;
    height: 24px;
    color: #14b8a6;
  }

  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: #111827;
  }
}

.add-item-button {
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

.table-container {
  background: white;
  border-radius: 12px;
  padding: 16px;
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
      &:hover {
        background: #f0fdfa !important;
      }

      td {
        border-bottom: 1px solid #f3f4f6;
        padding: 12px 8px;
      }
    }

    :deep(.el-input-number) {
      width: 100%;

      .el-input__inner {
        text-align: right;
      }
    }

    :deep(.quantity-number-input .el-input__inner) {
      text-align: center;
      font-weight: 600;
      color: #111827;
      padding-left: 8px;
      padding-right: 8px;
    }
  }

  .amount-text {
    font-weight: 600;
    color: #059669;
  }

  .delete-item-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: #fef2f2;
    color: #ef4444;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;

    svg {
      width: 16px;
      height: 16px;
    }

    &:hover {
      background: #fee2e2;
      transform: scale(1.1);
    }

    &:active {
      transform: scale(0.95);
    }
  }
}

.summary-section {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;

  .summary-card {
    min-width: 400px;
    padding: 20px;
    background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%);
    border-radius: 12px;
    border: 2px solid #14b8a6;
    box-shadow: 0 2px 8px rgba(20, 184, 166, 0.15);

    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #99f6e4;

      &:last-child {
        border-bottom: none;
      }

      &.discount-row {
        .discount-value {
          color: #dc2626;
        }
      }

      &.total-row {
        padding-top: 14px;
        margin-top: 8px;
        border-top: 2px solid #14b8a6;

        .final-value {
          font-size: 20px;
          font-weight: 700;
          color: #059669;
        }
      }

      .summary-label {
        font-size: 14px;
        font-weight: 500;
        color: #0f766e;
      }

      .summary-value {
        font-size: 15px;
        font-weight: 600;
        color: #111827;
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 28px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;

  button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 24px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;

    svg {
      width: 18px;
      height: 18px;
    }

    &.cancel-button {
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

    &.submit-button {
      background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(20, 184, 166, 0.4);
      }

      &:active:not(:disabled) {
        transform: translateY(0);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
  }
}
</style>
