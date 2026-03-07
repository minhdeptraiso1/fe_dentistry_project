<template>
  <div class="inventory-container">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Báo cáo tồn kho</h1>
        <p class="page-subtitle">Theo dõi tồn kho và cảnh báo hết hạn</p>
      </div>
      <button @click="loadData" class="refresh-button">
        <component :is="RefreshIcon" />
        <span>Làm mới</span>
      </button>
    </div>

    <!-- Expiry Warnings -->
    <el-card
      v-loading="loadingWarnings"
      class="modern-card mb-4"
      shadow="never"
    >
      <template #header>
        <div class="card-header-modern">
          <div class="header-left">
            <component :is="AlertIcon" class="header-icon warning" />
            <span class="header-title">Cảnh báo thuốc hết hạn</span>
          </div>
          <el-badge
            v-if="warnings.length > 0"
            :value="warnings.length"
            :max="99"
            type="danger"
            class="header-badge"
          />
        </div>
      </template>

      <el-empty
        v-if="warnings.length === 0"
        description="Không có thuốc hết hạn hoặc sắp hết hạn"
        :image-size="120"
      >
        <template #image>
          <component
            :is="CheckCircleIcon"
            style="width: 80px; height: 80px; color: #10b981"
          />
        </template>
      </el-empty>

      <div v-else class="table-container">
        <el-table :data="warnings" stripe class="modern-table">
          <el-table-column type="index" label="STT" width="60" align="center" />
          <el-table-column prop="medicineCode" label="Mã thuốc" width="120" />
          <el-table-column
            prop="medicineName"
            label="Tên thuốc"
            min-width="200"
          />
          <el-table-column prop="batchNo" label="Số lô" width="120" />
          <el-table-column label="Ngày hết hạn" width="150">
            <template #default="{ row }">
              {{ formatDate(row.expiryDate) }}
            </template>
          </el-table-column>
          <el-table-column label="SL còn" width="100" align="right">
            <template #default="{ row }">
              {{ row.quantityRemaining }}
            </template>
          </el-table-column>
          <el-table-column label="Trạng thái" width="130" align="center">
            <template #default="{ row }">
              <el-tag
                v-if="row.warningType === 'EXPIRED'"
                type="danger"
                effect="dark"
              >
                Đã hết hạn
              </el-tag>
              <el-tag v-else type="warning" effect="dark">Sắp hết hạn</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="Ngày còn lại" width="120" align="center">
            <template #default="{ row }">
              <span
                :class="{
                  'text-red-600 font-semibold':
                    daysUntilExpiry(row.expiryDate) <= 0,
                  'text-orange-600': daysUntilExpiry(row.expiryDate) > 0,
                }"
              >
                {{ daysUntilExpiry(row.expiryDate) }} ngày
              </span>
            </template>
          </el-table-column>
          <el-table-column
            label="Thao tác"
            width="100"
            align="center"
            fixed="right"
          >
            <template #default="{ row }">
              <el-button
                type="danger"
                size="small"
                :icon="TrashIcon"
                @click="handleDispose(row)"
                class="action-button dispose-button"
              >
                Xử lý
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- Stock Summary Table -->
    <el-card v-loading="loadingStock" class="modern-card" shadow="never">
      <template #header>
        <div class="card-header-modern">
          <div class="header-left">
            <component :is="ChartBarIcon" class="header-icon primary" />
            <span class="header-title">Tổng hợp tồn kho</span>
          </div>
          <el-space :size="16">
            <el-switch
              v-model="filters.activeOnly"
              active-text="Chỉ thuốc đang dùng"
              @change="loadStockSummary"
            />
            <el-select
              v-model="filters.lowStockThreshold"
              placeholder="Ngưỡng cảnh báo"
              style="width: 180px"
              @change="loadStockSummary"
            >
              <el-option label="Dưới 5" :value="5" />
              <el-option label="Dưới 10" :value="10" />
              <el-option label="Dưới 20" :value="20" />
              <el-option label="Dưới 50" :value="50" />
            </el-select>
          </el-space>
        </div>
      </template>

      <div class="table-container">
        <el-table :data="stockSummary" stripe class="modern-table">
          <el-table-column type="index" label="STT" width="60" align="center" />
          <el-table-column prop="medicineCode" label="Mã thuốc" width="120" />
          <el-table-column
            prop="medicineName"
            label="Tên thuốc"
            min-width="200"
          />
          <el-table-column label="Tồn kho" width="120" align="right">
            <template #default="{ row }">
              <span
                :class="{
                  'text-red-600 font-semibold': row.lowStock,
                  'text-green-600': !row.lowStock,
                }"
              >
                {{ row.totalRemaining }} {{ row.unit }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="Số lô" width="100" align="center">
            <template #default="{ row }">
              {{ row.totalBatches }}
            </template>
          </el-table-column>
          <el-table-column label="HSD gần nhất" width="130">
            <template #default="{ row }">
              <span v-if="row.nearestExpiryDate">
                {{ formatDate(row.nearestExpiryDate) }}
              </span>
              <span v-else class="text-gray-400">N/A</span>
            </template>
          </el-table-column>
          <el-table-column label="Cảnh báo" width="200" align="center">
            <template #default="{ row }">
              <el-space wrap :size="4">
                <el-tag
                  v-if="row.lowStock"
                  type="warning"
                  size="small"
                  effect="dark"
                >
                  Tồn kho thấp
                </el-tag>
                <el-tag
                  v-if="row.hasExpired"
                  type="danger"
                  size="small"
                  effect="dark"
                >
                  Có lô hết hạn ({{ row.expiredBatchesCount }})
                </el-tag>
                <el-tag
                  v-if="row.hasNearExpiry"
                  type="warning"
                  size="small"
                  effect="dark"
                >
                  Sắp hết hạn ({{ row.nearExpiryBatchesCount }})
                </el-tag>
                <el-tag
                  v-if="!row.lowStock && !row.hasExpired && !row.hasNearExpiry"
                  type="success"
                  size="small"
                  effect="dark"
                >
                  Tốt
                </el-tag>
              </el-space>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, h } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { inventoryApi } from "@/api/inventory";
import { medicineApi } from "@/api/medicine";
import type {
  MedicineStockSummary,
  BatchExpiryWarning,
} from "@/types/inventory";

// Custom Icons
const RefreshIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      style: "width: 18px; height: 18px;",
    },
    [
      h("path", {
        d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",
      }),
      h("path", { d: "M21 3v5h-5" }),
      h("path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" }),
      h("path", { d: "M3 21v-5h5" }),
    ],
  );

const AlertIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      style: "width: 20px; height: 20px;",
    },
    [
      h("path", {
        d: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z",
      }),
      h("line", { x1: "12", y1: "9", x2: "12", y2: "13" }),
      h("line", { x1: "12", y1: "17", x2: "12.01", y2: "17" }),
    ],
  );

const ChartBarIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      style: "width: 20px; height: 20px;",
    },
    [
      h("line", { x1: "12", y1: "20", x2: "12", y2: "10" }),
      h("line", { x1: "18", y1: "20", x2: "18", y2: "4" }),
      h("line", { x1: "6", y1: "20", x2: "6", y2: "16" }),
    ],
  );

const CheckCircleIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    [
      h("path", { d: "M22 11.08V12a10 10 0 1 1-5.93-9.14" }),
      h("polyline", { points: "22 4 12 14.01 9 11.01" }),
    ],
  );

const TrashIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      style: "width: 16px; height: 16px;",
    },
    [
      h("polyline", { points: "3 6 5 6 21 6" }),
      h("path", {
        d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
      }),
    ],
  );

const loadingStock = ref(false);
const loadingWarnings = ref(false);

const filters = reactive({
  nearDays: 30,
  lowStockThreshold: 10,
  activeOnly: false,
});

const stockSummary = ref<MedicineStockSummary[]>([]);
const warnings = ref<BatchExpiryWarning[]>([]);

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("vi-VN");
};

const daysUntilExpiry = (expiryDate: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diff = expiry.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const loadStockSummary = async () => {
  loadingStock.value = true;
  try {
    const res = await inventoryApi.stockSummary({
      nearDays: filters.nearDays,
      lowStockThreshold: filters.lowStockThreshold,
      activeOnly: filters.activeOnly,
    });
    stockSummary.value = res;
  } catch (error: any) {
    ElMessage.error(error.message || "Không thể tải báo cáo tồn kho");
  } finally {
    loadingStock.value = false;
  }
};

const loadExpiryWarnings = async () => {
  loadingWarnings.value = true;
  try {
    const res = await inventoryApi.expiryWarnings({
      nearDays: filters.nearDays,
    });
    warnings.value = res;
  } catch (error: any) {
    ElMessage.error(error.message || "Không thể tải cảnh báo hết hạn");
  } finally {
    loadingWarnings.value = false;
  }
};

const loadData = () => {
  loadStockSummary();
  loadExpiryWarnings();
};

const handleDispose = async (batch: BatchExpiryWarning) => {
  try {
    const result = await ElMessageBox.prompt(
      `Xác nhận xử lý lô thuốc "${batch.medicineName}" (${batch.batchNo})?\nSố lượng: ${batch.quantityRemaining} ${batch.warningType === "EXPIRED" ? "(Đã hết hạn)" : "(Sắp hết hạn)"}`,
      "Xử lý lô thuốc",
      {
        confirmButtonText: "Xác nhận xử lý",
        cancelButtonText: "Hủy",
        inputPlaceholder: "Nhập lý do xử lý (tùy chọn)",
        inputType: "textarea",
        type: "warning",
      },
    );

    loadingWarnings.value = true;
    const reason = typeof result === "string" ? result : (result as any).value;
    await medicineApi.disposeBatch(batch.batchId, reason || undefined);

    ElMessage.success("Đã xử lý lô thuốc thành công");
    await loadExpiryWarnings();
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(error.message || "Không thể xử lý lô thuốc");
    }
  } finally {
    loadingWarnings.value = false;
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped lang="scss">
.inventory-container {
  padding: 24px;
  max-width: 1600px;
  margin: 0 auto;
}

// Page Header
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 4px 0;
}

.page-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.refresh-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);

  svg {
    width: 20px;
    height: 20px;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(20, 184, 166, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
}

// Modern Card
.modern-card {
  border-radius: 12px;
  border: 1px solid #e5e7eb;

  :deep(.el-card__header) {
    padding: 20px 24px;
    background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
    border-bottom: none;
  }

  :deep(.el-card__body) {
    padding: 0;
  }
}

.card-header-modern {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .header-icon {
    flex-shrink: 0;

    &.warning {
      color: #fbbf24;
    }

    &.primary {
      color: #ffffff;
    }
  }

  .header-title {
    font-size: 16px;
    font-weight: 600;
    color: #ffffff;
  }

  // Switch styling in header
  :deep(.el-switch) {
    .el-switch__label {
      color: #ffffff !important;
      font-weight: 500;
    }
  }

  // Select styling in header
  :deep(.el-select) {
    .el-input__wrapper {
      background-color: rgba(255, 255, 255, 0.95);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .el-input__inner {
      color: #111827;
      font-weight: 500;
    }
  }

  .header-badge {
    :deep(.el-badge__content) {
      background-color: #ef4444;
      border: 2px solid white;
      font-weight: 600;
    }
  }
}

// Table Container
.table-container {
  padding: 24px;
}

.modern-table {
  border-radius: 8px;
  overflow: hidden;

  :deep(.el-table__header) {
    th {
      background: #f9fafb;
      color: #374151;
      font-weight: 600;
      font-size: 13px;
      padding: 12px 0;
    }
  }

  :deep(.el-table__body) {
    td {
      padding: 12px 0;
      font-size: 14px;
    }
  }

  :deep(.el-table__row) {
    &:hover {
      background: #f9fafb;
    }
  }

  :deep(.el-button.action-button) {
    font-weight: 500;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 13px;
    border: none;
    margin: 0 4px;

    &.dispose-button {
      background: #fef2f2;
      color: #ef4444;

      &:hover {
        background: #fee2e2;
        transform: translateY(-1px);
      }
    }
  }
}

// Empty State
:deep(.el-empty) {
  padding: 60px 20px;

  .el-empty__description {
    color: #6b7280;
    font-size: 14px;
  }
}

// Spacing utilities
.mb-4 {
  margin-bottom: 24px;
}
</style>
