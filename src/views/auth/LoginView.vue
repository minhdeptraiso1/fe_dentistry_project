<template>
  <div class="login-view">
    <div class="login-container">
      <div class="login-left">
        <div class="welcome-content">
          <el-icon :size="80" color="#1890ff"><Tooth /></el-icon>
          <h1>Hệ thống Quản lý Nha khoa</h1>
          <p>Quản lý bệnh nhân, lịch hẹn và điều trị một cách hiệu quả</p>
        </div>
      </div>

      <div class="login-right">
        <div class="login-form-container">
          <div class="form-header">
            <h2>Đăng nhập</h2>
            <p>Chào mừng bạn quay trở lại!</p>
          </div>

          <el-form
            ref="formRef"
            :model="formData"
            :rules="rules"
            @submit.prevent="handleLogin"
            size="large"
          >
            <el-form-item prop="username">
              <el-input
                v-model="formData.username"
                placeholder="Tên đăng nhập"
                :prefix-icon="User"
              />
            </el-form-item>

            <el-form-item prop="password">
              <el-input
                v-model="formData.password"
                type="password"
                placeholder="Mật khẩu"
                :prefix-icon="Lock"
                show-password
                @keyup.enter="handleLogin"
              />
            </el-form-item>

            <el-form-item>
              <el-checkbox v-model="rememberMe">Ghi nhớ đăng nhập</el-checkbox>
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                :loading="loading"
                @click="handleLogin"
                style="width: 100%"
              >
                {{ loading ? "Đang đăng nhập..." : "Đăng nhập" }}
              </el-button>
            </el-form-item>
          </el-form>

          <div class="form-footer">
            <el-link type="primary">Quên mật khẩu?</el-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { User, Lock, HomeFilled } from "@element-plus/icons-vue";
import type { FormInstance } from "element-plus";

// Fake icon for demo
const Tooth = HomeFilled;

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const formRef = ref<FormInstance>();
const loading = ref(false);
const rememberMe = ref(false);

const formData = reactive({
  username: "",
  password: "",
});

const rules = {
  username: [
    { required: true, message: "Vui lòng nhập tên đăng nhập", trigger: "blur" },
  ],
  password: [
    { required: true, message: "Vui lòng nhập mật khẩu", trigger: "blur" },
    { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự", trigger: "blur" },
  ],
};

const handleLogin = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    loading.value = true;

    const success = await authStore.login({
      username: formData.username,
      password: formData.password,
    });

    if (success) {
      const redirect = route.query.redirect as string;
      router.push(redirect || "/");
    }
  } catch (error) {
    console.error("Login validation failed:", error);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped lang="scss">
.login-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-container {
  display: flex;
  width: 100%;
  max-width: 1000px;
  min-height: 600px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.login-left {
  flex: 1;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
  color: #fff;

  .welcome-content {
    text-align: center;

    h1 {
      font-size: 32px;
      font-weight: 700;
      margin: 24px 0 16px;
    }

    p {
      font-size: 16px;
      opacity: 0.9;
      line-height: 1.6;
    }
  }
}

.login-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
  background: #fff;
}

.login-form-container {
  width: 100%;
  max-width: 400px;

  .form-header {
    margin-bottom: 40px;
    text-align: center;

    h2 {
      font-size: 28px;
      font-weight: 700;
      color: #1f1f1f;
      margin: 0 0 8px;
    }

    p {
      color: #8c8c8c;
      font-size: 14px;
      margin: 0;
    }
  }

  .form-footer {
    text-align: center;
    margin-top: 24px;
  }
}

@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
  }

  .login-left {
    padding: 40px 20px;

    .welcome-content {
      h1 {
        font-size: 24px;
      }

      p {
        font-size: 14px;
      }
    }
  }

  .login-right {
    padding: 40px 20px;
  }
}
</style>
