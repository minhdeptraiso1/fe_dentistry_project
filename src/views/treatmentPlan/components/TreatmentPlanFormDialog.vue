<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? 'Cập nhật kế hoạch điều trị' : 'Tạo kế hoạch điều trị'"
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
              @change="handleMedicalRecordChange"
            >
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
            >
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
        />
      </el-form-item>

      <el-divider content-position="left">
        <span class="text-sm font-semibold">Danh sách dịch vụ điều trị</span>
      </el-divider>

      <div class="mb-4">
        <el-button type="primary" @click="handleAddItem">
          <el-icon class="mr-1"><Plus /></el-icon>
          Thêm dịch vụ
        </el-button>
      </div>

      <el-table :data="form.items" border stripe style="width: 100%">
        <el-table-column type="index" label="STT" width="60" />
        <el-table-column prop="serviceCode" label="Mã DV" width="100" />
        <el-table-column prop="itemName" label="Tên dịch vụ" min-width="180" />
        <el-table-column label="SL" width="80">
          <template #default="{ row }">
            <el-input-number
              v-model="row.quantity"
              :min="1"
              :max="100"
              size="small"
              @change="calculateLineTotal(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="Đơn giá" width="140" align="right">
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
        <el-table-column label="Giảm giá" width="130" align="right">
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
        <el-table-column label="Thành tiền" width="140" align="right">
          <template #default="{ row }">
            <span class="font-semibold text-green-600">
              {{ formatCurrency(row.lineTotal || 0) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="Số răng" width="100">
          <template #default="{ row }">
            <el-input v-model="row.toothNo" size="small" placeholder="VD: 11" />
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
        <el-table-column label="Thao tác" width="80" fixed="right">
          <template #default="{ $index }">
            <el-button
              type="danger"
              size="small"
              link
              @click="handleRemoveItem($index)"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="mt-4 flex justify-end">
        <el-descriptions :column="1" border style="width: 400px">
          <el-descriptions-item label="Tổng tiền">
            <span class="font-semibold">{{ formatCurrency(totalAmount) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="Tổng giảm giá">
            <span class="font-semibold text-red-600">
              {{ formatCurrency(totalDiscount) }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="Thành tiền">
            <span class="text-lg font-bold text-green-600">
              {{ formatCurrency(finalAmount) }}
            </span>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">Hủy</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        Lưu
      </el-button>
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
import { ref, reactive, computed, watch } from "vue";
import { ElMessage } from "element-plus";
import { Plus, Delete } from "@element-plus/icons-vue";
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
  const subtotal = (item.unitPrice || 0) * (item.quantity || 1);
  item.lineTotal = subtotal - (item.discountAmount || 0);
};

const handleAddItem = () => {
  currentItem.value = null;
  itemDialogVisible.value = true;
};

const handleItemConfirm = (item: FormItem) => {
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

<style scoped>
:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-input-number .el-input__inner) {
  text-align: right;
}
</style>
