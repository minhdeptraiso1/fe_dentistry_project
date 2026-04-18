<template>
  <div class="patient-dashboard">
    <div class="dashboard-header">
      <div class="flex items-center justify-between gap-6 flex-wrap">
        <div>
          <h1 class="text-4xl font-bold text-slate-900">Hồ sơ bệnh nhân</h1>
          <p class="text-slate-500 mt-2">
            Xem thông tin cá nhân, hóa đơn và hồ sơ khám
          </p>
        </div>
        <div class="header-chip">
          Cập nhật gần nhất:
          {{ formatDate(patient.updatedAt || patient.createdAt) }}
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
      <div class="lg:col-span-3 profile-card">
        <div class="flex items-start gap-8">
          <div class="flex-shrink-0">
            <el-avatar
              :size="120"
              :src="patient.avatar"
              class="bg-gradient-to-br from-teal-500 to-teal-600 ring-4 ring-teal-100"
            >
              {{ getInitials(patient.fullName) }}
            </el-avatar>
          </div>
          <div class="flex-1">
            <h2 class="text-3xl font-bold text-gray-900 mb-1">
              {{ patient.fullName }}
            </h2>
            <p class="text-teal-600 font-medium mb-6">
              {{ patient.patientCode }}
            </p>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <p class="text-gray-500 text-sm">Mã bệnh nhân</p>
                <p class="text-gray-900 font-medium">
                  {{ patient.patientCode }}
                </p>
              </div>
              <div>
                <p class="text-gray-500 text-sm">Điện thoại</p>
                <p class="text-gray-900 font-medium">{{ patient.phone }}</p>
              </div>
              <div>
                <p class="text-gray-500 text-sm">Ngày sinh</p>
                <p class="text-gray-900 font-medium">
                  {{ formatDate(patient.dob) }}
                </p>
              </div>
              <div>
                <p class="text-gray-500 text-sm">Giới tính</p>
                <p class="text-gray-900 font-medium">
                  {{ getGenderLabel(patient.gender) }}
                </p>
              </div>
              <div>
                <p class="text-gray-500 text-sm">Vai trò</p>
                <p class="text-gray-900 font-medium">Bệnh nhân</p>
              </div>
              <div class="col-span-2 md:col-span-1">
                <p class="text-gray-500 text-sm">Địa chỉ</p>
                <p class="text-gray-900 font-medium">
                  {{ patient.address || "N/A" }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="content-card">
      <div class="border-b border-gray-200">
        <div class="flex flex-wrap gap-2 p-3">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'tab-trigger',
              activeTab === tab.id
                ? 'tab-trigger-active'
                : 'tab-trigger-inactive',
            ]"
          >
            <component :is="tab.icon" class="w-5 h-5" />
            <span>{{ tab.label }}</span>
            <span class="tab-count">{{ getTabCount(tab.id) }}</span>
          </button>
        </div>
      </div>

      <div class="p-8" v-loading="loading">
        <div v-if="activeTab === 'invoices'" class="space-y-4">
          <div v-if="invoices.length === 0" class="empty-state">
            <svg
              class="w-16 h-16 mx-auto text-gray-300 mb-4"
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
            <p class="text-gray-500">Chưa có hóa đơn nào</p>
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="invoice in invoices"
              :key="invoice.id"
              class="list-card list-card-invoice"
              @click="viewInvoiceDetail(invoice.id)"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <p class="list-label">Mã hóa đơn</p>
                  <h3 class="font-semibold text-gray-900 text-lg">
                    {{ invoice.invoiceCode }}
                  </h3>
                  <p class="text-sm text-gray-500 mt-1">
                    {{ formatDate(invoice.issuedAt) }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="list-label">Tổng tiền</p>
                  <p class="font-semibold text-gray-900 text-lg">
                    {{ formatCurrency(invoice.totalAmount) }}
                  </p>
                  <el-tag
                    :type="getInvoiceStatusType(invoice.status)"
                    effect="light"
                    class="mt-2"
                  >
                    {{ getInvoiceStatusLabel(invoice.status) }}
                  </el-tag>
                </div>
              </div>

              <div class="payment-progress mt-4">
                <div
                  class="payment-progress-fill"
                  :style="{ width: `${getPaidPercent(invoice)}%` }"
                ></div>
              </div>

              <div class="invoice-actions mt-4" @click.stop>
                <el-button
                  v-if="canPayInvoice(invoice)"
                  class="pay-vnpay-btn"
                  :loading="payingInvoiceId === invoice.id"
                  @click.stop="startVnPayPayment(invoice.id)"
                >
                  <el-icon><Wallet /></el-icon>
                  Thanh toan VNPAY
                </el-button>
                <span v-else class="invoice-paid-note"
                  >Khong can thanh toan them</span
                >
              </div>

              <div class="mt-4 flex items-center gap-4">
                <div class="flex-1">
                  <p class="text-xs text-gray-500">Đã thanh toán</p>
                  <p class="text-sm font-medium text-gray-900">
                    {{ formatCurrency(invoice.paidAmount) }} /
                    {{ formatCurrency(invoice.totalAmount) }}
                  </p>
                </div>
                <div class="flex-1">
                  <p class="text-xs text-gray-500">Còn lại</p>
                  <p class="text-sm font-medium text-rose-600">
                    {{ formatCurrency(getRemainingAmount(invoice)) }}
                  </p>
                </div>
                <div class="text-sm font-medium text-teal-700">
                  Xem chi tiết
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'medical-records'" class="space-y-4">
          <div v-if="medicalRecords.length === 0" class="empty-state">
            <svg
              class="w-16 h-16 mx-auto text-gray-300 mb-4"
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
            <p class="text-gray-500">Chưa có hồ sơ khám nào</p>
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="record in medicalRecords"
              :key="record.id"
              class="list-card list-card-medical"
              @click="viewMedicalRecordDetail(record.id)"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <p class="list-label">Mã hồ sơ khám</p>
                  <h3 class="font-semibold text-gray-900 text-lg">
                    {{ record.recordCode }}
                  </h3>
                  <p class="text-sm text-gray-500 mt-1">
                    Bác sĩ:
                    <span class="text-gray-700">{{
                      record.doctorUsername
                    }}</span>
                  </p>
                  <p class="text-sm text-gray-500">
                    Ngày khám: {{ formatDate(record.visitDate) }}
                  </p>
                </div>
              </div>
              <div
                v-if="record.symptom || record.diagnosis"
                class="mt-4 space-y-3 bg-gray-50 p-3 rounded-xl border border-gray-200"
              >
                <div v-if="record.symptom">
                  <p class="text-xs font-medium text-gray-600 uppercase">
                    Triệu chứng
                  </p>
                  <p class="text-sm text-gray-700">{{ record.symptom }}</p>
                </div>
                <div v-if="record.diagnosis">
                  <p class="text-xs font-medium text-gray-600 uppercase">
                    Chẩn đoán
                  </p>
                  <p class="text-sm text-gray-700">{{ record.diagnosis }}</p>
                </div>
              </div>
              <div class="mt-4 text-sm font-medium text-teal-700">
                Xem chi tiết hồ sơ
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'prescriptions'" class="space-y-4">
          <div v-if="prescriptions.length === 0" class="empty-state">
            <svg
              class="w-16 h-16 mx-auto text-gray-300 mb-4"
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
            <p class="text-gray-500">Chưa có đơn thuốc nào</p>
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="prescription in prescriptions"
              :key="prescription.id"
              class="list-card list-card-prescription"
              @click="viewPrescriptionDetail(prescription.id)"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <p class="list-label">Mã đơn thuốc</p>
                  <h3 class="font-semibold text-gray-900 text-lg">
                    {{ prescription.prescriptionCode }}
                  </h3>
                  <p class="text-sm text-gray-500 mt-1">
                    Bác sĩ: {{ prescription.doctorUsername }}
                  </p>
                </div>
                <el-tag :type="getPrescriptionStatusType(prescription.status)">
                  {{ getPrescriptionStatusLabel(prescription.status) }}
                </el-tag>
              </div>
              <p class="text-sm text-gray-500 mt-2">
                {{ formatDate(prescription.createdAt) }}
              </p>
              <p
                v-if="prescription.note"
                class="text-sm text-gray-700 mt-3 bg-gray-50 border border-gray-200 p-3 rounded-xl"
              >
                {{ prescription.note }}
              </p>
              <div class="mt-4 text-sm font-medium text-teal-700">
                Xem chi tiết đơn thuốc
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <InvoiceDetailDialog
      v-model="invoiceDetailVisible"
      :loading="invoiceDetailLoading"
      :invoice="selectedInvoiceDetail"
      :close-on-click-modal="true"
    />

    <MedicalRecordDetailDialog
      v-model="medicalRecordDetailVisible"
      :loading="medicalRecordDetailLoading"
      :record="selectedMedicalRecordDetail"
      :patient-code="patient.patientCode"
      :close-on-click-modal="true"
    />

    <PrescriptionDetailDialog
      v-model="prescriptionDetailVisible"
      :loading="prescriptionDetailLoading"
      :prescription="selectedPrescriptionDetail"
      :close-on-click-modal="true"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Tickets, Document, Reading, Wallet } from "@element-plus/icons-vue";
import { patientApi } from "@/api/patient";
import {
  paymentApi,
  VNPAY_INVOICE_ID_KEY,
  VNPAY_RETURN_TO_KEY,
} from "@/api/payment";
import { notification } from "@/utils/notification";
import InvoiceDetailDialog from "./components/InvoiceDetailDialog.vue";
import MedicalRecordDetailDialog from "./components/MedicalRecordDetailDialog.vue";
import PrescriptionDetailDialog from "./components/PrescriptionDetailDialog.vue";
import type {
  PatientResponse,
  InvoiceDetailResponse,
  InvoiceMyResponse,
  MedicalRecordResponse,
  PrescriptionResponse,
} from "@/types/patient";

const activeTab = ref("invoices");
const loading = ref(false);
const invoiceDetailVisible = ref(false);
const invoiceDetailLoading = ref(false);
const selectedInvoiceDetail = ref<InvoiceDetailResponse | null>(null);
const medicalRecordDetailVisible = ref(false);
const medicalRecordDetailLoading = ref(false);
const selectedMedicalRecordDetail = ref<MedicalRecordResponse | null>(null);
const prescriptionDetailVisible = ref(false);
const prescriptionDetailLoading = ref(false);
const selectedPrescriptionDetail = ref<PrescriptionResponse | null>(null);
const payingInvoiceId = ref<string | null>(null);

const patient = ref<PatientResponse>({
  id: "",
  patientCode: "",
  fullName: "",
  phone: "",
  createdAt: "",
  updatedAt: "",
});

const invoices = ref<InvoiceMyResponse[]>([]);
const medicalRecords = ref<MedicalRecordResponse[]>([]);
const prescriptions = ref<PrescriptionResponse[]>([]);

const tabs = [
  { id: "invoices", label: "Hóa đơn", icon: Tickets },
  { id: "medical-records", label: "Hồ sơ khám", icon: Document },
  { id: "prescriptions", label: "Đơn thuốc", icon: Reading },
];

const getTabCount = (tabId: string) => {
  if (tabId === "invoices") return invoices.value.length;
  if (tabId === "medical-records") return medicalRecords.value.length;
  if (tabId === "prescriptions") return prescriptions.value.length;
  return 0;
};

const toArray = <T,>(payload: any): T[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const normalizePatient = (payload: any): PatientResponse => ({
  id: payload?.id || "",
  patientCode: payload?.patientCode || payload?.code || "",
  fullName: payload?.fullName || "",
  phone: payload?.phone || "",
  dob: payload?.dob || payload?.dateOfBirth || undefined,
  gender: payload?.gender,
  address: payload?.address || "",
  note: payload?.note || "",
  avatar: payload?.avatar || undefined,
  createdAt: payload?.createdAt || "",
  updatedAt: payload?.updatedAt || "",
});

const loadData = async () => {
  try {
    loading.value = true;

    const [profileRes, invoicesRes, recordsRes, prescriptionsRes] =
      await Promise.allSettled([
        patientApi.getMyProfile(),
        patientApi.getMyInvoices(),
        patientApi.getMyMedicalRecords(),
        patientApi.getMyPrescriptions(),
      ]);

    if (profileRes.status === "fulfilled" && profileRes.value) {
      patient.value = normalizePatient(profileRes.value);
    }

    invoices.value =
      invoicesRes.status === "fulfilled"
        ? toArray<InvoiceMyResponse>(invoicesRes.value)
        : [];
    medicalRecords.value =
      recordsRes.status === "fulfilled"
        ? toArray<MedicalRecordResponse>(recordsRes.value)
        : [];
    prescriptions.value =
      prescriptionsRes.status === "fulfilled"
        ? toArray<PrescriptionResponse>(prescriptionsRes.value)
        : [];

    const hasFailedRequest =
      profileRes.status === "rejected" ||
      invoicesRes.status === "rejected" ||
      recordsRes.status === "rejected" ||
      prescriptionsRes.status === "rejected";

    if (hasFailedRequest) {
      notification.warning("Một số dữ liệu chưa tải được. Vui lòng thử lại.");
    }
  } catch (error: any) {
    console.error("Error loading patient data:", error);
    notification.error("Lỗi khi tải dữ liệu. Vui lòng thử lại.");
  } finally {
    loading.value = false;
  }
};

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

const getPaidPercent = (invoice: InvoiceMyResponse) => {
  const total = Number(invoice.totalAmount) || 0;
  const paid = Number(invoice.paidAmount) || 0;
  if (!total || total <= 0) return 0;
  return Math.min(Math.max(Math.round((paid / total) * 100), 0), 100);
};

const canPayInvoice = (invoice: InvoiceMyResponse) => {
  const status = String(invoice.status || "");
  return (
    getRemainingAmount(invoice) > 0 &&
    status !== "PAID" &&
    status !== "CANCELLED" &&
    status !== "DRAFT"
  );
};

const startVnPayPayment = async (invoiceId: string) => {
  try {
    payingInvoiceId.value = invoiceId;

    const returnTo = window.location.pathname + window.location.search;
    localStorage.setItem(VNPAY_RETURN_TO_KEY, returnTo);
    localStorage.setItem(VNPAY_INVOICE_ID_KEY, invoiceId);

    const paymentRes = await paymentApi.createVnPayPayment({
      invoiceId,
      language: "vn",
    });

    if (!paymentRes?.paymentUrl) {
      throw new Error("Khong tao duoc link thanh toan VNPAY");
    }

    // Same-tab redirect so user does not open a new browser tab.
    window.location.assign(paymentRes.paymentUrl);
  } catch (error: any) {
    notification.error(error?.message || "Khong the khoi tao thanh toan VNPAY");
  } finally {
    payingInvoiceId.value = null;
  }
};

const getGenderLabel = (gender?: string) => {
  const labels: Record<string, string> = {
    MALE: "Nam",
    FEMALE: "Nữ",
    OTHER: "Khác",
    Nam: "Nam",
    Nữ: "Nữ",
    Nu: "Nữ",
  };
  return labels[gender || ""] || "N/A";
};

const getInitials = (fullName: string) => {
  if (!fullName?.trim()) return "BN";
  return fullName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
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

const viewInvoiceDetail = (invoiceId: string) => {
  invoiceDetailLoading.value = true;
  selectedInvoiceDetail.value = null;
  invoiceDetailVisible.value = true;

  patientApi
    .getMyInvoiceDetail(invoiceId)
    .then((res) => {
      selectedInvoiceDetail.value = res;
    })
    .catch((error: any) => {
      invoiceDetailVisible.value = false;
      notification.error(
        error?.message || "Không thể tải chi tiết hóa đơn. Vui lòng thử lại.",
      );
    })
    .finally(() => {
      invoiceDetailLoading.value = false;
    });
};

const viewMedicalRecordDetail = (recordId: string) => {
  medicalRecordDetailLoading.value = true;
  selectedMedicalRecordDetail.value = null;
  medicalRecordDetailVisible.value = true;

  patientApi
    .getMyMedicalRecordDetail(recordId)
    .then((res) => {
      selectedMedicalRecordDetail.value = res;
    })
    .catch((error: any) => {
      medicalRecordDetailVisible.value = false;
      notification.error(
        error?.message ||
          "Không thể tải chi tiết hồ sơ khám. Vui lòng thử lại.",
      );
    })
    .finally(() => {
      medicalRecordDetailLoading.value = false;
    });
};

const viewPrescriptionDetail = (prescriptionId: string) => {
  prescriptionDetailLoading.value = true;
  selectedPrescriptionDetail.value = null;
  prescriptionDetailVisible.value = true;

  patientApi
    .getMyPrescriptionDetail(prescriptionId)
    .then((res) => {
      selectedPrescriptionDetail.value = res;
    })
    .catch((error: any) => {
      prescriptionDetailVisible.value = false;
      notification.error(
        error?.message || "Không thể tải chi tiết đơn thuốc. Vui lòng thử lại.",
      );
    })
    .finally(() => {
      prescriptionDetailLoading.value = false;
    });
};

onMounted(() => {
  loadData();
});
</script>

<style scoped lang="postcss">
.patient-dashboard {
  @apply space-y-8;
}

.dashboard-header {
  @apply mb-8;
}

.header-chip {
  @apply inline-flex items-center rounded-2xl border border-teal-100 bg-teal-50 text-teal-700 px-4 py-2 text-sm font-medium;
}

.profile-card {
  @apply bg-white rounded-3xl shadow-lg p-8 border border-gray-100 relative overflow-hidden;
}

.profile-card::after {
  content: "";
  position: absolute;
  width: 240px;
  height: 240px;
  right: -90px;
  top: -120px;
  border-radius: 9999px;
  background: radial-gradient(
    circle,
    rgba(13, 148, 136, 0.12) 0%,
    rgba(13, 148, 136, 0) 70%
  );
  pointer-events: none;
}

.content-card {
  @apply bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden;
}

.tab-trigger {
  @apply px-5 py-3 rounded-xl font-medium text-sm whitespace-nowrap transition-all flex items-center gap-2 border;
}

.tab-trigger-active {
  @apply text-teal-700 border-teal-200 bg-teal-50 shadow-sm;
}

.tab-trigger-inactive {
  @apply text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50;
}

.tab-count {
  @apply ml-1 min-w-6 h-6 px-2 inline-flex items-center justify-center rounded-full bg-white/90 text-xs font-semibold text-teal-700 border border-teal-200;
}

.empty-state {
  @apply text-center py-12 rounded-2xl border border-dashed border-gray-200 bg-gray-50/70;
}

.list-card {
  @apply border rounded-2xl p-5 transition-all cursor-pointer;
}

.list-card:hover {
  @apply shadow-md -translate-y-0.5;
}

.list-card-invoice {
  @apply border-teal-100 bg-gradient-to-r from-teal-50/70 to-cyan-50/40;
}

.list-card-medical {
  @apply border-emerald-100 bg-gradient-to-r from-emerald-50/60 to-teal-50/30;
}

.list-card-prescription {
  @apply border-sky-100 bg-gradient-to-r from-sky-50/60 to-cyan-50/30;
}

.list-label {
  @apply text-[11px] font-semibold uppercase tracking-wide text-gray-500;
}

.payment-progress {
  @apply h-2.5 rounded-full bg-white/80 border border-teal-100 overflow-hidden;
}

.payment-progress-fill {
  @apply h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500;
}

.invoice-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.invoice-paid-note {
  font-size: 12px;
  color: #0f766e;
  font-weight: 600;
}

.pay-vnpay-btn {
  border: none !important;
  color: #ffffff !important;
  font-weight: 700;
  border-radius: 10px;
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 55%, #0284c7 100%);
  box-shadow: 0 10px 18px rgba(13, 148, 136, 0.28);
}

.pay-vnpay-btn:hover {
  opacity: 0.95;
}

.pay-vnpay-btn :deep(.el-icon) {
  margin-right: 6px;
}
</style>
