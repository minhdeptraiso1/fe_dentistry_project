/**
 * Form validation utilities
 */

export const validators = {
  required: (message: string = "Trường này là bắt buộc") => ({
    required: true,
    message,
    trigger: "blur",
  }),

  email: () => ({
    type: "email" as const,
    message: "Email không hợp lệ",
    trigger: "blur",
  }),

  phone: () => ({
    pattern: /^[0-9]{10,11}$/,
    message: "Số điện thoại không hợp lệ",
    trigger: "blur",
  }),

  minLength: (min: number) => ({
    min,
    message: `Tối thiểu ${min} ký tự`,
    trigger: "blur",
  }),

  maxLength: (max: number) => ({
    max,
    message: `Tối đa ${max} ký tự`,
    trigger: "blur",
  }),

  password: () => ({
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
    message:
      "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số",
    trigger: "blur",
  }),

  number: () => ({
    type: "number" as const,
    message: "Phải là số",
    trigger: "blur",
  }),
};

export const validatePhoneNumber = (phone: string): boolean => {
  return /^[0-9]{10,11}$/.test(phone);
};

export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
