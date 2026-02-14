<template>
  <div class="not-found-view">
    <el-result
      icon="error"
      title="404"
      sub-title="Không tìm thấy trang bạn đang tìm kiếm"
    >
      <template #extra>
        <el-button type="primary" @click="router.push('/')">
          Về trang chủ
        </el-button>
      </template>
    </el-result>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();
</script>

<style scoped lang="scss">
.not-found-view {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}
</style>
