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

      <div v-if="appointment" class="header-actions">
        <button @click="openFollowUpDialog" class="follow-up-button">
          <el-icon><Calendar /></el-icon>
          <span>Tạo lịch hẹn tiếp theo</span>
        </button>
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
            <div v-if="appointment.actualDate" class="info-row">
              <span class="info-label">Ngày khám thực tế:</span>
              <span class="info-value">{{
                formatDate(appointment.actualDate)
              }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Lần khám:</span>
              <span class="info-value">#{{ appointment.sequenceNo || 1 }}</span>
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
            <div v-if="appointment.parentId" class="info-row">
              <span class="info-label">Thuộc lịch:</span>
              <span class="info-value">{{ appointment.parentId }}</span>
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
              </div>
            </div>
            <div v-else class="empty-state-small">
              <el-icon class="empty-icon"><Warning /></el-icon>
              <p class="empty-text">Chưa phân công bác sĩ</p>
            </div>
          </div>
        </div>

        <!-- Treatment Plan Information Card -->
        <div class="info-card">
          <div class="card-header">
            <el-icon class="header-icon"><Document /></el-icon>
            <h3 class="card-title">Kế hoạch điều trị</h3>
          </div>
          <div class="card-body">
            <div v-if="appointment.treatmentPlanId" class="treatment-plan-link">
              <div class="plan-info">
                <div class="plan-code">Mã kế hoạch: {{ appointment.treatmentPlanCode }}</div>
                <button
                  @click="navigateToTreatmentPlan"
                  class="navigate-button"
                >
                  <el-icon><ArrowRight /></el-icon>
                  <span>Xem chi tiết kế hoạch điều trị</span>
                </button>
              </div>
            </div>
            <div v-else class="empty-state-small">
              <el-icon class="empty-icon"><Warning /></el-icon>
              <p class="empty-text">Lịch khám này không liên kết với kế hoạch điều trị</p>
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

    <el-dialog
      v-model="followUpDialogVisible"
      width="700px"
      :close-on-click-modal="false"
      :show-close="false"
      class="modern-followup-dialog"
    >
      <template #header>
        <div class="dialog-header">
          <div class="header-content">
            <el-icon class="header-icon"><Calendar /></el-icon>
            <span class="header-title">Tạo lịch hẹn tiếp theo</span>
          </div>
        </div>
      </template>

      <el-form
        ref="followUpFormRef"
        :model="followUpForm"
        :rules="followUpRules"
        label-width="140px"
        label-position="left"
        class="modern-followup-form"
      >
        <el-form-item label="Ngày hẹn tiếp theo" prop="workDate">
          <el-date-picker
            v-model="followUpForm.workDate"
            type="date"
            value-format="YYYY-MM-DD"
            format="DD/MM/YYYY"
            placeholder="Chọn ngày hẹn"
            style="width: 100%"
            :disabled-date="disablePastDate"
            size="large"
          />
        </el-form-item>

        <el-form-item label="Ca khám" prop="shift">
          <el-radio-group
            v-model="followUpForm.shift"
            class="followup-shift-group"
          >
            <el-radio-button value="MORNING">
              <div class="radio-label">
                <el-icon><Sunrise /></el-icon>
                <span>Ca sáng</span>
              </div>
            </el-radio-button>
            <el-radio-button value="AFTERNOON">
              <div class="radio-label">
                <el-icon><Sunset /></el-icon>
                <span>Ca chiều</span>
              </div>
            </el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="Bác sĩ (tùy chọn)">
          <el-select
            v-model="followUpForm.doctorId"
            placeholder="Để trống để chờ phân công"
            clearable
            filterable
            :loading="followUpDoctorLoading"
            style="width: 100%"
            size="large"
            popper-class="modern-select-dropdown"
          >
            <template #prefix>
              <el-icon style="width: 16px; height: 16px; color: #9ca3af">
                <UserFilled />
              </el-icon>
            </template>
            <el-option
              v-for="doctor in followUpAvailableDoctors"
              :key="doctor.doctorId"
              :label="doctor.doctorName"
              :value="doctor.doctorId"
              :disabled="doctor.isFull"
            >
              <div class="doctor-option">
                <div class="doctor-option-left">
                  <el-avatar
                    :size="28"
                    class="bg-gradient-to-br from-blue-500 to-blue-600"
                  >
                    {{ doctor.doctorName?.[0] || "?" }}
                  </el-avatar>
                  <span class="doctor-name">{{ doctor.doctorName }}</span>
                </div>
                <el-tag
                  :type="doctor.isFull ? 'danger' : 'success'"
                  size="small"
                  effect="light"
                >
                  {{ doctor.currentPatients }}/{{ doctor.maxPatients }}
                </el-tag>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="Ghi chú">
          <el-input
            v-model="followUpForm.note"
            type="textarea"
            :rows="3"
            maxlength="1000"
            show-word-limit
            size="large"
            placeholder="Nhập ghi chú cho lịch hẹn tiếp theo (nếu có)"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <button @click="followUpDialogVisible = false" class="cancel-button">
            <el-icon><Close /></el-icon>
            <span>Hủy</span>
          </button>
          <button
            @click="handleCreateFollowUp"
            :disabled="followUpSubmitting"
            class="submit-button"
          >
            <el-icon v-if="!followUpSubmitting"><Check /></el-icon>
            <span>Tạo lịch hẹn tiếp theo</span>
          </button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage, type FormInstance } from "element-plus";
import {
  ArrowLeft,
  ArrowRight,
  Document,
  User,
  UserFilled,
  Avatar,
  Warning,
  Sunrise,
  Sunset,
  Calendar,
  Close,
  Check,
} from "@element-plus/icons-vue";
import { appointmentApi } from "@/api/appointment";
import { doctorCapacityApi } from "@/api/doctorCapacity";

import type {
  Appointment,
  AvailableDoctor,
  CreateFollowUpAppointmentRequest,
  WorkShift,
} from "@/types";

const router = useRouter();
const route = useRoute();

// State
const loading = ref(false);
const submitting = ref(false);
const doctorLoading = ref(false);
const appointment = ref<Appointment | null>(null);
const assignDialogVisible = ref(false);
const availableDoctors = ref<AvailableDoctor[]>([]);

const followUpDialogVisible = ref(false);
const followUpSubmitting = ref(false);
const followUpDoctorLoading = ref(false);
const followUpAvailableDoctors = ref<AvailableDoctor[]>([]);
const followUpFormRef = ref<FormInstance>();

const followUpForm = reactive<CreateFollowUpAppointmentRequest>({
  workDate: "",
  shift: "MORNING",
  doctorId: undefined,
  note: "",
});

const followUpRules = {
  workDate: [
    {
      required: true,
      message: "Vui lòng chọn ngày hẹn tiếp theo",
      trigger: "change",
    },
  ],
  shift: [
    { required: true, message: "Vui lòng chọn ca khám", trigger: "change" },
  ],
};

const assignForm = ref({
  doctorId: "",
});

const getDefaultFollowUpDate = () => {
  const current = appointment.value?.workDate
    ? new Date(appointment.value.workDate)
    : new Date();
  current.setDate(current.getDate() + 1);
  return current.toISOString().slice(0, 10);
};

const disablePastDate = (date: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

// Methods
const goBack = () => {
  router.back();
};

const navigateToPatient = () => {
  if (appointment.value?.patientId) {
    router.push(`/patients/${appointment.value.patientId}`);
  }
};

const navigateToTreatmentPlan = () => {
  if (appointment.value?.treatmentPlanId) {
    router.push(`/treatment-plans/${appointment.value.treatmentPlanId}`);
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

const loadFollowUpDoctors = async () => {
  if (!followUpForm.workDate || !followUpForm.shift) {
    followUpAvailableDoctors.value = [];
    return;
  }

  try {
    followUpDoctorLoading.value = true;
    const doctors = await doctorCapacityApi.getAvailableDoctors(
      followUpForm.workDate,
      followUpForm.shift as WorkShift,
    );
    followUpAvailableDoctors.value = doctors;

    if (
      followUpForm.doctorId &&
      !doctors.some((doctor) => doctor.doctorId === followUpForm.doctorId)
    ) {
      followUpForm.doctorId = undefined;
    }
  } catch {
    followUpAvailableDoctors.value = [];
  } finally {
    followUpDoctorLoading.value = false;
  }
};

const openFollowUpDialog = async () => {
  if (!appointment.value) {
    return;
  }

  followUpForm.workDate = getDefaultFollowUpDate();
  followUpForm.shift = appointment.value.shift;
  followUpForm.doctorId = appointment.value.doctorId;
  followUpForm.note = "";
  followUpDialogVisible.value = true;
  await loadFollowUpDoctors();
};

const handleCreateFollowUp = async () => {
  if (!appointment.value) {
    return;
  }

  try {
    await followUpFormRef.value?.validate();
    followUpSubmitting.value = true;

    const payload: CreateFollowUpAppointmentRequest = {
      workDate: followUpForm.workDate,
      shift: followUpForm.shift,
      doctorId: followUpForm.doctorId || undefined,
      note: followUpForm.note?.trim() || undefined,
    };

    const created = await appointmentApi.createFollowUp(
      appointment.value.id,
      payload,
    );
    ElMessage.success("Tạo lịch hẹn tiếp theo thành công");
    followUpDialogVisible.value = false;

    if (created?.id) {
      router.push(`/appointments/${created.id}`);
    } else {
      loadAppointment();
    }
  } catch (error: any) {
    if (error?.message) {
      ElMessage.error(error.message);
    }
  } finally {
    followUpSubmitting.value = false;
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

watch(
  () => [followUpForm.workDate, followUpForm.shift],
  () => {
    if (followUpDialogVisible.value) {
      loadFollowUpDoctors();
    }
  },
);

watch(followUpDialogVisible, (visible) => {
  if (!visible) {
    followUpAvailableDoctors.value = [];
    followUpFormRef.value?.clearValidate();
  }
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

    .header-actions {
      margin-top: 14px;
      display: flex;
      justify-content: flex-end;

      .follow-up-button {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        border: none;
        border-radius: 10px;
        background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
        color: #ffffff;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 3px 10px rgba(20, 184, 166, 0.28);

        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(20, 184, 166, 0.34);
        }
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

  .treatment-plan-link {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .plan-info {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .plan-code {
        font-size: 14px;
        color: #6b7280;
        font-family: monospace;
      }
    }

    .navigate-button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);
        transform: translateX(2px);
      }

      &:active {
        transform: translateX(1px);
      }

      .el-icon {
        display: flex;
      }
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

.modern-followup-dialog {
  :deep(.el-dialog) {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
  }

  :deep(.el-dialog__header) {
    padding: 0;
    margin: 0;
  }

  .dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
    padding: 20px 24px;
    color: white;

    .header-content {
      display: flex;
      align-items: center;
      gap: 12px;

      .header-icon {
        width: 24px;
        height: 24px;
      }

      .header-title {
        font-size: 18px;
        font-weight: 600;
        color: white;
      }
    }
  }

  :deep(.el-dialog__body) {
    padding: 24px;
  }

  :deep(.el-dialog__footer) {
    padding: 0;
    border-top: 1px solid #f3f4f6;
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 24px;
    background: white;

    .cancel-button,
    .submit-button {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .cancel-button {
      padding: 10px 24px;
      border: 1px solid #e5e7eb;
      background: #ffffff;
      color: #6b7280;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background: #f9fafb;
        border-color: #d1d5db;
        color: #374151;
      }
    }

    .submit-button {
      padding: 10px 24px;
      border: none;
      background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
      color: #ffffff;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(20, 184, 166, 0.4);
      }

      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
    }
  }
}

.modern-followup-form {
  :deep(.el-form-item) {
    margin-bottom: 20px;

    .el-form-item__label {
      font-weight: 600;
      color: #374151;
      font-size: 14px;
    }

    .el-input__wrapper,
    .el-textarea__inner {
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease;
    }

    .el-input__wrapper:hover,
    .el-textarea__inner:hover {
      box-shadow: 0 3px 10px rgba(20, 184, 166, 0.14);
    }
  }

  .followup-shift-group {
    display: flex;
    gap: 12px;
    width: 100%;

    :deep(.el-radio-button) {
      flex: 1;

      .el-radio-button__inner {
        width: 100%;
        border-radius: 10px;
        padding: 14px 20px;
        transition: all 0.3s ease;
        font-weight: 500;
        border: 2px solid #e5e7eb;
        background: #ffffff;
      }

      &:first-child {
        .el-radio-button__inner {
          &:hover {
            background-color: #ecfeff;
            border-color: #06b6d4;
          }
        }

        &.is-active {
          .el-radio-button__inner {
            background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
            border-color: #06b6d4;
            color: white;
            box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
          }
        }
      }

      &:last-child {
        .el-radio-button__inner {
          &:hover {
            background-color: #fef3c7;
            border-color: #f59e0b;
          }
        }

        &.is-active {
          .el-radio-button__inner {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            border-color: #f59e0b;
            color: white;
            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
          }
        }
      }
    }
  }

  .radio-label {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
    font-size: 14px;
    font-weight: 500;
  }

  .doctor-option {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .doctor-option-left {
      display: flex;
      align-items: center;
      gap: 10px;

      .doctor-name {
        font-weight: 500;
      }
    }
  }
}
</style>
