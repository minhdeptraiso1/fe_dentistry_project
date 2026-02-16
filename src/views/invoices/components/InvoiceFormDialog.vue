<template>
  <el-dialog
    v-model="visible"
    title="Tạo hóa đơn"
    width="90%"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="140px"
      label-position="left"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="Bệnh nhân" prop="patientId">
            <el-select
              v-model="form.patientId"
              placeholder="Chọn bệnh nhân"
              filterable
              :loading="patientLoading"
              style="width: 100%"
              @change="handlePatientChange"
            >
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
              style="width: 100%"
              @change="handlePlanChange"
            >
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
        />
      </el-form-item>

      <!-- Items Table -->
      <el-form-item label="Danh sách dịch vụ">
        <div class="w-full">
          <div class="mb-2 flex justify-between items-center">
            <span class="text-sm text-gray-600">
              {{ form.items.length }} dịch vụ
            </span>
            <el-button
              type="primary"
              size="small"
              :disabled="!!form.treatmentPlanId"
              @click="handleAddItem"
            >
              <el-icon class="mr-1"><Plus /></el-icon>
              Thêm dịch vụ
            </el-button>
          </div>

          <el-table
            :data="form.items"
            border
            stripe
            style="width: 100%"
            :empty-text="
              form.treatmentPlanId
                ? 'Chọn kế hoạch điều trị để tự động tải dịch vụ'
                : 'Chưa có dịch vụ nào'
            "
          >
            <el-table-column type="index" label="STT" width="60" />
            <el-table-column
              prop="itemName"
              label="Tên dịch vụ"
              min-width="200"
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
                {{ formatCurrency(row.discountAmount || 0) }}
              </template>
            </el-table-column>
            <el-table-column label="Thành tiền" width="140" align="right">
              <template #default="{ row }">
                <span class="font-semibold text-green-600">
                  {{ formatCurrency(calculateLineTotal(row)) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column
              v-if="!form.treatmentPlanId"
              label="Thao tác"
              width="80"
              align="center"
            >
              <template #default="{ $index }">
                <el-button
                  type="danger"
                  size="small"
                  link
                  @click="handleRemoveItem($index)"
                >
                  Xóa
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- Summary -->
          <div class="mt-4 flex justify-end">
            <div class="w-96 space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Tạm tính:</span>
                <span class="text-lg">{{ formatCurrency(subtotal) }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Giảm giá hóa đơn:</span>
                <el-input-number
                  v-model="form.discountAmount"
                  :min="0"
                  :max="subtotal"
                  :precision="0"
                  :controls="false"
                  size="small"
                  style="width: 200px"
                />
              </div>
              <el-divider />
              <div class="flex justify-between items-center">
                <span class="text-lg font-semibold">Tổng tiền:</span>
                <span class="text-2xl font-bold text-green-600">
                  {{ formatCurrency(totalAmount) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">Hủy</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        Tạo hóa đơn
      </el-button>
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
import { ref, reactive, computed } from "vue";
import { ElMessage } from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import { invoiceApi } from "@/api/invoice";
import { patientApi } from "@/api/patient";
import { treatmentPlanApi } from "@/api/treatmentPlan";
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

const handleRemoveItem = (index: number) => {
  form.items.splice(index, 1);
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

// Load patients on mount
loadPatients();
</script>
