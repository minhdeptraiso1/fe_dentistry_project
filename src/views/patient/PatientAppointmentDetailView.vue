<template>
  <div class="appointment-detail-page">
    <div class="detail-hero">
      <div class="hero-left">
        <div class="hero-icon">
          <el-icon><Calendar /></el-icon>
        </div>
        <div>
          <h1 class="hero-title">Chi tiết lịch hẹn</h1>
          <p class="hero-subtitle">
            Theo dõi trạng thái, bác sĩ và lịch khám của bạn.
          </p>
        </div>
      </div>
      <div class="hero-actions">
        <button class="ghost-btn" @click="router.back()">
          <el-icon><ArrowLeft /></el-icon>
          <span>Quay lại</span>
        </button>
        <button
          v-if="appointment && canCancel"
          class="danger-btn"
          :disabled="submitting"
          @click="handleCancel"
        >
          <el-icon><Close /></el-icon>
          <span>{{ submitting ? "Đang hủy..." : "Hủy lịch hẹn" }}</span>
        </button>
      </div>
    </div>

    <div class="detail-card">
      <div v-if="loading" class="detail-loading">
        Đang tải thông tin lịch hẹn...
      </div>

      <div v-else-if="appointment" class="detail-content">
        <div class="detail-summary">
          <div class="summary-item">
            <span class="summary-label">Mã lịch hẹn</span>
            <span class="summary-value code">{{ appointment.appointmentCode }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Trạng thái</span>
            <el-tag :type="getStatusType(appointment.status)">
              {{ getStatusText(appointment.status) }}
            </el-tag>
          </div>
        </div>

        <div class="detail-grid">
          <div class="detail-row">
            <span class="detail-label">Ngày khám</span>
            <span class="detail-value">{{ formatDate(appointment.workDate) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Ca khám</span>
            <span class="detail-value">
              {{ appointment.shift === "MORNING" ? "Ca sáng" : "Ca chiều" }}
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Bác sĩ</span>
            <span class="detail-value">{{ getDoctorDisplayName(appointment) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Ngày tạo</span>
            <span class="detail-value">{{ formatDateTime(appointment.createdAt) }}</span>
          </div>
        </div>

        <div v-if="appointment.note" class="detail-note">
          <span class="detail-label">Ghi chú</span>
          <span class="detail-value">{{ appointment.note }}</span>
        </div>
        <div v-if="appointment.cancellationNote" class="detail-note danger">
          <span class="detail-label">Lý do hủy</span>
          <span class="detail-value">{{ appointment.cancellationNote }}</span>
        </div>
      </div>

      <div v-else class="detail-empty">
        Không tìm thấy lịch hẹn phù hợp.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { appointmentApi } from "@/api/appointment";
import { ArrowLeft, Calendar, Close } from "@element-plus/icons-vue";
import type { Appointment, AppointmentStatus } from "@/types";

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const submitting = ref(false);
const appointment = ref<Appointment | null>(null);

const getStatusText = (status: AppointmentStatus) => {
  const map: Record<AppointmentStatus, string> = {
    WAITING: "Chờ xác nhận",
    ASSIGNED: "Đã phân công",
    IN_PROGRESS: "Đang khám",
    DONE: "Hoàn thành",
    CANCELLED: "Đã hủy",
  };
  return map[status] || status;
};

const getStatusType = (status: AppointmentStatus) => {
  const map: Record<AppointmentStatus, string> = {
    WAITING: "warning",
    ASSIGNED: "primary",
    IN_PROGRESS: "success",
    DONE: "success",
    CANCELLED: "danger",
  };
  return map[status] || "info";
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const formatDateTime = (dateString?: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getDoctorDisplayName = (row: Appointment) => {
  const extended = row as Appointment & { doctorUsername?: string };
  return extended.doctorName || extended.doctorUsername || "Chờ phân công";
};

const canCancel = computed(() => {
  if (!appointment.value) return false;
  const status = appointment.value.status;
  return status !== "DONE" && status !== "IN_PROGRESS" && status !== "CANCELLED";
});

const loadAppointment = async () => {
  const appointmentId = route.params.id as string;
  if (!appointmentId) {
    appointment.value = null;
    return;
  }

  try {
    loading.value = true;
    appointment.value = await appointmentApi.getMyById(appointmentId);
  } catch (error: any) {
    appointment.value = null;
    ElMessage.error(error?.message || "Không thể tải lịch hẹn");
  } finally {
    loading.value = false;
  }
};

const handleCancel = async () => {
  if (!appointment.value) return;

  try {
    const result = await ElMessageBox.prompt(
      `Xác nhận hủy lịch "${appointment.value.appointmentCode}"?`,
      "Lý do hủy",
      {
        confirmButtonText: "Hủy lịch",
        cancelButtonText: "Đóng",
        inputPlaceholder: "Nhập lý do hủy (tùy chọn)",
        inputType: "textarea",
        type: "error",
      },
    );

    const note =
      typeof result === "string" ? result : (result as { value?: string }).value;

    submitting.value = true;
    await appointmentApi.cancelMy(appointment.value.id, note || undefined);
    ElMessage.success("Hủy lịch hẹn thành công");
    await loadAppointment();
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(error?.message || "Không thể hủy lịch hẹn");
    }
  } finally {
    submitting.value = false;
  }
};

onMounted(loadAppointment);
</script>

<style scoped lang="scss">
.appointment-detail-page {
  min-height: 100vh;
  padding: 32px;
  background: #f3f4f6;

  .detail-hero {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    margin-bottom: 24px;
  }

  .hero-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .hero-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 14px;
    background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
    color: white;
    box-shadow: 0 6px 16px rgba(13, 148, 136, 0.2);
  }

  .hero-title {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
    color: #111827;
  }

  .hero-subtitle {
    margin: 4px 0 0;
    font-size: 14px;
    color: #64748b;
  }

  .hero-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .ghost-btn,
  .danger-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .ghost-btn {
    background: #f8fafc;
    color: #0f172a;
    border: 1px solid #e2e8f0;

    &:hover {
      background: #eef2f7;
    }
  }

  .danger-btn {
    background: #fee2e2;
    color: #b91c1c;

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    &:hover:not(:disabled) {
      background: #fecaca;
    }
  }

  .detail-card {
    max-width: 760px;
    margin: 0 auto;
    background: white;
    border-radius: 20px;
    padding: 28px;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
  }

  .detail-loading,
  .detail-empty {
    text-align: center;
    color: #6b7280;
    padding: 24px 0;
  }

  .detail-summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e5e7eb;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }

  .summary-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .summary-label {
    font-size: 12px;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
  }

  .summary-value {
    font-size: 16px;
    font-weight: 700;
    color: #0f172a;

    &.code {
      color: #0f766e;
    }
  }

  .detail-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px 24px;
  }

  .detail-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .detail-label {
    font-size: 12px;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
  }

  .detail-value {
    font-size: 15px;
    font-weight: 600;
    color: #0f172a;
  }

  .detail-note {
    margin-top: 20px;
    padding: 14px 16px;
    background: #f8fafc;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    display: flex;
    flex-direction: column;
    gap: 6px;

    &.danger {
      background: #fef2f2;
      border-color: #fecaca;
      color: #b91c1c;
    }
  }

  @media (max-width: 768px) {
    padding: 20px;

    .detail-hero {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }

    .detail-card {
      padding: 20px;
    }

    .detail-grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>
