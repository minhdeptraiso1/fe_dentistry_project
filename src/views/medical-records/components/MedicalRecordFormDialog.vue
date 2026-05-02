<template>
  <el-dialog
    v-model="visible"
    :show-close="false"
    width="700px"
    :close-on-click-modal="false"
    @close="handleClose"
    class="modern-dialog"
  >
    <template #header>
      <div class="dialog-header">
        <div class="header-content">
          <component :is="MedicalRecordIcon" class="header-icon" />
          <span class="header-title">{{
            isEdit ? "Cập nhật phiếu khám" : "Tạo phiếu khám mới"
          }}</span>
        </div>
      </div>
    </template>
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="130px"
      label-position="left"
      class="modern-form"
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
          size="large"
        >
          <template #prefix>
            <component
              :is="UserIcon"
              style="width: 16px; height: 16px; color: #9ca3af"
            />
          </template>
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
          size="large"
        >
          <template #prefix>
            <component
              :is="DoctorIcon"
              style="width: 16px; height: 16px; color: #9ca3af"
            />
          </template>
        </el-input>
      </el-form-item>

      <el-form-item label="Ngày khám" prop="visitDate">
        <el-date-picker
          v-model="formData.visitDate"
          type="datetime"
          placeholder="Chọn ngày giờ khám"
          style="width: 100%"
          format="DD/MM/YYYY HH:mm"
          value-format="YYYY-MM-DDTHH:mm:ss[Z]"
          size="large"
        >
          <template #prefix>
            <component
              :is="CalendarIcon"
              style="width: 16px; height: 16px; color: #9ca3af"
            />
          </template>
        </el-date-picker>
      </el-form-item>

      <el-form-item label="Triệu chứng" prop="symptom">
        <el-input
          v-model="formData.symptom"
          type="textarea"
          :rows="3"
          placeholder="Nhập triệu chứng của bệnh nhân..."
          size="large"
        />
      </el-form-item>

      <el-form-item label="Chẩn đoán" prop="diagnosis">
        <el-input
          v-model="formData.diagnosis"
          type="textarea"
          :rows="3"
          placeholder="Nhập chẩn đoán của bác sĩ..."
          size="large"
        />
      </el-form-item>

      <el-form-item label="Ghi chú" prop="note">
        <el-input
          v-model="formData.note"
          type="textarea"
          :rows="3"
          placeholder="Nhập ghi chú thêm (nếu có)..."
          size="large"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <button @click="handleClose" class="cancel-button">
          <component :is="CloseIcon" />
          <span>Hủy</span>
        </button>
        <button @click="handleSubmit" :disabled="loading" class="submit-button">
          <component :is="loading ? LoadingIcon : CheckIcon" />
          <span>{{ isEdit ? "Cập nhật" : "Tạo mới" }}</span>
        </button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, h } from "vue";
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

// Icon components
const MedicalRecordIcon = () =>
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
    [
      h("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
      h("line", { x1: "6", y1: "6", x2: "18", y2: "18" }),
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

// Custom Icons for form fields
const UserIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "stroke-width": "2",
      stroke: "currentColor",
      class: "w-4 h-4",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
      }),
    ],
  );

const DoctorIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "stroke-width": "2",
      stroke: "currentColor",
      class: "w-4 h-4",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
      }),
    ],
  );

const CalendarIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "stroke-width": "2",
      stroke: "currentColor",
      class: "w-4 h-4",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
      }),
    ],
  );

const props = defineProps<{
  modelValue: boolean;
  record?: MedicalRecord | null;
  presetPatientId?: string;
  appointmentId?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "success", recordId?: string): void;
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
 * Watch presetPatientId to auto-select patient from appointment
 */
watch(
  [() => props.presetPatientId, () => props.modelValue, patientOptions],
  ([patientId, isVisible, patients]) => {
    // When dialog opens, preset patient ID is provided, and patients are loaded
    if (isVisible && patientId && !props.record && patients.length > 0) {
      // Wait a bit for the select component to render
      setTimeout(() => {
        formData.patientId = patientId;
      }, 100);
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
      const response = await medicalRecordApi.create(createData);
      notification.success("Tạo phiếu khám thành công!");
      emit("success", response.id);
    }

    if (isEdit.value) {
      emit("success");
    }
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
.modern-dialog {
  :deep(.el-dialog) {
    border-radius: 16px;
    overflow: hidden;
  }

  .dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
    padding: 20px 24px;
    color: white;

    .header-content {
      display: flex;
      align-items: center;
      gap: 12px;

      .header-icon {
        width: 24px;
        height: 24px;
        color: white;
      }

      .header-title {
        font-size: 18px;
        font-weight: 600;
        color: white;
      }
    }

    .close-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      color: white;
      padding: 0;

      &:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: scale(1.1);
      }
    }
  }

  :deep(.el-dialog__body) {
    padding: 24px;
  }

  :deep(.el-dialog__footer) {
    padding: 16px 24px;
    border-top: 1px solid #f3f4f6;
  }
}

.modern-form {
  :deep(.el-form-item) {
    margin-bottom: 20px;

    .el-form-item__label {
      font-weight: 600;
      color: #374151;
      font-size: 14px;
    }

    .el-input__wrapper {
      border-radius: 10px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      padding: 8px 12px;
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
      }

      &.is-focus {
        box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
      }
    }

    .el-textarea__inner {
      border-radius: 10px;
      padding: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
      }

      &:focus {
        box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
      }
    }

    .el-select {
      .el-input__wrapper {
        &.is-focus {
          box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
        }
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  background: white;

  .cancel-button,
  .submit-button {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .cancel-button {
    padding: 10px 24px;
    border: 1px solid #e5e7eb;
    background: white;
    color: #6b7280;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: #f9fafb;
      border-color: #d1d5db;
      color: #374151;
    }
  }

  .submit-button {
    padding: 10px 24px;
    border: none;
    background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
    color: white;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(20, 184, 166, 0.4);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}
</style>
