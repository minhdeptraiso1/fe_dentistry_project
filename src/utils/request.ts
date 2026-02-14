import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type AxiosError,
  type AxiosRequestConfig,
} from "axios";
import { ElMessage } from "element-plus";

// Create axios instance
const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

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
    console.error("Request error:", error);
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
      ElMessage.error(errorMessage);
      return Promise.reject(new Error(errorMessage));
    }

    // Return the actual data (unwrap ApiResponse wrapper)
    return res.data;
  },
  (error: AxiosError) => {
    console.error("Response error:", error);

    if (error.response) {
      const { status } = error.response;

      switch (status) {
        case 401:
          // Unauthorized - redirect to login
          // Clear cookies
          document.cookie =
            "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          document.cookie =
            "refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          ElMessage.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại");
          window.location.href = "/login";
          break;
        case 403:
          ElMessage.error("Bạn không có quyền truy cập");
          break;
        case 404:
          ElMessage.error("Không tìm thấy tài nguyên");
          break;
        case 500:
          ElMessage.error("Lỗi máy chủ. Vui lòng thử lại sau");
          break;
        default:
          ElMessage.error(error.message || "Có lỗi xảy ra");
      }
    } else {
      ElMessage.error("Không thể kết nối đến máy chủ");
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
