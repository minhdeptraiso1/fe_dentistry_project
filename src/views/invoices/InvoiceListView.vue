<template>
  <div class="invoice-list-view">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">Quản lý hóa đơn</h1>
          <p class="page-subtitle">
            Quản lý và theo dõi các hóa đơn thanh toán
          </p>
        </div>
        <button
          v-if="authStore.isCashier || authStore.isAdmin"
          @click="handleCreate"
          class="create-button"
        >
          <component :is="PlusIcon" />
          <span>Tạo hóa đơn</span>
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="search-card">
      <div class="search-header">
        <component :is="SearchIcon" class="search-header-icon" />
        <span class="search-header-text">Tìm kiếm hóa đơn</span>
      </div>

      <div class="search-content">
        <div class="search-row">
          <el-select
            v-model="searchParams.patientId"
            placeholder="Chọn bệnh nhân"
            clearable
            filterable
            :loading="patientLoading"
            @change="handleSearch"
            @clear="handleSearch"
            class="search-select"
          >
            <template #prefix>
              <component :is="PatientIcon" class="input-icon" />
            </template>
            <el-option
              v-for="patient in patientOptions"
              :key="patient.id"
              :label="`${patient.patientCode} - ${patient.fullName}`"
              :value="patient.id"
            />
          </el-select>

          <el-select
            v-model="searchParams.status"
            placeholder="Trạng thái"
            clearable
            @change="handleSearch"
            class="search-select"
          >
            <template #prefix>
              <component :is="StatusIcon" class="input-icon" />
            </template>
            <el-option label="Nháp" value="DRAFT" />
            <el-option label="Đã phát hành" value="ISSUED" />
            <el-option label="Thanh toán 1 phần" value="PARTIALLY_PAID" />
            <el-option label="Đã thanh toán" value="PAID" />
            <el-option label="Đã hủy" value="CANCELLED" />
          </el-select>

          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="-"
            start-placeholder="Từ ngày"
            end-placeholder="Đến ngày"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            clearable
            @clear="handleSearch"
            @change="handleSearch"
            class="search-date-range"
          >
            <template #prefix>
              <component :is="CalendarIcon" class="input-icon" />
            </template>
          </el-date-picker>
        </div>

        <div class="search-actions">
          <button @click="handleSearch" class="search-button">
            <component :is="SearchIcon" />
            <span>Tìm kiếm</span>
          </button>

          <button @click="handleReset" class="reset-button">
            <component :is="ResetIcon" />
            <span>Đặt lại</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="table-card">
      <el-table
        v-loading="loading"
        :data="invoices"
        stripe
        style="width: 100%"
        class="modern-table"
      >
        <el-table-column prop="invoiceCode" label="Mã HĐ" width="120" />
        <el-table-column prop="patientCode" label="Mã BN" width="100" />
        <el-table-column prop="patientName" label="Bệnh nhân" min-width="150" />
        <el-table-column prop="cashierUsername" label="Thu ngân" width="120" />
        <el-table-column label="Trạng thái" width="150" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Tổng tiền" width="140" align="right">
          <template #default="{ row }">
            {{ formatCurrency(row.totalAmount) }}
          </template>
        </el-table-column>
        <el-table-column label="Đã thanh toán" width="140" align="right">
          <template #default="{ row }">
            <span
              :class="{
                'text-green-600 font-semibold': row.paidAmount > 0,
              }"
            >
              {{ formatCurrency(row.paidAmount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="Còn lại" width="140" align="right">
          <template #default="{ row }">
            <span
              :class="{
                'text-red-600 font-semibold':
                  row.totalAmount - row.paidAmount > 0,
              }"
            >
              {{ formatCurrency(row.totalAmount - row.paidAmount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="Ngày tạo" width="110">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column
          label="Thao tác"
          width="320"
          align="center"
          fixed="right"
        >
          <template #default="{ row }">
            <div class="action-buttons">
              <button
                @click="handleView(row.id)"
                class="action-btn-info"
                title="Xem chi tiết"
              >
                <component :is="EyeIcon" />
                <span>Xem</span>
              </button>
              <button
                v-if="
                  row.status === 'DRAFT' &&
                  (authStore.isCashier || authStore.isAdmin)
                "
                @click="handleIssue(row)"
                class="action-btn-success"
                title="Phát hành"
              >
                <component :is="IssueIcon" />
                <span>Phát hành</span>
              </button>
              <button
                v-if="
                  (row.status === 'ISSUED' ||
                    row.status === 'PARTIALLY_PAID') &&
                  (authStore.isCashier || authStore.isAdmin)
                "
                @click="handleAddPayment(row)"
                class="action-btn-warning"
                title="Thanh toán"
              >
                <component :is="PaymentIcon" />
                <span>Thanh toán</span>
              </button>
              <button
                v-if="
                  row.status !== 'PAID' &&
                  row.status !== 'CANCELLED' &&
                  authStore.isAdmin
                "
                @click="handleCancel(row)"
                class="action-btn-danger"
                title="Hủy hóa đơn"
              >
                <component :is="CancelIcon" />
                <span>Hủy</span>
              </button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="searchParams.page"
          v-model:page-size="searchParams.size"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="loadInvoices"
          @size-change="loadInvoices"
        />
      </div>
    </div>

    <!-- Add Payment Dialog -->
    <AddPaymentDialog
      v-if="paymentDialogVisible"
      v-model="paymentDialogVisible"
      :invoice="currentInvoice"
      @success="handleSearch"
    />

    <!-- Invoice Form Dialog -->
    <InvoiceFormDialog
      v-if="formDialogVisible"
      v-model="formDialogVisible"
      @success="handleSearch"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, h } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { invoiceApi } from "@/api/invoice";
import { patientApi } from "@/api/patient";
import { sortByCreatedAtDesc } from "@/utils/sort";
import { useAuthStore } from "@/stores/auth";
import type { Invoice, InvoiceStatus } from "@/types/invoice";
import type { Patient } from "@/types";
import AddPaymentDialog from "./components/AddPaymentDialog.vue";
import InvoiceFormDialog from "./components/InvoiceFormDialog.vue";

// Custom Icons
const PlusIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    [h("path", { d: "M5 12h14" }), h("path", { d: "M12 5v14" })],
  );

const PatientIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    [
      h("path", { d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" }),
      h("circle", { cx: "12", cy: "7", r: "4" }),
    ],
  );

const StatusIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    [
      h("path", { d: "M22 11.08V12a10 10 0 1 1-5.93-9.14" }),
      h("polyline", { points: "22 4 12 14.01 9 11.01" }),
    ],
  );

const CalendarIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    [
      h("rect", {
        width: "18",
        height: "18",
        x: "3",
        y: "4",
        rx: "2",
        ry: "2",
      }),
      h("line", { x1: "16", x2: "16", y1: "2", y2: "6" }),
      h("line", { x1: "8", x2: "8", y1: "2", y2: "6" }),
      h("line", { x1: "3", x2: "21", y1: "10", y2: "10" }),
    ],
  );

const SearchIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    [
      h("circle", { cx: "11", cy: "11", r: "8" }),
      h("path", { d: "m21 21-4.3-4.3" }),
    ],
  );

const ResetIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    [
      h("path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" }),
      h("path", { d: "M21 3v5h-5" }),
      h("path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" }),
      h("path", { d: "M3 21v-5h5" }),
    ],
  );

const EyeIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    [
      h("path", { d: "M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" }),
      h("circle", { cx: "12", cy: "12", r: "3" }),
    ],
  );

const IssueIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    [
      h("path", { d: "M12 2v20" }),
      h("path", { d: "m15 19-3 3-3-3" }),
      h("path", { d: "M19 15V9a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v6" }),
    ],
  );

const PaymentIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    [
      h("rect", { width: "20", height: "14", x: "2", y: "5", rx: "2" }),
      h("line", { x1: "2", x2: "22", y1: "10", y2: "10" }),
    ],
  );

const CancelIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    [
      h("circle", { cx: "12", cy: "12", r: "10" }),
      h("path", { d: "m15 9-6 6" }),
      h("path", { d: "m9 9 6 6" }),
    ],
  );

const router = useRouter();
const authStore = useAuthStore();

const loading = ref(false);
const invoices = ref<Invoice[]>([]);
const total = ref(0);

const patientLoading = ref(false);
const patientOptions = ref<Patient[]>([]);

const paymentDialogVisible = ref(false);
const formDialogVisible = ref(false);
const currentInvoice = ref<Invoice | null>(null);

const getCurrentMonthRange = (): [string, string] => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const toYmd = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  return [toYmd(firstDay), toYmd(lastDay)];
};

const [defaultFromDate, defaultToDate] = getCurrentMonthRange();

const searchParams = reactive({
  patientId: "",
  status: "" as InvoiceStatus | "",
  fromDate: `${defaultFromDate}T00:00:00Z`,
  toDate: `${defaultToDate}T23:59:59Z`,
  page: 1,
  size: 10,
});

const dateRange = ref<[string, string] | null>([
  defaultFromDate,
  defaultToDate,
]);

// Watch date range and update searchParams
watch(dateRange, (newValue) => {
  if (newValue && newValue.length === 2) {
    searchParams.fromDate = newValue[0] + "T00:00:00Z";
    searchParams.toDate = newValue[1] + "T23:59:59Z";
  } else {
    searchParams.fromDate = "";
    searchParams.toDate = "";
  }
});

// Load patients for filter
const loadPatients = async () => {
  try {
    patientLoading.value = true;
    const response = await patientApi.search({
      page: 0,
      size: 1000,
    });
    patientOptions.value = response.content || [];
  } catch (error) {
    console.error("Failed to load patients:", error);
  } finally {
    patientLoading.value = false;
  }
};

// Load invoices
const loadInvoices = async () => {
  try {
    loading.value = true;
    const response = await invoiceApi.search({
      patientId: searchParams.patientId || undefined,
      status: searchParams.status || undefined,
      fromDate: searchParams.fromDate || undefined,
      toDate: searchParams.toDate || undefined,
      page: searchParams.page - 1,
      size: searchParams.size,
    });
    invoices.value = sortByCreatedAtDesc(response.content || []);
    total.value = response.totalElements || 0;
  } catch (error) {
    console.error("Failed to load invoices:", error);
    ElMessage.error("Tải danh sách hóa đơn thất bại");
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  searchParams.page = 1;
  loadInvoices();
};

const handleReset = () => {
  searchParams.patientId = "";
  searchParams.status = "";
  const [fromDate, toDate] = getCurrentMonthRange();
  searchParams.fromDate = `${fromDate}T00:00:00Z`;
  searchParams.toDate = `${toDate}T23:59:59Z`;
  dateRange.value = [fromDate, toDate];
  searchParams.page = 1;
  searchParams.size = 10;
  loadInvoices();
};

const handleCreate = () => {
  formDialogVisible.value = true;
};

const handleView = (id: string) => {
  router.push(`/invoices/${id}`);
};

const handleIssue = async (invoice: Invoice) => {
  try {
    await ElMessageBox.confirm(
      `Xác nhận phát hành hóa đơn "${invoice.invoiceCode}"?`,
      "Xác nhận phát hành",
      {
        confirmButtonText: "Phát hành",
        cancelButtonText: "Hủy",
        type: "warning",
        customClass: "modern-confirm-dialog",
      },
    );

    await invoiceApi.issue(invoice.id);
    ElMessage.success("Phát hành hóa đơn thành công");
    loadInvoices();
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("Failed to issue invoice:", error);
      ElMessage.error("Phát hành hóa đơn thất bại");
    }
  }
};

const handleAddPayment = (invoice: Invoice) => {
  currentInvoice.value = invoice;
  paymentDialogVisible.value = true;
};

const handleCancel = async (invoice: Invoice) => {
  try {
    const result = await ElMessageBox.prompt(
      `Xác nhận hủy hóa đơn "${invoice.invoiceCode}"?`,
      "Lý do hủy",
      {
        confirmButtonText: "Hủy hóa đơn",
        cancelButtonText: "Đóng",
        inputPlaceholder: "Nhập lý do hủy (tùy chọn)",
        inputType: "textarea",
        type: "error",
        customClass: "danger-confirm-dialog",
      },
    );

    const note = typeof result === "string" ? result : (result as any).value;
    await invoiceApi.cancel(invoice.id, note || undefined);
    ElMessage.success("Hủy hóa đơn thành công");
    loadInvoices();
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

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("vi-VN");
};

onMounted(() => {
  loadPatients();
  loadInvoices();
});
</script>

<style scoped lang="scss">
.invoice-list-view {
  padding: 24px;
  background: #f3f4f6;
  min-height: 100vh;
}

// Page Header
.page-header {
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .title-section {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .page-title {
    font-size: 28px;
    font-weight: 700;
    background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0;
  }

  .page-subtitle {
    font-size: 14px;
    color: #6b7280;
    margin: 0;
  }

  .create-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 28px;
    background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);

    svg {
      width: 20px;
      height: 20px;
    }

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(20, 184, 166, 0.4);
    }

    &:active {
      transform: translateY(0);
    }
  }
}

// Search Card
.search-card {
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;

  .search-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 2px solid #f3f4f6;

    .search-header-icon {
      width: 24px;
      height: 24px;
      color: #14b8a6;
    }

    .search-header-text {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
    }
  }

  .search-content {
    .search-row {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;

      .search-select {
        flex: 1;
        min-width: 200px;
      }

      .search-date-range {
        flex: 1.5;
        min-width: 280px;
      }

      :deep(.el-input) {
        .el-input__wrapper {
          border-radius: 10px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;

          &:hover {
            box-shadow: 0 2px 8px rgba(20, 184, 166, 0.15);
          }

          &.is-focus {
            box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
          }
        }

        .el-input__prefix {
          display: flex;
          align-items: center;
        }
      }

      :deep(.el-select) {
        width: 100%;

        .el-input__wrapper {
          border-radius: 10px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;

          &:hover {
            box-shadow: 0 2px 8px rgba(20, 184, 166, 0.15);
          }

          &.is-focus {
            box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
          }
        }
      }

      :deep(.el-date-editor) {
        width: 100%;

        .el-input__wrapper {
          border-radius: 10px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;

          &:hover {
            box-shadow: 0 2px 8px rgba(20, 184, 166, 0.15);
          }

          &.is-focus {
            box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
          }
        }
      }

      .input-icon {
        width: 16px;
        height: 16px;
        color: #14b8a6;
      }
    }

    .search-actions {
      display: flex;
      gap: 12px;

      .search-button,
      .reset-button {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 24px;
        border: none;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        height: 40px;

        svg {
          width: 16px;
          height: 16px;
        }
      }

      .search-button {
        background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
        color: white;
        box-shadow: 0 2px 8px rgba(20, 184, 166, 0.25);

        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(20, 184, 166, 0.35);
        }

        &:active {
          transform: translateY(0);
        }
      }

      .reset-button {
        background: white;
        color: #6b7280;
        border: 1px solid #e5e7eb;

        &:hover {
          background: #f9fafb;
          border-color: #d1d5db;
          color: #374151;
        }

        &:active {
          background: #f3f4f6;
        }
      }
    }
  }
}

// Table Card
.table-card {
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  .modern-table {
    :deep(.el-table__header) {
      th {
        background: #f9fafb;
        color: #374151;
        font-weight: 600;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 2px solid #e5e7eb;
      }
    }

    :deep(.el-table__row) {
      transition: all 0.3s ease;

      &:hover {
        background: #f0fdfa !important;
      }

      td {
        border-bottom: 1px solid #f3f4f6;
      }
    }
  }

  .action-buttons {
    display: flex;
    gap: 6px;
    justify-content: center;
    align-items: center;
    flex-wrap: nowrap;

    button {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;

      svg {
        width: 14px;
        height: 14px;
      }

      &:hover {
        transform: translateY(-1px);
      }

      &:active {
        transform: translateY(0);
      }
    }

    .action-btn-info {
      background: #eff6ff;
      color: #2563eb;

      &:hover {
        background: #dbeafe;
      }
    }

    .action-btn-success {
      background: #f0fdf4;
      color: #16a34a;

      &:hover {
        background: #dcfce7;
      }
    }

    .action-btn-warning {
      background: #fffbeb;
      color: #ea580c;

      &:hover {
        background: #fef3c7;
      }
    }

    .action-btn-danger {
      background: #fef2f2;
      color: #ef4444;

      &:hover {
        background: #fee2e2;
      }
    }
  }

  .pagination-container {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #f3f4f6;
  }
}
</style>
