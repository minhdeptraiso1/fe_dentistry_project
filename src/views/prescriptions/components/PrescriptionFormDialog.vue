<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? 'Cập nhật đơn thuốc' : 'Tạo đơn thuốc'"
    width="90%"
    :close-on-click-modal="false"
    @close="handleClose"
  >
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
          <div class="mb-2">
            <el-button type="primary" size="small" @click="handleAddItem">
              <el-icon class="mr-1"><Plus /></el-icon>
              Thêm thuốc
            </el-button>
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
            <el-table-column label="Thao tác" width="80" align="center">
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
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">Hủy</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        {{ isEdit ? "Cập nhật" : "Tạo đơn thuốc" }}
      </el-button>
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
import { ref, reactive, computed, watch } from "vue";
import { ElMessage } from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import { prescriptionApi } from "@/api/prescription";
import { medicalRecordApi } from "@/api/medicalRecord";
import type { MedicalRecord } from "@/types/medicalRecord";
import type {
  CreatePrescriptionItemRequest,
  Prescription,
} from "@/types/prescription";
import type { FormInstance, FormRules } from "element-plus";
import PrescriptionItemDialog from "./PrescriptionItemDialog.vue";

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
