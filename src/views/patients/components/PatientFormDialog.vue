<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? 'Cập nhật bệnh nhân' : 'Thêm bệnh nhân mới'"
    width="600px"
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
      <el-form-item label="Họ tên" prop="fullName">
        <el-input
          v-model="formData.fullName"
          placeholder="Nhập họ tên bệnh nhân"
          clearable
        />
      </el-form-item>

      <el-form-item label="Số điện thoại" prop="phone">
        <el-input
          v-model="formData.phone"
          placeholder="Nhập số điện thoại"
          clearable
        />
      </el-form-item>

      <el-form-item label="Giới tính" prop="gender">
        <el-select
          v-model="formData.gender"
          placeholder="Chọn giới tính"
          style="width: 100%"
        >
          <el-option label="Nam" value="Nam" />
          <el-option label="Nữ" value="Nữ" />
          <el-option label="Khác" value="Khác" />
        </el-select>
      </el-form-item>

      <el-form-item label="Ngày sinh" prop="dob">
        <el-date-picker
          v-model="formData.dob"
          type="date"
          placeholder="Chọn ngày sinh"
          style="width: 100%"
          format="DD/MM/YYYY"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>

      <el-form-item label="Địa chỉ" prop="address">
        <el-input
          v-model="formData.address"
          type="textarea"
          :rows="2"
          placeholder="Nhập địa chỉ"
        />
      </el-form-item>

      <el-form-item label="Ghi chú" prop="note">
        <el-input
          v-model="formData.note"
          type="textarea"
          :rows="3"
          placeholder="Nhập ghi chú (tiểu sử bệnh, dị ứng...)"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">Hủy</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        {{ isEdit ? "Cập nhật" : "Thêm mới" }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { type FormInstance, type FormRules } from "element-plus";
import { notification } from "@/utils/notification";
import { patientApi } from "@/api/patient";
import type {
  Patient,
  CreatePatientRequest,
  UpdatePatientRequest,
} from "@/types";

const props = defineProps<{
  modelValue: boolean;
  patient?: Patient | null;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "success"): void;
}>();

const formRef = ref<FormInstance>();
const loading = ref(false);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const isEdit = computed(() => !!props.patient);

const formData = reactive<CreatePatientRequest | UpdatePatientRequest>({
  fullName: "",
  gender: "",
  phone: "",
  dob: "",
  address: "",
  note: "",
});

const rules: FormRules = {
  fullName: [
    { required: true, message: "Vui lòng nhập họ tên", trigger: "blur" },
  ],
  phone: [
    {
      pattern: /^[0-9]{10,11}$/,
      message: "Số điện thoại không hợp lệ",
      trigger: "blur",
    },
  ],
};

/**
 * Reset form
 */
const resetForm = () => {
  formData.fullName = "";
  formData.gender = "";
  formData.phone = "";
  formData.dob = "";
  formData.address = "";
  formData.note = "";
  formRef.value?.clearValidate();
};

/**
 * Watch patient prop to populate form data
 */
watch(
  () => props.patient,
  (patient) => {
    if (patient) {
      formData.fullName = patient.fullName;
      formData.gender = patient.gender || "";
      formData.phone = patient.phone || "";
      formData.dob = patient.dob || "";
      formData.address = patient.address || "";
      formData.note = patient.note || "";
    } else {
      resetForm();
    }
  },
  { immediate: true },
);

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

    if (isEdit.value && props.patient) {
      // Update patient
      await patientApi.update(
        props.patient.id,
        formData as UpdatePatientRequest,
      );
      notification.success("Cập nhật bệnh nhân thành công!");
    } else {
      // Create patient
      await patientApi.create(formData as CreatePatientRequest);
      notification.success("Thêm bệnh nhân thành công!");
    }

    emit("success");
    handleClose();
  } catch (error: any) {
    console.error("Submit patient error:", error);
    notification.error(error?.message || "Có lỗi xảy ra, vui lòng thử lại");
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped lang="scss">
// Custom styles if needed
</style>
