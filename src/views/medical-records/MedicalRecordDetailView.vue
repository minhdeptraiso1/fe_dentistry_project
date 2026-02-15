<template>
  <div class="p-4">
    <el-page-header @back="router.back()" class="mb-4">
      <template #content>
        <h2 class="m-0 text-lg font-semibold">Chi tiết phiếu khám</h2>
      </template>
      <template #extra>
        <el-button
          v-if="canCreateTreatmentPlan"
          type="success"
          @click="handleCreateTreatmentPlan"
        >
          Tạo kế hoạch điều trị
        </el-button>
        <el-button v-if="canEdit" type="primary" @click="handleEdit">
          Chỉnh sửa
        </el-button>
      </template>
    </el-page-header>

    <el-card v-loading="loading">
      <div v-if="record">
        <h3 class="text-xl font-bold mb-2">
          Phiếu khám {{ record.recordCode }}
        </h3>

        <el-descriptions :column="2" border class="mt-4">
          <el-descriptions-item label="Mã phiếu khám">
            {{ record.recordCode }}
          </el-descriptions-item>
          <el-descriptions-item label="Ngày khám">
            {{ formatDateTime(record.visitDate) }}
          </el-descriptions-item>
          <el-descriptions-item label="Bệnh nhân">
            <el-button
              link
              type="primary"
              @click="viewPatient(record.patientId)"
            >
              {{ record.patientCode }} - {{ record.patientName }}
            </el-button>
          </el-descriptions-item>
          <el-descriptions-item label="Bác sĩ">
            {{ record.doctorUsername }}
          </el-descriptions-item>
          <el-descriptions-item label="Triệu chứng" :span="2">
            <div class="whitespace-pre-wrap">
              {{ record.symptom || "-" }}
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="Chẩn đoán" :span="2">
            <div class="whitespace-pre-wrap">
              {{ record.diagnosis || "-" }}
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="Ghi chú" :span="2">
            <div class="whitespace-pre-wrap">
              {{ record.note || "-" }}
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="Ngày tạo">
            {{ formatDateTime(record.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="Cập nhật lần cuối">
            {{ formatDateTime(record.updatedAt) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <el-empty
        v-else-if="!loading"
        description="Không tìm thấy thông tin phiếu khám"
      />
    </el-card>

    <!-- Edit Dialog -->
    <MedicalRecordFormDialog
      v-model="dialogVisible"
      :record="record"
      @success="handleUpdateSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { medicalRecordApi } from "@/api/medicalRecord";
import { notification } from "@/utils/notification";
import { useAuthStore } from "@/stores/auth";
import MedicalRecordFormDialog from "./components/MedicalRecordFormDialog.vue";
import type { MedicalRecord } from "@/types";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const loading = ref(false);
const record = ref<MedicalRecord | null>(null);
const dialogVisible = ref(false);

/**
 * Check if current user can edit
 */
const canEdit = computed(() => {
  const role = authStore.user?.role;
  return role === "ADMIN" || role === "DOCTOR";
});

/**
 * Check if can create treatment plan
 */
const canCreateTreatmentPlan = computed(() => {
  const role = authStore.user?.role;
  return role === "ADMIN" || role === "DOCTOR";
});

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
 * Load medical record detail
 */
const loadRecord = async () => {
  const recordId = route.params.id as string;
  if (!recordId) {
    notification.error("Không tìm thấy ID phiếu khám");
    router.back();
    return;
  }

  try {
    loading.value = true;
    record.value = await medicalRecordApi.getById(recordId);
  } catch (error: any) {
    console.error("Load medical record detail error:", error);
    notification.error(error?.message || "Không thể tải thông tin phiếu khám");
    router.back();
  } finally {
    loading.value = false;
  }
};

/**
 * View patient detail
 */
const viewPatient = (patientId: string) => {
  router.push(`/patients/${patientId}`);
};

/**
 * Handle edit
 */
const handleEdit = () => {
  dialogVisible.value = true;
};

/**
 * Handle update success
 */
const handleUpdateSuccess = () => {
  dialogVisible.value = false;
  loadRecord(); // Reload data
};

/**
 * Handle create treatment plan
 */
const handleCreateTreatmentPlan = () => {
  if (!record.value) return;
  // Navigate to treatment plans page with medicalRecordId in query
  router.push({
    name: "TreatmentPlans",
    query: {
      medicalRecordId: record.value.id,
      patientId: record.value.patientId,
    },
  });
};

onMounted(() => {
  loadRecord();
});
</script>

<style scoped lang="scss">
// Custom styles if needed
</style>
