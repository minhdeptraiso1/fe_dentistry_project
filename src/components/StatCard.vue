<template>
  <el-card class="stat-card" :body-style="{ padding: '20px' }">
    <div class="stat-content">
      <div class="stat-info">
        <div class="stat-title">{{ title }}</div>
        <div class="stat-value">{{ value }}</div>
        <div
          v-if="trend"
          class="stat-trend"
          :class="{ positive: trend.startsWith('+') }"
        >
          <el-icon><TrendCharts /></el-icon>
          {{ trend }}
        </div>
      </div>
      <div class="stat-icon" :style="{ background: color }">
        <el-icon :size="32"><component :is="icon" /></el-icon>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { TrendCharts } from "@element-plus/icons-vue";

defineProps<{
  title: string;
  value: string | number;
  icon: string;
  color: string;
  trend?: string;
}>();
</script>

<style scoped lang="scss">
.stat-card {
  height: 100%;
  margin-bottom: 24px;

  .stat-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;

    .stat-info {
      flex: 1;

      .stat-title {
        font-size: 14px;
        color: #8c8c8c;
        margin-bottom: 8px;
      }

      .stat-value {
        font-size: 28px;
        font-weight: 700;
        color: #1f1f1f;
        margin-bottom: 8px;
      }

      .stat-trend {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 13px;
        color: #f5222d;

        &.positive {
          color: #52c41a;
        }
      }
    }

    .stat-icon {
      width: 64px;
      height: 64px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      opacity: 0.9;
    }
  }
}
</style>
