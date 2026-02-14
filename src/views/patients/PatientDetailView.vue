<template>
  <div class="p-4">
    <el-page-header @back="router.back()" class="mb-4">
      <template #content>
        <h2 class="m-0 text-lg font-semibold">Chi tiết bệnh nhân</h2>
      </template>
    </el-page-header>

    <el-card v-loading="loading">
      <div v-if="patient" class="flex items-start gap-6">
        <el-avatar :size="100" class="flex-shrink-0">
          {{ patient.fullName[0] }}
        </el-avatar>

        <div class="flex-1">
          <h3 class="text-xl font-bold mb-2">{{ patient.fullName }}</h3>
          <p class="text-gray-500 mb-4">
            Mã bệnh nhân: {{ patient.patientCode }}
          </p>

          <el-descriptions :column="2" border>
            <el-descriptions-item label="Giới tính">
              {{ patient.gender || "-" }}
            </el-descriptions-item>
            <el-descriptions-item label="Số điện thoại">
              {{ patient.phone || "-" }}
            </el-descriptions-item>
            <el-descriptions-item label="Ngày sinh">
              {{ patient.dob ? formatDate(patient.dob) : "-" }}
            </el-descriptions-item>
            <el-descriptions-item label="Địa chỉ" :span="2">
              {{ patient.address || "-" }}
            </el-descriptions-item>
            <el-descriptions-item label="Ghi chú" :span="2">
              {{ patient.note || "-" }}
            </el-descriptions-item>
            <el-descriptions-item label="Ngày tạo">
              {{ formatDateTime(patient.createdAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="Cập nhật lần cuối">
              {{ formatDateTime(patient.updatedAt) }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>

      <el-empty
        v-else-if="!loading"
        description="Không tìm thấy thông tin bệnh nhân"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { patientApi } from "@/api/patient";
import { formatDate } from "@/utils/date";
import { notification } from "@/utils/notification";
import type { Patient } from "@/types";

const router = useRouter();
const route = useRoute();

const loading = ref(false);
const patient = ref<Patient | null>(null);

/**
 * Format datetime
 */
const formatDateTime = (dateStr: string) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Load patient detail
 */
const loadPatient = async () => {
  const patientId = route.params.id as string;
  if (!patientId) {
    notification.error("Không tìm thấy ID bệnh nhân");
    router.back();
    return;
  }

  try {
    loading.value = true;
    patient.value = await patientApi.getById(patientId);
  } catch (error: any) {
    console.error("Load patient detail error:", error);
    notification.error(error?.message || "Không thể tải thông tin bệnh nhân");
    router.back();
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadPatient();
});
</script>

<style scoped lang="scss">
// Custom styles if needed
</style>
