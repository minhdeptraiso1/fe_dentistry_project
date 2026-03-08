import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { ElNotification, ElMessageBox } from "element-plus";
import { tokenStorage } from "./storage";

// Create axios instance
const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Flag để tránh multiple refresh calls
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

// Process queued requests after token refresh
const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Refresh token and retry request
const refreshTokenAndRetry = async (
  originalRequest: InternalAxiosRequestConfig,
): Promise<any> => {
  if (isRefreshing) {
    // Nếu đang refresh, đợi trong queue
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    })
      .then((token) => {
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }
        return service(originalRequest);
      })
      .catch((err) => {
        return Promise.reject(err);
      });
  }

  isRefreshing = true;
  const refreshToken = tokenStorage.getRefreshToken();

  if (!refreshToken) {
    // Không có refresh token, logout
    isRefreshing = false;
    processQueue(new Error("No refresh token"), null);
    clearAuthAndRedirect();
    return Promise.reject(new Error("No refresh token"));
  }

  try {
    // Gọi API refresh token với refreshToken là query parameter
    const response = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/auth/refresh?refreshToken=${encodeURIComponent(refreshToken)}`,
    );

    const newAccessToken = response.data?.data?.accessToken;
    const newRefreshToken = response.data?.data?.refreshToken;

    if (newAccessToken) {
      // Lưu token mới
      tokenStorage.setAccessToken(newAccessToken);
      if (newRefreshToken) {
        tokenStorage.setRefreshToken(newRefreshToken);
      }

      // Process queue với token mới
      processQueue(null, newAccessToken);

      // Retry request ban đầu với token mới
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      }
      isRefreshing = false;
      return service(originalRequest);
    } else {
      throw new Error("No access token in refresh response");
    }
  } catch (error) {
    // Refresh token hết hạn hoặc không hợp lệ
    processQueue(error as Error, null);
    isRefreshing = false;
    clearAuthAndRedirect();
    return Promise.reject(error);
  }
};

// Clear auth and redirect to login
const clearAuthAndRedirect = async () => {
  // Lưu đường dẫn hiện tại để redirect sau khi login lại
  const currentPath = window.location.pathname + window.location.search;

  tokenStorage.clearTokens();
  tokenStorage.clearUser();

  try {
    // Hiển thị dialog xác nhận
    await ElMessageBox.confirm(
      "Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.",
      "Phiên đăng nhập hết hạn",
      {
        confirmButtonText: "Đăng nhập",
        cancelButtonText: "Hủy",
        showCancelButton: false,
        closeOnClickModal: false,
        closeOnPressEscape: false,
        center: true,
        customClass: "modern-session-dialog",
        confirmButtonClass: "modern-session-confirm-button",
      },
    );
  } catch {
    // Nếu user cancel hoặc đóng dialog, vẫn redirect
  }

  // Redirect về login với query parameter để quay lại trang cũ
  const loginUrl =
    currentPath && currentPath !== "/login"
      ? `/login?redirect=${encodeURIComponent(currentPath)}`
      : "/login";
  window.location.href = loginUrl;
};

// Request interceptor
service.interceptors.request.use(
  (config) => {
    // Get token from cookie
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("access_token="))
      ?.split("=")[1];

    if (token) {
      config.headers.Authorization = `Bearer ${decodeURIComponent(token)}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// Response interceptor
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data;

    // Backend returns: { success: boolean, data: T, error: any }
    // Check if request was successful
    if (res.success === false) {
      const errorMessage = res.error?.message || res.message || "Có lỗi xảy ra";
      ElNotification({
        title: "Lỗi",
        message: errorMessage,
        type: "error",
        position: "top-right",
      });
      return Promise.reject(new Error(errorMessage));
    }

    // Return the actual data (unwrap ApiResponse wrapper)
    return res.data;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response) {
      const { status } = error.response;

      // Xử lý 401 và 403 - Token hết hạn hoặc không hợp lệ
      // Backend trả về 403 khi access token hết hạn
      if (
        (status === 401 || status === 403) &&
        originalRequest &&
        !originalRequest._retry
      ) {
        // Đánh dấu request đã retry để tránh infinite loop
        originalRequest._retry = true;

        // Không refresh nếu đang gọi API refresh hoặc login
        if (
          originalRequest.url?.includes("/auth/refresh") ||
          originalRequest.url?.includes("/auth/login")
        ) {
          // Đối với login request, không hiện "session expired" dialog
          // Chỉ reject error và để auth store xử lý message
          if (originalRequest.url?.includes("/auth/login")) {
            return Promise.reject(error);
          }
          // Đối với refresh request, clear auth và redirect
          clearAuthAndRedirect();
          return Promise.reject(error);
        }

        // Thử refresh token và retry request
        try {
          return await refreshTokenAndRetry(originalRequest);
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      }

      // Các lỗi khác
      switch (status) {
        case 404:
          ElNotification({
            title: "Không tìm thấy",
            message: "Không tìm thấy tài nguyên",
            type: "warning",
            position: "top-right",
          });
          break;
        case 500:
          ElNotification({
            title: "Lỗi máy chủ",
            message: "Vui lòng thử lại sau",
            type: "error",
            position: "top-right",
          });
          break;
        default:
          if (status !== 401 && status !== 403) {
            // Đã xử lý 401 và 403 ở trên
            ElNotification({
              title: "Lỗi",
              message: error.message || "Có lỗi xảy ra",
              type: "error",
              position: "top-right",
            });
          }
      }
    } else {
      ElNotification({
        title: "Lỗi kết nối",
        message: "Không thể kết nối đến máy chủ",
        type: "error",
        position: "top-right",
      });
    }

    return Promise.reject(error);
  },
);

// Custom request wrapper with proper types
// The interceptor unwraps { success, data, error } and returns data directly
const request = {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return service.get(url, config);
  },

  post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return service.post(url, data, config);
  },

  put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return service.put(url, data, config);
  },

  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return service.delete(url, config);
  },

  patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return service.patch(url, data, config);
  },
};

export default request;
