<template>
  <div class="dashboard-container">
    <!-- Date Range Filter -->
    <el-card class="filter-card mb-4">
      <el-row :gutter="16" align="middle">
        <el-col :span="12">
          <h2 class="text-xl font-semibold">Dashboard</h2>
        </el-col>
        <el-col :span="12" class="text-right">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="đến"
            start-placeholder="Từ ngày"
            end-placeholder="Đến ngày"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            @change="loadData"
          />
        </el-col>
      </el-row>
    </el-card>

    <!-- Summary Cards -->
    <el-row :gutter="16" class="mb-4">
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover" class="stat-card revenue-card">
          <div class="stat-content">
            <el-icon class="stat-icon"><Money /></el-icon>
            <div class="stat-info">
              <div class="stat-label">Doanh thu thuần</div>
              <div class="stat-value">
                {{ formatCurrency(summary.netRevenue) }}
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover" class="stat-card cost-card">
          <div class="stat-content">
            <el-icon class="stat-icon"><ShoppingCart /></el-icon>
            <div class="stat-info">
              <div class="stat-label">Tổng chi phí</div>
              <div class="stat-value">
                {{ formatCurrency(summary.totalCosts) }}
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover" class="stat-card profit-card">
          <div class="stat-content">
            <el-icon class="stat-icon"><TrendCharts /></el-icon>
            <div class="stat-info">
              <div class="stat-label">Lợi nhuận ước tính</div>
              <div class="stat-value">
                {{ formatCurrency(summary.estimatedProfit) }}
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover" class="stat-card unpaid-card">
          <div class="stat-content">
            <el-icon class="stat-icon"><Document /></el-icon>
            <div class="stat-info">
              <div class="stat-label">Công nợ</div>
              <div class="stat-value">
                {{ formatCurrency(summary.unpaidAmount) }}
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Charts Row 1: Revenue -->
    <el-row :gutter="16" class="mb-4">
      <el-col :xs="24" :lg="16">
        <el-card v-loading="loading">
          <template #header>
            <div class="card-header">
              <span class="font-semibold">Doanh thu theo ngày</span>
            </div>
          </template>
          <v-chart
            v-if="revenueChartOptions"
            :option="revenueChartOptions"
            :style="{ height: '350px' }"
            autoresize
          />
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="8">
        <el-card v-loading="loading">
          <template #header>
            <div class="card-header">
              <span class="font-semibold">Doanh thu theo loại</span>
            </div>
          </template>
          <v-chart
            v-if="serviceTypeChartOptions"
            :option="serviceTypeChartOptions"
            :style="{ height: '350px' }"
            autoresize
          />
        </el-card>
      </el-col>
    </el-row>

    <!-- Charts Row 2: Medicine -->
    <el-row :gutter="16" class="mb-4">
      <el-col :xs="24" :lg="12">
        <el-card v-loading="loading">
          <template #header>
            <div class="card-header">
              <span class="font-semibold">Chi phí nhập thuốc theo ngày</span>
            </div>
          </template>
          <v-chart
            v-if="importCostChartOptions"
            :option="importCostChartOptions"
            :style="{ height: '300px' }"
            autoresize
          />
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card v-loading="loading">
          <template #header>
            <div class="card-header">
              <span class="font-semibold">Top thuốc xuất nhiều nhất</span>
            </div>
          </template>
          <v-chart
            v-if="topMedicinesChartOptions"
            :option="topMedicinesChartOptions"
            :style="{ height: '300px' }"
            autoresize
          />
        </el-card>
      </el-col>
    </el-row>

    <!-- Detail Summary -->
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <span class="font-semibold">Chi tiết tài chính</span>
        </div>
      </template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="Doanh thu gốc">
          {{ formatCurrency(summary.grossRevenue) }}
        </el-descriptions-item>
        <el-descriptions-item label="Giảm giá">
          {{ formatCurrency(summary.discountAmount) }}
        </el-descriptions-item>
        <el-descriptions-item label="Doanh thu thuần">
          <span class="text-green-600 font-semibold">
            {{ formatCurrency(summary.netRevenue) }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="Đã thanh toán">
          {{ formatCurrency(summary.paidAmount) }}
        </el-descriptions-item>
        <el-descriptions-item label="Chi phí vận hành">
          {{ formatCurrency(summary.operatingExpenses) }}
        </el-descriptions-item>
        <el-descriptions-item label="Chi phí nhập thuốc">
          {{ formatCurrency(summary.medicineImportCost) }}
        </el-descriptions-item>
        <el-descriptions-item label="Tổng chi phí">
          <span class="text-red-600 font-semibold">
            {{ formatCurrency(summary.totalCosts) }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="Lợi nhuận ước tính">
          <span class="text-blue-600 font-semibold text-lg">
            {{ formatCurrency(summary.estimatedProfit) }}
          </span>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import {
  Money,
  ShoppingCart,
  TrendCharts,
  Document,
} from "@element-plus/icons-vue";
import VChart from "vue-echarts";
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

// Date range - default to last 30 days
const dateRange = ref<[string, string]>([
  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0] as string,
  new Date().toISOString().split("T")[0] as string,
]);

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

// Chart options
const revenueChartOptions = computed(() => {
  if (revenueByDay.value.length === 0) return null;

  return {
    tooltip: {
      trigger: "axis",
      formatter: (params: any) => {
        const item = params[0];
        return `${item.name}<br/>Doanh thu: ${formatCurrency(item.value)}`;
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
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
    },
    yAxis: {
      type: "value",
      axisLabel: {
        formatter: (value: number) => `${(value / 1000000).toFixed(0)}M`,
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
          color: "#1890ff",
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(24, 144, 255, 0.3)" },
              { offset: 1, color: "rgba(24, 144, 255, 0.05)" },
            ],
          },
        },
      },
    ],
  };
});

const serviceTypeChartOptions = computed(() => {
  if (revenueByServiceType.value.length === 0) return null;

  const typeNames: Record<string, string> = {
    SERVICE: "Dịch vụ nha khoa",
    MEDICINE: "Thuốc",
  };

  return {
    tooltip: {
      trigger: "item",
      formatter: (params: any) => {
        return `${params.name}<br/>Doanh thu: ${formatCurrency(
          params.value,
        )}<br/>Tỷ lệ: ${params.percent}%`;
      },
    },
    legend: {
      bottom: "5%",
      left: "center",
    },
    series: [
      {
        name: "Doanh thu",
        type: "pie",
        radius: ["40%", "70%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: "#fff",
          borderWidth: 2,
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
        },
        data: revenueByServiceType.value.map((item) => ({
          name: typeNames[item.category] || item.category,
          value: item.amount,
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
      formatter: (params: any) => {
        const item = params[0];
        return `${item.name}<br/>Chi phí: ${formatCurrency(item.value)}`;
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
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
    },
    yAxis: {
      type: "value",
      axisLabel: {
        formatter: (value: number) => `${(value / 1000000).toFixed(0)}M`,
      },
    },
    series: [
      {
        name: "Chi phí nhập",
        type: "bar",
        data: importCostByDay.value.map((item) => item.amount),
        itemStyle: {
          color: "#ff7875",
          borderRadius: [4, 4, 0, 0],
        },
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
      formatter: (params: any) => {
        const item = params[0];
        return `${item.name}<br/>Số lượng: ${item.value}`;
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "value",
    },
    yAxis: {
      type: "category",
      data: topMedicines.value.map((item) => item.category).reverse(),
    },
    series: [
      {
        name: "Số lượng",
        type: "bar",
        data: topMedicines.value.map((item) => item.amount).reverse(),
        itemStyle: {
          color: "#52c41a",
          borderRadius: [0, 4, 4, 0],
        },
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
.dashboard-container {
  padding: 20px;

  .filter-card {
    margin-bottom: 20px;
  }

  .stat-card {
    transition: all 0.3s;
    cursor: pointer;

    &:hover {
      transform: translateY(-4px);
    }

    .stat-content {
      display: flex;
      align-items: center;
      gap: 16px;

      .stat-icon {
        font-size: 48px;
        opacity: 0.8;
      }

      .stat-info {
        flex: 1;

        .stat-label {
          font-size: 14px;
          color: #8c8c8c;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 600;
        }
      }
    }

    &.revenue-card {
      .stat-icon {
        color: #1890ff;
      }
      .stat-value {
        color: #1890ff;
      }
    }

    &.cost-card {
      .stat-icon {
        color: #ff7875;
      }
      .stat-value {
        color: #ff7875;
      }
    }

    &.profit-card {
      .stat-icon {
        color: #52c41a;
      }
      .stat-value {
        color: #52c41a;
      }
    }

    &.unpaid-card {
      .stat-icon {
        color: #faad14;
      }
      .stat-value {
        color: #faad14;
      }
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
}

.mb-4 {
  margin-bottom: 16px;
}

.text-right {
  text-align: right;
}

.text-xl {
  font-size: 1.25rem;
}

.font-semibold {
  font-weight: 600;
}

.text-green-600 {
  color: #52c41a;
}

.text-red-600 {
  color: #ff4d4f;
}

.text-blue-600 {
  color: #1890ff;
}

.text-lg {
  font-size: 1.125rem;
}
</style>
