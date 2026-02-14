<template>
  <div class="patient-detail-view">
    <el-page-header @back="router.back()" title="Quay lại">
      <template #content>
        <h2>Chi tiết bệnh nhân</h2>
      </template>
    </el-page-header>

    <el-card style="margin-top: 16px">
      <div class="patient-info">
        <el-avatar :size="100">N</el-avatar>
        <div class="info-content">
          <h3>Nguyễn Văn A</h3>
          <p>Mã bệnh nhân: #BN001</p>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();
</script>

<style scoped lang="scss">
.patient-detail-view {
  .patient-info {
    display: flex;
    align-items: center;
    gap: 24px;

    .info-content {
      h3 {
        margin: 0 0 8px;
      }
      p {
        margin: 0;
        color: #8c8c8c;
      }
    }
  }
}
</style>
