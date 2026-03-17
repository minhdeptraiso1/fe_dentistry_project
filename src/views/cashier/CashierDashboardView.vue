<template>
  <div class="dashboard-modern" v-loading="loading">
    <div class="dashboard-header">
      <div>
        <h1 class="dashboard-title">Dashboard Thu Ngân</h1>
        <p class="dashboard-subtitle">
          Theo dõi hóa đơn cần thu tiền và thuốc sắp hết hạn
        </p>
      </div>

      <div class="date-filter-card">
        <div class="date-filter-header">
          <svg
            class="w-5 h-5 text-teal-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span class="date-filter-label">Ngày hóa đơn</span>
        </div>
        <el-date-picker
          v-model="selectedDate"
          type="date"
          placeholder="Chọn ngày"
          format="DD/MM/YYYY"
          value-format="YYYY-MM-DD"
          @change="loadData"
          class="date-picker-modern"
        />
      </div>
    </div>

    <div class="stats-grid">
      <section class="stat-card invoice-card">
        <div class="stat-icon-wrapper">
          <svg
            class="w-6 h-6 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <div>
          <div class="stat-label">Hóa đơn chờ thanh toán</div>
          <div class="stat-value text-blue-600">{{ pendingInvoiceCount }}</div>
        </div>
      </section>

      <section class="stat-card medicine-card">
        <div class="stat-icon-wrapper">
          <svg
            class="w-6 h-6 text-amber-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div>
          <div class="stat-label">Thuốc sắp hết hạn</div>
          <div class="stat-value text-amber-600">
            {{ expiringMedicineCount }}
          </div>
        </div>
      </section>
    </div>

    <div class="content-grid">
      <section class="panel-card">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Hóa đơn cần thu tiền</h2>
            <p class="panel-subtitle">
              Hóa đơn có trạng thái ISSUED và PARTIALLY_PAID trong ngày đã chọn
            </p>
          </div>
          <el-button type="primary" plain @click="goToInvoices">
            Xem tất cả
          </el-button>
        </div>

        <div v-if="visiblePendingInvoices.length === 0" class="empty-state">
          <svg
            class="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p>Không có hóa đơn chờ thanh toán</p>
        </div>

        <div v-else class="list-stack">
          <article
            v-for="invoice in visiblePendingInvoices"
            :key="invoice.id"
            class="list-item invoice-item"
          >
            <div class="item-main">
              <div class="item-avatar invoice-avatar">
                {{ invoice.patientName?.[0] || "?" }}
              </div>
              <div class="item-content">
                <div class="item-row">
                  <p class="item-title">{{ invoice.patientName }}</p>
                  <el-tag
                    :type="
                      invoice.status === 'PARTIALLY_PAID'
                        ? 'warning'
                        : 'primary'
                    "
                    effect="light"
                    round
                  >
                    {{ getInvoiceStatusLabel(invoice.status) }}
                  </el-tag>
                </div>
                <p class="item-meta">Mã: {{ invoice.invoiceCode }}</p>
                <p class="item-amount">
                  {{ formatCurrency(invoice.totalAmount) }}
                </p>
              </div>
            </div>
            <el-button type="success" @click="payInvoice(invoice.id)">
              Thu tiền
            </el-button>
          </article>
        </div>
      </section>

      <section class="panel-card warning-panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Thuốc sắp hết hạn</h2>
            <p class="panel-subtitle">
              Dữ liệu lấy từ báo cáo tồn kho cảnh báo hết hạn
            </p>
          </div>
          <el-button plain @click="goToInventoryReport">Xem báo cáo</el-button>
        </div>

        <div v-if="visibleExpiringMedicines.length === 0" class="empty-state">
          <svg
            class="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p>Không có thuốc sắp hết hạn</p>
        </div>

        <div v-else class="list-stack">
          <article
            v-for="medicine in visibleExpiringMedicines"
            :key="medicine.batchId"
            class="list-item warning-item"
          >
            <div class="item-main">
              <div class="item-avatar warning-avatar">
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div class="item-content">
                <div class="item-row">
                  <p class="item-title">{{ medicine.medicineName }}</p>
                  <el-tag
                    :type="
                      medicine.warningType === 'EXPIRED' ? 'danger' : 'warning'
                    "
                    effect="light"
                    round
                  >
                    {{
                      medicine.warningType === "EXPIRED"
                        ? "Đã hết hạn"
                        : "Sắp hết hạn"
                    }}
                  </el-tag>
                </div>
                <p class="item-meta">Lô: {{ medicine.batchNo || "N/A" }}</p>
                <p class="item-meta">
                  Hạn dùng: {{ formatDate(medicine.expiryDate) }} • Còn lại:
                  {{ medicine.quantityRemaining }}
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { invoiceApi } from "@/api/invoice";
import { inventoryApi } from "@/api/inventory";
import { notification } from "@/utils/notification";
import type { Invoice, InvoiceStatus } from "@/types/invoice";
import type { BatchExpiryWarning } from "@/types/inventory";

const router = useRouter();

const loading = ref(false);
const selectedDate = ref(new Date().toISOString().split("T")[0]);
const pendingInvoices = ref<Invoice[]>([]);
const expiringMedicines = ref<BatchExpiryWarning[]>([]);

const pendingInvoiceCount = computed(() => pendingInvoices.value.length);
const expiringMedicineCount = computed(() => expiringMedicines.value.length);
const visiblePendingInvoices = computed(() =>
  pendingInvoices.value.slice(0, 6),
);
const visibleExpiringMedicines = computed(() =>
  expiringMedicines.value.slice(0, 6),
);

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value || 0);
};

const formatDate = (value?: string) => {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("vi-VN");
};

const getInvoiceStatusLabel = (status: InvoiceStatus) => {
  switch (status) {
    case "ISSUED":
      return "Chờ thanh toán";
    case "PARTIALLY_PAID":
      return "Thanh toán 1 phần";
    default:
      return status;
  }
};

const createDayRange = (date: string) => ({
  fromDate: `${date}T00:00:00Z`,
  toDate: `${date}T23:59:59Z`,
});

const loadPendingInvoices = async () => {
  const { fromDate, toDate } = createDayRange(selectedDate.value);

  const [issuedResponse, partiallyPaidResponse] = await Promise.all([
    invoiceApi.search({
      status: "ISSUED",
      fromDate,
      toDate,
      page: 0,
      size: 50,
    }),
    invoiceApi.search({
      status: "PARTIALLY_PAID",
      fromDate,
      toDate,
      page: 0,
      size: 50,
    }),
  ]);

  pendingInvoices.value = [
    ...(issuedResponse.content || []),
    ...(partiallyPaidResponse.content || []),
  ].sort((left, right) => {
    return (
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    );
  });
};

const loadExpiringMedicines = async () => {
  const response = await inventoryApi.expiryWarnings({ nearDays: 30 });
  expiringMedicines.value = (response || []).sort((left, right) => {
    return (
      new Date(left.expiryDate).getTime() - new Date(right.expiryDate).getTime()
    );
  });
};

const loadData = async () => {
  loading.value = true;
  try {
    await Promise.all([loadPendingInvoices(), loadExpiringMedicines()]);
  } catch (error: any) {
    notification.error(error?.message || "Không thể tải dashboard thu ngân");
  } finally {
    loading.value = false;
  }
};

const goToInvoices = () => {
  router.push({ name: "Invoices" });
};

const goToInventoryReport = () => {
  router.push({ name: "InventoryReport" });
};

const payInvoice = (id: string) => {
  router.push({
    name: "InvoiceDetail",
    params: { id },
    query: { action: "pay" },
  });
};

onMounted(() => {
  loadData();
});
</script>

<style scoped lang="scss">
.dashboard-modern {
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.dashboard-title {
  margin: 0;
  font-size: clamp(2rem, 3vw, 2.75rem);
  font-weight: 800;
  color: #0f172a;
}

.dashboard-subtitle {
  margin: 0.5rem 0 0;
  color: #64748b;
  font-size: 0.975rem;
}

.date-filter-card {
  background: linear-gradient(135deg, #f0fdfa 0%, #ffffff 100%);
  padding: 1rem 1.25rem;
  border-radius: 18px;
  border: 1px solid #99f6e4;
  min-width: 250px;
}

.date-filter-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.date-filter-label {
  font-size: 0.875rem;
  font-weight: 700;
  color: #0f766e;
}

.date-picker-modern {
  width: 100%;

  :deep(.el-input__wrapper) {
    border-radius: 12px;
    box-shadow: none;
    border: 1px solid #bae6fd;
    padding: 8px 12px;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.25rem;
  margin-bottom: 1.25rem;
}

.stat-card,
.panel-card {
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 22px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.06);
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
}

.stat-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.invoice-card .stat-icon-wrapper {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
}

.medicine-card .stat-icon-wrapper {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
}

.stat-label {
  color: #64748b;
  font-size: 0.95rem;
  margin-bottom: 0.35rem;
}

.stat-value {
  font-size: 1.9rem;
  line-height: 1;
  font-weight: 800;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.25rem;
}

.panel-card {
  padding: 1.5rem;
}

.warning-panel {
  background: linear-gradient(180deg, #fffdf7 0%, #ffffff 100%);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.panel-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
}

.panel-subtitle {
  margin: 0.35rem 0 0;
  color: #64748b;
  font-size: 0.9rem;
}

.list-stack {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  max-height: 560px;
  overflow-y: auto;
}

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 18px;
}

.invoice-item {
  border: 1px solid #dbeafe;
  background: linear-gradient(135deg, #f8fbff 0%, #ffffff 100%);
}

.warning-item {
  border: 1px solid #fde68a;
  background: linear-gradient(135deg, #fff7ed 0%, #ffffff 100%);
}

.item-main {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  min-width: 0;
  flex: 1;
}

.item-avatar {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  flex-shrink: 0;
}

.invoice-avatar {
  background: linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%);
  color: #0f766e;
}

.warning-avatar {
  background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%);
  color: #c2410c;
}

.item-content {
  min-width: 0;
  flex: 1;
}

.item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.25rem;
}

.item-title {
  margin: 0;
  font-size: 0.96rem;
  font-weight: 700;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-meta {
  margin: 0.15rem 0 0;
  color: #64748b;
  font-size: 0.85rem;
}

.item-amount {
  margin: 0.35rem 0 0;
  color: #0f766e;
  font-weight: 800;
  font-size: 0.95rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem 1rem;
  text-align: center;
  color: #94a3b8;
}

@media (max-width: 960px) {
  .stats-grid,
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>
