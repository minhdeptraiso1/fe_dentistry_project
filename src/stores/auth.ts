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

      // Clear old tokens BEFORE login attempt to prevent using stale tokens
      token.value = null;
      user.value = null;
      tokenStorage.clearTokens();
      tokenStorage.clearUser();

      const loginData: any = await authApi.login(credentials);

      console.log("Login response:", loginData);

      // Check if login was successful
      if (!loginData || !loginData.accessToken) {
        throw new Error("Invalid login response - no access token");
      }

      // Backend returns { accessToken, refreshToken } only
      // Save tokens
      token.value = loginData.accessToken;
      tokenStorage.setAccessToken(loginData.accessToken);
      if (loginData.refreshToken) {
        tokenStorage.setRefreshToken(loginData.refreshToken);
      }

      // Fetch user info from /users/me to get full user data (including id)
      await fetchUserInfo();

      // Only show success message if we successfully fetched user info
      if (user.value) {
        notification.success("Đăng nhập thành công!");
        return true;
      } else {
        throw new Error("Failed to fetch user information");
      }
    } catch (error: any) {
      console.error("Login error:", error);

      // Clear any tokens that might have been set
      token.value = null;
      user.value = null;
      tokenStorage.clearTokens();
      tokenStorage.clearUser();

      // Get error message from backend response
      let errorMessage = "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!";

      if (error?.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      // Throw error instead of showing notification
      // Let the LoginView component handle the display
      throw new Error(errorMessage);
    } finally {
      loading.value = false;
    }
  };

  const logout = async () => {
    // Call backend logout API but don't handle errors
    // Just clear local data regardless of API result
    try {
      const refreshToken = tokenStorage.getRefreshToken();
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch (error) {
      // Ignore errors from backend, just log
      console.log("Logout API call failed (ignored):", error);
    }

    // Always clear local data
    user.value = null;
    token.value = null;
    tokenStorage.clearTokens();
    tokenStorage.clearUser();
    notification.success("Đăng xuất thành công!");
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
      // Propagate error to caller (e.g., login function)
      // Let the caller decide what to do with the error
      throw error;
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
        try {
          await fetchUserInfo();
        } catch (error: any) {
          console.error("Failed to fetch user info during checkAuth:", error);
          // If we can't fetch user info, clear tokens and logout
          if (error?.response?.status === 401) {
            logout();
          }
        }
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
