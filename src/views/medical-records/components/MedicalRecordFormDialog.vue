<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? 'Cập nhật phiếu khám' : 'Tạo phiếu khám mới'"
    width="700px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="120px"
      @submit.prevent="handleSubmit"
    >
      <el-form-item label="Bệnh nhân" prop="patientId">
        <el-select
          v-model="formData.patientId"
          placeholder="Chọn bệnh nhân"
          filterable
          clearable
          :loading="patientLoading"
          style="width: 100%"
        >
          <el-option
            v-for="patient in patientOptions"
            :key="patient.id"
            :label="`${patient.patientCode} - ${patient.fullName}`"
            :value="patient.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="Bác sĩ" prop="doctorId">
        <el-input
          :model-value="doctorDisplay"
          disabled
          placeholder="Bác sĩ hiện tại"
        />
      </el-form-item>

      <el-form-item label="Ngày khám" prop="visitDate">
        <el-date-picker
          v-model="formData.visitDate"
          type="datetime"
          placeholder="Chọn ngày giờ khám"
          style="width: 100%"
          format="DD/MM/YYYY HH:mm"
          value-format="YYYY-MM-DDTHH:mm:ss[Z]"
        />
      </el-form-item>

      <el-form-item label="Triệu chứng" prop="symptom">
        <el-input
          v-model="formData.symptom"
          type="textarea"
          :rows="3"
          placeholder="Nhập triệu chứng của bệnh nhân..."
        />
      </el-form-item>

      <el-form-item label="Chẩn đoán" prop="diagnosis">
        <el-input
          v-model="formData.diagnosis"
          type="textarea"
          :rows="3"
          placeholder="Nhập chẩn đoán của bác sĩ..."
        />
      </el-form-item>

      <el-form-item label="Ghi chú" prop="note">
        <el-input
          v-model="formData.note"
          type="textarea"
          :rows="3"
          placeholder="Nhập ghi chú thêm (nếu có)..."
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">Hủy</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        {{ isEdit ? "Cập nhật" : "Tạo mới" }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from "vue";
import { type FormInstance, type FormRules } from "element-plus";
import { notification } from "@/utils/notification";
import { medicalRecordApi } from "@/api/medicalRecord";
import { patientApi } from "@/api/patient";
import { useAuthStore } from "@/stores/auth";
import type {
  MedicalRecord,
  CreateMedicalRecordRequest,
  UpdateMedicalRecordRequest,
  Patient,
} from "@/types";

const props = defineProps<{
  modelValue: boolean;
  record?: MedicalRecord | null;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "success"): void;
}>();

// Internal form data interface that includes all fields
interface FormData {
  patientId: string;
  doctorId: string;
  visitDate: string;
  symptom: string;
  diagnosis: string;
  note: string;
}

const authStore = useAuthStore();
const formRef = ref<FormInstance>();
const loading = ref(false);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const isEdit = computed(() => !!props.record);

const formData = reactive<FormData>({
  patientId: "",
  doctorId: "",
  visitDate: "",
  symptom: "",
  diagnosis: "",
  note: "",
});

// Patient list
const patientLoading = ref(false);
const patientOptions = ref<Patient[]>([]);

// Doctor display (readonly - use current user)
const doctorDisplay = computed(() => {
  return (
    authStore.user?.fullName || authStore.user?.username || "Bác sĩ hiện tại"
  );
});

/**
 * Load all patients from API
 */
const loadPatients = async () => {
  try {
    patientLoading.value = true;
    const pageData = await patientApi.search({
      page: 0,
      size: 1000, // Load all patients (adjust if needed)
    });
    patientOptions.value = pageData.content;
  } catch (error: any) {
    console.error("Load patients error:", error);
    notification.error("Không thể tải danh sách bệnh nhân");
  } finally {
    patientLoading.value = false;
  }
};

const rules: FormRules = {
  patientId: [
    { required: true, message: "Vui lòng chọn bệnh nhân", trigger: "change" },
  ],
  // doctorId không cần validate vì tự động lấy từ user hiện tại
};

/**
 * Reset form
 */
const resetForm = () => {
  formData.patientId = "";
  formData.doctorId = authStore.user?.id || ""; // Auto-fill current user
  formData.visitDate = new Date().toISOString(); // Default to now
  formData.symptom = "";
  formData.diagnosis = "";
  formData.note = "";
  formRef.value?.clearValidate();
};

/**
 * Watch dialog visibility to load patients
 */
watch(
  () => props.modelValue,
  (isVisible) => {
    if (isVisible && patientOptions.value.length === 0) {
      loadPatients();
    }
  },
);

/**
 * Watch record prop to populate form data
 */
watch(
  () => props.record,
  (record) => {
    if (record) {
      formData.patientId = record.patientId;
      formData.doctorId = record.doctorId;
      formData.visitDate = record.visitDate;
      formData.symptom = record.symptom || "";
      formData.diagnosis = record.diagnosis || "";
      formData.note = record.note || "";
    } else {
      resetForm();
    }
  },
  { immediate: true },
);

/**
 * Load patients on mount
 */
onMounted(() => {
  loadPatients();
});

/**
 * Handle close
 */
const handleClose = () => {
  resetForm();
  visible.value = false;
};

/**
 * Handle submit
 */
const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    const valid = await formRef.value.validate();
    if (!valid) return;

    loading.value = true;

    // Always use current user's id as doctorId
    const currentDoctorId = authStore.user?.id;
    if (!currentDoctorId) {
      notification.error(
        "Không thể xác định thông tin bác sĩ. Vui lòng đăng nhập lại.",
      );
      return;
    }

    if (isEdit.value && props.record) {
      // Update medical record - only send updateable fields
      const updateData: UpdateMedicalRecordRequest = {
        doctorId: currentDoctorId,
        visitDate: formData.visitDate,
        symptom: formData.symptom,
        diagnosis: formData.diagnosis,
        note: formData.note,
      };
      await medicalRecordApi.update(props.record.id, updateData);
      notification.success("Cập nhật phiếu khám thành công!");
    } else {
      // Create medical record
      const createData: CreateMedicalRecordRequest = {
        patientId: formData.patientId,
        doctorId: currentDoctorId,
        visitDate: formData.visitDate,
        symptom: formData.symptom,
        diagnosis: formData.diagnosis,
        note: formData.note,
      };
      await medicalRecordApi.create(createData);
      notification.success("Tạo phiếu khám thành công!");
    }

    emit("success");
    handleClose();
  } catch (error: any) {
    console.error("Submit medical record error:", error);
    notification.error(error?.message || "Có lỗi xảy ra, vui lòng thử lại");
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped lang="scss">
// Custom styles if needed
</style>
