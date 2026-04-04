<template>
  <el-dialog
    v-model="dialogVisible"
    width="980px"
    :close-on-click-modal="closeOnClickModal"
    :show-close="false"
  >
    <div v-loading="loading" class="space-y-5">
      <div v-if="invoice" class="space-y-4">
        <div
          class="rounded-2xl border border-gray-200 overflow-hidden bg-white"
        >
          <div
            class="px-6 py-5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-white/80">Chi tiết hóa đơn</p>
                <h3 class="text-2xl font-bold mt-1">
                  {{ invoice.invoiceCode }}
                </h3>
                <p class="text-sm text-white/90 mt-1">
                  Ngày phát hành: {{ formatDate(invoice.issuedAt) }}
                </p>
              </div>
              <el-tag
                :type="getInvoiceStatusType(invoice.status)"
                effect="dark"
              >
                {{ getInvoiceStatusLabel(invoice.status) }}
              </el-tag>
            </div>
          </div>

          <div class="p-5 space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div class="rounded-xl border border-teal-100 bg-teal-50/60 p-4">
                <p class="text-xs text-gray-500 uppercase tracking-wide">
                  Tổng tiền
                </p>
                <p class="text-2xl font-bold text-teal-700 mt-1">
                  {{ formatCurrency(invoice.totalAmount) }}
                </p>
              </div>
              <div
                class="rounded-xl border border-green-100 bg-green-50/60 p-4"
              >
                <p class="text-xs text-gray-500 uppercase tracking-wide">
                  Đã thanh toán
                </p>
                <p class="text-2xl font-bold text-green-700 mt-1">
                  {{ formatCurrency(invoice.paidAmount) }}
                </p>
              </div>
              <div class="rounded-xl border border-rose-100 bg-rose-50/60 p-4">
                <p class="text-xs text-gray-500 uppercase tracking-wide">
                  Còn lại
                </p>
                <p class="text-2xl font-bold text-rose-700 mt-1">
                  {{ formatCurrency(getRemainingAmount(invoice)) }}
                </p>
              </div>
            </div>

            <div class="rounded-xl border border-gray-200 overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-3 py-2 text-left">Dịch vụ</th>
                    <th class="px-3 py-2 text-right">SL</th>
                    <th class="px-3 py-2 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(item, index) in invoice.items || []"
                    :key="item.id || index"
                    class="border-t border-gray-100"
                  >
                    <td class="px-3 py-2">
                      <p class="font-medium text-gray-900">
                        {{ item.itemName }}
                      </p>
                      <p class="text-xs text-gray-500">
                        {{ item.serviceCode }}
                      </p>
                      <p v-if="item.note" class="text-xs text-gray-400 mt-1">
                        {{ item.note }}
                      </p>
                    </td>
                    <td class="px-3 py-2 text-right">{{ item.quantity }}</td>
                    <td class="px-3 py-2 text-right font-semibold">
                      {{ formatCurrency(item.lineTotal) }}
                    </td>
                  </tr>
                  <tr v-if="!(invoice.items && invoice.items.length)">
                    <td colspan="3" class="px-3 py-4 text-center text-gray-500">
                      Hóa đơn chưa có chi tiết dịch vụ.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { InvoiceDetailResponse, InvoiceMyResponse } from "@/types/patient";

interface Props {
  modelValue: boolean;
  loading: boolean;
  invoice: InvoiceDetailResponse | null;
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

const formatCurrency = (value: number) => {
  const safeValue = Number.isFinite(Number(value)) ? Number(value) : 0;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(safeValue);
};

const getRemainingAmount = (invoice: InvoiceMyResponse) => {
  const total = Number(invoice.totalAmount) || 0;
  const paid = Number(invoice.paidAmount) || 0;
  return Math.max(total - paid, 0);
};

const getInvoiceStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    DRAFT: "Nháp",
    ISSUED: "Đã phát hành",
    PARTIALLY_PAID: "Thanh toán một phần",
    PAID: "Đã thanh toán",
    CANCELLED: "Đã hủy",
  };
  return labels[status] || status;
};

const getInvoiceStatusType = (status: string) => {
  const types: Record<string, string> = {
    DRAFT: "info",
    ISSUED: "warning",
    PARTIALLY_PAID: "warning",
    PAID: "success",
    CANCELLED: "danger",
  };
  return types[status] || "info";
};
</script>
