/**
 * Cookie utilities
 */

interface CookieOptions {
  days?: number;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
}

export const cookieUtils = {
  // Set cookie
  set(name: string, value: string, options: CookieOptions = {}): void {
    const {
      days = 7,
      path = "/",
      secure = window.location.protocol === "https:",
      sameSite = "Lax",
    } = options;

    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      cookieString += `; expires=${date.toUTCString()}`;
    }

    cookieString += `; path=${path}`;

    if (options.domain) {
      cookieString += `; domain=${options.domain}`;
    }

    if (secure) {
      cookieString += "; secure";
    }

    cookieString += `; SameSite=${sameSite}`;

    document.cookie = cookieString;
  },

  // Get cookie
  get(name: string): string | null {
    const nameEQ = encodeURIComponent(name) + "=";
    const cookies = document.cookie.split(";");

    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.indexOf(nameEQ) === 0) {
        return decodeURIComponent(cookie.substring(nameEQ.length));
      }
    }

    return null;
  },

  // Remove cookie
  remove(name: string, options: CookieOptions = {}): void {
    this.set(name, "", { ...options, days: -1 });
  },

  // Check if cookie exists
  exists(name: string): boolean {
    return this.get(name) !== null;
  },

  // Get all cookies as object
  getAll(): Record<string, string> {
    const cookies: Record<string, string> = {};
    const cookieArray = document.cookie.split(";");

    for (let cookie of cookieArray) {
      cookie = cookie.trim();
      const [name, value] = cookie.split("=");
      if (name && value) {
        cookies[decodeURIComponent(name)] = decodeURIComponent(value);
      }
    }

    return cookies;
  },

  // Clear all cookies
  clearAll(): void {
    const cookies = this.getAll();
    for (const name in cookies) {
      this.remove(name);
    }
  },
};
