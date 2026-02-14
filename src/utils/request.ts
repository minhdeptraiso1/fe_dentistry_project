import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type AxiosError,
  type AxiosRequestConfig,
} from "axios";
import { ElNotification } from "element-plus";

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
          ElNotification({
            title: "Phiên đăng nhập hết hạn",
            message: "Vui lòng đăng nhập lại",
            type: "warning",
            position: "top-right",
          });
          window.location.href = "/login";
          break;
        case 403:
          ElNotification({
            title: "Từ chối truy cập",
            message: "Bạn không có quyền truy cập",
            type: "error",
            position: "top-right",
          });
          break;
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
          ElNotification({
            title: "Lỗi",
            message: error.message || "Có lỗi xảy ra",
            type: "error",
            position: "top-right",
          });
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
