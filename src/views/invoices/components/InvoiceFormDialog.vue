<template>
  <el-dialog
    v-model="visible"
    :close-on-click-modal="false"
    :show-close="false"
    @close="handleClose"
    width="95%"
    class="modern-invoice-dialog"
  >
    <template #header>
      <div class="dialog-header">
        <component :is="InvoiceIcon" class="header-icon" />
        <span class="header-title">Tạo hóa đơn</span>
      </div>
    </template>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      class="modern-form"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="Bệnh nhân" prop="patientId">
            <el-select
              v-model="form.patientId"
              placeholder="Chọn bệnh nhân"
              filterable
              :loading="patientLoading"
              size="large"
              style="width: 100%"
              @change="handlePatientChange"
            >
              <template #prefix>
                <component :is="PatientIcon" class="input-icon" />
              </template>
              <el-option
                v-for="patient in patientOptions"
                :key="patient.id"
                :label="`${patient.patientCode} - ${patient.fullName}`"
                :value="patient.id"
              />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="Kế hoạch điều trị" prop="treatmentPlanId">
            <el-select
              v-model="form.treatmentPlanId"
              placeholder="Chọn kế hoạch (tùy chọn)"
              filterable
              clearable
              :loading="planLoading"
              :disabled="!form.patientId"
              size="large"
              style="width: 100%"
              @change="handlePlanChange"
            >
              <template #prefix>
                <component :is="PlanIcon" class="input-icon" />
              </template>
              <el-option label="Không có (Thêm dịch vụ thủ công)" value="" />
              <el-option
                v-for="plan in treatmentPlanOptions"
                :key="plan.id"
                :label="`${plan.planCode} - ${getStatusLabel(plan.status)}`"
                :value="plan.id"
              >
                <div class="flex justify-between items-center">
                  <span>{{ plan.planCode }}</span>
                  <el-tag size="small" :type="getStatusType(plan.status)">
                    {{ getStatusLabel(plan.status) }}
                  </el-tag>
                </div>
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="Ghi chú">
        <el-input
          v-model="form.note"
          type="textarea"
          :rows="2"
          placeholder="Nhập ghi chú..."
        >
          <template #prefix>
            <component :is="NoteIcon" class="input-icon" />
          </template>
        </el-input>
      </el-form-item>

      <!-- Items Section -->
      <div class="items-section">
        <div class="section-header">
          <div class="header-left">
            <component :is="ServiceIcon" class="section-icon" />
            <span class="section-title">Danh sách dịch vụ & thuốc</span>
            <span class="item-count">{{ form.items.length }} mục</span>
            <span class="item-count text-blue-600" v-if="servicesCount > 0">({{ servicesCount }} dịch vụ)</span>
            <span class="item-count text-orange-600" v-if="medicinesCount > 0">({{ medicinesCount }} thuốc)</span>
          </div>
          <button
            type="button"
            class="add-item-button"
            :disabled="!!form.treatmentPlanId"
            @click="handleAddItem"
          >
            <component :is="PlusIcon" />
            <span>Thêm dịch vụ</span>
          </button>
        </div>

        <!-- Services Table -->
        <div v-if="servicesCount > 0" class="table-section">
          <h4 class="table-subtitle">Dịch vụ ({{ servicesCount }})</h4>
          <el-table
            :data="servicesItems"
            class="modern-table service-table"
            style="width: 100%"
            :empty-text="'Chưa có dịch vụ nào'"
          >
            <el-table-column type="index" label="STT" width="60" align="center" />
            <el-table-column
              prop="itemName"
              label="Tên dịch vụ"
              min-width="250"
            />
            <el-table-column prop="serviceCode" label="Mã DV" width="100" />
            <el-table-column label="SL" width="80" align="center">
              <template #default="{ row }">
                {{ row.quantity }}
              </template>
            </el-table-column>
            <el-table-column label="Đơn giá" width="130" align="right">
              <template #default="{ row }">
                {{ formatCurrency(row.unitPrice) }}
              </template>
            </el-table-column>
            <el-table-column label="Giảm giá" width="120" align="right">
              <template #default="{ row }">
                <span class="text-red-500">{{
                  formatCurrency(row.discountAmount || 0)
                }}</span>
              </template>
            </el-table-column>
            <el-table-column label="Thành tiền" width="140" align="right">
              <template #default="{ row }">
                <span class="amount-value">
                  {{ formatCurrency(calculateLineTotal(row)) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column
              v-if="!form.treatmentPlanId"
              label="Thao tác"
              width="100"
              align="center"
            >
              <template #default="{ $index }">
                <button class="delete-button" @click="handleRemoveServiceItem($index)">
                  <component :is="TrashIcon" />
                </button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- Medicines Table -->
        <div v-if="medicinesCount > 0" class="table-section">
          <h4 class="table-subtitle">Thuốc ({{ medicinesCount }})</h4>
          <el-table
            :data="medicinesItems"
            class="modern-table medicine-table"
            style="width: 100%"
            :empty-text="'Chưa có thuốc nào'"
          >
            <el-table-column type="index" label="STT" width="60" align="center" />
            <el-table-column
              prop="itemName"
              label="Tên thuốc"
              min-width="250"
            />
            <el-table-column prop="serviceCode" label="Mã thuốc" width="100" />
            <el-table-column label="SL" width="80" align="center">
              <template #default="{ row }">
                {{ row.quantity }}
              </template>
            </el-table-column>
            <el-table-column label="Đơn giá" width="130" align="right">
              <template #default="{ row }">
                {{ formatCurrency(row.unitPrice) }}
              </template>
            </el-table-column>
            <el-table-column label="Giảm giá" width="120" align="right">
              <template #default="{ row }">
                <span class="text-red-500">{{
                  formatCurrency(row.discountAmount || 0)
                }}</span>
              </template>
            </el-table-column>
            <el-table-column label="Thành tiền" width="140" align="right">
              <template #default="{ row }">
                <span class="amount-value">
                  {{ formatCurrency(calculateLineTotal(row)) }}
                </span>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- Summary Card -->
        <div class="summary-card">
          <div class="summary-row">
            <span class="summary-label">Tạm tính:</span>
            <span class="summary-value">{{ formatCurrency(subtotal) }}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Giảm giá hóa đơn:</span>
            <el-input-number
              v-model="form.discountAmount"
              :min="0"
              :max="subtotal"
              :precision="0"
              :controls="false"
              size="large"
              style="width: 200px"
            />
          </div>
          <div class="summary-divider"></div>
          <div class="summary-row total">
            <span class="summary-label">Tổng tiền:</span>
            <span class="summary-value">
              {{ formatCurrency(totalAmount) }}
            </span>
          </div>
        </div>
      </div>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <button class="cancel-button" @click="handleClose">
          <component :is="CloseIcon" />
          <span>Hủy</span>
        </button>
        <button
          class="submit-button"
          :disabled="submitting"
          @click="handleSubmit"
        >
          <component :is="SaveIcon" />
          <span>{{ submitting ? "Đang tạo..." : "Tạo hóa đơn" }}</span>
        </button>
      </div>
    </template>

    <!-- Add Item Dialog -->
    <AddInvoiceItemDialog
      v-if="itemDialogVisible"
      v-model="itemDialogVisible"
      @confirm="handleItemConfirm"
    />
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, h } from "vue";
import { ElMessage } from "element-plus";
import { invoiceApi } from "@/api/invoice";
import { patientApi } from "@/api/patient";
import { treatmentPlanApi } from "@/api/treatmentPlan";
import { prescriptionApi } from "@/api/prescription";
import type { Patient } from "@/types";
import type { TreatmentPlan, TreatmentPlanStatus } from "@/types/treatmentPlan";
import type { CreateInvoiceItemRequest } from "@/types/invoice";
import type { FormInstance, FormRules } from "element-plus";
import AddInvoiceItemDialog from "./AddInvoiceItemDialog.vue";

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "success"): void;
}

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<Emits>();

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const formRef = ref<FormInstance>();
const submitting = ref(false);

const patientLoading = ref(false);
const patientOptions = ref<Patient[]>([]);

const planLoading = ref(false);
const treatmentPlanOptions = ref<TreatmentPlan[]>([]);

const itemDialogVisible = ref(false);

const form = reactive<{
  patientId: string;
  treatmentPlanId: string;
  note: string;
  discountAmount: number;
  items: CreateInvoiceItemRequest[];
}>({
  patientId: "",
  treatmentPlanId: "",
  note: "",
  discountAmount: 0,
  items: [],
});

const rules: FormRules = {
  patientId: [
    {
      required: true,
      message: "Vui lòng chọn bệnh nhân",
      trigger: "change",
    },
  ],
};

// Load patients
const loadPatients = async () => {
  try {
    patientLoading.value = true;
    const response = await patientApi.search({
      page: 0,
      size: 1000,
    });
    patientOptions.value = response.content || [];
  } catch (error) {
    console.error("Failed to load patients:", error);
  } finally {
    patientLoading.value = false;
  }
};

// Load treatment plans for selected patient
const loadTreatmentPlans = async (patientId: string) => {
  try {
    planLoading.value = true;
    const response = await treatmentPlanApi.listByPatient(patientId, {
      page: 0,
      size: 100,
    });
    // Only show plans with DONE status
    treatmentPlanOptions.value =
      response.content?.filter((p) => p.status === "DONE") || [];
  } catch (error) {
    console.error("Failed to load treatment plans:", error);
  } finally {
    planLoading.value = false;
  }
};

const handlePatientChange = (patientId: string) => {
  form.treatmentPlanId = "";
  form.items = [];
  if (patientId) {
    loadTreatmentPlans(patientId);
  } else {
    treatmentPlanOptions.value = [];
  }
};

const handlePlanChange = async (planId: string) => {
  form.items = [];
  if (planId) {
    // Load treatment plan details and fill items
    try {
      planLoading.value = true;
      const plan = await treatmentPlanApi.getById(planId);

      // Map treatment items to invoice items
      form.items = (plan.items || []).map((item) => ({
        serviceId: item.serviceId,
        itemName: item.itemName,
        serviceCode: item.serviceCode,
        serviceType: item.serviceType,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountAmount: item.discountAmount || 0,
        note: item.note,
      }));

      // Load prescriptions from medical record and add medicine items
      try {
        const prescriptionsResponse = await prescriptionApi.search({
          medicalRecordId: plan.medicalRecordId,
          status: "DISPENSED",
          page: 0,
          size: 100,
        });

        // Add medicine items from dispensed prescriptions
        for (const rxSummary of prescriptionsResponse.content || []) {
          // Only process prescriptions from this medical record
          if (rxSummary.medicalRecordId !== plan.medicalRecordId) {
            continue;
          }

          // Load full prescription details to get items
          try {
            const rx = await prescriptionApi.getById(rxSummary.id);

            for (const item of rx.items || []) {
              form.items.push({
                itemName: `Thuốc: ${item.medicineName}`,
                serviceCode: item.medicineCode,
                serviceType: "MEDICINE",
                quantity: item.quantity,
                unitPrice: 0,
                discountAmount: 0,
                note: item.dosage,
              });
            }
          } catch (detailError) {
            console.error("Failed to load prescription details:", detailError);
          }
        }
      } catch (prescriptionError) {
        console.error("Failed to load prescriptions:", prescriptionError);
      }
    } catch (error) {
      console.error("Failed to load treatment plan details:", error);
      ElMessage.error("Không thể tải chi tiết kế hoạch điều trị");
    } finally {
      planLoading.value = false;
    }
  }
};

const handleAddItem = () => {
  itemDialogVisible.value = true;
};

const handleItemConfirm = (item: CreateInvoiceItemRequest) => {
  form.items.push(item);
};

const handleRemoveServiceItem = (index: number) => {
  const item = servicesItems.value[index];
  if (!item) {
    return;
  }
  const fullIndex = form.items.indexOf(item);
  if (fullIndex > -1) {
    form.items.splice(fullIndex, 1);
  }
};

const calculateLineTotal = (item: CreateInvoiceItemRequest) => {
  const subtotal = (item.unitPrice || 0) * (item.quantity || 1);
  return subtotal - (item.discountAmount || 0);
};

const subtotal = computed(() => {
  return form.items.reduce((sum, item) => sum + calculateLineTotal(item), 0);
});

const totalAmount = computed(() => {
  return Math.max(0, subtotal.value - (form.discountAmount || 0));
});

const servicesCount = computed(() => {
  return form.items.filter(item => item.serviceType !== "MEDICINE").length;
});

const medicinesCount = computed(() => {
  return form.items.filter(item => item.serviceType === "MEDICINE").length;
});

const servicesItems = computed(() => {
  return form.items.filter(item => item.serviceType !== "MEDICINE");
});

const medicinesItems = computed(() => {
  return form.items.filter(item => item.serviceType === "MEDICINE");
});

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();

    if (!form.treatmentPlanId && form.items.length === 0) {
      ElMessage.warning("Vui lòng chọn kế hoạch điều trị hoặc thêm dịch vụ");
      return;
    }

    submitting.value = true;

    await invoiceApi.create({
      patientId: form.patientId,
      treatmentPlanId: form.treatmentPlanId || undefined,
      note: form.note || undefined,
      discountAmount: form.discountAmount || undefined,
      items: form.treatmentPlanId ? undefined : form.items,
    });

    ElMessage.success("Tạo hóa đơn thành công");
    emit("success");
    handleClose();
  } catch (error) {
    console.error("Failed to create invoice:", error);
    ElMessage.error("Tạo hóa đơn thất bại");
  } finally {
    submitting.value = false;
  }
};

const handleClose = () => {
  visible.value = false;
  formRef.value?.resetFields();
  form.patientId = "";
  form.treatmentPlanId = "";
  form.note = "";
  form.discountAmount = 0;
  form.items = [];
  treatmentPlanOptions.value = [];
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

// Custom SVG Icons
const InvoiceIcon = h(
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

const PatientIcon = h(
  "svg",
  {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    style: { width: "18px", height: "18px" },
  },
  [
    h("path", { d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" }),
    h("circle", { cx: "12", cy: "7", r: "4" }),
  ],
);

const PlanIcon = h(
  "svg",
  {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    style: { width: "18px", height: "18px" },
  },
  [
    h("path", { d: "M9 11l3 3L22 4" }),
    h("path", {
      d: "M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
    }),
  ],
);

const ServiceIcon = h(
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
  [
    h("path", {
      d: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
    }),
    h("polyline", { points: "3.27 6.96 12 12.01 20.73 6.96" }),
    h("line", { x1: "12", y1: "22.08", x2: "12", y2: "12" }),
  ],
);

const NoteIcon = h(
  "svg",
  {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    style: { width: "18px", height: "18px" },
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

const PlusIcon = h(
  "svg",
  {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    style: { width: "16px", height: "16px" },
  },
  [
    h("line", { x1: "12", y1: "5", x2: "12", y2: "19" }),
    h("line", { x1: "5", y1: "12", x2: "19", y2: "12" }),
  ],
);

const TrashIcon = h(
  "svg",
  {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    style: { width: "16px", height: "16px" },
  },
  [
    h("polyline", { points: "3 6 5 6 21 6" }),
    h("path", {
      d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
    }),
  ],
);

const CloseIcon = h(
  "svg",
  {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    style: { width: "16px", height: "16px" },
  },
  [
    h("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
    h("line", { x1: "6", y1: "6", x2: "18", y2: "18" }),
  ],
);

const SaveIcon = h(
  "svg",
  {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    style: { width: "16px", height: "16px" },
  },
  [
    h("path", {
      d: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z",
    }),
    h("polyline", { points: "17 21 17 13 7 13 7 21" }),
    h("polyline", { points: "7 3 7 8 15 8" }),
  ],
);

// Load patients on mount
loadPatients();
</script>

<style scoped lang="scss">
.modern-invoice-dialog {
  :deep(.el-dialog) {
    border-radius: 16px;
    overflow: hidden;
  }

  :deep(.el-dialog__header) {
    padding: 0;
    margin: 0;
  }

  :deep(.el-dialog__body) {
    padding: 24px;
    max-height: 70vh;
    overflow-y: auto;
  }

  :deep(.el-dialog__footer) {
    padding: 20px 24px;
    border-top: 1px solid #e5e7eb;
  }
}

.dialog-header {
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;

  svg {
    flex-shrink: 0;
  }

  h3 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
  }
}

.modern-form {
  display: flex;
  flex-direction: column;
  gap: 20px;

  :deep(.el-form-item__label) {
    font-weight: 500;
    color: #374151;
    margin-bottom: 8px;
  }

  :deep(.el-select),
  :deep(.el-input) {
    width: 100%;
  }

  :deep(.el-input__wrapper) {
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    padding: 0 16px;
    transition: all 0.2s;

    &:hover {
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    &.is-focus {
      box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
    }
  }

  :deep(.el-input__inner) {
    height: 42px;
  }

  :deep(.el-textarea__inner) {
    border-radius: 8px;
    padding: 12px 16px;
    min-height: 80px !important;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    transition: all 0.2s;

    &:hover {
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    &:focus {
      box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
    }
  }

  .input-icon {
    display: flex;
    align-items: center;
    gap: 10px;

    svg {
      color: #6b7280;
      flex-shrink: 0;
    }
  }
}

.items-section {
  margin-top: 24px;

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 16px;

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
    }

    .section-icon {
      color: #14b8a6;
      flex-shrink: 0;
      width: 20px;
      height: 20px;
    }

    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
    }

    svg {
      color: #14b8a6;
      flex-shrink: 0;
    }

    h4 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
      flex: 1;
    }

    .item-count {
      background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
      color: white;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
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

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }
    }
  }
}

.modern-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  thead {
    background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);

    th {
      padding: 14px 16px;
      text-align: left;
      font-weight: 600;
      font-size: 13px;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;

      &:first-child {
        padding-left: 20px;
      }

      &:last-child {
        padding-right: 20px;
        text-align: center;
      }
    }
  }

  tbody {
    tr {
      border-bottom: 1px solid #f3f4f6;
      transition: background-color 0.2s;

      &:hover {
        background-color: #f9fafb;
      }

      &:last-child {
        border-bottom: none;
      }

      td {
        padding: 14px 16px;
        font-size: 14px;
        color: #4b5563;

        &:first-child {
          padding-left: 20px;
          font-weight: 500;
          color: #6b7280;
        }

        &:last-child {
          padding-right: 20px;
          text-align: center;
        }

        .amount-value {
          font-weight: 600;
          color: #059669;
        }
      }
    }
  }

  .delete-button {
    padding: 6px 10px;
    background: #fee2e2;
    color: #dc2626;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: #fecaca;
      transform: translateY(-1px);
    }

    svg {
      width: 16px;
      height: 16px;
    }
  }
}

.table-section {
  margin-top: 24px;

  .table-subtitle {
    margin: 0 0 12px 0;
    font-size: 15px;
    font-weight: 600;
    color: #374151;
    display: flex;
    align-items: center;
    gap: 8px;

    &::before {
      content: "";
      display: inline-block;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background-color: #14b8a6;
    }
  }
}

.service-table {
  :deep(thead) {
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  }
}

.medicine-table {
  :deep(thead) {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  }
}

:deep(.medicine-row) {
  background-color: #fef3c7 !important;

  &:hover {
    background-color: #fde68a !important;
  }
}

:deep(.service-row) {
  background-color: #f0f9ff !important;

  &:hover {
    background-color: #e0f2fe !important;
  }
}

.summary-card {
  margin-top: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%);
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  .summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    font-size: 15px;

    &.total-row {
      margin-top: 12px;
      padding-top: 16px;
      border-top: 2px solid #14b8a6;
      font-size: 18px;
      font-weight: 700;

      .label {
        color: #0f766e;
      }

      .value {
        color: #059669;
      }
    }

    .label {
      color: #374151;
      font-weight: 500;
    }

    .value {
      color: #1f2937;
      font-weight: 600;
    }

    :deep(.el-input) {
      max-width: 200px;
    }

    :deep(.el-input__wrapper) {
      background: white;
    }
  }

  .divider {
    height: 2px;
    background: #14b8a6;
    margin: 12px 0;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;

  button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 24px;
    border: none;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;

    svg {
      width: 16px;
      height: 16px;
    }

    &.cancel-button {
      background: white;
      color: #6b7280;
      border: 1px solid #d1d5db;

      &:hover {
        background: #f9fafb;
        border-color: #9ca3af;
      }
    }

    &.submit-button {
      background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
      color: white;
      box-shadow: 0 2px 4px rgba(20, 184, 166, 0.3);

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(20, 184, 166, 0.4);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
  }
}
</style>
