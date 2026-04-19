<template>
  <el-dialog
    v-model="visible"
    :fullscreen="true"
    :show-close="false"
    destroy-on-close
    class="ai-analysis-dialog"
  >
    <div class="dialog-content">
      <div class="dialog-header-bar">
        <button
          type="button"
          class="header-close-btn"
          aria-label="Đóng"
          @click="visible = false"
        >
          ×
        </button>

        <div class="header-main">
          <div>
            <h2 class="dialog-title">Thống kê tháng bằng AI</h2>
            <p class="dialog-subtitle">
              Xem dữ liệu tổng quan trước, sau đó chạy phân tích AI chi tiết cho
              tháng đã chọn.
            </p>
          </div>

          <div class="dialog-toolbar">
            <div class="month-field">
              <label>Chọn tháng thống kê</label>
              <el-date-picker
                v-model="selectedMonth"
                type="month"
                placeholder="Chọn tháng"
                format="MM/YYYY"
                value-format="YYYY-MM"
                class="month-picker"
              />
            </div>

            <div class="actions-group">
              <el-button
                class="btn-secondary"
                size="large"
                :loading="contextLoading"
                @click="loadContext"
              >
                Tải dữ liệu tháng
              </el-button>

              <el-button
                type="primary"
                class="btn-primary"
                size="large"
                :loading="insightLoading"
                @click="analyzeInsight"
              >
                Phân tích bằng AI
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <div class="dialog-body" v-loading="contextLoading">
        <div class="context-card" v-if="context">
          <div class="section-header">
            <h3>Dữ liệu tổng quan: {{ context.periodLabel }}</h3>
          </div>

          <div class="summary-grid">
            <div class="summary-box">
              <div class="summary-title">Tháng hiện tại</div>
              <div class="summary-row">
                <span>Doanh thu thuần</span>
                <b>{{
                  formatCurrency(context.currentMonthSummary?.netRevenue)
                }}</b>
              </div>
              <div class="summary-row">
                <span>Lợi nhuận ước tính</span>
                <b>{{
                  formatCurrency(context.currentMonthSummary?.estimatedProfit)
                }}</b>
              </div>
            </div>

            <div class="summary-box">
              <div class="summary-title">Tháng trước</div>
              <div class="summary-row">
                <span>Doanh thu thuần</span>
                <b>{{
                  formatCurrency(context.previousMonthSummary?.netRevenue)
                }}</b>
              </div>
              <div class="summary-row">
                <span>Lợi nhuận ước tính</span>
                <b>{{
                  formatCurrency(context.previousMonthSummary?.estimatedProfit)
                }}</b>
              </div>
            </div>

            <div class="summary-box">
              <div class="summary-title">Cùng kỳ năm trước</div>
              <div class="summary-row">
                <span>Doanh thu thuần</span>
                <b>{{
                  formatCurrency(context.sameMonthLastYearSummary?.netRevenue)
                }}</b>
              </div>
              <div class="summary-row">
                <span>Lợi nhuận ước tính</span>
                <b>{{
                  formatCurrency(
                    context.sameMonthLastYearSummary?.estimatedProfit,
                  )
                }}</b>
              </div>
            </div>
          </div>

          <div class="growth-grid" v-if="growthMetricEntries.length">
            <div
              class="growth-item"
              v-for="item in growthMetricEntries"
              :key="item.key"
            >
              <div class="growth-key">{{ item.label }}</div>
              <div class="growth-value">{{ item.value }}</div>
            </div>
          </div>
        </div>

        <div class="insight-card" v-if="insightView" v-loading="insightLoading">
          <div class="section-header">
            <h3>Phân tích AI: {{ insightView.periodLabel }}</h3>
          </div>

          <p class="executive-summary">{{ insightView.executiveSummary }}</p>

          <div class="insight-columns">
            <div class="insight-col-card">
              <h4>Điểm nổi bật</h4>
              <ul>
                <li
                  v-for="(row, idx) in insightView.highlights"
                  :key="`h-${idx}`"
                >
                  {{ row }}
                </li>
              </ul>
            </div>

            <div class="insight-col-card">
              <h4>Rủi ro</h4>
              <ul>
                <li v-for="(row, idx) in insightView.risks" :key="`r-${idx}`">
                  {{ row }}
                </li>
              </ul>
            </div>

            <div class="insight-col-card">
              <h4>Khuyến nghị</h4>
              <ul>
                <li
                  v-for="(row, idx) in insightView.recommendations"
                  :key="`rec-${idx}`"
                >
                  {{ row }}
                </li>
              </ul>
            </div>
          </div>

          <div
            class="insight-col-card data-quality-card"
            v-if="insightView.dataQualityNotes.length"
          >
            <h4>Lưu ý chất lượng dữ liệu</h4>
            <ul>
              <li
                v-for="(row, idx) in insightView.dataQualityNotes"
                :key="`dq-${idx}`"
              >
                {{ row }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { dashboardApi } from "@/api/dashboard";
import type {
  DashboardAiContextResponse,
  DashboardAiInsightResponse,
} from "@/types/dashboard";

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit("update:modelValue", value),
});

const selectedMonth = ref(new Date().toISOString().slice(0, 7));
const contextLoading = ref(false);
const insightLoading = ref(false);
const context = ref<DashboardAiContextResponse | null>(null);
const insight = ref<DashboardAiInsightResponse | null>(null);

const parseYearMonth = () => {
  const [yearText, monthText] = selectedMonth.value.split("-");
  return {
    year: Number(yearText),
    month: Number(monthText),
  };
};

const formatCurrency = (value?: number) => {
  const amount = typeof value === "number" ? value : 0;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

const formatMetricLabel = (key: string) =>
  (
    ({
      netRevenueVsPrevMonthPct: "Tăng trưởng doanh thu so với tháng trước (%)",
      estimatedProfitVsPrevMonthPct:
        "Tăng trưởng lợi nhuận so với tháng trước (%)",
      medicineImportCostVsPrevMonthPct:
        "Tăng trưởng chi phí nhập thuốc so với tháng trước (%)",
      netRevenueVsSameMonthLastYearPct:
        "Tăng trưởng doanh thu so với cùng kỳ năm trước (%)",
      estimatedProfitVsSameMonthLastYearPct:
        "Tăng trưởng lợi nhuận so với cùng kỳ năm trước (%)",
      medicineImportCostVsSameMonthLastYearPct:
        "Tăng trưởng chi phí nhập thuốc so với cùng kỳ năm trước (%)",
    }) as Record<string, string>
  )[key] ||
  key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/^./, (ch) => ch.toUpperCase());

const formatMetricValue = (value: unknown, key?: string) => {
  if (typeof value === "number") {
    const base = value.toLocaleString("vi-VN");
    return key?.endsWith("Pct") ? `${base}%` : base;
  }
  if (typeof value === "boolean") return value ? "Có" : "Không";
  if (typeof value === "string") {
    if (key?.endsWith("Pct") && !value.trim().endsWith("%")) {
      return `${value}%`;
    }
    return value;
  }
  if (value == null) return "-";
  return JSON.stringify(value);
};

const growthMetricEntries = computed(() => {
  const metrics = context.value?.growthMetrics;
  if (!metrics) return [];

  return Object.entries(metrics).map(([key, value]) => ({
    key,
    label: formatMetricLabel(key),
    value: formatMetricValue(value, key),
  }));
});

const normalizeAiText = (text?: string) =>
  (text || "")
    .replace(/^\s*\*\*(\d+)\*\*\s*/gm, "$1. ")
    .replace(/^\s*(\d+)\)\s*/gm, "$1. ")
    .replace(/\*\*/g, "")
    .trim();

const insightView = computed(() => {
  if (!insight.value) return null;

  return {
    ...insight.value,
    executiveSummary: normalizeAiText(insight.value.executiveSummary),
    highlights: (insight.value.highlights || [])
      .map((item) => normalizeAiText(item))
      .filter(Boolean),
    risks: (insight.value.risks || [])
      .map((item) => normalizeAiText(item))
      .filter(Boolean),
    recommendations: (insight.value.recommendations || [])
      .map((item) => normalizeAiText(item))
      .filter(Boolean),
    dataQualityNotes: (insight.value.dataQualityNotes || [])
      .map((item) => normalizeAiText(item))
      .filter(Boolean),
  };
});

const loadContext = async () => {
  const { year, month } = parseYearMonth();
  if (!year || !month) {
    ElMessage.warning("Tháng không hợp lệ");
    return;
  }

  try {
    contextLoading.value = true;
    context.value = await dashboardApi.aiContext({ year, month });
    insight.value = null;
  } catch (error: any) {
    ElMessage.error(error?.message || "Không thể tải dữ liệu ngữ cảnh AI");
  } finally {
    contextLoading.value = false;
  }
};

const analyzeInsight = async () => {
  const { year, month } = parseYearMonth();
  if (!year || !month) {
    ElMessage.warning("Tháng không hợp lệ");
    return;
  }

  try {
    insightLoading.value = true;
    insight.value = await dashboardApi.aiInsight({ year, month }, 60000);
  } catch (error: any) {
    const msg = String(error?.message || "");
    if (msg.includes("timeout")) {
      ElMessage.error(
        "Hết thời gian chờ phản hồi AI. Vui lòng thử lại sau ít phút.",
      );
    } else {
      ElMessage.error(error?.message || "Không thể phân tích AI");
    }
  } finally {
    insightLoading.value = false;
  }
};

watch(
  () => visible.value,
  (isOpen) => {
    if (isOpen) {
      loadContext();
    }
  },
);

watch(
  () => selectedMonth.value,
  () => {
    if (visible.value) {
      loadContext();
    }
  },
);
</script>

<style scoped lang="scss">
.ai-analysis-dialog {
  :deep(.el-dialog) {
    margin: 0 !important;
    border-radius: 0;
    background: #eef2f7;
  }

  :deep(.el-dialog__body) {
    padding: 16px;
    max-height: 100vh;
    overflow: auto;
  }
}

.dialog-content {
  background: #eef2f7;
}

.dialog-header-bar {
  background: linear-gradient(135deg, #0f766e 0%, #0891b2 100%);
  border-radius: 18px;
  padding: 18px;
  margin-bottom: 16px;
  position: relative;
  box-shadow: 0 16px 30px rgba(15, 118, 110, 0.25);
}

.header-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
}

.header-close-btn {
  position: absolute;
  top: 10px;
  right: 12px;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
  color: #ffffff;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
}

.dialog-title {
  margin: 0;
  font-size: 34px;
  color: #ffffff;
  font-weight: 800;
}

.dialog-subtitle {
  margin: 6px 0 0;
  color: #d1fae5;
  font-size: 18px;
}

.dialog-toolbar {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.month-field {
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 14px;
    color: #e0f2fe;
    font-weight: 600;
  }
}

.month-picker {
  width: 240px;

  :deep(.el-input__wrapper) {
    border-radius: 10px;
    min-height: 40px;
  }

  :deep(.el-input__inner) {
    font-size: 15px;
  }
}

.actions-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-secondary,
.btn-primary {
  border-radius: 10px;
  font-weight: 700;
}

.btn-primary {
  border: none;
  background: linear-gradient(135deg, #0d9488 0%, #06b6d4 100%);
  box-shadow: 0 8px 18px rgba(13, 148, 136, 0.25);
}

.dialog-body {
  min-height: auto;
}

.context-card,
.insight-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #dbeafe;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
}

.context-card {
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  font-size: 30px;
  color: #0f172a;
  font-weight: 800;
}

.section-header p {
  margin: 8px 0 0;
  color: #0f766e;
  font-size: 16px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.summary-box {
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 14px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.06);
}

.summary-title {
  font-size: 20px;
  font-weight: 700;
  color: #0f766e;
  margin-bottom: 10px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 18px;
  color: #475569;
}

.growth-grid {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.growth-item {
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 12px;
  background: #ffffff;
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.05);
}

.growth-key {
  font-size: 15px;
  color: #64748b;
  margin-bottom: 4px;
}

.growth-value {
  font-size: 20px;
  color: #0f172a;
  font-weight: 700;
  word-break: break-word;
}

.executive-summary {
  margin: 14px 0;
  color: #334155;
  line-height: 1.7;
  font-size: 18px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 12px;
  padding: 14px;
}

.insight-columns {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.insight-col-card {
  border: 1px solid #bfdbfe;
  border-radius: 12px;
  background: #ffffff;
  padding: 12px;
  box-shadow: 0 8px 14px rgba(14, 116, 144, 0.08);
}

.data-quality-card {
  margin-top: 14px;
}

.insight-columns h4,
.data-quality-card h4 {
  margin: 0 0 10px;
  color: #0f766e;
  font-size: 22px;
}

.insight-columns ul,
.data-quality-card ul {
  margin: 0;
  padding-left: 20px;
  color: #334155;
}

.insight-columns li,
.data-quality-card li {
  margin-bottom: 8px;
  line-height: 1.55;
  font-size: 17px;
}

@media (max-width: 1200px) {
  .summary-grid,
  .growth-grid,
  .insight-columns {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .dialog-title {
    font-size: 24px;
  }

  .dialog-subtitle {
    font-size: 14px;
  }

  .section-header h3 {
    font-size: 22px;
  }

  .section-header p,
  .summary-row,
  .executive-summary,
  .insight-columns li,
  .data-quality-card li {
    font-size: 14px;
  }

  .month-picker {
    width: 100%;
  }

  .actions-group {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .summary-grid,
  .growth-grid,
  .insight-columns {
    grid-template-columns: 1fr;
  }
}
</style>
