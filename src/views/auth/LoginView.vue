<template>
  <div
    class="min-h-screen flex items-center justify-center p-5 relative overflow-hidden"
  >
    <!-- Background Image with Overlay -->
    <div class="absolute inset-0 z-0">
      <img
        src="https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=1920&h=1080&fit=crop"
        alt="Dental Clinic Background"
        class="w-full h-full object-cover"
      />
      <div
        class="absolute inset-0 bg-gradient-to-br from-blue-900/80 to-teal-800/80 backdrop-blur-sm"
      ></div>
    </div>

    <!-- Login Card -->
    <div
      class="relative z-10 flex w-full max-w-5xl min-h-[650px] bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden"
    >
      <!-- Left side - Visual Section -->
      <div
        class="flex-1 relative flex items-center justify-center p-12 overflow-hidden"
        style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      >
        <div class="absolute inset-0 opacity-10">
          <div
            class="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl"
          ></div>
          <div
            class="absolute bottom-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl"
          ></div>
        </div>

        <div class="relative text-center z-10">
          <!-- Logo Nha Khoa -->
          <div class="mb-8 flex justify-center">
            <img
              :src="logoImg"
              alt="Nha Khoa Việt Smile"
              class="w-64 h-auto drop-shadow-2xl bg-white/95 p-6 rounded-2xl border-4 border-white/30"
            />
          </div>

          <h1
            class="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight"
          >
            Hệ thống Quản lý<br />Nha khoa
          </h1>
          <p class="text-white/90 text-lg leading-relaxed max-w-md mx-auto">
            Quản lý bệnh nhân, lịch hẹn và điều trị một cách hiệu quả và chuyên
            nghiệp
          </p>

          <!-- Trust Badges -->
          <div
            class="mt-10 flex items-center justify-center gap-6 text-white/80 text-sm"
          >
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                />
              </svg>
              <span>Bảo mật cao</span>
            </div>
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"
                />
              </svg>
              <span>Dễ sử dụng</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right side - Login Form -->
      <div class="flex-1 flex items-center justify-center p-12 bg-white">
        <div class="w-full max-w-md">
          <!-- Header with Image -->
          <div class="mb-10 text-center">
            <div
              class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6 shadow-lg"
            >
              <svg
                class="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h2 class="text-3xl font-bold text-gray-900 mb-2">Đăng nhập</h2>
            <p class="text-gray-500">Chào mừng bạn quay trở lại!</p>
          </div>

          <el-form
            ref="formRef"
            :model="formData"
            :rules="rules"
            @submit.prevent="handleLogin"
            size="large"
            class="space-y-5"
          >
            <!-- Username Field with Image -->
            <el-form-item prop="username">
              <div class="relative w-full">
                <div class="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                  <div
                    class="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center"
                  >
                    <svg
                      class="w-5 h-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                </div>
                <el-input
                  v-model="formData.username"
                  placeholder="Tên đăng nhập"
                  class="pl-16"
                  style="padding-left: 60px"
                />
              </div>
            </el-form-item>

            <!-- Password Field with Image -->
            <el-form-item prop="password">
              <div class="relative w-full">
                <div class="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                  <div
                    class="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center"
                  >
                    <svg
                      class="w-5 h-5 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                </div>
                <el-input
                  v-model="formData.password"
                  type="password"
                  placeholder="Mật khẩu"
                  class="pl-16"
                  style="padding-left: 60px"
                  show-password
                  @keyup.enter="handleLogin"
                />
              </div>
            </el-form-item>

            <!-- Error Message Display - Same position as validation error -->
            <div v-if="errorMessage" class="mt-1 mb-3">
              <span class="text-xs text-red-600">{{ errorMessage }}</span>
            </div>

            <div class="flex items-center justify-between">
              <el-checkbox v-model="rememberMe">
                <span class="text-gray-700">Ghi nhớ đăng nhập</span>
              </el-checkbox>
            </div>

            <el-form-item class="mb-0">
              <el-button
                type="primary"
                :loading="loading"
                @click="handleLogin"
                class="w-full h-12 text-lg font-semibold"
                style="
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  border: none;
                "
              >
                <span
                  v-if="!loading"
                  class="flex items-center justify-center gap-2"
                >
                  <svg
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                  Đăng nhập
                </span>
                <span v-else>Đang đăng nhập...</span>
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import type { FormInstance } from "element-plus";
import logoImg from "@/assets/logo.png";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const formRef = ref<FormInstance>();
const loading = ref(false);
const rememberMe = ref(false);
const errorMessage = ref("");

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
    errorMessage.value = ""; // Clear previous error

    const success = await authStore.login({
      username: formData.username,
      password: formData.password,
    });

    if (success) {
      const redirect = route.query.redirect as string;
      router.push(redirect || "/");
    }
  } catch (error: any) {
    console.error("Login failed:", error);
    errorMessage.value =
      error.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!";
  } finally {
    loading.value = false;
  }
};
</script>
