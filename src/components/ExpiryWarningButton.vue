<template>
  <el-badge
    :value="warningCount"
    :max="99"
    :hidden="warningCount === 0"
    type="danger"
    class="warning-badge"
  >
    <el-popover
      placement="bottom"
      :width="400"
      trigger="click"
      @show="loadWarnings"
    >
      <template #reference>
        <button
          class="notification-button"
          :class="{ 'has-warning': warningCount > 0 }"
        >
          <component :is="BellIcon" />
        </button>
      </template>

      <div class="warning-popover">
        <div class="warning-header">
          <h4>Cảnh báo thuốc hết hạn</h4>
          <el-button
            text
            type="primary"
            size="small"
            @click="$router.push('/inventory-report')"
          >
            Xem tất cả
          </el-button>
        </div>

        <el-divider style="margin: 12px 0" />

        <div v-loading="loading" class="warning-list">
          <el-empty
            v-if="warnings.length === 0"
            :image-size="80"
            description="Không có cảnh báo"
          />

          <div
            v-for="warning in warnings.slice(0, 5)"
            :key="warning.batchId"
            class="warning-item"
          >
            <div class="warning-info">
              <div class="medicine-name">{{ warning.medicineName }}</div>
              <div class="warning-detail">
                <el-tag
                  :type="
                    warning.warningType === 'EXPIRED' ? 'danger' : 'warning'
                  "
                  size="small"
                >
                  {{
                    warning.warningType === "EXPIRED"
                      ? "Hết hạn"
                      : "Sắp hết hạn"
                  }}
                </el-tag>
                <span class="batch-no">Lô: {{ warning.batchNo }}</span>
                <span class="expiry-date"
                  >HSD: {{ formatDate(warning.expiryDate) }}</span
                >
              </div>
            </div>
            <div class="quantity">
              <span class="quantity-value">{{
                warning.quantityRemaining
              }}</span>
            </div>
          </div>

          <div v-if="warnings.length > 5" class="warning-more">
            <el-button
              text
              type="primary"
              @click="$router.push('/inventory-report')"
            >
              Xem thêm {{ warnings.length - 5 }} cảnh báo khác
            </el-button>
          </div>
        </div>
      </div>
    </el-popover>
  </el-badge>
</template>

<script setup lang="ts">
import { ref, computed, h } from "vue";
import { inventoryApi } from "@/api/inventory";
import type { BatchExpiryWarning } from "@/types/inventory";

// Custom Bell Icon
const BellIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "stroke-width": "2",
      stroke: "currentColor",
      class: "w-5 h-5",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
      }),
    ],
  );

const loading = ref(false);
const warnings = ref<BatchExpiryWarning[]>([]);

const warningCount = computed(() => warnings.value.length);

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const loadWarnings = async () => {
  loading.value = true;
  try {
    const res = await inventoryApi.expiryWarnings({ nearDays: 30 });
    warnings.value = res;
  } catch (error) {
    console.error("Failed to load expiry warnings:", error);
  } finally {
    loading.value = false;
  }
};

// Auto load on mount
loadWarnings();

// Refresh every 5 minutes
setInterval(loadWarnings, 5 * 60 * 1000);
</script>

<style scoped lang="scss">
.warning-badge {
  :deep(.el-badge__content) {
    font-weight: 600;
    font-size: 11px;
    height: 18px;
    line-height: 18px;
    padding: 0 5px;
    border: 2px solid white;
  }
}

.notification-button {
  position: relative;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  &:hover {
    background: linear-gradient(135deg, #e8e8e8 0%, #d9d9d9 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    color: #14b8a6;
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  &.has-warning {
    background: linear-gradient(135deg, #fef3e8 0%, #fee8d0 100%);
    color: #f59e0b;
    animation: pulse 2s infinite;

    &:hover {
      background: linear-gradient(135deg, #fee8d0 0%, #fdd9b5 100%);
      color: #ea580c;
    }
  }

  svg {
    width: 22px;
    height: 22px;
  }
}

@keyframes pulse {
  0%,
  100% {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  50% {
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
  }
}

.warning-popover {
  max-height: 500px;
  overflow-y: auto;

  .warning-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    h4 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }
  }

  .warning-list {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .warning-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px;
      background: #fafafa;
      border-radius: 8px;
      border-left: 3px solid #faad14;
      transition: all 0.3s;

      &:hover {
        background: #f0f0f0;
        transform: translateX(4px);
      }

      .warning-info {
        flex: 1;

        .medicine-name {
          font-weight: 500;
          color: #1f1f1f;
          margin-bottom: 6px;
        }

        .warning-detail {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #8c8c8c;

          .batch-no,
          .expiry-date {
            font-size: 11px;
          }
        }
      }

      .quantity {
        margin-left: 12px;

        .quantity-value {
          font-size: 18px;
          font-weight: 600;
          color: #ff4d4f;
        }
      }
    }

    .warning-more {
      text-align: center;
      padding-top: 8px;
    }
  }
}
</style>
