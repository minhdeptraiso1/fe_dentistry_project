import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { authApi } from "@/api/auth";
import { tokenStorage } from "@/utils/storage";
import type { User, LoginRequest } from "@/types";
import { notification } from "@/utils/notification";

export const useAuthStore = defineStore("auth", () => {
  // State - Tự động restore từ cookie khi khởi tạo
  const savedUser = tokenStorage.getUser();
  const savedToken = tokenStorage.getAccessToken();

  const user = ref<User | null>(savedUser);
  const token = ref<string | null>(savedToken);
  const loading = ref(false);

  // Log để debug
  if (savedUser) {
    console.log(
      "Restored user from cookie:",
      savedUser.username,
      savedUser.role,
    );
  }

  // Getters
  const isAuthenticated = computed(() => !!token.value);
  const userRole = computed(() => user.value?.role);
  const isAdmin = computed(() => user.value?.role === "ADMIN");
  const isDoctor = computed(() => user.value?.role === "DOCTOR");
  const isCashier = computed(() => user.value?.role === "CASHIER");

  // Actions
  const login = async (credentials: LoginRequest) => {
    try {
      loading.value = true;
      const loginData: any = await authApi.login(credentials);

      console.log("Login response:", loginData);

      // Backend returns { accessToken, refreshToken } only
      // Save tokens
      token.value = loginData.accessToken;
      tokenStorage.setAccessToken(loginData.accessToken);
      if (loginData.refreshToken) {
        tokenStorage.setRefreshToken(loginData.refreshToken);
      }

      // Fetch user info from /users/me to get full user data (including id)
      await fetchUserInfo();

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

  const refreshToken = async () => {
    try {
      const refreshTokenValue = tokenStorage.getRefreshToken();
      if (!refreshTokenValue) {
        throw new Error("No refresh token");
      }

      const response: any = await authApi.refreshToken(refreshTokenValue);

      // Update tokens
      if (response.accessToken) {
        token.value = response.accessToken;
        tokenStorage.setAccessToken(response.accessToken);
      }
      if (response.refreshToken) {
        tokenStorage.setRefreshToken(response.refreshToken);
      }

      return true;
    } catch (error) {
      console.error("Refresh token error:", error);
      // Token hết hạn, logout
      await logout();
      return false;
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

  // Tự động sync state vào cookie khi thay đổi
  watch(user, (newUser) => {
    if (newUser) {
      tokenStorage.setUser(newUser);
      console.log("Auto-saved user to cookie:", newUser.username);
    } else {
      tokenStorage.clearUser();
    }
  });

  watch(token, (newToken) => {
    if (newToken) {
      tokenStorage.setAccessToken(newToken);
    } else {
      tokenStorage.clearTokens();
    }
  });

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
    isCashier,

    // Actions
    login,
    logout,
    refreshToken,
    fetchUserInfo,
    checkAuth,
  };
});
