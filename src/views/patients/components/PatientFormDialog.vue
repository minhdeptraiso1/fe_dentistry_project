<template>
  <el-dialog
    v-model="visible"
    width="650px"
    :close-on-click-modal="false"
    :show-close="false"
    @close="handleClose"
    class="modern-dialog"
  >
    <template #header>
      <div class="dialog-header">
        <div class="header-content">
          <component :is="UserIcon" class="header-icon" />
          <span class="header-title">
            {{ isEdit ? "Cập nhật bệnh nhân" : "Thêm bệnh nhân mới" }}
          </span>
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
      <el-form-item label="Họ tên" prop="fullName">
        <el-input
          v-model="formData.fullName"
          placeholder="Nhập họ tên bệnh nhân"
          clearable
          size="large"
        >
          <template #prefix>
            <component
              :is="UserIcon"
              style="width: 16px; height: 16px; color: #9ca3af"
            />
          </template>
        </el-input>
      </el-form-item>

      <el-form-item label="Số điện thoại" prop="phone">
        <el-input
          v-model="formData.phone"
          placeholder="Nhập số điện thoại"
          clearable
          size="large"
        >
          <template #prefix>
            <component
              :is="PhoneIcon"
              style="width: 16px; height: 16px; color: #9ca3af"
            />
          </template>
        </el-input>
      </el-form-item>

      <el-form-item label="Giới tính" prop="gender">
        <el-select
          v-model="formData.gender"
          placeholder="Chọn giới tính"
          style="width: 100%"
          size="large"
        >
          <template #prefix>
            <component
              :is="GenderIcon"
              style="width: 16px; height: 16px; color: #9ca3af"
            />
          </template>
          <el-option label="Nam" value="Nam">
            <span class="flex items-center gap-2">
              <el-tag type="primary" size="small" effect="light">Nam</el-tag>
            </span>
          </el-option>
          <el-option label="Nữ" value="Nữ">
            <span class="flex items-center gap-2">
              <el-tag type="danger" size="small" effect="light">Nữ</el-tag>
            </span>
          </el-option>
          <el-option label="Khác" value="Khác">
            <span class="flex items-center gap-2">
              <el-tag type="info" size="small" effect="light">Khác</el-tag>
            </span>
          </el-option>
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

      <el-form-item label="Địa chỉ" prop="address">
        <el-input
          v-model="formData.address"
          type="textarea"
          :rows="2"
          placeholder="Nhập địa chỉ"
          size="large"
        />
      </el-form-item>

      <el-form-item label="Ghi chú" prop="note">
        <el-input
          v-model="formData.note"
          type="textarea"
          :rows="3"
          placeholder="Nhập ghi chú (tiểu sử bệnh, dị ứng...)"
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
          <span>{{ isEdit ? "Cập nhật" : "Thêm mới" }}</span>
        </button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, h } from "vue";
import { type FormInstance, type FormRules } from "element-plus";
import { notification } from "@/utils/notification";
import { patientApi } from "@/api/patient";
import type {
  Patient,
  CreatePatientRequest,
  UpdatePatientRequest,
} from "@/types";

// Custom Icons
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

const PhoneIcon = () =>
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
        d: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
      }),
    ],
  );

const GenderIcon = () =>
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
        d: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
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

const CloseIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "stroke-width": "2",
      stroke: "currentColor",
      class: "w-5 h-5",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M6 18L18 6M6 6l12 12",
      }),
    ],
  );

const CheckIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "stroke-width": "2",
      stroke: "currentColor",
      class: "w-5 h-5",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M5 13l4 4L19 7",
      }),
    ],
  );

const LoadingIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      stroke: "currentColor",
      "stroke-width": "2",
      class: "w-5 h-5 animate-spin",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M21 12a9 9 0 11-6.219-8.56",
      }),
    ],
  );

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
.modern-dialog {
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
  }

  :deep(.el-dialog__footer) {
    padding: 0;
    border-top: 1px solid #e5e7eb;
  }
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  color: white;

  .header-content {
    display: flex;
    align-items: center;
    gap: 12px;

    .header-icon {
      width: 24px;
      height: 24px;
    }

    .header-title {
      font-size: 18px;
      font-weight: 600;
    }
  }

  .close-button {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
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
    padding: 10px 24px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .cancel-button {
    border: 1px solid #e5e7eb;
    background: white;
    color: #6b7280;

    &:hover {
      background: #f9fafb;
      border-color: #d1d5db;
      color: #374151;
    }
  }

  .submit-button {
    border: none;
    background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
    color: white;
    font-weight: 600;
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

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
