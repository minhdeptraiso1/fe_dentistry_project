import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { authApi } from "@/api/auth";
import { tokenStorage } from "@/utils/storage";
import type { User, LoginRequest } from "@/types";
import { notification } from "@/utils/notification";

export const useAuthStore = defineStore("auth", () => {
  // State
  const user = ref<User | null>(null);
  const token = ref<string | null>(tokenStorage.getAccessToken());
  const loading = ref(false);

  // Getters
  const isAuthenticated = computed(() => !!token.value);
  const userRole = computed(() => user.value?.role);
  const isAdmin = computed(() => user.value?.role === "ADMIN");
  const isDoctor = computed(() => user.value?.role === "DOCTOR");
  const isReceptionist = computed(() => user.value?.role === "RECEPTIONIST");

  // Actions
  const login = async (credentials: LoginRequest) => {
    try {
      loading.value = true;
      const loginData: any = await authApi.login(credentials);

      console.log("Login response:", loginData);

      // Axios interceptor unwrapped ApiResponse, so loginData is the actual data
      // loginData = { accessToken, id, username, email, fullName, role, ... }

      // Save tokens
      token.value = loginData.accessToken;
      tokenStorage.setAccessToken(loginData.accessToken);
      if (loginData.refreshToken) {
        tokenStorage.setRefreshToken(loginData.refreshToken);
      }

      // Save user info - either from nested user object or direct properties
      const userData = loginData.user
        ? loginData.user
        : ({
            id: loginData.id,
            username: loginData.username,
            email: loginData.email,
            fullName: loginData.fullName,
            role: loginData.role,
            phone: loginData.phone,
            avatar: loginData.avatar,
            createdAt: loginData.createdAt,
          } as User);

      user.value = userData;
      // Lưu user vào localStorage để tránh phải gọi API /auth/me
      tokenStorage.setUser(userData);

      notification.success("Đăng nhập thành công!");
      return true;
    } catch (error) {
      console.error("Login error:", error);
      notification.error(
        "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!",
      );
      return false;
    } finally {
      loading.value = false;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear local data
      user.value = null;
      token.value = null;
      tokenStorage.clearTokens();
      tokenStorage.clearUser();
      notification.success("Đăng xuất thành công!");
    }
  };

  const fetchUserInfo = async () => {
    try {
      const userData: any = await authApi.getCurrentUser();
      user.value = userData;
      // Lưu lại để lần sau không phải gọi API
      tokenStorage.setUser(userData);
    } catch (error: any) {
      console.error("Fetch user info error:", error);
      // Chỉ logout nếu là lỗi 401 (unauthorized)
      // Không logout nếu là lỗi network hoặc 500
      if (error?.response?.status === 401) {
        logout();
      } else {
        console.warn("Could not fetch user info, but keeping session");
      }
    }
  };

  const checkAuth = async () => {
    const accessToken = tokenStorage.getAccessToken();
    const savedUser = tokenStorage.getUser();

    console.log("Checking auth:", {
      hasToken: !!accessToken,
      hasUser: !!savedUser,
    });

    if (accessToken) {
      token.value = accessToken;

      // Nếu đã có user data trong storage, dùng luôn
      if (savedUser) {
        user.value = savedUser;
        console.log("Loaded user from storage:", savedUser.username);
      } else {
        // Chỉ gọi API nếu chưa có user data
        console.log("Fetching user info from API...");
        await fetchUserInfo();
      }
    }
  };

  return {
    // State
    user,
    token,
    loading,

    // Getters
    isAuthenticated,
    userRole,
    isAdmin,
    isDoctor,
    isReceptionist,

    // Actions
    login,
    logout,
    fetchUserInfo,
    checkAuth,
  };
});
