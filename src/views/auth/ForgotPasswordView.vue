<template>
  <div class="auth-page">
    <div class="auth-bg"></div>
    <div class="auth-orb auth-orb-1"></div>
    <div class="auth-orb auth-orb-2"></div>

    <div class="auth-shell">
      <aside class="brand-panel">
        <div class="brand-logo-wrap">
          <img :src="logoImg" alt="Nha Khoa Việt Smile" class="brand-logo" />
        </div>
        <h1 class="brand-title">Nha khoa Việt Smile</h1>
        <p class="brand-subtitle">
          Quản lý lịch hẹn, bệnh án và điều trị trong một trải nghiệm mượt mà.
        </p>
        <div class="brand-points">
          <div class="point-item">Lịch khám tập trung theo ca</div>
          <div class="point-item">Theo dõi hồ sơ bệnh nhân tức thời</div>
          <div class="point-item">Bảo mật theo vai trò người dùng</div>
        </div>

        <div class="brand-highlight">
          <p class="brand-highlight-text">
            Bạn có thể xem qua về nha khoa bằng nút bên dưới.
          </p>
          <router-link to="/public" class="brand-public-btn">
            Đến trang giới thiệu
            <span aria-hidden="true">&rarr;</span>
          </router-link>
        </div>
      </aside>

      <section class="form-panel">
        <router-link to="/login" class="back-link">← Quay lại đăng nhập</router-link>

        <div class="panel-content">
          <h2 class="panel-title">Quên mật khẩu</h2>
          <p class="panel-subtitle">
            Nhập email để nhận mã xác nhận và đặt lại mật khẩu
          </p>

          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            size="large"
            class="auth-form"
          >
            <!-- Step 1: Request OTP -->
            <div v-if="step === 1">
              <el-form-item prop="email">
                <el-input
                  v-model="form.email"
                  placeholder="Email"
                  type="email"
                  clearable
                  :disabled="loadingOtp"
                />
              </el-form-item>

              <div v-if="errorOtp" class="error-text">{{ errorOtp }}</div>

              <el-button
                type="primary"
                :loading="loadingOtp"
                @click="handleRequestOtp"
                class="submit-btn"
              >
                {{ loadingOtp ? "Đang gửi..." : "Gửi mã OTP" }}
              </el-button>
            </div>

            <!-- Step 2: Reset Password -->
            <div v-else>
              <div class="email-display">
                <span class="label">Email:</span>
                <span class="value">{{ form.email }}</span>
                <el-button
                  text
                  type="primary"
                  @click="goBackToStep1"
                  :disabled="loadingReset"
                >
                  Thay đổi
                </el-button>
              </div>

              <el-form-item prop="otp">
                <el-input
                  v-model="form.otp"
                  placeholder="Mã OTP (6 chữ số)"
                  maxlength="6"
                  clearable
                  :disabled="loadingReset"
                />
              </el-form-item>

              <el-form-item prop="newPassword">
                <el-input
                  v-model="form.newPassword"
                  placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                  type="password"
                  show-password
                  :disabled="loadingReset"
                />
              </el-form-item>

              <el-form-item prop="confirmPassword">
                <el-input
                  v-model="form.confirmPassword"
                  placeholder="Xác nhận mật khẩu"
                  type="password"
                  show-password
                  :disabled="loadingReset"
                />
              </el-form-item>
              <div v-if="errorReset" class="error-text">{{ errorReset }}</div>

              <el-button
                type="primary"
                :loading="loadingReset"
                @click="handleResetPassword"
                class="submit-btn"
              >
                {{ loadingReset ? "Đang đặt lại..." : "Đặt lại mật khẩu" }}
              </el-button>
            </div>
          </el-form>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import type { FormInstance } from "element-plus";
import { authApi } from "@/api/auth";
import logoImg from "@/assets/logo.png";

const router = useRouter();
const formRef = ref<FormInstance>();
const step = ref(1);
const loadingOtp = ref(false);
const loadingReset = ref(false);
const errorOtp = ref("");
const errorReset = ref("");

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

const handleRequestOtp = async () => {
  if (!formRef.value) return;

  try {
    errorOtp.value = "";
    await formRef.value.validateField("email");
    loadingOtp.value = true;

    const response = await authApi.requestForgotPasswordOtp({
      identifier: form.email,
    });

    ElMessage.success(response);
    step.value = 2;
  } catch (error: any) {
    errorOtp.value = error?.message || "Lỗi khi gửi mã OTP. Vui lòng thử lại.";
  } finally {
    loadingOtp.value = false;
  }
};

const handleResetPassword = async () => {
  if (!formRef.value) return;

  try {
    errorReset.value = "";
    await formRef.value.validate();
    loadingReset.value = true;

    const response = await authApi.resetPasswordWithOtp({
      identifier: form.email,
      otp: form.otp,
      newPassword: form.newPassword,
    });

    ElMessage.success(response);
    setTimeout(() => {
      router.push("/login");
    }, 1500);
  } catch (error: any) {
    errorReset.value = error?.message || "Lỗi khi đặt lại mật khẩu. Vui lòng thử lại.";
  } finally {
    loadingReset.value = false;
  }
};

const goBackToStep1 = () => {
  step.value = 1;
  errorOtp.value = "";
  form.otp = "";
  form.newPassword = "";
  form.confirmPassword = "";
};
</script>

<style scoped lang="scss">
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  position: relative;
  overflow: hidden;
  background: #f4f7f9;
}

.auth-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(
      circle at 20% 15%,
      rgba(20, 184, 166, 0.16),
      transparent 40%
    ),
    radial-gradient(
      circle at 80% 70%,
      rgba(13, 148, 136, 0.18),
      transparent 42%
    ),
    linear-gradient(130deg, #eaf6f6 0%, #f5fafb 45%, #f9fcfd 100%);
}

.auth-orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(2px);
}

.auth-orb-1 {
  width: 420px;
  height: 420px;
  background: rgba(20, 184, 166, 0.1);
  top: -120px;
  right: -90px;
}

.auth-orb-2 {
  width: 300px;
  height: 300px;
  background: rgba(8, 145, 178, 0.1);
  bottom: -100px;
  left: -80px;
}

.auth-shell {
  --auth-fixed-height: 600px;
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 1100px;
  height: var(--auth-fixed-height);
  background: #ffffff;
  border-radius: 28px;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(17, 24, 39, 0.16);
  display: grid;
  grid-template-columns: 1.15fr 1fr;
}

.brand-panel {
  height: 100%;
  padding: 56px 48px;
  color: #ffffff;
  background: linear-gradient(145deg, #0f766e 0%, #0d9488 55%, #0891b2 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.brand-logo-wrap {
  width: 148px;
  padding: 14px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.94);
  margin-bottom: 24px;
}

.brand-logo {
  width: 100%;
  display: block;
}

.brand-title {
  margin: 0 0 12px;
  font-size: 40px;
  line-height: 1.1;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.brand-subtitle {
  margin: 0;
  font-size: 17px;
  color: rgba(255, 255, 255, 0.9);
  max-width: 460px;
}

.brand-points {
  margin-top: 30px;
  display: grid;
  gap: 10px;
}

.point-item {
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.96);
  padding-left: 18px;
  position: relative;
}

.point-item::before {
  content: "";
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  left: 0;
  top: 8px;
  background: #99f6e4;
}

.brand-highlight {
  margin-top: 22px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(153, 246, 228, 0.5);
  border-radius: 14px;
  padding: 14px;
  display: grid;
  gap: 10px;
}

.brand-highlight-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.94);
}

.brand-public-btn {
  justify-self: start;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  border: 1px solid rgba(153, 246, 228, 0.75);
  color: #ecfeff;
  background: rgba(15, 118, 110, 0.45);
  font-size: 13px;
  font-weight: 700;
  padding: 9px 14px;
  border-radius: 999px;
  transition: all 0.2s ease;
}

.brand-public-btn:hover {
  background: rgba(13, 148, 136, 0.75);
  border-color: #99f6e4;
}

.form-panel {
  height: 100%;
  padding: 42px 38px 36px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.back-link {
  display: inline-block;
  margin-bottom: 20px;
  color: #14b8a6;
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  transition: color 0.2s ease;

  &:hover {
    color: #0d9488;
    text-decoration: underline;
  }
}

.panel-content {
  max-width: 430px;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  padding-right: 6px;
}

.panel-title {
  margin: 0;
  font-size: 30px;
  line-height: 1.15;
  letter-spacing: -0.015em;
  color: #0f172a;
}

.panel-subtitle {
  margin: 10px 0 20px;
  color: #64748b;
  font-size: 14px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  min-height: 0;

  :deep(.el-form-item) {
    margin-bottom: 14px;
  }

  :deep(.el-input__wrapper) {
    min-height: 46px;
    border-radius: 11px;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
    transition: all 0.2s ease;
  }

  :deep(.el-input__wrapper:hover) {
    box-shadow: 0 2px 8px rgba(20, 184, 166, 0.16);
  }

  :deep(.el-input__wrapper.is-focus) {
    box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.14);
  }
}

.email-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f1f5f9;
  border-radius: 8px;
  margin-bottom: 14px;
  font-size: 14px;

  .label {
    color: #64748b;
    font-weight: 500;
  }

  .value {
    color: #0f172a;
    font-weight: 600;
    flex: 1;
  }
}

.info-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 8px;
  margin-bottom: 14px;
  font-size: 13px;
  color: #92400e;

  :deep(.el-icon) {
    flex-shrink: 0;
    color: #f59e0b;
  }
}

.submit-btn {
  margin-top: 8px;
  width: 100%;
  height: 46px;
  border: none;
  border-radius: 11px;
  font-size: 16px;
  font-weight: 700;
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  box-shadow: 0 8px 16px rgba(20, 184, 166, 0.24);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 20px rgba(20, 184, 166, 0.3);
  }
}

.error-text {
  margin: 4px 0 10px;
  color: #dc2626;
  font-size: 12px;
  font-weight: 500;
}

@media (max-width: 980px) {
  .auth-shell {
    height: auto;
    grid-template-columns: 1fr;
  }

  .brand-panel {
    padding: 34px 26px;
  }

  .brand-title {
    font-size: 32px;
  }

  .form-panel {
    padding: 30px 22px 24px;
  }

  .panel-content {
    max-width: none;
    overflow: visible;
    padding-right: 0;
  }
}
</style>
