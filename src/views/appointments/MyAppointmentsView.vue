<template>
  <div class="my-appointments-container">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Lịch hẹn của tôi</h1>
        <p class="page-subtitle">Quản lý lịch khám bệnh của bác sĩ</p>
      </div>
      <div class="flex gap-2">
        <el-date-picker
          v-model="selectedDate"
          type="date"
          placeholder="Chọn ngày"
          format="DD/MM/YYYY"
          value-format="YYYY-MM-DD"
          @change="loadMyAppointments"
        />
      </div>
    </div>

    <!-- Shift Tabs -->
    <div class="tabs-card">
      <div class="shift-toggle">
        <button
          type="button"
          class="shift-btn morning"
          :class="{ active: activeShift === 'MORNING' }"
          @click="activeShift = 'MORNING'"
        >
          <el-icon><Sunrise /></el-icon>
          <span>Ca sáng</span>
          <span v-if="morningCount > 0" class="shift-count">{{
            morningCount
          }}</span>
        </button>

        <button
          type="button"
          class="shift-btn afternoon"
          :class="{ active: activeShift === 'AFTERNOON' }"
          @click="activeShift = 'AFTERNOON'"
        >
          <el-icon><Sunset /></el-icon>
          <span>Ca chiều</span>
          <span v-if="afternoonCount > 0" class="shift-count">{{
            afternoonCount
          }}</span>
        </button>
      </div>
    </div>

    <!-- Appointments List -->
    <div class="appointments-grid">
      <div v-if="loading" class="flex justify-center items-center py-12">
        <el-icon class="is-loading" :size="40"><Loading /></el-icon>
      </div>

      <div v-else-if="filteredAppointments.length === 0" class="empty-state">
        <el-empty description="Không có lịch hẹn nào" />
      </div>

      <div
        v-else
        v-for="appointment in filteredAppointments"
        :key="appointment.id"
        class="appointment-card"
        :class="`status-${appointment.status.toLowerCase()}`"
      >
        <div class="appointment-header">
          <div class="appointment-code">
            <el-icon><Ticket /></el-icon>
            <span>{{ appointment.appointmentCode }}</span>
          </div>
          <el-tag :type="getStatusType(appointment.status)" size="small">
            {{ getStatusText(appointment.status) }}
          </el-tag>
        </div>

        <div class="appointment-body">
          <div class="patient-info">
            <el-avatar
              :size="48"
              class="bg-gradient-to-br from-teal-500 to-teal-600"
            >
              {{ appointment.patientName?.[0] || "?" }}
            </el-avatar>
            <div class="patient-details">
              <h3 class="patient-name">{{ appointment.patientName }}</h3>
              <p class="appointment-time">
                {{ formatDate(appointment.workDate) }} -
                {{ appointment.shift === "MORNING" ? "Ca sáng" : "Ca chiều" }}
              </p>
            </div>
          </div>

          <div v-if="appointment.note" class="appointment-note">
            <el-icon><DocumentCopy /></el-icon>
            <span>{{ appointment.note }}</span>
          </div>
        </div>

        <div class="appointment-actions">
          <el-button
            v-if="canReschedule(appointment)"
            type="info"
            size="default"
            @click="rescheduleAppointment(appointment)"
            :loading="actionLoading === appointment.id"
          >
            <el-icon><Calendar /></el-icon>
            Dời lịch
          </el-button>

          <el-button
            v-if="canCancelChain(appointment)"
            type="danger"
            size="default"
            plain
            @click="cancelAppointmentChain(appointment)"
            :loading="actionLoading === appointment.id"
          >
            <el-icon><Delete /></el-icon>
            Hủy chuỗi hẹn
          </el-button>

          <el-button
            v-if="
              appointment.status === 'ASSIGNED' &&
              isAppointmentDateReached(appointment.workDate)
            "
            type="success"
            size="default"
            @click="startAppointment(appointment)"
            :loading="actionLoading === appointment.id"
          >
            <el-icon><VideoPlay /></el-icon>
            Bắt đầu khám
          </el-button>

          <el-button
            v-if="
              appointment.status === 'IN_PROGRESS' &&
              isAppointmentDateReached(appointment.workDate)
            "
            type="primary"
            size="default"
            @click="goToMedicalRecord(appointment)"
          >
            <el-icon><Edit /></el-icon>
            Tạo phiếu khám
          </el-button>

          <el-button
            v-if="
              appointment.status === 'IN_PROGRESS' &&
              isAppointmentDateReached(appointment.workDate)
            "
            type="warning"
            size="default"
            @click="finishAppointment(appointment)"
            :loading="actionLoading === appointment.id"
          >
            <el-icon><Check /></el-icon>
            Kết thúc khám
          </el-button>

          <el-button
            v-if="appointment.status === 'DONE'"
            type="info"
            size="default"
            @click="viewMedicalRecord(appointment)"
          >
            <el-icon><View /></el-icon>
            Xem phiếu khám
          </el-button>

          <el-tag
            v-if="
              !isAppointmentDateReached(appointment.workDate) &&
              appointment.status !== 'DONE' &&
              appointment.status !== 'CANCELLED'
            "
            type="warning"
            size="large"
          >
            <el-icon><Clock /></el-icon>
            Chưa đến ngày khám
          </el-tag>
        </div>
      </div>
    </div>

    <!-- Medical Record Dialog -->
    <MedicalRecordFormDialog
      v-model="medicalRecordDialogVisible"
      :preset-patient-id="presetPatientId"
      :appointment-id="selectedAppointmentId"
      @success="handleMedicalRecordSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Sunrise,
  Sunset,
  Loading,
  Ticket,
  DocumentCopy,
  VideoPlay,
  Edit,
  Check,
  View,
  Clock,
  Calendar,
  Delete,
} from "@element-plus/icons-vue";
import { appointmentApi } from "@/api/appointment";
import { useAuthStore } from "@/stores/auth";
import type { Appointment, WorkShift } from "@/types";
import MedicalRecordFormDialog from "@/views/medical-records/components/MedicalRecordFormDialog.vue";

const router = useRouter();
const authStore = useAuthStore();

// State
const loading = ref(false);
const actionLoading = ref<string | null>(null);
const appointments = ref<Appointment[]>([]);
const selectedDate = ref(new Date().toISOString().split("T")[0]);
const activeShift = ref<WorkShift>("MORNING");

// Medical Record Dialog State
const medicalRecordDialogVisible = ref(false);
const presetPatientId = ref<string>();
const selectedAppointmentId = ref<string>();

// Computed
const morningAppointments = computed(() =>
  appointments.value.filter((a) => a.shift === "MORNING"),
);

const afternoonAppointments = computed(() =>
  appointments.value.filter((a) => a.shift === "AFTERNOON"),
);

const morningCount = computed(() => morningAppointments.value.length);
const afternoonCount = computed(() => afternoonAppointments.value.length);

const filteredAppointments = computed(() => {
  return activeShift.value === "MORNING"
    ? morningAppointments.value
    : afternoonAppointments.value;
});

// Watch dialog close to reset preset values
watch(medicalRecordDialogVisible, (isVisible) => {
  if (!isVisible) {
    // Reset when dialog closes
    setTimeout(() => {
      presetPatientId.value = undefined;
      selectedAppointmentId.value = undefined;
    }, 300);
  }
});

// Helper function to check if appointment date has arrived
const isAppointmentDateReached = (workDate: string) => {
  const appointmentDate = new Date(workDate);
  const today = new Date();
  // Set time to start of day for comparison
  appointmentDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return appointmentDate <= today;
};

const canReschedule = (appointment: Appointment) => {
  return appointment.status !== "DONE" && appointment.status !== "CANCELLED";
};

const canCancelChain = (appointment: Appointment) => {
  if (appointment.status === "DONE" || appointment.status === "CANCELLED") {
    return false;
  }

  const sequenceNo = (appointment as any).sequenceNo;
  const parentId = (appointment as any).parentId;

  return (
    Boolean(parentId) || (typeof sequenceNo === "number" && sequenceNo > 1)
  );
};

// Methods
const loadMyAppointments = async () => {
  if (!authStore.user?.id) return;

  try {
    loading.value = true;
    const response = await appointmentApi.search({
      date: selectedDate.value,
      doctorId: authStore.user.id,
      sort: "createdAt,desc",
      page: 0,
      size: 100,
    });
    appointments.value = response.content;
  } catch (error: any) {
    ElMessage.error(error.message || "Không thể tải lịch hẹn");
  } finally {
    loading.value = false;
  }
};

const startAppointment = async (appointment: Appointment) => {
  try {
    await ElMessageBox.confirm(
      `Bắt đầu khám cho bệnh nhân ${appointment.patientName}?`,
      "Xác nhận",
      {
        confirmButtonText: "Bắt đầu",
        cancelButtonText: "Hủy",
        type: "info",
      },
    );

    actionLoading.value = appointment.id;
    await appointmentApi.start(appointment.id);
    ElMessage.success("Đã bắt đầu khám bệnh");
    
    // Nếu lịch khám có kế hoạch điều trị, mở kế hoạch đó
    if (appointment.treatmentPlanId) {
      router.push(`/treatment-plans/${appointment.treatmentPlanId}`);
    } else {
      loadMyAppointments();
    }
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(error.message || "Không thể bắt đầu khám");
    }
  } finally {
    actionLoading.value = null;
  }
};

const finishAppointment = async (appointment: Appointment) => {
  try {
    await ElMessageBox.confirm(
      `Kết thúc khám cho bệnh nhân ${appointment.patientName}?`,
      "Xác nhận",
      {
        confirmButtonText: "Kết thúc",
        cancelButtonText: "Hủy",
        type: "warning",
      },
    );

    actionLoading.value = appointment.id;
    await appointmentApi.finish(appointment.id);
    ElMessage.success("Đã kết thúc khám bệnh");
    loadMyAppointments();
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(error.message || "Không thể kết thúc khám");
    }
  } finally {
    actionLoading.value = null;
  }
};

const rescheduleAppointment = async (appointment: Appointment) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().slice(0, 10);

  try {
    const result = await ElMessageBox.prompt(
      `Nhập ngày mới cho lịch hẹn ${appointment.appointmentCode} (YYYY-MM-DD)`,
      "Dời lịch hẹn",
      {
        confirmButtonText: "Dời lịch",
        cancelButtonText: "Hủy",
        inputValue: defaultDate,
        inputPlaceholder: "YYYY-MM-DD",
        inputPattern: /^\d{4}-\d{2}-\d{2}$/,
        inputErrorMessage: "Ngày không đúng định dạng YYYY-MM-DD",
      },
    );

    const value =
      typeof result === "object" && "value" in result
        ? String((result as any).value)
        : "";

    actionLoading.value = appointment.id;
    await appointmentApi.reschedule(appointment.id, value);
    ElMessage.success("Dời lịch hẹn thành công");
    loadMyAppointments();
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(error.message || "Không thể dời lịch hẹn");
    }
  } finally {
    actionLoading.value = null;
  }
};

const cancelAppointmentChain = async (appointment: Appointment) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc muốn hủy toàn bộ chuỗi follow-up của lịch ${appointment.appointmentCode}?`,
      "Xác nhận hủy chuỗi",
      {
        confirmButtonText: "Hủy chuỗi",
        cancelButtonText: "Đóng",
        type: "warning",
      },
    );

    actionLoading.value = appointment.id;
    await appointmentApi.cancel(appointment.id, undefined, true);
    ElMessage.success("Đã hủy chuỗi lịch follow-up");
    loadMyAppointments();
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(error.message || "Không thể hủy chuỗi lịch");
    }
  } finally {
    actionLoading.value = null;
  }
};

const goToMedicalRecord = (appointment: Appointment) => {
  presetPatientId.value = appointment.patientId;
  selectedAppointmentId.value = appointment.id;
  medicalRecordDialogVisible.value = true;
};

const handleMedicalRecordSuccess = (recordId?: string) => {
  medicalRecordDialogVisible.value = false;
  presetPatientId.value = undefined;
  selectedAppointmentId.value = undefined;
  ElMessage.success("Tạo phiếu khám thành công");
  
  // Navigate to medical record detail if ID provided
  if (recordId) {
    router.push(`/medical-records/${recordId}`);
  } else {
    loadMyAppointments();
  }
};

const viewMedicalRecord = (appointment: Appointment) => {
  // Navigate to medical records page with filters
  router.push({
    path: "/medical-records",
    query: {
      patientId: appointment.patientId,
      date: appointment.workDate,
    },
  });
};

const formatDate = (date: string) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("vi-VN");
};

const getStatusType = (status: string) => {
  const types: Record<string, any> = {
    WAITING: "info",
    ASSIGNED: "warning",
    IN_PROGRESS: "primary",
    DONE: "success",
    CANCELLED: "danger",
  };
  return types[status] || "info";
};

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    WAITING: "Chờ phân công",
    ASSIGNED: "Đã phân công",
    IN_PROGRESS: "Đang khám",
    DONE: "Hoàn thành",
    CANCELLED: "Đã hủy",
  };
  return texts[status] || status;
};

// Lifecycle
onMounted(() => {
  loadMyAppointments();
});
</script>

<style scoped lang="scss">
.my-appointments-container {
  padding: 24px;
  background: #f9fafb;
  min-height: calc(100vh - 64px);

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding: 20px 24px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    .page-title {
      font-size: 28px;
      font-weight: 700;
      background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin: 0 0 4px 0;
    }

    .page-subtitle {
      font-size: 14px;
      color: #6b7280;
      margin: 0;
    }

    :deep(.el-date-editor) {
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
  }

  .tabs-card {
    background: white;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    margin-bottom: 24px;

    .shift-toggle {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .shift-btn {
      min-height: 44px;
      padding: 0 18px;
      border: 2px solid #cbd5e1;
      border-radius: 12px;
      background: #fff;
      color: #475569;
      font-size: 16px;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      transition: all 0.2s ease;

      .shift-count {
        min-width: 20px;
        height: 20px;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 700;
        padding: 0 6px;
        background: #e2e8f0;
        color: #0f172a;
      }

      &.morning:hover {
        border-color: #06b6d4;
        color: #0891b2;
        background: #ecfeff;
      }

      &.morning.active {
        border-color: #06b6d4;
        background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
        color: #fff;
        box-shadow: 0 4px 10px rgba(6, 182, 212, 0.25);

        .shift-count {
          background: rgba(255, 255, 255, 0.25);
          color: #fff;
        }
      }

      &.afternoon:hover {
        border-color: #f59e0b;
        color: #b45309;
        background: #fef3c7;
      }

      &.afternoon.active {
        border-color: #f59e0b;
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: #fff;
        box-shadow: 0 4px 10px rgba(245, 158, 11, 0.28);

        .shift-count {
          background: rgba(255, 255, 255, 0.25);
          color: #fff;
        }
      }
    }
  }

  .appointments-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 20px;

    .empty-state {
      grid-column: 1 / -1;
      padding: 60px 20px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
  }

  .appointment-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border-left: 4px solid #e5e7eb;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 4px 12px rgba(20, 184, 166, 0.15);
      transform: translateY(-2px);
      border-left-color: #14b8a6;
    }

    &.status-assigned {
      border-left-color: #f59e0b;
    }

    &.status-in_progress {
      border-left-color: #14b8a6;
    }

    &.status-done {
      border-left-color: #10b981;
    }

    .appointment-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      .appointment-code {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        color: #14b8a6;
        font-family: monospace;
        font-size: 16px;
      }
    }

    .appointment-body {
      margin-bottom: 16px;

      .patient-info {
        display: flex;
        gap: 12px;
        margin-bottom: 12px;

        .patient-details {
          flex: 1;

          .patient-name {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin: 0 0 4px 0;
          }

          .appointment-time {
            font-size: 14px;
            color: #6b7280;
            margin: 0;
          }
        }
      }

      .appointment-note {
        display: flex;
        align-items: start;
        gap: 8px;
        padding: 12px;
        background: #f0fdfa;
        border-radius: 8px;
        font-size: 14px;
        color: #4b5563;
        border: 1px solid #ccfbf1;
      }
    }

    .appointment-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;

      .el-button {
        flex: 1;
        min-width: 140px;
      }
    }
  }

  @media (max-width: 768px) {
    .tabs-card {
      .shift-toggle {
        width: 100%;
      }

      .shift-btn {
        flex: 1;
        justify-content: center;
      }
    }

    .appointments-grid {
      grid-template-columns: 1fr;
    }

    .appointment-actions .el-button {
      flex: 1 1 100%;
    }
  }
}
</style>
