<template>
  <div class="dashboard-modern">
    <!-- Header Section with Date Filter -->
    <div class="dashboard-header">
      <div class="flex items-center gap-8">
        <div>
          <h1 class="text-5xl font-bold text-gray-900">Dashboard</h1>
          <p class="text-gray-500 mt-2">Tổng quan hoạt động phòng khám</p>
        </div>
        <div class="date-filter-card">
          <div class="date-filter-header">
            <svg
              class="w-5 h-5 text-teal-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span class="date-filter-label">Khoảng thời gian</span>
          </div>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="→"
            start-placeholder="Từ ngày"
            end-placeholder="Đến ngày"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            @change="loadData"
            size="default"
            class="date-picker-modern"
          />
        </div>
      </div>
    </div>

    <div v-if="authStore.isAdmin" class="ai-month-entry">
      <button type="button" class="ai-open-btn" @click="aiDialogVisible = true">
        Mở thống kê tháng
      </button>
    </div>

    <DashboardAiAnalysisDialog
      v-if="authStore.isAdmin"
      v-model="aiDialogVisible"
    />

    <!-- Bento Grid Layout -->
    <div class="bento-grid" v-loading="loading">
      <!-- Stats Cards - Row 1 -->
      <div class="bento-item stat-card-modern revenue-card">
        <div class="stat-icon-wrapper-sm">
          <svg
            class="w-6 h-6 text-teal-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div class="stat-content-sm">
          <div class="stat-label-sm">Doanh thu thuần</div>
          <div class="stat-value-sm text-teal-600">
            {{ formatCurrency(summary.netRevenue) }}
          </div>
        </div>
      </div>

      <div class="bento-item stat-card-modern profit-card">
        <div class="stat-icon-wrapper-sm">
          <svg
            class="w-6 h-6 text-emerald-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <div class="stat-content-sm">
          <div class="stat-label-sm">Lợi nhuận ước tính</div>
          <div class="stat-value-sm text-emerald-600">
            {{ formatCurrency(summary.estimatedProfit) }}
          </div>
        </div>
      </div>

      <div class="bento-item stat-card-modern cost-card">
        <div class="stat-icon-wrapper-sm">
          <svg
            class="w-6 h-6 text-rose-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
        </div>
        <div class="stat-content-sm">
          <div class="stat-label-sm">Tổng chi phí</div>
          <div class="stat-value-sm text-rose-600">
            {{ formatCurrency(summary.totalCosts) }}
          </div>
        </div>
      </div>

      <div class="bento-item stat-card-modern unpaid-card">
        <div class="stat-icon-wrapper-sm">
          <svg
            class="w-6 h-6 text-amber-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <div class="stat-content-sm">
          <div class="stat-label-sm">Công nợ</div>
          <div class="stat-value-sm text-amber-600">
            {{ formatCurrency(summary.unpaidAmount) }}
          </div>
        </div>
      </div>

      <!-- Revenue Chart - Large -->
      <div class="bento-item bento-wide chart-card-modern">
        <div class="chart-header">
          <div>
            <h3 class="chart-title">Doanh thu theo ngày</h3>
            <p class="chart-subtitle">Biểu đồ xu hướng doanh thu</p>
          </div>
          <div class="chart-legend">
            <span class="legend-dot bg-teal-500"></span>
            <span class="legend-text">Doanh thu</span>
          </div>
        </div>
        <v-chart
          v-if="revenueChartOptions"
          :option="revenueChartOptions"
          :style="{ height: '300px' }"
          autoresize
        />
      </div>

      <!-- Service Type Pie Chart -->
      <div class="bento-item chart-card-modern">
        <div class="chart-header">
          <div>
            <h3 class="chart-title">Doanh thu theo loại</h3>
            <p class="chart-subtitle">Phân bổ doanh thu</p>
          </div>
        </div>
        <v-chart
          v-if="serviceTypeChartOptions"
          :option="serviceTypeChartOptions"
          :style="{ height: '300px' }"
          autoresize
        />
      </div>

      <!-- Import Cost Chart -->
      <div class="bento-item chart-card-modern">
        <div class="chart-header">
          <div>
            <h3 class="chart-title">Chi phí nhập thuốc</h3>
            <p class="chart-subtitle">Theo ngày</p>
          </div>
        </div>
        <v-chart
          v-if="importCostChartOptions"
          :option="importCostChartOptions"
          :style="{ height: '300px' }"
          autoresize
        />
      </div>

      <!-- Top Medicines -->
      <div class="bento-item chart-card-modern">
        <div class="chart-header">
          <div>
            <h3 class="chart-title">Top thuốc xuất nhiều</h3>
            <p class="chart-subtitle">Danh sách hàng đầu</p>
          </div>
        </div>
        <v-chart
          v-if="topMedicinesChartOptions"
          :option="topMedicinesChartOptions"
          :style="{ height: '300px' }"
          autoresize
        />
      </div>

      <!-- Financial Summary - Wide -->
      <div class="bento-item bento-wide summary-card-modern">
        <div class="summary-header">
          <div class="flex items-center gap-3">
            <div class="summary-icon">
              <svg
                class="w-6 h-6 text-teal-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h3 class="summary-title">Chi tiết tài chính</h3>
              <p class="summary-subtitle">Tổng hợp đầy đủ các chỉ số</p>
            </div>
          </div>
        </div>
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-label">Doanh thu gốc</div>
            <div class="summary-value">
              {{ formatCurrency(summary.grossRevenue) }}
            </div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Giảm giá</div>
            <div class="summary-value text-gray-500">
              {{ formatCurrency(summary.discountAmount) }}
            </div>
          </div>
          <div class="summary-item highlight">
            <div class="summary-label">Doanh thu thuần</div>
            <div class="summary-value text-teal-600">
              {{ formatCurrency(summary.netRevenue) }}
            </div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Đã thanh toán</div>
            <div class="summary-value">
              {{ formatCurrency(summary.paidAmount) }}
            </div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Chi phí vận hành</div>
            <div class="summary-value">
              {{ formatCurrency(summary.operatingExpenses) }}
            </div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Chi phí nhập thuốc</div>
            <div class="summary-value">
              {{ formatCurrency(summary.medicineImportCost) }}
            </div>
          </div>
          <div class="summary-item highlight">
            <div class="summary-label">Tổng chi phí</div>
            <div class="summary-value text-rose-600">
              {{ formatCurrency(summary.totalCosts) }}
            </div>
          </div>
          <div class="summary-item highlight">
            <div class="summary-label">Lợi nhuận ước tính</div>
            <div class="summary-value text-emerald-600 text-xl font-bold">
              {{ formatCurrency(summary.estimatedProfit) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import VChart from "vue-echarts";
import { useAuthStore } from "@/stores/auth";
import DashboardAiAnalysisDialog from "@/views/dashboard/components/DashboardAiAnalysisDialog.vue";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { LineChart, BarChart, PieChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from "echarts/components";
import { dashboardApi } from "@/api/dashboard";
import type { DashboardSummary } from "@/types/dashboard";

const authStore = useAuthStore();

// Register ECharts components
use([
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
]);

const loading = ref(false);
const aiDialogVisible = ref(false);

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

// Summary data
const summary = ref<DashboardSummary>({
  grossRevenue: 0,
  discountAmount: 0,
  netRevenue: 0,
  paidAmount: 0,
  unpaidAmount: 0,
  operatingExpenses: 0,
  medicineImportCost: 0,
  totalCosts: 0,
  estimatedProfit: 0,
});

// Chart data
const revenueByDay = ref<{ date: string; amount: number }[]>([]);
const revenueByServiceType = ref<{ category: string; amount: number }[]>([]);
const importCostByDay = ref<{ date: string; amount: number }[]>([]);
const topMedicines = ref<{ category: string; amount: number }[]>([]);

// Chart options with modern styling
const revenueChartOptions = computed(() => {
  if (revenueByDay.value.length === 0) return null;

  return {
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderColor: "#e5e7eb",
      borderWidth: 1,
      textStyle: {
        color: "#374151",
      },
      formatter: (params: any) => {
        const item = params[0];
        return `<div style="font-weight: 600; margin-bottom: 8px;">${item.name}</div><div>Doanh thu: <span style="color: #0d9488; font-weight: 600;">${formatCurrency(item.value)}</span></div>`;
      },
    },
    grid: {
      left: "3%",
      right: "3%",
      bottom: "10%",
      top: "5%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: revenueByDay.value.map((item) =>
        new Date(item.date).toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
        }),
      ),
      axisLine: {
        lineStyle: {
          color: "#e5e7eb",
        },
      },
      axisLabel: {
        color: "#6b7280",
      },
    },
    yAxis: {
      type: "value",
      axisLine: {
        show: false,
      },
      splitLine: {
        lineStyle: {
          color: "#f3f4f6",
          type: "dashed",
        },
      },
      axisLabel: {
        formatter: (value: number) => `${(value / 1000000).toFixed(1)}M`,
        color: "#6b7280",
      },
    },
    series: [
      {
        name: "Doanh thu",
        type: "line",
        data: revenueByDay.value.map((item) => item.amount),
        smooth: true,
        lineStyle: {
          width: 3,
          color: "#0d9488",
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(13, 148, 136, 0.2)" },
              { offset: 1, color: "rgba(13, 148, 136, 0.02)" },
            ],
          },
        },
        itemStyle: {
          color: "#0d9488",
        },
      },
    ],
  };
});

const serviceTypeChartOptions = computed(() => {
  if (revenueByServiceType.value.length === 0) return null;

  const typeNames: Record<string, string> = {
    SERVICE: "Dịch vụ",
    MEDICINE: "Thuốc",
  };

  const colors = ["#0d9488", "#06b6d4", "#8b5cf6", "#ec4899"];

  return {
    tooltip: {
      trigger: "item",
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderColor: "#e5e7eb",
      borderWidth: 1,
      textStyle: {
        color: "#374151",
      },
      formatter: (params: any) => {
        return `<div style="font-weight: 600; margin-bottom: 8px;">${params.name}</div><div>Doanh thu: <span style="font-weight: 600;">${formatCurrency(params.value)}</span></div><div>Tỷ lệ: <span style="font-weight: 600;">${params.percent}%</span></div>`;
      },
    },
    legend: {
      bottom: "0%",
      left: "center",
      textStyle: {
        color: "#6b7280",
      },
    },
    series: [
      {
        name: "Doanh thu",
        type: "pie",
        radius: ["45%", "75%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: "#fff",
          borderWidth: 3,
        },
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: "bold",
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.15)",
          },
        },
        data: revenueByServiceType.value.map((item, index) => ({
          name: typeNames[item.category] || item.category,
          value: item.amount,
          itemStyle: {
            color: colors[index % colors.length],
          },
        })),
      },
    ],
  };
});

const importCostChartOptions = computed(() => {
  if (importCostByDay.value.length === 0) return null;

  return {
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderColor: "#e5e7eb",
      borderWidth: 1,
      textStyle: {
        color: "#374151",
      },
      formatter: (params: any) => {
        const item = params[0];
        return `<div style="font-weight: 600; margin-bottom: 8px;">${item.name}</div><div>Chi phí: <span style="color: #f43f5e; font-weight: 600;">${formatCurrency(item.value)}</span></div>`;
      },
    },
    grid: {
      left: "10%",
      right: "5%",
      bottom: "20%",
      top: "10%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: importCostByDay.value.map((item) =>
        new Date(item.date).toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
        }),
      ),
      axisLine: {
        lineStyle: {
          color: "#e5e7eb",
        },
      },
      axisLabel: {
        color: "#6b7280",
        rotate: 45,
      },
    },
    yAxis: {
      type: "value",
      axisLine: {
        show: false,
      },
      splitLine: {
        lineStyle: {
          color: "#f3f4f6",
          type: "dashed",
        },
      },
      axisLabel: {
        formatter: (value: number) => `${(value / 1000000).toFixed(1)}M`,
        color: "#6b7280",
      },
    },
    series: [
      {
        name: "Chi phí nhập",
        type: "bar",
        data: importCostByDay.value.map((item) => item.amount),
        itemStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "#f43f5e" },
              { offset: 1, color: "#fb7185" },
            ],
          },
          borderRadius: [6, 6, 0, 0],
        },
        barWidth: "60%",
      },
    ],
  };
});

const topMedicinesChartOptions = computed(() => {
  if (topMedicines.value.length === 0) return null;

  return {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderColor: "#e5e7eb",
      borderWidth: 1,
      textStyle: {
        color: "#374151",
      },
      formatter: (params: any) => {
        const item = params[0];
        return `<div style="font-weight: 600; margin-bottom: 8px;">${item.name}</div><div>Số lượng: <span style="font-weight: 600;">${item.value}</span></div>`;
      },
    },
    grid: {
      left: "25%",
      right: "5%",
      bottom: "5%",
      top: "5%",
      containLabel: false,
    },
    xAxis: {
      type: "value",
      axisLine: {
        show: false,
      },
      splitLine: {
        lineStyle: {
          color: "#f3f4f6",
          type: "dashed",
        },
      },
      axisLabel: {
        color: "#6b7280",
      },
    },
    yAxis: {
      type: "category",
      data: topMedicines.value.map((item) => item.category).reverse(),
      axisLine: {
        lineStyle: {
          color: "#e5e7eb",
        },
      },
      axisLabel: {
        color: "#6b7280",
      },
    },
    series: [
      {
        name: "Số lượng",
        type: "bar",
        data: topMedicines.value.map((item) => item.amount).reverse(),
        itemStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              { offset: 0, color: "#10b981" },
              { offset: 1, color: "#34d399" },
            ],
          },
          borderRadius: [0, 6, 6, 0],
        },
        barWidth: "50%",
      },
    ],
  };
});

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

const loadData = async () => {
  if (!dateRange.value || dateRange.value.length !== 2) return;

  loading.value = true;
  try {
    const params = {
      from: dateRange.value[0],
      to: dateRange.value[1],
    };

    const [
      summaryRes,
      revenueRes,
      serviceTypeRes,
      importCostRes,
      topMedicinesRes,
    ] = await Promise.all([
      dashboardApi.summary(params),
      dashboardApi.revenueByDay(params),
      dashboardApi.revenueByServiceType(params),
      dashboardApi.medicineImportCostByDay(params),
      dashboardApi.topDispensedMedicines(params),
    ]);

    summary.value = summaryRes;
    revenueByDay.value = revenueRes;
    revenueByServiceType.value = serviceTypeRes;
    importCostByDay.value = importCostRes;
    topMedicines.value = topMedicinesRes;
  } catch (error: any) {
    ElMessage.error(error.message || "Không thể tải dữ liệu dashboard");
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped lang="scss">
.dashboard-modern {
  max-width: 1600px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;

  h1 {
    margin: 0;
    background: linear-gradient(135deg, #0d9488 0%, #06b6d4 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  p {
    margin: 0;
  }
}

.ai-month-entry {
  margin-bottom: 1rem;
}

.ai-open-btn {
  border: none;
  border-radius: 12px;
  padding: 10px 16px;
  font-weight: 700;
  color: #ffffff;
  background: linear-gradient(135deg, #0d9488 0%, #06b6d4 100%);
  box-shadow: 0 8px 18px rgba(13, 148, 136, 0.28);
  cursor: pointer;
}

.date-filter-card {
  background: linear-gradient(135deg, #f0fdfa 0%, #ffffff 100%);
  padding: 1rem 1.5rem;
  border-radius: 16px;
  border: 2px solid #99f6e4;
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 0.05),
    0 2px 4px -2px rgb(0 0 0 / 0.05);
  transition: all 0.3s ease;
}

.date-filter-card:hover {
  border-color: #5eead4;
  box-shadow:
    0 10px 15px -3px rgb(0 0 0 / 0.08),
    0 4px 6px -4px rgb(0 0 0 / 0.05);
  transform: translateY(-2px);
}

.date-filter-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.date-filter-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #14b8a6;
  letter-spacing: 0.025em;
}

.date-picker-modern {
  width: 280px;

  :deep(.el-input__wrapper) {
    background: white;
    border: 1.5px solid #d1fae5;
    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    border-radius: 12px;
    padding: 8px 12px;
    transition: all 0.3s ease;
  }

  :deep(.el-input__wrapper:hover) {
    border-color: #5eead4;
    box-shadow: 0 0 0 3px rgba(94, 234, 212, 0.1);
  }

  :deep(.el-input__wrapper.is-focus) {
    border-color: #14b8a6;
    box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.15);
  }

  :deep(.el-range-input) {
    font-size: 0.875rem;
    font-weight: 500;
    color: #0f766e;
  }

  :deep(.el-range-input::placeholder) {
    color: #94a3b8;
    font-weight: 400;
  }

  :deep(.el-range-separator) {
    color: #14b8a6;
    font-weight: 600;
  }

  :deep(.el-input__prefix),
  :deep(.el-input__suffix) {
    color: #14b8a6;
  }

  :deep(.el-icon) {
    color: #14b8a6;
  }
}

/* Bento Grid Layout */
.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  grid-auto-rows: minmax(120px, auto);
}

.bento-item {
  background: white;
  border-radius: 20px;
  padding: 1.75rem;
  box-shadow:
    0 1px 3px 0 rgb(0 0 0 / 0.1),
    0 1px 2px -1px rgb(0 0 0 / 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(0, 0, 0, 0.05);

  &:hover {
    box-shadow:
      0 10px 15px -3px rgb(0 0 0 / 0.1),
      0 4px 6px -4px rgb(0 0 0 / 0.1);
    transform: translateY(-2px);
  }
}

.bento-wide {
  grid-column: span 4;
}

/* Stat Cards */
.stat-card-modern {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stat-icon-wrapper-sm {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.revenue-card .stat-icon-wrapper-sm {
  background: linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%);
}

.profit-card .stat-icon-wrapper-sm {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
}

.cost-card .stat-icon-wrapper-sm {
  background: linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%);
}

.unpaid-card .stat-icon-wrapper-sm {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
}

.stat-content-sm {
  .stat-label-sm {
    font-size: 0.875rem;
    font-weight: 500;
    color: #6b7280;
    margin-bottom: 0.5rem;
  }

  .stat-value-sm {
    font-size: 1.5rem;
    font-weight: 700;
  }
}

/* Chart Cards */
.chart-card-modern {
  display: flex;
  flex-direction: column;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;

  .chart-title {
    font-size: 1.125rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 0.25rem 0;
  }

  .chart-subtitle {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
  }
}

.chart-legend {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  .legend-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }

  .legend-text {
    font-size: 0.875rem;
    color: #6b7280;
  }
}

/* Summary Card */
.summary-card-modern {
  background: linear-gradient(135deg, #f0fdfa 0%, #f0f9ff 100%);
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid rgba(13, 148, 136, 0.1);
}

.summary-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 0.1),
    0 2px 4px -2px rgb(0 0 0 / 0.1);
}

.summary-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.25rem 0;
}

.summary-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

.summary-item {
  background: white;
  padding: 1.25rem;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);

  &.highlight {
    background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
    border: 2px solid #0d9488;
    box-shadow: 0 4px 6px -1px rgb(13 148 136 / 0.1);
  }

  .summary-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #6b7280;
    margin-bottom: 0.5rem;
  }

  .summary-value {
    font-size: 1.25rem;
    font-weight: 700;
    color: #111827;
  }
}

/* Responsive */
@media (max-width: 1280px) {
  .bento-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .bento-wide {
    grid-column: span 2;
  }

  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    gap: 1rem;
  }

  .bento-grid {
    grid-template-columns: 1fr;
  }

  .bento-wide {
    grid-column: span 1;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
