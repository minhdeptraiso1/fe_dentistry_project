import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { authApi } from "@/api/auth";
import { tokenStorage } from "@/utils/storage";
import type { User, LoginRequest } from "@/types";
import { notification } from "@/utils/notification";

export const useAuthStore = defineStore(
  "auth",
  () => {
    // State - Will be automatically persisted by pinia-plugin-persistedstate
    const user = ref<User | null>(null);
    const token = ref<string | null>(null);
    const loading = ref(false);

    // Getters
    const isAuthenticated = computed(() => !!token.value);
    const userRole = computed(() => user.value?.role);
    const isAdmin = computed(() => user.value?.role === "ADMIN");
    const isDoctor = computed(() => user.value?.role === "DOCTOR");
    const isCashier = computed(() => user.value?.role === "CASHIER");
    const isPatient = computed(() => user.value?.role === "PATIENT");

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
        // Save tokens to both Pinia store (persisted to localStorage) AND cookies (for axios)
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
        let errorMessage =
          "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!";

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

      // Always clear local data (both Pinia store and cookies)
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

        // Update tokens in both Pinia store and cookies
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
        // Also save to cookies for backward compatibility
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
        storeToken: !!token.value,
        storeUser: !!user.value,
      });

      // Persist plugin will restore token and user from localStorage
      // But we also sync with cookies for the axios interceptor
      if (!token.value && accessToken) {
        token.value = accessToken;
      }

      if (!user.value && savedUser) {
        user.value = savedUser;
        console.log("Loaded user from cookie storage:", savedUser.username);
      } else if (token.value && !user.value) {
        // Have token but no user - fetch from API
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
      isCashier,
      isPatient,

      // Actions
      login,
      logout,
      refreshToken,
      fetchUserInfo,
      checkAuth,
    };
  },
  {
    persist: {
      key: "dental-auth",
      storage: localStorage,
      paths: ["user", "token"], // Only persist user and token, not loading
    },
  },
);
