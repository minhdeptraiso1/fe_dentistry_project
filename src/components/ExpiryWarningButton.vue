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
        <el-button circle>
          <el-icon :size="20">
            <WarningFilled />
          </el-icon>
        </el-button>
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
import { ref, computed } from "vue";
import { WarningFilled } from "@element-plus/icons-vue";
import { inventoryApi } from "@/api/inventory";
import type { BatchExpiryWarning } from "@/types/inventory";

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
