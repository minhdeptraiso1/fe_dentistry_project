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
      </aside>

      <section class="form-panel">
        <div class="tab-switcher">
          <button
            @click="activeTab = 'login'"
            :class="['tab-btn', { active: activeTab === 'login' }]"
          >
            Đăng nhập
          </button>
          <button
            @click="activeTab = 'register'"
            :class="['tab-btn', { active: activeTab === 'register' }]"
          >
            Đăng ký
          </button>
        </div>

        <div v-if="activeTab === 'login'" class="panel-content">
          <h2 class="panel-title">Xin chào, mời bạn đăng nhập</h2>
          <p class="panel-subtitle">
            Sử dụng tài khoản đã được cấp để truy cập hệ thống
          </p>

          <el-form
            ref="loginFormRef"
            :model="loginData"
            :rules="loginRules"
            @submit.prevent="handleLogin"
            size="large"
            class="auth-form"
          >
            <el-form-item prop="username">
              <el-input
                v-model="loginData.username"
                placeholder="Tên đăng nhập"
              />
            </el-form-item>

            <el-form-item prop="password">
              <el-input
                v-model="loginData.password"
                type="password"
                placeholder="Mật khẩu"
                show-password
                @keyup.enter="handleLogin"
              />
            </el-form-item>

            <div v-if="loginError" class="error-text">{{ loginError }}</div>

            <div class="remember-row">
              <el-checkbox v-model="rememberMe">Ghi nhớ đăng nhập</el-checkbox>
            </div>

            <el-button
              type="primary"
              :loading="loginLoading"
              @click="handleLogin"
              class="submit-btn"
            >
              {{ loginLoading ? "Đang đăng nhập..." : "Đăng nhập" }}
            </el-button>
          </el-form>
        </div>

        <div v-else class="panel-content">
          <h2 class="panel-title">Tạo tài khoản bệnh nhân</h2>
          <p class="panel-subtitle">
            Nhập đúng thông tin để hệ thống xác thực hồ sơ
          </p>

          <el-form
            ref="registerFormRef"
            :model="registerData"
            :rules="registerRules"
            @submit.prevent="handleRegister"
            size="large"
            class="auth-form"
          >
            <el-form-item prop="email">
              <el-input v-model="registerData.email" placeholder="Email" />
            </el-form-item>

            <el-form-item prop="username">
              <el-input
                v-model="registerData.username"
                placeholder="Tên đăng nhập"
              />
            </el-form-item>

            <el-form-item prop="patientCode">
              <el-input
                v-model="registerData.patientCode"
                placeholder="Mã bệnh nhân"
              />
            </el-form-item>

            <el-form-item prop="password">
              <el-input
                v-model="registerData.password"
                type="password"
                placeholder="Mật khẩu"
                show-password
                @change="validatePasswordMatch"
              />
            </el-form-item>

            <el-form-item prop="confirmPassword">
              <el-input
                v-model="registerData.confirmPassword"
                type="password"
                placeholder="Xác nhận mật khẩu"
                show-password
                @change="validatePasswordMatch"
              />
            </el-form-item>

            <div v-if="registerError" class="error-text">
              {{ registerError }}
            </div>
            <div v-if="passwordMismatchError" class="error-text">
              {{ passwordMismatchError }}
            </div>

            <el-button
              type="primary"
              :loading="registerLoading"
              @click="handleRegister"
              class="submit-btn"
            >
              {{ registerLoading ? "Đang tạo tài khoản..." : "Tạo tài khoản" }}
            </el-button>
          </el-form>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { authApi } from "@/api/auth";
import { notification } from "@/utils/notification";
import type { FormInstance } from "element-plus";
import logoImg from "@/assets/logo.png";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const activeTab = ref<"login" | "register">("login");

// Login
const loginFormRef = ref<FormInstance>();
const loginLoading = ref(false);
const rememberMe = ref(false);
const loginError = ref("");

const loginData = reactive({
  username: "",
  password: "",
});

const loginRules = {
  username: [
    { required: true, message: "Vui lòng nhập tên đăng nhập", trigger: "blur" },
  ],
  password: [
    { required: true, message: "Vui lòng nhập mật khẩu", trigger: "blur" },
    { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự", trigger: "blur" },
  ],
};

// Register
const registerFormRef = ref<FormInstance>();
const registerLoading = ref(false);
const registerError = ref("");
const passwordMismatchError = ref("");

const registerData = reactive({
  email: "",
  username: "",
  patientCode: "",
  password: "",
  confirmPassword: "",
});

const validatePasswordMatch = () => {
  if (registerData.password && registerData.confirmPassword) {
    if (registerData.password !== registerData.confirmPassword) {
      passwordMismatchError.value = "Mật khẩu không trùng khớp!";
    } else {
      passwordMismatchError.value = "";
    }
  }
};

const registerRules = {
  email: [
    { required: true, message: "Vui lòng nhập email", trigger: "blur" },
    {
      type: "email",
      message: "Email không hợp lệ",
      trigger: ["blur", "change"],
    },
  ],
  username: [
    { required: true, message: "Vui lòng nhập tên đăng nhập", trigger: "blur" },
    {
      min: 3,
      message: "Tên đăng nhập phải có ít nhất 3 ký tự",
      trigger: "blur",
    },
  ],
  patientCode: [
    { required: true, message: "Vui lòng nhập mã bệnh nhân", trigger: "blur" },
  ],
  password: [
    { required: true, message: "Vui lòng nhập mật khẩu", trigger: "blur" },
    {
      min: 6,
      message: "Mật khẩu phải có ít nhất 6 ký tự",
      trigger: "blur",
    },
  ],
  confirmPassword: [
    { required: true, message: "Vui lòng xác nhận mật khẩu", trigger: "blur" },
    {
      min: 6,
      message: "Mật khẩu phải có ít nhất 6 ký tự",
      trigger: "blur",
    },
  ],
};

const handleLogin = async () => {
  if (!loginFormRef.value) return;

  try {
    await loginFormRef.value.validate();
    loginLoading.value = true;
    loginError.value = "";

    const success = await authStore.login({
      username: loginData.username,
      password: loginData.password,
    });

    if (success) {
      const redirect = route.query.redirect as string;
      router.push(redirect || "/");
    }
  } catch (error: any) {
    console.error("Login failed:", error);
    loginError.value =
      error.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!";
  } finally {
    loginLoading.value = false;
  }
};

const handleRegister = async () => {
  if (!registerFormRef.value) return;

  try {
    // Validate form
    await registerFormRef.value.validate();

    // Check password match
    if (registerData.password !== registerData.confirmPassword) {
      passwordMismatchError.value = "Mật khẩu không trùng khớp!";
      return;
    }

    registerLoading.value = true;
    registerError.value = "";

    // Send only required fields to backend
    const payload: any = {
      username: registerData.username,
      password: registerData.password,
      email: registerData.email,
      patientCode: registerData.patientCode,
    };

    await authApi.registerPatient(payload);

    notification.success("Đăng ký thành công! Vui lòng đăng nhập.");
    // Reset form and switch to login tab
    registerFormRef.value.resetFields();
    activeTab.value = "login";
    loginData.username = registerData.username;
    passwordMismatchError.value = "";
  } catch (error: any) {
    console.error("Register failed:", error);
    registerError.value =
      error?.response?.data?.error?.message ||
      error?.response?.data?.message ||
      error?.message ||
      "Đăng ký thất bại. Vui lòng thử lại!";
  } finally {
    registerLoading.value = false;
  }
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

.form-panel {
  height: 100%;
  padding: 42px 38px 36px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
}

.tab-switcher {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  background: #f1f5f9;
  border-radius: 14px;
  padding: 6px;
  margin-bottom: 26px;
}

.tab-btn {
  height: 42px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  color: #475569;
  background: transparent;
  cursor: pointer;
  transition: all 0.25s ease;
}

.tab-btn.active {
  color: #ffffff;
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  box-shadow: 0 6px 14px rgba(20, 184, 166, 0.28);
}

.panel-content {
  max-width: 430px;
  flex: 1;
  display: flex;
  flex-direction: column;
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

.remember-row {
  margin: 6px 0 14px;
}

.submit-btn {
  margin-top: auto;
  width: 100%;
  height: 46px;
  border: none;
  border-radius: 11px;
  font-size: 16px;
  font-weight: 700;
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  box-shadow: 0 8px 16px rgba(20, 184, 166, 0.24);
}

.submit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(20, 184, 166, 0.3);
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
  }
}
</style>
