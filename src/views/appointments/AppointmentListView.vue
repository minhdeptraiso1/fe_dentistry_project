<template>
  <div class="appointment-list-view">
    <el-card>
      <template #header>
        <div class="page-header">
          <h2>Quản lý lịch hẹn</h2>
          <el-button type="primary">
            <el-icon><Plus /></el-icon>
            Đặt lịch mới
          </el-button>
        </div>
      </template>

      <el-empty description="Chức năng đang phát triển" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { Plus } from "@element-plus/icons-vue";
</script>
