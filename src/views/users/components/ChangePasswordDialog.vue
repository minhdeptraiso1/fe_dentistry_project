<template>
  <el-dialog
    v-model="dialogVisible"
    title="Đổi mật khẩu"
    width="500px"
    :close-on-click-modal="false"
    :show-close="false"
  >
    <template #header>
      <div class="dialog-header">
        <div class="header-icon-box">
          <component :is="KeyIcon" />
        </div>
        <div class="header-text">
          <h3 class="header-title">Đổi mật khẩu</h3>
          <p class="header-subtitle">Cập nhật mật khẩu mới cho tài khoản</p>
        </div>
      </div>
    </template>

    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-position="top"
      @submit.prevent="handleSubmit"
    >
      <div v-if="requireOldPassword" class="form-group">
        <label class="form-label">
          Mật khẩu hiện tại
          <span class="required-star">*</span>
        </label>
        <el-form-item prop="oldPassword">
          <el-input
            v-model="formData.oldPassword"
            type="password"
            show-password
            placeholder="Nhập mật khẩu hiện tại"
          >
            <template #prefix>
              <component :is="LockIcon" style="width: 16px; height: 16px" />
            </template>
          </el-input>
        </el-form-item>
      </div>

      <div class="form-group">
        <label class="form-label">
          Mật khẩu mới
          <span class="required-star">*</span>
        </label>
        <el-form-item prop="newPassword">
          <el-input
            v-model="formData.newPassword"
            type="password"
            show-password
            placeholder="Nhập mật khẩu mới"
          >
            <template #prefix>
              <component :is="KeyIcon" style="width: 16px; height: 16px" />
            </template>
          </el-input>
        </el-form-item>
        <div class="password-requirements">
          <p class="requirements-title">Yêu cầu mật khẩu:</p>
          <ul class="requirements-list">
            <li :class="{ valid: passwordChecks.length }">
              <component :is="passwordChecks.length ? CheckIcon : XIcon" />
              <span>Ít nhất 6 ký tự</span>
            </li>
            <li :class="{ valid: passwordChecks.hasLetter }">
              <component :is="passwordChecks.hasLetter ? CheckIcon : XIcon" />
              <span>Chứa chữ cái</span>
            </li>
            <li :class="{ valid: passwordChecks.hasNumber }">
              <component :is="passwordChecks.hasNumber ? CheckIcon : XIcon" />
              <span>Chứa số</span>
            </li>
          </ul>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">
          Xác nhận mật khẩu mới
          <span class="required-star">*</span>
        </label>
        <el-form-item prop="confirmPassword">
          <el-input
            v-model="formData.confirmPassword"
            type="password"
            show-password
            placeholder="Nhập lại mật khẩu mới"
          >
            <template #prefix>
              <component :is="CheckIcon" style="width: 16px; height: 16px" />
            </template>
          </el-input>
        </el-form-item>
      </div>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <button @click="handleCancel" class="cancel-button">
          <component :is="XIcon" />
          <span>Hủy</span>
        </button>
        <button @click="handleSubmit" :disabled="loading" class="submit-button">
          <component
            :is="loading ? LoadingIcon : SaveIcon"
            :class="{ spinning: loading }"
          />
          <span>{{ loading ? "Đang lưu..." : "Đổi mật khẩu" }}</span>
        </button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, h } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";
import { userApi } from "@/api/user";
import type { ChangePasswordRequest } from "@/types/user";

// Props & Emits
interface Props {
  modelValue: boolean;
  userId: string;
  requireOldPassword?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  requireOldPassword: true,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "success"): void;
}>();

// Custom Icons
const KeyIcon = () =>
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
      h("circle", { cx: "7.5", cy: "15.5", r: "5.5" }),
      h("path", { d: "m21 2-9.6 9.6" }),
      h("path", { d: "m15.5 7.5 3 3L22 7l-3-3" }),
    ],
  );

const LockIcon = () =>
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
        height: "11",
        x: "3",
        y: "11",
        rx: "2",
        ry: "2",
      }),
      h("path", { d: "M7 11V7a5 5 0 0 1 10 0v4" }),
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
    [h("path", { d: "M18 6 6 18" }), h("path", { d: "m6 6 12 12" })],
  );

const SaveIcon = () =>
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
        d: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z",
      }),
      h("polyline", { points: "17 21 17 13 7 13 7 21" }),
      h("polyline", { points: "7 3 7 8 15 8" }),
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
    },
    [h("path", { d: "M21 12a9 9 0 1 1-6.219-8.56" })],
  );

// State
const formRef = ref<FormInstance>();
const loading = ref(false);

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const formData = reactive({
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
});

// Password strength checks
const passwordChecks = computed(() => ({
  length: formData.newPassword.length >= 6,
  hasLetter: /[a-zA-Z]/.test(formData.newPassword),
  hasNumber: /[0-9]/.test(formData.newPassword),
}));

// Validation Rules
const validateOldPassword = (_rule: any, value: any, callback: any) => {
  if (props.requireOldPassword && !value) {
    callback(new Error("Vui lòng nhập mật khẩu hiện tại"));
  } else {
    callback();
  }
};

const validateNewPassword = (_rule: any, value: any, callback: any) => {
  if (!value) {
    callback(new Error("Vui lòng nhập mật khẩu mới"));
  } else if (value.length < 6) {
    callback(new Error("Mật khẩu phải có ít nhất 6 ký tự"));
  } else if (!/[a-zA-Z]/.test(value)) {
    callback(new Error("Mật khẩu phải chứa chữ cái"));
  } else if (!/[0-9]/.test(value)) {
    callback(new Error("Mật khẩu phải chứa số"));
  } else if (props.requireOldPassword && value === formData.oldPassword) {
    callback(new Error("Mật khẩu mới phải khác mật khẩu hiện tại"));
  } else {
    callback();
  }
};

const validateConfirmPassword = (_rule: any, value: any, callback: any) => {
  if (!value) {
    callback(new Error("Vui lòng xác nhận mật khẩu mới"));
  } else if (value !== formData.newPassword) {
    callback(new Error("Mật khẩu xác nhận không khớp"));
  } else {
    callback();
  }
};

const rules = reactive<FormRules>({
  oldPassword: [{ validator: validateOldPassword, trigger: "blur" }],
  newPassword: [{ validator: validateNewPassword, trigger: "blur" }],
  confirmPassword: [{ validator: validateConfirmPassword, trigger: "blur" }],
});

// Methods
const resetForm = () => {
  formData.oldPassword = "";
  formData.newPassword = "";
  formData.confirmPassword = "";
  formRef.value?.clearValidate();
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    loading.value = true;

    const data: ChangePasswordRequest = {
      newPassword: formData.newPassword,
    };

    if (props.requireOldPassword) {
      data.oldPassword = formData.oldPassword;
    }

    await userApi.changePassword(props.userId, data);
    ElMessage.success("Đổi mật khẩu thành công");
    emit("success");
    resetForm();
    dialogVisible.value = false;
  } catch (error: any) {
    ElMessage.error(error.message || "Không thể đổi mật khẩu");
  } finally {
    loading.value = false;
  }
};

const handleCancel = () => {
  resetForm();
  dialogVisible.value = false;
};
</script>

<style scoped lang="scss">
:deep(.el-dialog__header) {
  padding: 0;
  margin-right: 0;
}

:deep(.el-dialog__body) {
  padding: 24px;
}

:deep(.el-dialog__footer) {
  padding: 0;
}

.dialog-header {
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon-box {
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
    color: white;
  }
}

.header-text {
  flex: 1;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin-bottom: 4px;
}

.header-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.form-group {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;

  .required-star {
    color: #ef4444;
    margin-left: 2px;
  }
}

:deep(.el-form-item) {
  margin-bottom: 0;

  .el-form-item__error {
    padding-top: 4px;
  }
}

.password-requirements {
  margin-top: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.requirements-title {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.requirements-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;

  li {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #6b7280;
    transition: color 0.2s ease;

    svg {
      width: 14px;
      height: 14px;
      flex-shrink: 0;
    }

    &.valid {
      color: #10b981;

      svg {
        stroke: #10b981;
      }
    }

    &:not(.valid) svg {
      stroke: #d1d5db;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
}

.cancel-button,
.submit-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;

  svg {
    width: 16px;
    height: 16px;
  }
}

.cancel-button {
  background: white;
  color: #6b7280;
  border: 1px solid #d1d5db;

  &:hover {
    background: #f9fafb;
    border-color: #9ca3af;
  }
}

.submit-button {
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(20, 184, 166, 0.3);

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(20, 184, 166, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.spinning {
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
