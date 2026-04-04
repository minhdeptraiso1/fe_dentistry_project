<template>
  <el-dialog
    v-model="dialogVisible"
    width="900px"
    :close-on-click-modal="closeOnClickModal"
    :show-close="false"
  >
    <div v-loading="loading" class="space-y-5">
      <div
        v-if="record"
        class="rounded-2xl border border-gray-200 overflow-hidden bg-white"
      >
        <div
          class="px-6 py-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-white/80">Chi tiết hồ sơ khám</p>
              <h3 class="text-2xl font-bold mt-1">Thông tin thăm khám</h3>
              <p class="text-sm text-white/90 mt-1">
                Ngày khám: {{ formatDate(record.visitDate) }}
              </p>
            </div>
            <span
              class="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-semibold"
            >
              {{ record.recordCode || "N/A" }}
            </span>
          </div>
        </div>

        <div class="p-5 space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div
              class="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4"
            >
              <p class="text-xs text-gray-500 uppercase tracking-wide">
                Mã bệnh nhân
              </p>
              <p class="text-xl font-bold text-emerald-700 mt-1">
                {{ patientCode || "N/A" }}
              </p>
              <p class="text-xs text-gray-500 mt-1">
                {{ record.patientName || "N/A" }}
              </p>
            </div>
            <div class="rounded-xl border border-teal-100 bg-teal-50/60 p-4">
              <p class="text-xs text-gray-500 uppercase tracking-wide">
                Bác sĩ khám
              </p>
              <p class="text-xl font-bold text-teal-700 mt-1">
                {{ record.doctorUsername || "N/A" }}
              </p>
              <p class="text-xs text-gray-500 mt-1">
                Ngày tạo: {{ formatDate(record.createdAt) }}
              </p>
            </div>
            <div class="rounded-xl border border-cyan-100 bg-cyan-50/60 p-4">
              <p class="text-xs text-gray-500 uppercase tracking-wide">
                Tình trạng hồ sơ
              </p>
              <p class="text-xl font-bold text-cyan-700 mt-1">Đã lưu</p>
              <p class="text-xs text-gray-500 mt-1">
                Sẵn sàng để theo dõi điều trị
              </p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p class="text-xs text-gray-500 uppercase tracking-wide">
                Triệu chứng
              </p>
              <p class="text-sm text-gray-900 mt-1">
                {{ record.symptom || "Không có" }}
              </p>
            </div>
            <div class="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p class="text-xs text-gray-500 uppercase tracking-wide">
                Chẩn đoán
              </p>
              <p class="text-sm text-gray-900 mt-1">
                {{ record.diagnosis || "Không có" }}
              </p>
            </div>
          </div>

          <div class="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p class="text-xs text-gray-500 uppercase tracking-wide">Ghi chú</p>
            <p class="text-sm text-gray-900 mt-1">
              {{ record.note || "Không có" }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { MedicalRecordResponse } from "@/types/patient";

interface Props {
  modelValue: boolean;
  loading: boolean;
  record: MedicalRecordResponse | null;
  patientCode?: string;
  closeOnClickModal?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  closeOnClickModal: true,
  patientCode: "",
});

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit("update:modelValue", value),
});

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};
</script>
