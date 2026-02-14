/**
 * localStorage wrapper with type safety
 */

import { cookieUtils } from "./cookie";

const STORAGE_PREFIX = "dental_";

export const storage = {
  set(key: string, value: any): void {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(STORAGE_PREFIX + key, serializedValue);
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  },

  get<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = localStorage.getItem(STORAGE_PREFIX + key);
      return item ? JSON.parse(item) : defaultValue || null;
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return defaultValue || null;
    }
  },

  remove(key: string): void {
    localStorage.removeItem(STORAGE_PREFIX + key);
  },

  clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  },
};

// Token management - Using Cookies for better security
export const tokenStorage = {
  setAccessToken(token: string): void {
    // Lưu vào cookie với expire 7 ngày
    cookieUtils.set("access_token", token, {
      days: 7,
      secure: false, // Development: false, Production: true
      sameSite: "Lax", // Lax cho phép navigation, Strict quá nghiêm khắt
    });
  },

  getAccessToken(): string | null {
    return cookieUtils.get("access_token");
  },

  setRefreshToken(token: string): void {
    // Refresh token lưu lâu hơn - 30 ngày
    cookieUtils.set("refresh_token", token, {
      days: 30,
      secure: false, // Development: false, Production: true
      sameSite: "Lax",
    });
  },

  getRefreshToken(): string | null {
    return cookieUtils.get("refresh_token");
  },

  clearTokens(): void {
    cookieUtils.remove("access_token");
    cookieUtils.remove("refresh_token");
  },

  // User data management - Lưu vào cookie cùng với tokens
  setUser(user: any): void {
    // Lưu user data vào cookie với expire 7 ngày (cùng với access_token)
    cookieUtils.set("user_data", JSON.stringify(user), {
      days: 7,
      secure: false, // Development: false, Production: true
      sameSite: "Lax",
    });
  },

  getUser(): any | null {
    try {
      const userData = cookieUtils.get("user_data");
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  },

  clearUser(): void {
    cookieUtils.remove("user_data");
  },
};
