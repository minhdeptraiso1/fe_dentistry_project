<template>
  <div class="appointment-detail-container">
    <!-- Back Button & Header -->
    <div class="page-header">
      <button @click="goBack" class="back-button">
        <el-icon><ArrowLeft /></el-icon>
        <span>Quay lại</span>
      </button>
      <div class="header-content">
        <h1 class="page-title">Chi tiết lịch hẹn</h1>
        <el-tag
          v-if="appointment"
          :type="getStatusType(appointment.status)"
          size="large"
        >
          {{ getStatusText(appointment.status) }}
        </el-tag>
      </div>
    </div>

    <div v-loading="loading" class="content-wrapper">
      <div v-if="appointment" class="detail-grid">
        <!-- Appointment Information Card -->
        <div class="info-card">
          <div class="card-header">
            <el-icon class="header-icon"><Document /></el-icon>
            <h3 class="card-title">Thông tin lịch hẹn</h3>
          </div>
          <div class="card-body">
            <div class="info-row">
              <span class="info-label">Mã phiếu:</span>
              <span class="info-value font-mono font-bold text-primary-600">{{
                appointment.appointmentCode
              }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Ngày khám:</span>
              <span class="info-value">{{
                formatDate(appointment.workDate)
              }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Ca khám:</span>
              <el-tag
                :type="appointment.shift === 'MORNING' ? 'warning' : 'primary'"
                size="default"
              >
                <el-icon>
                  <component
                    :is="appointment.shift === 'MORNING' ? Sunrise : Sunset"
                  />
                </el-icon>
                {{ appointment.shift === "MORNING" ? "Ca sáng" : "Ca chiều" }}
              </el-tag>
            </div>
            <div class="info-row">
              <span class="info-label">Ngày tạo:</span>
              <span class="info-value">{{
                formatDateTime(appointment.createdAt)
              }}</span>
            </div>
            <div v-if="appointment.note" class="info-row">
              <span class="info-label">Ghi chú:</span>
              <span class="info-value">{{ appointment.note }}</span>
            </div>
          </div>
        </div>

        <!-- Patient Information Card -->
        <div class="info-card">
          <div class="card-header">
            <el-icon class="header-icon"><User /></el-icon>
            <h3 class="card-title">Thông tin bệnh nhân</h3>
          </div>
          <div class="card-body">
            <div class="patient-profile clickable" @click="navigateToPatient">
              <el-avatar
                :size="80"
                class="bg-gradient-to-br from-teal-500 to-teal-600"
              >
                {{ appointment.patientName?.[0] || "?" }}
              </el-avatar>
              <div class="patient-info">
                <h4 class="patient-name">{{ appointment.patientName }}</h4>
                <p class="patient-code">
                  Mã BN:
                  {{
                    (appointment as any).patientCode || appointment.patientId
                  }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Doctor Information Card -->
        <div class="info-card">
          <div class="card-header">
            <el-icon class="header-icon"><Avatar /></el-icon>
            <h3 class="card-title">Thông tin bác sĩ</h3>
          </div>
          <div class="card-body">
            <div v-if="appointment.doctorId" class="patient-profile">
              <el-avatar
                :size="80"
                class="bg-gradient-to-br from-blue-500 to-blue-600"
              >
                {{ appointment.doctorName?.[0] || "BS" }}
              </el-avatar>
              <div class="patient-info">
                <h4 class="patient-name">
                  {{ appointment.doctorName || "Bác sĩ" }}
                </h4>
                <p class="patient-code">
                  Username:
                  {{
                    (appointment as any).doctorUsername ||
                    appointment.doctorName
                  }}
                </p>
              </div>
            </div>
            <div v-else class="empty-state-small">
              <el-icon class="empty-icon"><Warning /></el-icon>
              <p class="empty-text">Chưa phân công bác sĩ</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Assign Doctor Dialog -->
    <el-dialog
      v-model="assignDialogVisible"
      title="Phân công bác sĩ"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="assignForm" label-width="100px">
        <el-form-item label="Bác sĩ">
          <el-select
            v-model="assignForm.doctorId"
            placeholder="Chọn bác sĩ"
            style="width: 100%"
            :loading="doctorLoading"
          >
            <el-option
              v-for="doctor in availableDoctors"
              :key="doctor.doctorId"
              :label="doctor.doctorName"
              :value="doctor.doctorId"
              :disabled="doctor.isFull"
            >
              <div class="flex justify-between items-center">
                <span>{{ doctor.doctorName }}</span>
                <el-tag
                  :type="doctor.isFull ? 'danger' : 'success'"
                  size="small"
                >
                  {{ doctor.currentPatients }}/{{ doctor.maxPatients }}
                </el-tag>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="assignDialogVisible = false">Hủy</el-button>
          <el-button type="primary" @click="handleAssign" :loading="submitting">
            Phân công
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  ArrowLeft,
  Document,
  User,
  Avatar,
  Warning,
  Sunrise,
  Sunset,
} from "@element-plus/icons-vue";
import { appointmentApi } from "@/api/appointment";

import type { Appointment, AvailableDoctor } from "@/types";

const router = useRouter();
const route = useRoute();

// State
const loading = ref(false);
const submitting = ref(false);
const doctorLoading = ref(false);
const appointment = ref<Appointment | null>(null);
const assignDialogVisible = ref(false);
const availableDoctors = ref<AvailableDoctor[]>([]);

const assignForm = ref({
  doctorId: "",
});

// Methods
const goBack = () => {
  router.back();
};

const navigateToPatient = () => {
  if (appointment.value?.patientId) {
    router.push(`/patients/${appointment.value.patientId}`);
  }
};

const loadAppointment = async () => {
  try {
    loading.value = true;
    const id = route.params.id as string;

    const data: any = await appointmentApi.getById(id);
    // Map doctorUsername to doctorName
    appointment.value = {
      ...data,
      doctorName: data.doctorUsername || data.doctorName || null,
      patientCode: data.patientCode || data.patientId,
    } as Appointment;
  } catch (error: any) {
    ElMessage.error(error.message || "Không thể tải thông tin lịch hẹn");
    goBack();
  } finally {
    loading.value = false;
  }
};

const handleAssign = async () => {
  if (!assignForm.value.doctorId) {
    ElMessage.warning("Vui lòng chọn bác sĩ");
    return;
  }

  try {
    submitting.value = true;
    await appointmentApi.assignDoctor(appointment.value!.id, {
      doctorId: assignForm.value.doctorId,
    });
    ElMessage.success("Phân công bác sĩ thành công");
    assignDialogVisible.value = false;
    loadAppointment();
  } catch (error: any) {
    ElMessage.error(error.message || "Phân công thất bại");
  } finally {
    submitting.value = false;
  }
};

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    WAITING: "Chờ phân công",
    ASSIGNED: "Đã phân công",
    IN_PROGRESS: "Đang khám",
    DONE: "Hoàn thành",
    CANCELLED: "Đã hủy",
  };
  return statusMap[status] || status;
};

const getStatusType = (status: string) => {
  const typeMap: Record<string, any> = {
    WAITING: "info",
    ASSIGNED: "warning",
    IN_PROGRESS: "primary",
    DONE: "success",
    CANCELLED: "danger",
  };
  return typeMap[status] || "info";
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatDateTime = (dateTime: string) => {
  return new Date(dateTime).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

onMounted(() => {
  loadAppointment();
});
</script>

<style scoped lang="scss">
.appointment-detail-container {
  padding: 24px;
  background: #f8fafc;
  min-height: 100vh;

  .page-header {
    margin-bottom: 24px;

    .back-button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      color: #6b7280;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-bottom: 16px;

      &:hover {
        background: #f9fafb;
        color: #14b8a6;
        border-color: #14b8a6;
      }
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px;
      background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
      border-radius: 16px;
      box-shadow: 0 4px 6px rgba(20, 184, 166, 0.2);

      .page-title {
        margin: 0;
        font-size: 28px;
        font-weight: 700;
        color: white;
      }
    }
  }

  .content-wrapper {
    min-height: 400px;
  }

  .detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 24px;

    .full-width {
      grid-column: 1 / -1;
    }
  }

  .info-card {
    background: white;
    border-radius: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
    overflow: hidden;

    .card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 24px;
      background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
      border-bottom: 1px solid #e5e7eb;

      .header-icon {
        font-size: 24px;
        color: #14b8a6;
      }

      .card-title {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #1f2937;
      }
    }

    .card-body {
      padding: 24px;
    }
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #f3f4f6;

    &:last-child {
      border-bottom: none;
    }

    .info-label {
      font-weight: 500;
      color: #6b7280;
      min-width: 120px;
    }

    .info-value {
      color: #1f2937;
      font-weight: 500;
      text-align: right;
      flex: 1;
    }
  }

  .patient-profile {
    display: flex;
    align-items: center;
    gap: 20px;

    &.clickable {
      cursor: pointer;
      padding: 12px;
      margin: -12px;
      border-radius: 8px;
      transition: all 0.2s ease;

      &:hover {
        background-color: #f3f4f6;
        transform: translateX(4px);

        .patient-name {
          color: #14b8a6;
        }
      }

      &:active {
        transform: translateX(2px);
      }
    }

    .patient-info {
      flex: 1;

      .patient-name {
        margin: 0 0 8px 0;
        font-size: 20px;
        font-weight: 600;
        color: #1f2937;
        transition: color 0.2s ease;
      }

      .patient-code {
        margin: 0;
        color: #6b7280;
        font-size: 14px;
      }
    }
  }

  .empty-state-small {
    text-align: center;
    padding: 24px;

    .empty-icon {
      font-size: 48px;
      color: #d1d5db;
      margin-bottom: 12px;
    }

    .empty-text {
      margin: 0;
      color: #9ca3af;
      font-size: 14px;
    }
  }

  .action-buttons-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;

    .el-button {
      flex: 1;
      min-width: 180px;
    }
  }
}
</style>
