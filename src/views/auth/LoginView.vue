<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-5"
  >
    <div
      class="flex w-full max-w-4xl min-h-[600px] bg-white rounded-2xl shadow-2xl overflow-hidden"
    >
      <!-- Left side -->
      <div
        class="flex-1 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center p-10 md:p-15 text-white"
      >
        <div class="text-center">
          <el-icon :size="80" color="#fff"><Tooth /></el-icon>
          <h1 class="text-3xl md:text-4xl font-bold mt-6 mb-4">
            Hệ thống Quản lý Nha khoa
          </h1>
          <p class="text-base opacity-90 leading-relaxed">
            Quản lý bệnh nhân, lịch hẹn và điều trị một cách hiệu quả
          </p>
        </div>
      </div>

      <!-- Right side -->
      <div
        class="flex-1 flex items-center justify-center p-10 md:p-15 bg-white"
      >
        <div class="w-full max-w-md">
          <div class="mb-10 text-center">
            <h2 class="text-3xl font-bold text-gray-900 mb-2">Đăng nhập</h2>
            <p class="text-gray-500 text-sm">Chào mừng bạn quay trở lại!</p>
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
                class="w-full"
              >
                {{ loading ? "Đang đăng nhập..." : "Đăng nhập" }}
              </el-button>
            </el-form-item>
          </el-form>

          <div class="text-center mt-6">
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
