import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { ElMessage } from "element-plus";

const routes: RouteRecordRaw[] = [
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/auth/LoginView.vue"),
    meta: { guest: true, title: "Đăng nhập" },
  },
  {
    path: "/",
    component: () => import("@/layouts/MainLayout.vue"),
    meta: { requiresAuth: true },
    children: [
      {
        path: "",
        name: "Dashboard",
        component: () => import("@/views/dashboard/DashboardView.vue"),
        meta: { title: "Tổng quan" },
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
        meta: { title: "Quản lý chi phí", requiresAdmin: true },
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

  // ⚡ IMPORTANT: Load auth from cookie nếu chưa có (sau khi refresh)
  if (!authStore.token && !authStore.user) {
    await authStore.checkAuth();
  }

  // Check authentication
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      ElMessage.warning("Vui lòng đăng nhập để tiếp tục");
      next({ name: "Login", query: { redirect: to.fullPath } });
      return;
    }

    // checkAuth() đã load user rồi, không cần gọi lại fetchUserInfo
    // Chỉ cần check role permission

    // Check role permission
    if (to.meta.roles && Array.isArray(to.meta.roles)) {
      const hasPermission = to.meta.roles.includes(
        authStore.userRole as string,
      );
      if (!hasPermission) {
        ElMessage.error("Bạn không có quyền truy cập trang này");
        next({ name: "Dashboard" });
        return;
      }
    }
  }

  // Redirect to dashboard if already logged in
  if (to.meta.guest && authStore.isAuthenticated) {
    next({ name: "Dashboard" });
    return;
  }

  next();
});

export default router;
