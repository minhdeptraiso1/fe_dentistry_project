<template>
  <el-dialog
    v-model="dialogVisible"
    width="980px"
    :close-on-click-modal="closeOnClickModal"
    :show-close="false"
  >
    <div v-loading="loading" class="space-y-5">
      <div
        v-if="prescription"
        class="rounded-2xl border border-gray-200 overflow-hidden bg-white"
      >
        <div
          class="px-6 py-5 bg-gradient-to-r from-sky-500 to-cyan-600 text-white"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-white/80">Chi tiết đơn thuốc</p>
              <h3 class="text-2xl font-bold mt-1">Thông tin đơn điều trị</h3>
              <p class="text-sm text-white/90 mt-1">
                Ngày tạo: {{ formatDate(prescription.createdAt) }}
              </p>
            </div>
            <el-tag
              :type="getPrescriptionStatusType(prescription.status)"
              effect="dark"
            >
              {{ getPrescriptionStatusLabel(prescription.status) }}
            </el-tag>
          </div>
        </div>

        <div class="p-5 space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="rounded-xl border border-sky-100 bg-sky-50/60 p-4">
              <p class="text-xs text-gray-500 uppercase tracking-wide">
                Mã bệnh nhân
              </p>
              <p class="text-xl font-bold text-sky-700 mt-1">
                {{ prescription.patientCode || "N/A" }}
              </p>
              <p class="text-xs text-gray-500 mt-1">
                {{ prescription.patientName || "N/A" }}
              </p>
            </div>
            <div class="rounded-xl border border-teal-100 bg-teal-50/60 p-4">
              <p class="text-xs text-gray-500 uppercase tracking-wide">
                Bác sĩ kê đơn
              </p>
              <p class="text-xl font-bold text-teal-700 mt-1">
                {{ prescription.doctorUsername || "N/A" }}
              </p>
              <p class="text-xs text-gray-500 mt-1">
                Cập nhật: {{ formatDate(prescription.updatedAt) }}
              </p>
            </div>
            <div
              class="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4"
            >
              <p class="text-xs text-gray-500 uppercase tracking-wide">
                Tổng số lượng thuốc
              </p>
              <p class="text-2xl font-bold text-indigo-700 mt-1">
                {{ getPrescriptionTotalQuantity(prescription) }}
              </p>
              <p class="text-xs text-gray-500 mt-1">
                {{ (prescription.items || []).length }} loại thuốc
              </p>
            </div>
          </div>

          <div class="rounded-xl border border-gray-200 overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-3 py-2 text-left">Mã thuốc</th>
                  <th class="px-3 py-2 text-left">Tên thuốc</th>
                  <th class="px-3 py-2 text-left">Liều dùng</th>
                  <th class="px-3 py-2 text-right">SL</th>
                  <th class="px-3 py-2 text-left">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, index) in prescription.items || []"
                  :key="item.id || index"
                  class="border-t border-gray-100"
                >
                  <td class="px-3 py-2">
                    <p class="font-medium text-gray-900">
                      {{ item.medicineCode }}
                    </p>
                    <p class="text-xs text-gray-500">{{ item.unit }}</p>
                  </td>
                  <td class="px-3 py-2 font-medium text-gray-900">
                    {{ item.medicineName }}
                  </td>
                  <td class="px-3 py-2 text-gray-700">
                    {{ item.dosage || "N/A" }}
                  </td>
                  <td class="px-3 py-2 text-right font-semibold text-gray-900">
                    {{ item.quantity }}
                  </td>
                  <td class="px-3 py-2 text-gray-600">
                    {{ item.note || "-" }}
                  </td>
                </tr>
                <tr v-if="!(prescription.items && prescription.items.length)">
                  <td colspan="5" class="px-3 py-4 text-center text-gray-500">
                    Đơn thuốc chưa có chi tiết thuốc.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p class="text-xs text-gray-500 uppercase tracking-wide">Ghi chú</p>
            <p class="text-sm text-gray-900 mt-1">
              {{ prescription.note || "Không có" }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { PrescriptionResponse } from "@/types/patient";

interface Props {
  modelValue: boolean;
  loading: boolean;
  prescription: PrescriptionResponse | null;
  closeOnClickModal?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  closeOnClickModal: true,
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

const getPrescriptionStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    DRAFT: "Nháp",
    ISSUED: "Đã phát hành",
    DISPENSED: "Đã phát thuốc",
    CANCELLED: "Đã hủy",
  };
  return labels[status] || status;
};

const getPrescriptionStatusType = (status: string) => {
  const types: Record<string, string> = {
    DRAFT: "info",
    ISSUED: "warning",
    DISPENSED: "success",
    CANCELLED: "danger",
  };
  return types[status] || "info";
};

const getPrescriptionTotalQuantity = (prescription: PrescriptionResponse) => {
  return (prescription.items || []).reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0,
  );
};
</script>
