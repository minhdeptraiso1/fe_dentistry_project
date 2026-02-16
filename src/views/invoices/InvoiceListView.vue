<template>
  <div class="invoice-list-view">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Quản lý hóa đơn</h1>
      <el-button
        v-if="authStore.isCashier || authStore.isAdmin"
        type="primary"
        @click="handleCreate"
      >
        <el-icon class="mr-2"><Plus /></el-icon>
        Tạo hóa đơn
      </el-button>
    </div>

    <!-- Filters -->
    <el-card class="mb-6">
      <el-form
        :inline="true"
        :model="searchParams"
        @submit.prevent="handleSearch"
      >
        <el-form-item label="Bệnh nhân">
          <el-select
            v-model="searchParams.patientId"
            placeholder="Chọn bệnh nhân"
            clearable
            filterable
            :loading="patientLoading"
            style="width: 240px"
            @change="handleSearch"
            @clear="handleSearch"
          >
            <el-option
              v-for="patient in patientOptions"
              :key="patient.id"
              :label="`${patient.patientCode} - ${patient.fullName}`"
              :value="patient.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Trạng thái">
          <el-select
            v-model="searchParams.status"
            placeholder="Tất cả"
            clearable
            style="width: 150px"
            @change="handleSearch"
          >
            <el-option label="Nháp" value="DRAFT" />
            <el-option label="Đã phát hành" value="ISSUED" />
            <el-option label="Thanh toán 1 phần" value="PARTIALLY_PAID" />
            <el-option label="Đã thanh toán" value="PAID" />
            <el-option label="Đã hủy" value="CANCELLED" />
          </el-select>
        </el-form-item>

        <el-form-item label="Từ ngày">
          <el-date-picker
            v-model="searchParams.fromDate"
            type="date"
            placeholder="Chọn ngày"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            style="width: 150px"
            @change="handleSearch"
          />
        </el-form-item>

        <el-form-item label="Đến ngày">
          <el-date-picker
            v-model="searchParams.toDate"
            type="date"
            placeholder="Chọn ngày"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            style="width: 150px"
            @change="handleSearch"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon class="mr-2"><Search /></el-icon>
            Tìm kiếm
          </el-button>
          <el-button @click="handleReset">Đặt lại</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Table -->
    <el-card>
      <el-table v-loading="loading" :data="invoices" stripe style="width: 100%">
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
          width="200"
          align="center"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              size="small"
              @click="handleView(row.id)"
            >
              Xem
            </el-button>
            <el-button
              v-if="
                row.status === 'DRAFT' &&
                (authStore.isCashier || authStore.isAdmin)
              "
              link
              type="success"
              size="small"
              @click="handleIssue(row)"
            >
              Phát hành
            </el-button>
            <el-button
              v-if="
                (row.status === 'ISSUED' || row.status === 'PARTIALLY_PAID') &&
                (authStore.isCashier || authStore.isAdmin)
              "
              link
              type="warning"
              size="small"
              @click="handleAddPayment(row)"
            >
              Thanh toán
            </el-button>
            <el-button
              v-if="
                row.status !== 'PAID' &&
                row.status !== 'CANCELLED' &&
                authStore.isAdmin
              "
              link
              type="danger"
              size="small"
              @click="handleCancel(row)"
            >
              Hủy
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="flex justify-end mt-4">
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
    </el-card>

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
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { Search, Plus } from "@element-plus/icons-vue";
import { invoiceApi } from "@/api/invoice";
import { patientApi } from "@/api/patient";
import { useAuthStore } from "@/stores/auth";
import type { Invoice, InvoiceStatus } from "@/types/invoice";
import type { Patient } from "@/types";
import AddPaymentDialog from "./components/AddPaymentDialog.vue";
import InvoiceFormDialog from "./components/InvoiceFormDialog.vue";

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

const searchParams = reactive({
  patientId: "",
  status: "" as InvoiceStatus | "",
  fromDate: "",
  toDate: "",
  page: 1,
  size: 10,
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
    invoices.value = response.content || [];
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
  searchParams.fromDate = "";
  searchParams.toDate = "";
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
      "Xác nhận",
      {
        confirmButtonText: "Phát hành",
        cancelButtonText: "Hủy",
        type: "warning",
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

<style scoped>
.invoice-list-view {
  padding: 20px;
}
</style>
