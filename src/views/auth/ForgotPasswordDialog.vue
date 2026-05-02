<template>
  <el-dialog
    v-model="dialogVisible"
    width="500px"
    :close-on-click-modal="false"
    :show-close="false"
  >
    <template #header>
      <div class="dialog-header">
        <div class="header-icon-box">
          <el-icon><Lock /></el-icon>
        </div>
        <div class="header-text">
          <h3 class="header-title">Quên mật khẩu</h3>
          <p class="header-subtitle">
            Nhập email để nhận mã xác nhận và đặt lại mật khẩu
          </p>
        </div>
      </div>
    </template>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      class="forgot-form"
    >
      <!-- Step 1: Request OTP -->
      <div v-if="step === 1" class="form-step">
        <el-form-item label="Email" prop="email">
          <el-input
            v-model="form.email"
            placeholder="Nhập email của bạn"
            type="email"
            clearable
            :disabled="loadingOtp"
          >
            <template #prefix>
              <el-icon><Message /></el-icon>
            </template>
          </el-input>
        </el-form-item>
      </div>

      <!-- Step 2: Enter OTP and New Password -->
      <div v-else class="form-step">
        <div class="email-display">
          <span class="label">Email:</span>
          <span class="value">{{ form.email }}</span>
          <el-button
            text
            type="primary"
            @click="step = 1"
            :disabled="loadingReset"
          >
            Thay đổi
          </el-button>
        </div>

        <el-form-item label="Mã OTP" prop="otp">
          <el-input
            v-model="form.otp"
            placeholder="Mã OTP 6 chữ số"
            maxlength="6"
            clearable
            :disabled="loadingReset"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
          <div class="otp-hint">Mã OTP đã được gửi đến email của bạn</div>
        </el-form-item>

        <el-form-item label="Mật khẩu mới" prop="newPassword">
          <el-input
            v-model="form.newPassword"
            placeholder="Tối thiểu 6 ký tự"
            type="password"
            show-password
            :disabled="loadingReset"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="Xác nhận mật khẩu" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            placeholder="Nhập lại mật khẩu"
            type="password"
            show-password
            :disabled="loadingReset"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        
      </div>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose" :disabled="loadingOtp || loadingReset">
          Hủy
        </el-button>
        <el-button
          type="primary"
          @click="step === 1 ? handleRequestOtp() : handleResetPassword()"
          :loading="loadingOtp || loadingReset"
        >
          {{ step === 1 ? "Gửi mã OTP" : "Đặt lại mật khẩu" }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from "vue";
import { ElMessage } from "element-plus";
import type { FormInstance } from "element-plus";
import { authApi } from "@/api/auth";
import { Lock, Message } from "@element-plus/icons-vue";

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const formRef = ref<FormInstance>();
const step = ref(1);
const loadingOtp = ref(false);
const loadingReset = ref(false);

const form = reactive({
  email: "",
  otp: "",
  newPassword: "",
  confirmPassword: "",
});

const validateEmail = (_: any, value: string, callback: any) => {
  if (!value) {
    callback(new Error("Vui lòng nhập email"));
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    callback(new Error("Email không hợp lệ"));
  } else {
    callback();
  }
};

const validatePassword = (_: any, value: string, callback: any) => {
  if (!value) {
    callback(new Error("Vui lòng nhập mật khẩu mới"));
  } else if (value.length < 6) {
    callback(new Error("Mật khẩu phải có ít nhất 6 ký tự"));
  } else {
    callback();
  }
};

const validateConfirmPassword = (_: any, value: string, callback: any) => {
  if (!value) {
    callback(new Error("Vui lòng xác nhận mật khẩu"));
  } else if (value !== form.newPassword) {
    callback(new Error("Mật khẩu không trùng khớp"));
  } else {
    callback();
  }
};

const validateOtp = (_: any, value: string, callback: any) => {
  if (!value) {
    callback(new Error("Vui lòng nhập mã OTP"));
  } else if (!/^\d{6}$/.test(value)) {
    callback(new Error("Mã OTP phải là 6 chữ số"));
  } else {
    callback();
  }
};

const rules = {
  email: [{ validator: validateEmail, trigger: "blur" }],
  otp: [{ validator: validateOtp, trigger: "blur" }],
  newPassword: [{ validator: validatePassword, trigger: "blur" }],
  confirmPassword: [{ validator: validateConfirmPassword, trigger: "blur" }],
};

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit("update:modelValue", value),
});

watch(
  () => dialogVisible.value,
  (newVal) => {
    if (newVal) {
      step.value = 1;
      form.email = "";
      form.otp = "";
      form.newPassword = "";
      form.confirmPassword = "";
      formRef.value?.clearValidate();
    }
  },
);

const handleClose = () => {
  dialogVisible.value = false;
};

const handleRequestOtp = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validateField("email");
    loadingOtp.value = true;

    await authApi.requestForgotPasswordOtp({
      email: form.email,
    });

    ElMessage.success("Mã OTP đã được gửi về email của bạn");
    step.value = 2;
  } catch (error: any) {
    ElMessage.error(
      error?.message || "Lỗi khi gửi mã OTP. Vui lòng thử lại."
    );
  } finally {
    loadingOtp.value = false;
  }
};

const handleResetPassword = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    loadingReset.value = true;

    await authApi.resetPasswordWithOtp({
      email: form.email,
      otp: form.otp,
      newPassword: form.newPassword,
    });

    ElMessage.success("Đặt lại mật khẩu thành công!");
    handleClose();
  } catch (error: any) {
    ElMessage.error(
      error?.message || "Lỗi khi đặt lại mật khẩu. Vui lòng thử lại."
    );
  } finally {
    loadingReset.value = false;
  }
};
</script>

<style scoped lang="scss">
.dialog-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 8px;

  .header-icon-box {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: linear-gradient(135deg, rgba(20, 184, 166, 0.1), rgba(13, 148, 136, 0.1));
    color: #14b8a6;
    font-size: 22px;
  }

  .header-text {
    .header-title {
      margin: 0 0 4px 0;
      font-size: 18px;
      font-weight: 600;
      color: #111827;
    }

    .header-subtitle {
      margin: 0;
      font-size: 13px;
      color: #6b7280;
    }
  }
}

.forgot-form {
  .form-step {
    animation: slideIn 0.3s ease;
  }

  .email-display {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    background: #f3f4f6;
    border-radius: 10px;
    margin-bottom: 16px;
    font-size: 13px;
    border: 1px solid #e5e7eb;

    .label {
      color: #6b7280;
      font-weight: 500;
    }

    .value {
      color: #111827;
      font-weight: 600;
      flex: 1;
    }
  }

  .otp-hint {
    margin-top: 6px;
    font-size: 12px;
    color: #6b7280;
  }

  .info-box {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #fef3c7;
    border: 1px solid #fde68a;
    border-radius: 10px;
    padding: 12px;
    font-size: 13px;
    color: #92400e;
    margin-top: 16px;

    :deep(.el-icon) {
      flex-shrink: 0;
      font-size: 16px;
    }
  }

  :deep(.el-form-item) {
    margin-bottom: 16px;
  }

  :deep(.el-form-item__label) {
    color: #374151;
    font-weight: 500;
    margin-bottom: 6px;
  }

  :deep(.el-input__wrapper) {
    border-radius: 10px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    transition: all 0.25s ease;

    &:hover {
      box-shadow: 0 2px 8px rgba(20, 184, 166, 0.15);
    }

    &.is-focus {
      box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
