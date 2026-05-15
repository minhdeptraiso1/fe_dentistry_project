<template>
  <el-dialog
    v-model="visible"
    width="650px"
    :close-on-click-modal="false"
    :show-close="false"
    class="modern-dialog"
    @closed="handleClose"
  >
    <template #header>
      <div class="dialog-header">
        <div class="header-content">
          <el-icon class="header-icon"><UserFilled /></el-icon>
          <span class="header-title">Phân công bác sĩ</span>
        </div>
      </div>
    </template>
    <div v-if="appointment" class="assign-info-card">
      <div class="info-row">
        <span class="info-label">Mã phiếu:</span>
        <span class="info-value code">{{ appointment.appointmentCode }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Bệnh nhân:</span>
        <span class="info-value">{{ appointment.patientName }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Ngày khám:</span>
        <span class="info-value">{{ formatDate(appointment.workDate) }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Ca:</span>
        <el-tag
          :type="appointment.shift === 'MORNING' ? 'warning' : 'primary'"
          size="small"
        >
          {{ appointment.shift === "MORNING" ? "Sáng" : "Chiều" }}
        </el-tag>
      </div>
      <div class="info-row info-row-note">
        <span class="info-label">Ghi chú:</span>
        <span class="info-value note-value">
          {{ appointment.note?.trim() || "Không có" }}
        </span>
      </div>
    </div>

    <el-divider style="margin: 20px 0" />

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      label-position="left"
      class="modern-form"
    >
      <el-form-item label="Bác sĩ" prop="doctorId">
        <el-select
          v-model="form.doctorId"
          placeholder="Chọn bác sĩ"
          style="width: 100%"
          size="large"
          :loading="doctorLoading"
          filterable
        >
          <template #prefix>
            <el-icon style="width: 16px; height: 16px; color: #9ca3af">
              <UserFilled />
            </el-icon>
          </template>
          <template #empty>
            <div class="empty-doctor-list">
              <el-icon :size="40" color="#d1d5db">
                <UserFilled />
              </el-icon>
              <p>Chưa có bác sĩ khả dụng</p>
              <p class="hint">
                Vui lòng thiết lập công suất bác sĩ cho ngày và ca này
              </p>
            </div>
          </template>
          <el-option
            v-for="doctor in availableDoctors"
            :key="doctor.doctorId"
            :label="doctor.doctorName"
            :value="doctor.doctorId"
            :disabled="doctor.isFull"
          >
            <div class="doctor-option">
              <div class="doctor-option-left">
                <el-avatar
                  :size="32"
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
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <button @click="handleCancel" class="cancel-button">
          <el-icon><Close /></el-icon>
          <span>Hủy</span>
        </button>
        <button
          @click="handleSubmit"
          :disabled="submitting || !form.doctorId"
          class="submit-button"
        >
          <el-icon v-if="!submitting"><Check /></el-icon>
          <span>Phân công</span>
        </button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { ElMessage, type FormInstance } from "element-plus";
import { UserFilled, Close, Check } from "@element-plus/icons-vue";
import { doctorCapacityApi } from "@/api/doctorCapacity";
import { appointmentApi } from "@/api/appointment";
import { emailApi } from "@/api/email";
import { userApi } from "@/api/user";
import type { Appointment, AvailableDoctor } from "@/types";

const props = defineProps<{
  modelValue: boolean;
  appointment: Appointment | null;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "success"): void;
}>();

const formRef = ref<FormInstance>();
const submitting = ref(false);
const doctorLoading = ref(false);
const availableDoctors = ref<AvailableDoctor[]>([]);

const form = reactive({
  doctorId: "",
});

const rules = {
  doctorId: [
    { required: true, message: "Vui lòng chọn bác sĩ", trigger: "change" },
  ],
};

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const resolvePatientEmail = async (appointment: Appointment) => {
  if (!appointment.patientId) return undefined;

  try {
    const patientUser = await userApi.getByPatientId(appointment.patientId);
    const email = patientUser?.email;
    return typeof email === "string" && email.trim() ? email.trim() : undefined;
  } catch {
    return undefined;
  }
};

const fireAssignedDoctorEmail = async (
  appointment: Appointment,
  doctorName: string,
) => {
  const to = await resolvePatientEmail(appointment);
  if (!to) return;

  const shiftLabel = appointment.shift === "MORNING" ? "Ca sáng" : "Ca chiều";

  await emailApi.sendTemplate({
    to,
    subject: "Thông báo phân công bác sĩ lịch khám",
    template: "appointment-assigned",
    model: {
      patientName: appointment.patientName || "Bệnh nhân",
      appointmentCode: appointment.appointmentCode,
      workDate: formatDate(appointment.workDate),
      shift: shiftLabel,
      doctorName,
      cancelUrl: `${window.location.origin}/patient/appointments/${appointment.id}`,
    },
  });
};

const formatDate = (date: string) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("vi-VN");
};

const loadDoctors = async () => {
  if (!props.appointment) return;

  try {
    doctorLoading.value = true;
    availableDoctors.value = await doctorCapacityApi.getAvailableDoctors(
      props.appointment.workDate,
      props.appointment.shift,
    );

    if (availableDoctors.value.length === 0) {
      ElMessage.info({
        message:
          "Chưa có bác sĩ khả dụng cho ngày và ca này. Vui lòng thiết lập công suất bác sĩ trước.",
        duration: 4000,
      });
    }
  } catch (error: any) {
    ElMessage.error("Không thể tải danh sách bác sĩ");
    availableDoctors.value = [];
  } finally {
    doctorLoading.value = false;
  }
};

const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
    if (!props.appointment) return;

    submitting.value = true;
    const assigned = await appointmentApi.assignDoctor(props.appointment.id, {
      doctorId: form.doctorId,
    });

    const selectedDoctor = availableDoctors.value.find(
      (doctor) => doctor.doctorId === form.doctorId,
    );
    const doctorName =
      selectedDoctor?.doctorName ||
      (assigned as any)?.doctorName ||
      (assigned as any)?.doctorUsername ||
      "Bác sĩ phụ trách";

    void fireAssignedDoctorEmail(props.appointment, doctorName).catch(() => {
      // Best-effort async email.
    });

    ElMessage.success("Phân công bác sĩ thành công");
    emit("success");
    visible.value = false;
  } catch (error: any) {
    if (error.message) {
      ElMessage.error(error.message);
    }
  } finally {
    submitting.value = false;
  }
};

const handleCancel = () => {
  visible.value = false;
};

const handleClose = () => {
  formRef.value?.resetFields();
  form.doctorId = "";
  availableDoctors.value = [];
};

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal && props.appointment) {
      loadDoctors();
      formRef.value?.clearValidate();
    }
  },
);
</script>

<style scoped lang="scss">
.modern-dialog {
  :deep(.el-dialog) {
    border-radius: 16px;
    overflow: hidden;
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
        color: white;
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
    padding: 16px 24px;
    border-top: 1px solid #f3f4f6;
  }
}

.modern-form {
  :deep(.el-form-item) {
    margin-bottom: 20px;

    .el-form-item__label {
      font-weight: 600;
      color: #374151;
      font-size: 14px;
    }

    .el-input__wrapper {
      border-radius: 10px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      padding: 8px 12px;
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
      }

      &.is-focus {
        box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
      }
    }

    .el-select {
      .el-input__wrapper {
        &.is-focus {
          box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
        }
      }
    }
  }
}

.assign-info-card {
  background: #f9fafb;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e5e7eb;

  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid #e5e7eb;

    &:last-child {
      border-bottom: none;
    }

    .info-label {
      font-weight: 600;
      color: #4b5563;
      font-size: 14px;
    }

    .info-value {
      color: #1f2937;
      font-size: 14px;

      &.code {
        font-family: monospace;
        font-weight: 600;
        color: #14b8a6;
        background: #ecfdf5;
        padding: 4px 12px;
        border-radius: 6px;
      }

      &.note-value {
        max-width: 68%;
        text-align: right;
        white-space: pre-wrap;
        line-height: 1.5;
      }
    }

    &.info-row-note {
      align-items: flex-start;
      padding-top: 12px;
    }
  }
}

.empty-doctor-list {
  padding: 40px 20px;
  text-align: center;
  color: #9ca3af;

  p {
    margin: 8px 0 0;
    font-size: 14px;

    &.hint {
      font-size: 12px;
      color: #d1d5db;
      margin-top: 4px;
    }
  }
}

.doctor-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 4px 0;

  .doctor-option-left {
    display: flex;
    align-items: center;
    gap: 12px;

    .doctor-name {
      font-weight: 500;
      color: #1f2937;
    }
  }
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
    background: white;
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
    color: white;
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
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}
</style>
