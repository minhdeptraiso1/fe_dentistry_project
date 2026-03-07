<template>
  <el-dialog
    v-model="visible"
    width="95%"
    :show-close="false"
    class="batch-history-dialog"
  >
    <template #header>
      <div class="dialog-header">
        <div class="header-content">
          <div class="header-icon">
            <component :is="HistoryIcon" />
          </div>
          <div class="header-text">
            <h3 class="dialog-title">Lịch sử lô thuốc</h3>
            <p class="medicine-name">{{ medicine?.name }}</p>
          </div>
        </div>
      </div>
    </template>

    <!-- Summary Cards -->
    <div class="summary-cards">
      <div class="summary-card">
        <div class="card-icon card-icon-blue">
          <component :is="BoxIcon" />
        </div>
        <div class="card-content">
          <p class="card-label">Tổng số lô</p>
          <p class="card-value">{{ pagination.total }}</p>
        </div>
      </div>

      <div class="summary-card">
        <div class="card-icon card-icon-green">
          <component :is="CheckIcon" />
        </div>
        <div class="card-content">
          <p class="card-label">Còn hạn</p>
          <p class="card-value">{{ validBatchesCount }}</p>
        </div>
      </div>

      <div class="summary-card">
        <div class="card-icon card-icon-orange">
          <component :is="AlertIcon" />
        </div>
        <div class="card-content">
          <p class="card-label">Sắp hết hạn</p>
          <p class="card-value">{{ expiringSoonCount }}</p>
        </div>
      </div>

      <div class="summary-card">
        <div class="card-icon card-icon-red">
          <component :is="XIcon" />
        </div>
        <div class="card-content">
          <p class="card-label">Đã hết hạn</p>
          <p class="card-value">{{ expiredCount }}</p>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="table-container">
      <el-table v-loading="loading" :data="batches" stripe class="modern-table">
        <el-table-column type="index" label="STT" width="70" align="center" />

        <el-table-column prop="batchNo" label="Số lô" width="140">
          <template #default="{ row }">
            <div class="batch-no">
              <span>{{ row.batchNo || "N/A" }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Ngày nhập" width="140">
          <template #default="{ row }">
            <div class="date-cell">
              <span>{{ formatDate(row.importDate) }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Ngày hết hạn" width="180">
          <template #default="{ row }">
            <div v-if="row.expiryDate" class="expiry-cell">
              <el-tag
                :type="getExpiryTagType(row.expiryDate)"
                effect="light"
                size="default"
              >
                <span>{{ formatDate(row.expiryDate) }}</span>
              </el-tag>
            </div>
            <span v-else class="na-text">N/A</span>
          </template>
        </el-table-column>

        <el-table-column label="Giá nhập" width="150" align="right">
          <template #default="{ row }">
            <div class="price-cell">
              {{ formatCurrency(row.importPrice) }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Số lượng nhập" width="130" align="center">
          <template #default="{ row }">
            <div class="quantity-cell">
              <el-tag type="info" effect="plain" size="default">
                {{ row.quantityIn }}
                <span class="unit">{{ medicine?.unit || "đơn vị" }}</span>
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Trạng thái" width="140" align="center">
          <template #default="{ row }">
            <el-tag
              v-if="row.expiryDate"
              :type="getExpiryTagType(row.expiryDate)"
              effect="dark"
              size="default"
            >
              {{ getExpiryStatus(row.expiryDate) }}
            </el-tag>
            <el-tag v-else type="info" effect="plain" size="default">
              Không rõ
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadBatches"
          @current-change="loadBatches"
        />
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <button @click="handleClose" class="footer-button">
          <component :is="CheckIcon" />
          <span>Đóng</span>
        </button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, h } from "vue";
import { ElMessage } from "element-plus";
import { medicineApi } from "@/api/medicine";
import type { Medicine, MedicineBatch } from "@/types/medicine";

// Custom Icons
const HistoryIcon = () =>
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
      h("path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }),
      h("path", { d: "M3 3v5h5" }),
      h("path", { d: "M12 7v5l4 2" }),
    ],
  );

const CloseIcon = () =>
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
      h("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
      h("line", { x1: "6", y1: "6", x2: "18", y2: "18" }),
    ],
  );

const BoxIcon = () =>
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
      h("path", {
        d: "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z",
      }),
      h("path", { d: "m3.3 7 8.7 5 8.7-5" }),
      h("path", { d: "M12 22V12" }),
    ],
  );

const CheckIcon = () =>
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
    [h("polyline", { points: "20 6 9 17 4 12" })],
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
    },
    [
      h("path", {
        d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z",
      }),
      h("path", { d: "M12 9v4" }),
      h("path", { d: "M12 17h.01" }),
    ],
  );

const XIcon = () =>
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
      h("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
      h("line", { x1: "6", y1: "6", x2: "18", y2: "18" }),
    ],
  );

const TagIcon = () =>
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
      h("path", {
        d: "M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z",
      }),
      h("path", { d: "M7 7h.01" }),
    ],
  );

const CalendarIcon = () =>
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
      h("rect", {
        width: "18",
        height: "18",
        x: "3",
        y: "4",
        rx: "2",
        ry: "2",
      }),
      h("line", { x1: "16", x2: "16", y1: "2", y2: "6" }),
      h("line", { x1: "8", x2: "8", y1: "2", y2: "6" }),
      h("line", { x1: "3", x2: "21", y1: "10", y2: "10" }),
    ],
  );

interface Props {
  modelValue: boolean;
  medicine?: Medicine;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const loading = ref(false);
const batches = ref<MedicineBatch[]>([]);

const pagination = reactive({
  page: 1,
  size: 20,
  total: 0,
});

const loadBatches = async () => {
  if (!props.medicine) return;

  try {
    loading.value = true;
    const response = await medicineApi.batchHistory(props.medicine.id, {
      page: pagination.page - 1, // Backend uses 0-based index
      size: pagination.size,
    });
    batches.value = response.content || [];
    pagination.total = response.totalElements || 0;
  } catch (error) {
    console.error("Failed to load batches:", error);
    ElMessage.error("Không thể tải lịch sử lô");
  } finally {
    loading.value = false;
  }
};

const handleClose = () => {
  visible.value = false;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("vi-VN");
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

const isExpired = (expiryDate: string) => {
  return new Date(expiryDate) < new Date();
};

const isExpiringSoon = (expiryDate: string) => {
  const diff = new Date(expiryDate).getTime() - new Date().getTime();
  const days = diff / (1000 * 60 * 60 * 24);
  return days <= 30 && days > 0;
};

const getExpiryClass = (expiryDate: string) => {
  if (isExpired(expiryDate)) return "text-red-600 font-semibold";
  if (isExpiringSoon(expiryDate)) return "text-orange-600 font-semibold";
  return "";
};

const getExpiryTagType = (expiryDate: string): any => {
  if (isExpired(expiryDate)) return "danger";
  if (isExpiringSoon(expiryDate)) return "warning";
  return "success";
};

const getExpiryStatus = (expiryDate: string) => {
  if (isExpired(expiryDate)) return "Đã hết hạn";
  if (isExpiringSoon(expiryDate)) return "Sắp hết hạn";
  return "Còn hạn";
};

const getExpiryIcon = (expiryDate: string) => {
  if (isExpired(expiryDate)) return XIcon;
  if (isExpiringSoon(expiryDate)) return AlertIcon;
  return CheckIcon;
};

// Computed counts for summary cards
const validBatchesCount = computed(() => {
  return batches.value.filter(
    (batch) =>
      batch.expiryDate &&
      !isExpired(batch.expiryDate) &&
      !isExpiringSoon(batch.expiryDate),
  ).length;
});

const expiringSoonCount = computed(() => {
  return batches.value.filter(
    (batch) => batch.expiryDate && isExpiringSoon(batch.expiryDate),
  ).length;
});

const expiredCount = computed(() => {
  return batches.value.filter(
    (batch) => batch.expiryDate && isExpired(batch.expiryDate),
  ).length;
});

// Watch for medicine changes and dialog visibility
watch(
  () => [props.modelValue, props.medicine],
  ([isVisible, medicine]) => {
    if (isVisible && medicine) {
      loadBatches();
    }
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
.batch-history-dialog {
  :deep(.el-dialog) {
    border-radius: 16px;
    overflow: hidden;
  }

  :deep(.el-dialog__header) {
    padding: 0;
    margin: 0;
  }

  :deep(.el-dialog__body) {
    padding: 24px;
    background: #f9fafb;
  }

  :deep(.el-dialog__footer) {
    padding: 0;
    border-top: 1px solid #e5e7eb;
  }
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  color: white;

  .header-content {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .header-icon {
    width: 48px;
    height: 48px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
      width: 24px;
      height: 24px;
      stroke: white;
    }
  }

  .header-text {
    .dialog-title {
      font-size: 20px;
      font-weight: 700;
      margin: 0 0 4px 0;
      color: white;
    }

    .medicine-name {
      font-size: 14px;
      margin: 0;
      color: rgba(255, 255, 255, 0.9);
      font-weight: 500;
    }
  }

  .close-button {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: none;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;

    svg {
      width: 20px;
      height: 20px;
    }

    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.summary-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  .card-icon {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
      width: 24px;
      height: 24px;
    }

    &.card-icon-blue {
      background: #eff6ff;
      color: #2563eb;
    }

    &.card-icon-green {
      background: #f0fdf4;
      color: #16a34a;
    }

    &.card-icon-orange {
      background: #fffbeb;
      color: #ea580c;
    }

    &.card-icon-red {
      background: #fef2f2;
      color: #ef4444;
    }
  }

  .card-content {
    flex: 1;

    .card-label {
      font-size: 13px;
      color: #6b7280;
      margin: 0 0 4px 0;
      font-weight: 500;
    }

    .card-value {
      font-size: 24px;
      font-weight: 700;
      color: #111827;
      margin: 0;
    }
  }
}

.table-container {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  .modern-table {
    :deep(.el-table__header) {
      th {
        background: #f9fafb;
        color: #374151;
        font-weight: 600;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 2px solid #e5e7eb;
      }
    }

    :deep(.el-table__row) {
      transition: all 0.2s ease;

      &:hover {
        background: #f0fdfa !important;
      }

      td {
        border-bottom: 1px solid #f3f4f6;
      }
    }
  }

  .batch-no {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
    color: #111827;

    .batch-icon {
      width: 16px;
      height: 16px;
      color: #14b8a6;
    }
  }

  .date-cell {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #6b7280;

    .date-icon {
      width: 14px;
      height: 14px;
      color: #9ca3af;
    }
  }

  .expiry-cell {
    :deep(.el-tag) {
      font-weight: 500;
      padding: 6px 12px;
      border-radius: 6px;

      .tag-icon {
        width: 14px;
        height: 14px;
        margin-right: 4px;
        vertical-align: middle;
      }
    }
  }

  .price-cell {
    font-weight: 600;
    color: #111827;
    font-size: 14px;
  }

  .quantity-cell {
    :deep(.el-tag) {
      font-weight: 500;
      padding: 6px 12px;
      border-radius: 6px;

      .unit {
        font-size: 11px;
        opacity: 0.8;
      }
    }
  }

  .na-text {
    color: #9ca3af;
    font-style: italic;
  }

  .pagination-container {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #f3f4f6;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  padding: 16px 24px;
  background: white;

  .footer-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 24px;
    background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;

    svg {
      width: 20px;
      height: 20px;
    }

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);
    }
  }
}
</style>
