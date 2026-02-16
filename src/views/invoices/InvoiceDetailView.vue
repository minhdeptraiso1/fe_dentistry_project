<template>
  <div class="invoice-detail-view">
    <el-page-header @back="router.back()" class="mb-6">
      <template #content>
        <span class="text-2xl font-bold">Chi tiết hóa đơn</span>
      </template>
      <template #extra>
        <el-space>
          <el-button
            v-if="
              invoice?.status === 'DRAFT' &&
              (authStore.isCashier || authStore.isAdmin)
            "
            type="success"
            @click="handleIssue"
          >
            <el-icon class="mr-1"><Check /></el-icon>
            Phát hành
          </el-button>
          <el-button
            v-if="
              (invoice?.status === 'ISSUED' ||
                invoice?.status === 'PARTIALLY_PAID') &&
              (authStore.isCashier || authStore.isAdmin)
            "
            type="primary"
            @click="handleAddPayment"
          >
            <el-icon class="mr-1"><Money /></el-icon>
            Thanh toán
          </el-button>
          <el-button @click="handlePrint">
            <el-icon class="mr-1"><Printer /></el-icon>
            In hóa đơn
          </el-button>
          <el-button
            v-if="
              invoice &&
              invoice.status !== 'PAID' &&
              invoice.status !== 'CANCELLED' &&
              authStore.isAdmin
            "
            type="danger"
            @click="handleCancel"
          >
            <el-icon class="mr-1"><Close /></el-icon>
            Hủy hóa đơn
          </el-button>
        </el-space>
      </template>
    </el-page-header>

    <el-card v-loading="loading">
      <!-- Invoice Info -->
      <el-descriptions :column="3" border>
        <el-descriptions-item
          label="Mã hóa đơn"
          label-class-name="font-semibold"
        >
          <span class="text-lg font-bold text-blue-600">{{
            invoice?.invoiceCode
          }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="Trạng thái">
          <el-tag
            v-if="invoice"
            :type="getStatusType(invoice.status)"
            size="large"
          >
            {{ getStatusLabel(invoice.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="Ngày tạo">
          {{ invoice?.createdAt ? formatDateTime(invoice.createdAt) : "-" }}
        </el-descriptions-item>

        <el-descriptions-item label="Bệnh nhân">
          {{ invoice?.patientCode }} - {{ invoice?.patientName }}
        </el-descriptions-item>
        <el-descriptions-item label="Thu ngân">
          {{ invoice?.cashierUsername }}
        </el-descriptions-item>
        <el-descriptions-item label="Ngày phát hành">
          {{ invoice?.issuedAt ? formatDateTime(invoice.issuedAt) : "-" }}
        </el-descriptions-item>

        <el-descriptions-item
          v-if="invoice?.treatmentPlanId"
          label="Kế hoạch điều trị"
          :span="2"
        >
          <el-button
            type="primary"
            link
            @click="router.push(`/treatment-plans/${invoice.treatmentPlanId}`)"
          >
            Xem kế hoạch điều trị
          </el-button>
        </el-descriptions-item>
        <el-descriptions-item label="Ngày thanh toán">
          {{ invoice?.paidAt ? formatDateTime(invoice.paidAt) : "-" }}
        </el-descriptions-item>

        <el-descriptions-item label="Ghi chú" :span="3">
          {{ invoice?.note || "-" }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- Items Table -->
      <el-divider />
      <h3 class="text-lg font-semibold mb-4">Danh sách dịch vụ</h3>
      <el-table :data="invoice?.items" border stripe style="width: 100%">
        <el-table-column type="index" label="STT" width="60" />
        <el-table-column prop="serviceCode" label="Mã DV" width="100" />
        <el-table-column prop="itemName" label="Tên dịch vụ" min-width="250" />
        <el-table-column label="Số lượng" width="100" align="center">
          <template #default="{ row }">
            {{ row.quantity }}
          </template>
        </el-table-column>
        <el-table-column label="Đơn giá" width="140" align="right">
          <template #default="{ row }">
            {{ formatCurrency(row.unitPrice) }}
          </template>
        </el-table-column>
        <el-table-column label="Giảm giá" width="120" align="right">
          <template #default="{ row }">
            {{ formatCurrency(row.discountAmount) }}
          </template>
        </el-table-column>
        <el-table-column label="Thành tiền" width="150" align="right">
          <template #default="{ row }">
            <span class="font-semibold">{{
              formatCurrency(row.lineTotal)
            }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="note" label="Ghi chú" width="150" />
      </el-table>

      <!-- Payment History -->
      <el-divider />
      <h3 class="text-lg font-semibold mb-4">Lịch sử thanh toán</h3>
      <el-table
        :data="invoice?.payments"
        border
        stripe
        style="width: 100%"
        :empty-text="'Chưa có thanh toán nào'"
      >
        <el-table-column type="index" label="STT" width="60" />
        <el-table-column label="Ngày thanh toán" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.paidAt) }}
          </template>
        </el-table-column>
        <el-table-column label="Phương thức" width="150">
          <template #default="{ row }">
            <el-tag :type="getPaymentMethodType(row.method)">
              {{ getPaymentMethodLabel(row.method) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Số tiền" width="150" align="right">
          <template #default="{ row }">
            <span class="font-semibold text-green-600">
              {{ formatCurrency(row.amount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column
          prop="reference"
          label="Mã tham chiếu"
          min-width="150"
        />
        <el-table-column prop="note" label="Ghi chú" min-width="200" />
      </el-table>

      <!-- Summary -->
      <el-divider />
      <div class="flex justify-end">
        <div class="w-96 space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-gray-600">Tạm tính:</span>
            <span class="text-lg">{{
              invoice ? formatCurrency(invoice.subtotal) : ""
            }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-600">Giảm giá:</span>
            <span class="text-lg text-red-600">
              -{{ invoice ? formatCurrency(invoice.discountAmount) : "" }}
            </span>
          </div>
          <el-divider />
          <div class="flex justify-between items-center">
            <span class="text-xl font-semibold">Tổng tiền:</span>
            <span class="text-2xl font-bold text-blue-600">
              {{ invoice ? formatCurrency(invoice.totalAmount) : "" }}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-lg font-semibold">Đã thanh toán:</span>
            <span class="text-xl font-bold text-green-600">
              {{ invoice ? formatCurrency(invoice.paidAmount) : "" }}
            </span>
          </div>
          <el-divider />
          <div class="flex justify-between items-center">
            <span class="text-xl font-bold">Còn lại:</span>
            <span
              class="text-3xl font-bold"
              :class="{
                'text-red-600':
                  invoice && invoice.totalAmount - invoice.paidAmount > 0,
                'text-gray-400':
                  invoice && invoice.totalAmount - invoice.paidAmount === 0,
              }"
            >
              {{
                invoice
                  ? formatCurrency(invoice.totalAmount - invoice.paidAmount)
                  : ""
              }}
            </span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- Add Payment Dialog -->
    <AddPaymentDialog
      v-if="paymentDialogVisible"
      v-model="paymentDialogVisible"
      :invoice="invoice"
      @success="loadInvoice"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { Check, Close, Money, Printer } from "@element-plus/icons-vue";
import { invoiceApi } from "@/api/invoice";
import { useAuthStore } from "@/stores/auth";
import type { Invoice, InvoiceStatus, PaymentMethod } from "@/types/invoice";
import AddPaymentDialog from "./components/AddPaymentDialog.vue";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const loading = ref(false);
const invoice = ref<Invoice | null>(null);
const paymentDialogVisible = ref(false);

const loadInvoice = async () => {
  const id = route.params.id as string;
  if (!id) return;

  try {
    loading.value = true;
    invoice.value = await invoiceApi.getById(id);
  } catch (error) {
    console.error("Failed to load invoice:", error);
    ElMessage.error("Tải chi tiết hóa đơn thất bại");
  } finally {
    loading.value = false;
  }
};

const handleIssue = async () => {
  if (!invoice.value) return;

  try {
    await ElMessageBox.confirm(
      `Xác nhận phát hành hóa đơn "${invoice.value.invoiceCode}"?`,
      "Xác nhận",
      {
        confirmButtonText: "Phát hành",
        cancelButtonText: "Hủy",
        type: "warning",
      },
    );

    await invoiceApi.issue(invoice.value.id);
    ElMessage.success("Phát hành hóa đơn thành công");
    loadInvoice();
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("Failed to issue invoice:", error);
      ElMessage.error("Phát hành hóa đơn thất bại");
    }
  }
};

const handleAddPayment = () => {
  paymentDialogVisible.value = true;
};

const handlePrint = () => {
  window.print();
};

const handleCancel = async () => {
  if (!invoice.value) return;

  try {
    const result = await ElMessageBox.prompt(
      `Xác nhận hủy hóa đơn "${invoice.value.invoiceCode}"?`,
      "Lý do hủy",
      {
        confirmButtonText: "Hủy hóa đơn",
        cancelButtonText: "Đóng",
        inputPlaceholder: "Nhập lý do hủy (tùy chọn)",
        inputType: "textarea",
      },
    );

    const note = typeof result === "string" ? result : (result as any).value;
    await invoiceApi.cancel(invoice.value.id, note || undefined);
    ElMessage.success("Hủy hóa đơn thành công");
    loadInvoice();
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("Failed to cancel invoice:", error);
      ElMessage.error("Hủy hóa đơn thất bại");
    }
  }
};

const getStatusType = (status: InvoiceStatus) => {
  const typeMap: Record<InvoiceStatus, any> = {
    DRAFT: "info",
    ISSUED: "warning",
    PARTIALLY_PAID: "warning",
    PAID: "success",
    CANCELLED: "danger",
  };
  return typeMap[status];
};

const getStatusLabel = (status: InvoiceStatus) => {
  const labelMap: Record<InvoiceStatus, string> = {
    DRAFT: "Nháp",
    ISSUED: "Đã phát hành",
    PARTIALLY_PAID: "Thanh toán 1 phần",
    PAID: "Đã thanh toán",
    CANCELLED: "Đã hủy",
  };
  return labelMap[status];
};

const getPaymentMethodType = (method: PaymentMethod) => {
  const typeMap: Record<PaymentMethod, any> = {
    CASH: "success",
    TRANSFER: "primary",
    CARD: "warning",
  };
  return typeMap[method];
};

const getPaymentMethodLabel = (method: PaymentMethod) => {
  const labelMap: Record<PaymentMethod, string> = {
    CASH: "Tiền mặt",
    TRANSFER: "Chuyển khoản",
    CARD: "Thẻ",
  };
  return labelMap[method];
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString("vi-VN");
};

onMounted(() => {
  loadInvoice();
});
</script>

<style scoped>
.invoice-detail-view {
  padding: 20px;
}

@media print {
  .invoice-detail-view :deep(.el-page-header),
  .invoice-detail-view :deep(.el-button) {
    display: none !important;
  }
}
</style>
