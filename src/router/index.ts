import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { ElMessage } from "element-plus";

const routes: RouteRecordRaw[] = [
  {
    path: "/public",
    component: () => import("@/views/public-site/PublicSiteLayout.vue"),
    children: [
      {
        path: "",
        name: "PublicHome",
        component: () => import("@/views/public-site/PublicHomeView.vue"),
        meta: { title: "Phòng khám nha khoa" },
      },
      {
        path: "doctors",
        name: "PublicDoctors",
        component: () => import("@/views/public-site/PublicDoctorsView.vue"),
        meta: { title: "Danh sách bác sĩ" },
      },
      {
        path: "doctors/:slug",
        name: "PublicDoctorDetail",
        component: () =>
          import("@/views/public-site/PublicDoctorDetailView.vue"),
        meta: { title: "Chi tiết bác sĩ" },
      },
      {
        path: "services",
        name: "PublicServices",
        component: () => import("@/views/public-site/PublicServicesView.vue"),
        meta: { title: "Danh sách dịch vụ" },
      },
      {
        path: "services/:slug",
        name: "PublicServiceDetail",
        component: () =>
          import("@/views/public-site/PublicServiceDetailView.vue"),
        meta: { title: "Chi tiết dịch vụ" },
      },
      {
        path: "medicines",
        name: "PublicMedicines",
        component: () => import("@/views/public-site/PublicMedicinesView.vue"),
        meta: { title: "Danh sách thuốc" },
      },
      {
        path: "medicines/:slug",
        name: "PublicMedicineDetail",
        component: () =>
          import("@/views/public-site/PublicMedicineDetailView.vue"),
        meta: { title: "Chi tiết thuốc" },
      },
      {
        path: "about",
        name: "PublicAbout",
        component: () => import("@/views/public-site/PublicAboutView.vue"),
        meta: { title: "Giới thiệu phòng khám" },
      },
      {
        path: "contact",
        name: "PublicContact",
        component: () => import("@/views/public-site/PublicContactView.vue"),
        meta: { title: "Liên hệ" },
      },
    ],
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/auth/LoginView.vue"),
    meta: { guest: true, title: "Đăng nhập" },
  },
  {
    path: "/forgot-password",
    name: "ForgotPassword",
    component: () => import("@/views/auth/ForgotPasswordView.vue"),
    meta: { guest: true, title: "Quên mật khẩu" },
  },
  {
    path: "/payment/vnpay-return",
    name: "VnPayReturn",
    component: () => import("@/views/payment/VnPayReturnView.vue"),
    meta: { title: "Kết quả thanh toán" },
  },
  {
    path: "/",
    component: () => import("@/layouts/MainLayout.vue"),
    meta: { requiresAuth: true },
    children: [
      {
        path: "",
        name: "Dashboard",
        redirect: (to) => {
          // Redirect will be handled in navigation guard based on user role
          return { name: "DefaultDashboard" };
        },
      },
      {
        path: "dashboard",
        name: "DefaultDashboard",
        component: () => import("@/views/dashboard/DashboardView.vue"),
        meta: { title: "Tổng quan" },
      },
      // Role-specific dashboards
      {
        path: "/doctor",
        name: "DoctorDashboard",
        component: () => import("@/views/doctor/DoctorDashboardView.vue"),
        meta: { title: "Dashboard Bác Sĩ", roles: ["DOCTOR"] },
      },
      {
        path: "/doctor/schedule-requests",
        name: "DoctorScheduleRequests",
        component: () => import("@/views/doctor/DoctorScheduleRequestView.vue"),
        meta: { title: "Đăng ký lịch làm việc", roles: ["DOCTOR"] },
      },
      {
        path: "/cashier",
        name: "CashierDashboard",
        component: () => import("@/views/cashier/CashierDashboardView.vue"),
        meta: { title: "Dashboard Thu Ngân", roles: ["CASHIER"] },
      },
      {
        path: "/patient",
        name: "PatientDashboard",
        component: () => import("@/views/patient/PatientDashboardView.vue"),
        meta: { title: "Hồ sơ bệnh nhân", roles: ["PATIENT"] },
      },
      {
        path: "/patient/appointments",
        name: "PatientAppointments",
        component: () =>
          import("@/views/patient/PatientAppointmentBookingView.vue"),
        meta: { title: "Đặt lịch khám", roles: ["PATIENT"] },
      },
      {
        path: "/patient/appointments/:id",
        name: "PatientAppointmentDetail",
        component: () =>
          import("@/views/patient/PatientAppointmentDetailView.vue"),
        meta: { title: "Chi tiết lịch hẹn", roles: ["PATIENT"] },
      },
      {
        path: "/admin",
        name: "AdminDashboard",
        component: () => import("@/views/dashboard/DashboardView.vue"),
        meta: { title: "Dashboard", roles: ["ADMIN"] },
      },
      {
        path: "/admin/doctor-schedule-requests",
        name: "DoctorScheduleApprovals",
        component: () => import("@/views/admin/DoctorScheduleApprovalView.vue"),
        meta: { title: "Duyệt lịch bác sĩ", roles: ["ADMIN"] },
      },
      {
        path: "/patients",
        name: "Patients",
        component: () => import("@/views/patients/PatientListView.vue"),
        meta: { title: "Quản lý bệnh nhân" },
      },
      {
        path: "/patients/:id",
        name: "PatientDetail",
        component: () => import("@/views/patients/PatientDetailView.vue"),
        meta: { title: "Chi tiết bệnh nhân" },
      },
      {
        path: "/medical-records",
        name: "MedicalRecords",
        component: () =>
          import("@/views/medical-records/MedicalRecordListView.vue"),
        meta: { title: "Quản lý phiếu khám" },
      },
      {
        path: "/medical-records/:id",
        name: "MedicalRecordDetail",
        component: () =>
          import("@/views/medical-records/MedicalRecordDetailView.vue"),
        meta: { title: "Chi tiết phiếu khám" },
      },
      {
        path: "/appointments",
        name: "Appointments",
        component: () => import("@/views/appointments/AppointmentListView.vue"),
        meta: { title: "Quản lý lịch khám" },
      },
      {
        path: "/appointments/:id",
        name: "AppointmentDetail",
        component: () =>
          import("@/views/appointments/AppointmentDetailView.vue"),
        meta: { title: "Chi tiết lịch hẹn" },
      },
      {
        path: "/my-appointments",
        name: "MyAppointments",
        component: () => import("@/views/appointments/MyAppointmentsView.vue"),
        meta: { title: "Lịch hẹn của tôi" },
      },
      {
        path: "/doctor-capacities",
        name: "DoctorCapacities",
        component: () => import("@/views/appointments/DoctorCapacityView.vue"),
        meta: { title: "Phân công làm việc", requiresAdmin: true },
      },
      {
        path: "/treatments",
        name: "Treatments",
        component: () => import("@/views/treatments/TreatmentListView.vue"),
        meta: { title: "Quản lý điều trị" },
      },
      {
        path: "/services",
        name: "Services",
        component: () => import("@/views/services/ServiceListView.vue"),
        meta: { title: "Danh mục dịch vụ" }, // All roles can view, only ADMIN can create/edit/delete
      },
      {
        path: "/services/:id",
        name: "ServiceDetail",
        component: () => import("@/views/services/ServiceDetailView.vue"),
        meta: { title: "Chi tiết dịch vụ" },
      },
      {
        path: "/treatment-plans",
        name: "TreatmentPlans",
        component: () =>
          import("@/views/treatmentPlan/TreatmentPlanListView.vue"),
        meta: { title: "Kế hoạch điều trị" },
      },
      {
        path: "/treatment-plans/:id",
        name: "TreatmentPlanDetail",
        component: () =>
          import("@/views/treatmentPlan/TreatmentPlanDetailView.vue"),
        meta: { title: "Chi tiết kế hoạch điều trị" },
      },
      {
        path: "/invoices",
        name: "Invoices",
        component: () => import("@/views/invoices/InvoiceListView.vue"),
        meta: { title: "Quản lý hóa đơn" },
      },
      {
        path: "/invoices/:id",
        name: "InvoiceDetail",
        component: () => import("@/views/invoices/InvoiceDetailView.vue"),
        meta: { title: "Chi tiết hóa đơn" },
      },
      {
        path: "/medicines",
        name: "Medicines",
        component: () => import("@/views/medicines/MedicineListView.vue"),
        meta: { title: "Quản lý thuốc" },
      },
      {
        path: "/prescriptions",
        name: "Prescriptions",
        component: () =>
          import("@/views/prescriptions/PrescriptionListView.vue"),
        meta: { title: "Quản lý đơn thuốc" },
      },
      {
        path: "/prescriptions/:id",
        name: "PrescriptionDetail",
        component: () =>
          import("@/views/prescriptions/PrescriptionDetailView.vue"),
        meta: { title: "Chi tiết đơn thuốc" },
      },
      {
        path: "/inventory-report",
        name: "InventoryReport",
        component: () => import("@/views/dashboard/InventoryReportView.vue"),
        meta: { title: "Báo cáo tồn kho" },
      },
      {
        path: "/expenses",
        name: "Expenses",
        component: () => import("@/views/expenses/ExpenseListView.vue"),
        meta: { title: "Quản lý chi phí", roles: ["ADMIN", "CASHIER"] },
      },
      {
        path: "/public-contents",
        name: "PublicContents",
        component: () =>
          import("@/views/public-contents/PublicContentManagementView.vue"),
        meta: {
          title: "Quản lý thông tin công khai",
          roles: ["ADMIN", "CASHIER"],
        },
      },
      {
        path: "/public-contents/:id",
        name: "PublicContentDetail",
        component: () =>
          import("@/views/public-contents/PublicContentDetailView.vue"),
        meta: {
          title: "Chi tiết thông tin công khai",
          roles: ["ADMIN", "CASHIER"],
        },
      },
      {
        path: "/users",
        name: "Users",
        component: () => import("@/views/users/UserListView.vue"),
        meta: { title: "Quản lý người dùng", requiresAdmin: true },
      },
      {
        path: "/profile",
        name: "Profile",
        component: () => import("@/views/profile/ProfileView.vue"),
        meta: { title: "Thông tin cá nhân" },
      },
      {
        path: "/notifications",
        name: "Notifications",
        component: () =>
          import("@/views/notifications/NotificationListView.vue"),
        meta: { title: "Thông báo" },
      },
    ],
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("@/views/error/NotFoundView.vue"),
    meta: { title: "Không tìm thấy trang" },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guard
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();

  // Set page title
  document.title = to.meta.title
    ? `${to.meta.title} - Dental Clinic`
    : "Dental Clinic";

  // ⚡ The persist plugin automatically restores state from localStorage
  // But we still need to check if we have a token but no user (edge case)
  if (authStore.token && !authStore.user) {
    await authStore.checkAuth();
  }

  // Check authentication
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      ElMessage.warning("Vui lòng đăng nhập để tiếp tục");
      next({ name: "Login", query: { redirect: to.fullPath } });
      return;
    }

    // Redirect to role-specific dashboard
    if (to.name === "Dashboard" || to.name === "DefaultDashboard") {
      const role = authStore.userRole;
      if (role === "DOCTOR") {
        next({ name: "DoctorDashboard" });
        return;
      } else if (role === "CASHIER") {
        next({ name: "CashierDashboard" });
        return;
      } else if (role === "PATIENT") {
        next({ name: "PatientDashboard" });
        return;
      } else if (role === "ADMIN") {
        next({ name: "AdminDashboard" });
        return;
      }
    }

    // Check role permission
    if (to.meta.roles && Array.isArray(to.meta.roles)) {
      const hasPermission = to.meta.roles.includes(
        authStore.userRole as string,
      );
      if (!hasPermission) {
        ElMessage.error("Bạn không có quyền truy cập trang này");
        // Redirect to role-specific dashboard instead of generic Dashboard
        const role = authStore.userRole;
        if (role === "DOCTOR") {
          next({ name: "DoctorDashboard" });
        } else if (role === "CASHIER") {
          next({ name: "CashierDashboard" });
        } else if (role === "PATIENT") {
          next({ name: "PatientDashboard" });
        } else if (role === "ADMIN") {
          next({ name: "AdminDashboard" });
        } else {
          next({ name: "DefaultDashboard" });
        }
        return;
      }
    }

    // Check admin-only routes
    if (to.meta.requiresAdmin && !authStore.isAdmin) {
      ElMessage.error("Chỉ quản trị viên mới có quyền truy cập");
      const role = authStore.userRole;
      if (role === "DOCTOR") {
        next({ name: "DoctorDashboard" });
      } else if (role === "CASHIER") {
        next({ name: "CashierDashboard" });
      } else if (role === "PATIENT") {
        next({ name: "PatientDashboard" });
      } else {
        next({ name: "DefaultDashboard" });
      }
      return;
    }
  }

  // Redirect to role-specific dashboard if already logged in
  if (to.meta.guest && authStore.isAuthenticated) {
    const role = authStore.userRole;
    if (role === "DOCTOR") {
      next({ name: "DoctorDashboard" });
    } else if (role === "CASHIER") {
      next({ name: "CashierDashboard" });
    } else if (role === "PATIENT") {
      next({ name: "PatientDashboard" });
    } else if (role === "ADMIN") {
      next({ name: "AdminDashboard" });
    } else {
      next({ name: "DefaultDashboard" });
    }
    return;
  }

  next();
});

export default router;
