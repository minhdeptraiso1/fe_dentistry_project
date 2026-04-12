<template>
  <div class="admin-dashboard">
    <!-- Header -->
    <div class="dashboard-header">
      <div>
        <h1 class="text-4xl font-bold text-gray-900">Dashboard Quản Trị</h1>
        <p class="text-gray-500 mt-2">
          Tổng quan hệ thống và quản lý toàn diện phòng khám
        </p>
      </div>
      <div class="date-filter-card">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="→"
          start-placeholder="Từ ngày"
          end-placeholder="Đến ngày"
          format="DD/MM/YYYY"
          value-format="YYYY-MM-DD"
          @change="loadData"
          size="large"
        />
      </div>
    </div>

    <!-- Stats Overview -->
    <div class="stats-grid" v-loading="loading">
      <div class="stat-card bg-gradient-to-br from-emerald-500 to-emerald-600">
        <div class="stat-icon">
          <el-icon :size="32"><Money /></el-icon>
        </div>
        <div class="stat-content">
          <p class="stat-label">Tổng doanh thu</p>
          <h3 class="stat-value">{{ formatCurrency(stats.totalRevenue) }}</h3>
          <p class="stat-change positive">+12.5% so với tháng trước</p>
        </div>
      </div>

      <div class="stat-card bg-gradient-to-br from-blue-500 to-blue-600">
        <div class="stat-icon">
          <el-icon :size="32"><User /></el-icon>
        </div>
        <div class="stat-content">
          <p class="stat-label">Tổng bệnh nhân</p>
          <h3 class="stat-value">{{ stats.totalPatients }}</h3>
          <p class="stat-change positive">
            +{{ stats.newPatients }} bệnh nhân mới
          </p>
        </div>
      </div>

      <div class="stat-card bg-gradient-to-br from-purple-500 to-purple-600">
        <div class="stat-icon">
          <el-icon :size="32"><Calendar /></el-icon>
        </div>
        <div class="stat-content">
          <p class="stat-label">Lượt khám</p>
          <h3 class="stat-value">{{ stats.totalAppointments }}</h3>
          <p class="stat-change positive">+8.3% so với tháng trước</p>
        </div>
      </div>

      <div class="stat-card bg-gradient-to-br from-rose-500 to-rose-600">
        <div class="stat-icon">
          <el-icon :size="32"><TrendCharts /></el-icon>
        </div>
        <div class="stat-content">
          <p class="stat-label">Lợi nhuận</p>
          <h3 class="stat-value">{{ formatCurrency(stats.profit) }}</h3>
          <p class="stat-change positive">+15.2% so với tháng trước</p>
        </div>
      </div>
    </div>

    <!-- Charts and Data -->
    <div class="content-grid">
      <!-- Revenue Chart -->
      <div class="content-card lg:col-span-2">
        <div class="card-header">
          <h2 class="card-title">
            <el-icon><TrendCharts /></el-icon>
            Biểu đồ doanh thu
          </h2>
          <el-radio-group v-model="revenueChartPeriod" size="small">
            <el-radio-button label="week">Tuần</el-radio-button>
            <el-radio-button label="month">Tháng</el-radio-button>
            <el-radio-button label="year">Năm</el-radio-button>
          </el-radio-group>
        </div>
        <div class="card-body">
          <div class="chart-placeholder">
            <p class="text-gray-500 text-center py-12">
              [Biểu đồ doanh thu sẽ được hiển thị ở đây]
            </p>
          </div>
        </div>
      </div>

      <!-- Top Services -->
      <div class="content-card">
        <div class="card-header">
          <h2 class="card-title">
            <el-icon><Trophy /></el-icon>
            Dịch vụ phổ biến
          </h2>
        </div>
        <div class="card-body">
          <div class="top-services">
            <div
              v-for="(service, index) in topServices"
              :key="service.id"
              class="service-item"
            >
              <div class="service-rank" :class="`rank-${index + 1}`">
                {{ index + 1 }}
              </div>
              <div class="flex-1">
                <p class="font-semibold text-gray-900">{{ service.name }}</p>
                <p class="text-sm text-gray-500">{{ service.count }} lượt</p>
              </div>
              <p class="font-semibold text-teal-600">
                {{ formatCurrency(service.revenue) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Doctor Performance -->
      <div class="content-card">
        <div class="card-header">
          <h2 class="card-title">
            <el-icon><UserFilled /></el-icon>
            Hiệu suất bác sĩ
          </h2>
        </div>
        <div class="card-body">
          <el-table :data="doctorPerformance" style="width: 100%">
            <el-table-column prop="name" label="Bác sĩ" />
            <el-table-column
              prop="appointments"
              label="Lượt khám"
              width="100"
            />
            <el-table-column label="Đánh giá" width="100">
              <template #default="{ row }">
                <el-rate
                  v-model="row.rating"
                  disabled
                  size="small"
                  show-score
                  text-color="#ff9900"
                />
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- Recent Activities -->
      <div class="content-card">
        <div class="card-header">
          <h2 class="card-title">
            <el-icon><Clock /></el-icon>
            Hoạt động gần đây
          </h2>
        </div>
        <div class="card-body">
          <el-timeline>
            <el-timeline-item
              v-for="activity in recentActivities"
              :key="activity.id"
              :timestamp="activity.time"
              placement="top"
              :type="activity.type"
              :icon="activity.icon"
            >
              <p class="text-sm text-gray-900">{{ activity.description }}</p>
              <p class="text-xs text-gray-500">{{ activity.user }}</p>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>

      <!-- Quick Management -->
      <div class="content-card">
        <div class="card-header">
          <h2 class="card-title">
            <el-icon><Setting /></el-icon>
            Quản lý nhanh
          </h2>
        </div>
        <div class="card-body">
          <div class="management-grid">
            <div class="management-card" @click="goToUsers">
              <el-icon :size="32" class="text-blue-500"><User /></el-icon>
              <p class="font-semibold">Người dùng</p>
              <p class="text-2xl font-bold">{{ stats.totalUsers }}</p>
            </div>
            <div class="management-card" @click="goToServices">
              <el-icon :size="32" class="text-emerald-500"><Menu /></el-icon>
              <p class="font-semibold">Dịch vụ</p>
              <p class="text-2xl font-bold">{{ stats.totalServices }}</p>
            </div>
            <div class="management-card" @click="goToMedicines">
              <el-icon :size="32" class="text-orange-500"
                ><Operation
              /></el-icon>
              <p class="font-semibold">Thuốc</p>
              <p class="text-2xl font-bold">{{ stats.totalMedicines }}</p>
            </div>
            <div class="management-card" @click="goToExpenses">
              <el-icon :size="32" class="text-rose-500"><CreditCard /></el-icon>
              <p class="font-semibold">Chi phí</p>
              <p class="text-2xl font-bold">{{ stats.totalExpenses }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- System Overview -->
    <div class="content-card">
      <div class="card-header">
        <h2 class="card-title">
          <el-icon><DataLine /></el-icon>
          Tổng quan hệ thống
        </h2>
      </div>
      <div class="card-body">
        <div class="system-grid">
          <div class="system-item">
            <div class="system-label">Lịch hẹn hôm nay</div>
            <div class="system-value">{{ stats.todayAppointments }}</div>
            <el-progress
              :percentage="
                (stats.todayAppointments / stats.maxAppointments) * 100
              "
              :stroke-width="8"
              :show-text="false"
            />
          </div>
          <div class="system-item">
            <div class="system-label">Phòng khám đang hoạt động</div>
            <div class="system-value">
              {{ stats.activeRooms }}/{{ stats.totalRooms }}
            </div>
            <el-progress
              :percentage="(stats.activeRooms / stats.totalRooms) * 100"
              :stroke-width="8"
              :show-text="false"
              color="#10b981"
            />
          </div>
          <div class="system-item">
            <div class="system-label">Bác sĩ đang làm việc</div>
            <div class="system-value">
              {{ stats.activeDoctors }}/{{ stats.totalDoctors }}
            </div>
            <el-progress
              :percentage="(stats.activeDoctors / stats.totalDoctors) * 100"
              :stroke-width="8"
              :show-text="false"
              color="#3b82f6"
            />
          </div>
          <div class="system-item">
            <div class="system-label">Tỷ lệ hoàn thành</div>
            <div class="system-value">{{ stats.completionRate }}%</div>
            <el-progress
              :percentage="stats.completionRate"
              :stroke-width="8"
              :show-text="false"
              color="#8b5cf6"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { adminApi } from "@/api/admin";
import { notification } from "@/utils/notification";
import {
  Money,
  User,
  Calendar,
  TrendCharts,
  Trophy,
  UserFilled,
  Clock,
  Setting,
  Menu,
  Operation,
  CreditCard,
  DataLine,
} from "@element-plus/icons-vue";

const router = useRouter();

// State
const loading = ref(false);

const getCurrentMonthDateRange = (): [string, string] => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const toYmd = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  return [toYmd(firstDay), toYmd(lastDay)];
};

const dateRange = ref<[string, string]>(getCurrentMonthDateRange());
const revenueChartPeriod = ref("month");

const stats = ref({
  totalRevenue: 125000000,
  totalPatients: 1247,
  newPatients: 45,
  totalAppointments: 856,
  profit: 45000000,
  totalUsers: 15,
  totalServices: 24,
  totalMedicines: 156,
  totalExpenses: 12,
  todayAppointments: 28,
  maxAppointments: 40,
  activeRooms: 3,
  totalRooms: 5,
  activeDoctors: 4,
  totalDoctors: 6,
  completionRate: 92,
});

const topServices = ref([
  { id: 1, name: "Trám răng", count: 156, revenue: 78000000 },
  { id: 2, name: "Nhổ răng khôn", count: 98, revenue: 49000000 },
  { id: 3, name: "Tẩy trắng răng", count: 87, revenue: 43500000 },
  { id: 4, name: "Chỉnh nha", count: 64, revenue: 320000000 },
  { id: 5, name: "Điều trị tủy", count: 52, revenue: 26000000 },
]);

const doctorPerformance = ref([
  { name: "BS. Nguyễn Văn A", appointments: 124, rating: 4.8 },
  { name: "BS. Trần Thị B", appointments: 108, rating: 4.9 },
  { name: "BS. Lê Văn C", appointments: 95, rating: 4.7 },
  { name: "BS. Phạm Thị D", appointments: 87, rating: 4.6 },
]);

const recentActivities = ref([
  {
    id: 1,
    description: "Tạo người dùng mới: BS. Hoàng Văn E",
    user: "Admin",
    time: "10 phút trước",
    type: "success",
    icon: User,
  },
  {
    id: 2,
    description: "Cập nhật giá dịch vụ: Trám răng",
    user: "Admin",
    time: "1 giờ trước",
    type: "primary",
    icon: Setting,
  },
  {
    id: 3,
    description: "Nhập lô thuốc mới: Amoxicillin 500mg",
    user: "Thu ngân A",
    time: "2 giờ trước",
    type: "warning",
    icon: Operation,
  },
  {
    id: 4,
    description: "Tạo chi phí: Thanh toán điện nước",
    user: "Admin",
    time: "3 giờ trước",
    type: "danger",
    icon: CreditCard,
  },
]);

// Format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

// Load data
const loadData = async () => {
  loading.value = true;
  try {
    const [startDate, endDate] = dateRange.value;
    const response = await adminApi.getDashboardOverview({
      startDate,
      endDate,
    });
    // Update stats with real data
    // stats.value = { ...stats.value, ...response.data };
  } catch (error: any) {
    console.error("Error loading dashboard data:", error);
    // notification.error(error.message || "Không thể tải dữ liệu");
  } finally {
    loading.value = false;
  }
};

// Navigation
const goToUsers = () => router.push({ name: "Users" });
const goToServices = () => router.push({ name: "Services" });
const goToMedicines = () => router.push({ name: "Medicines" });
const goToExpenses = () => router.push({ name: "Expenses" });

// Lifecycle
onMounted(() => {
  loadData();
});
</script>

<style scoped>
.admin-dashboard {
  @apply space-y-6;
}

.dashboard-header {
  @apply flex items-center justify-between mb-6;
}

.date-filter-card {
  @apply bg-white rounded-xl p-4 shadow-sm;
}

.stats-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6;
}

.stat-card {
  @apply rounded-xl p-6 text-white shadow-lg;
}

.stat-icon {
  @apply w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4;
}

.stat-content {
  @apply space-y-1;
}

.stat-label {
  @apply text-sm text-white/80;
}

.stat-value {
  @apply text-3xl font-bold;
}

.stat-change {
  @apply text-xs;
}

.stat-change.positive {
  @apply text-white/90;
}

.content-grid {
  @apply grid grid-cols-1 lg:grid-cols-3 gap-6;
}

.content-card {
  @apply bg-white rounded-xl shadow-sm overflow-hidden;
}

.card-header {
  @apply flex items-center justify-between p-6 border-b border-gray-200;
}

.card-title {
  @apply text-lg font-semibold text-gray-900 flex items-center gap-2;
}

.card-body {
  @apply p-6;
}

.chart-placeholder {
  @apply min-h-[300px] flex items-center justify-center bg-gray-50 rounded-lg;
}

.top-services {
  @apply space-y-3;
}

.service-item {
  @apply flex items-center gap-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors;
}

.service-rank {
  @apply w-8 h-8 rounded-full flex items-center justify-center font-bold text-white;
}

.service-rank.rank-1 {
  @apply bg-yellow-500;
}

.service-rank.rank-2 {
  @apply bg-gray-400;
}

.service-rank.rank-3 {
  @apply bg-orange-600;
}

.service-rank:not(.rank-1):not(.rank-2):not(.rank-3) {
  @apply bg-gray-300;
}

.management-grid {
  @apply grid grid-cols-2 gap-4;
}

.management-card {
  @apply p-6 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-all text-center space-y-2;
}

.system-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6;
}

.system-item {
  @apply space-y-2;
}

.system-label {
  @apply text-sm text-gray-600;
}

.system-value {
  @apply text-2xl font-bold text-gray-900;
}
</style>
