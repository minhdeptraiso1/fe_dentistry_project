import { ElNotification } from "element-plus";

export const notification = {
  success(message: string, title: string = "Thành công") {
    ElNotification({
      title,
      message,
      type: "success",
      duration: 3000,
      position: "top-right",
    });
  },

  error(message: string, title: string = "Lỗi") {
    ElNotification({
      title,
      message,
      type: "error",
      duration: 4000,
      position: "top-right",
    });
  },

  warning(message: string, title: string = "Cảnh báo") {
    ElNotification({
      title,
      message,
      type: "warning",
      duration: 3000,
      position: "top-right",
    });
  },

  info(message: string, title: string = "Thông báo") {
    ElNotification({
      title,
      message,
      type: "info",
      duration: 3000,
      position: "top-right",
    });
  },
};
