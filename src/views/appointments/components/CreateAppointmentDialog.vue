<template>
  <el-dialog
    v-model="visible"
    width="700px"
    :close-on-click-modal="false"
    :show-close="false"
    class="modern-dialog"
    @closed="handleClose"
  >
    <template #header>
      <div class="dialog-header">
        <div class="header-content">
          <el-icon class="header-icon"><Calendar /></el-icon>
          <span class="header-title">Tạo lịch hẹn khám</span>
        </div>
      </div>
    </template>
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
      label-position="left"
      class="modern-form"
    >
      <el-form-item label="Bệnh nhân" prop="patientId">
        <el-select
          v-model="form.patientId"
          placeholder="Chọn bệnh nhân"
          filterable
          :loading="patientLoading"
          style="width: 100%"
          size="large"
          popper-class="modern-select-dropdown"
        >
          <template #prefix>
            <el-icon style="width: 16px; height: 16px; color: #9ca3af">
              <User />
            </el-icon>
          </template>
          <el-option
            v-for="patient in patients"
            :key="patient.id"
            :label="patient.fullName"
            :value="patient.id"
          >
            <div class="patient-option">
              <el-avatar
                :size="36"
                class="bg-gradient-to-br from-teal-500 to-teal-600"
              >
                {{ patient.fullName?.[0] || "?" }}
              </el-avatar>
              <div class="patient-details">
                <div class="patient-name">{{ patient.fullName }}</div>
                <div class="patient-phone">
                  {{ patient.phone || "Chưa có SĐT" }}
                </div>
              </div>
            </div>
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="Ngày khám" prop="workDate">
        <el-date-picker
          v-model="form.workDate"
          type="date"
          placeholder="Chọn ngày khám"
          format="DD/MM/YYYY"
          value-format="YYYY-MM-DD"
          style="width: 100%"
          size="large"
          :disabled-date="disabledDate"
          @change="handleDateChange"
          popper-class="modern-date-picker"
        >
          <template #prefix>
            <el-icon style="width: 16px; height: 16px; color: #9ca3af">
              <Calendar />
            </el-icon>
          </template>
        </el-date-picker>
      </el-form-item>
      <el-form-item label="Ca khám" prop="shift">
        <el-radio-group v-model="form.shift" @change="handleShiftChange">
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
      <el-form-item label="Bác sĩ" prop="doctorId">
        <el-select
          v-model="form.doctorId"
          placeholder="Chọn bác sĩ (tùy chọn)"
          style="width: 100%"
          size="large"
          :loading="doctorLoading"
          clearable
          filterable
          :disabled="!form.workDate || !form.shift"
          popper-class="modern-select-dropdown"
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
              <p class="hint">Lịch hẹn sẽ ở trạng thái chờ phân công</p>
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
                  :size="36"
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
        <div class="form-hint">
          Nếu không chọn bác sĩ, lịch hẹn sẽ ở trạng thái "Chờ phân công"
        </div>
      </el-form-item>
      <el-form-item label="Ghi chú" prop="note">
        <el-input
          v-model="form.note"
          type="textarea"
          :rows="3"
          size="large"
          placeholder="Nhập ghi chú về lịch hẹn (không bắt buộc)..."
        />
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
          :disabled="submitting"
          class="submit-button"
        >
          <el-icon v-if="!submitting"><Check /></el-icon>
          <span>Tạo mới</span>
        </button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { ElMessage, type FormInstance } from "element-plus";
import {
  Calendar,
  User,
  UserFilled,
  Sunrise,
  Sunset,
  Close,
  Check,
} from "@element-plus/icons-vue";
import { patientApi } from "@/api/patient";
import { doctorCapacityApi } from "@/api/doctorCapacity";
import { appointmentApi } from "@/api/appointment";
import type {
  Patient,
  AvailableDoctor,
  CreateAppointmentRequest,
} from "@/types";

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "success"): void;
}>();

const formRef = ref<FormInstance>();
const submitting = ref(false);
const patientLoading = ref(false);
const doctorLoading = ref(false);
const patients = ref<Patient[]>([]);
const availableDoctors = ref<AvailableDoctor[]>([]);

const form = reactive<CreateAppointmentRequest>({
  patientId: "",
  workDate: "",
  shift: "MORNING",
  doctorId: undefined,
  note: "",
});

const rules = {
  patientId: [
    { required: true, message: "Vui lòng chọn bệnh nhân", trigger: "change" },
  ],
  workDate: [
    { required: true, message: "Vui lòng chọn ngày khám", trigger: "change" },
  ],
  shift: [
    { required: true, message: "Vui lòng chọn ca khám", trigger: "change" },
  ],
};

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const disabledDate = (date: Date) => {
  return date < new Date(new Date().setHours(0, 0, 0, 0));
};

const loadPatients = async () => {
  try {
    patientLoading.value = true;
    const response = await patientApi.search({
      keyword: "",
      page: 0,
      size: 100,
    });
    patients.value = response.content;
  } catch (error: any) {
    ElMessage.error("Không thể tải danh sách bệnh nhân");
  } finally {
    patientLoading.value = false;
  }
};

const loadDoctors = async () => {
  if (!form.workDate || !form.shift) {
    availableDoctors.value = [];
    form.doctorId = undefined;
    return;
  }

  form.doctorId = undefined;

  try {
    doctorLoading.value = true;
    availableDoctors.value = await doctorCapacityApi.getAvailableDoctors(
      form.workDate,
      form.shift,
    );
  } catch (error: any) {
    ElMessage.error("Không thể tải danh sách bác sĩ");
    availableDoctors.value = [];
  } finally {
    doctorLoading.value = false;
  }
};

const handleDateChange = () => {
  loadDoctors();
};

const handleShiftChange = () => {
  loadDoctors();
};

const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
    submitting.value = true;
    await appointmentApi.create(form);
    ElMessage.success("Tạo lịch hẹn thành công");
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
  Object.assign(form, {
    patientId: "",
    workDate: "",
    shift: "MORNING",
    doctorId: undefined,
    note: "",
  });
  availableDoctors.value = [];
};

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      loadPatients();
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
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
    max-height: 90vh;
    display: flex;
    flex-direction: column;
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
    max-height: 70vh;
    overflow-y: auto;
  }

  :deep(.el-dialog__footer) {
    padding: 0;
    border-top: 1px solid #f3f4f6;
  }
}

// Fix dropdown popper positioning and z-index
.modern-select-dropdown {
  z-index: 9999 !important;

  .el-select-dropdown__list {
    max-height: 320px;
    padding: 8px;
  }

  .el-select-dropdown__item {
    padding: 4px 8px;
    border-radius: 8px;
    margin-bottom: 2px;
    min-height: 56px;

    &:hover {
      background-color: #f0fdfa;
    }

    &.selected {
      background-color: #ccfbf1;
      font-weight: 500;
    }
  }
}

.modern-date-picker {
  z-index: 9999 !important;
}

.modern-form {
  :deep(.el-form-item) {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }

    .el-form-item__label {
      font-weight: 600;
      color: #374151;
      font-size: 14px;
      line-height: 1.5;
      padding-bottom: 8px;
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

    .el-textarea__inner {
      border-radius: 10px;
      padding: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
      }

      &:focus {
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

    .el-date-editor {
      .el-input__wrapper {
        &.is-focus {
          box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
        }
      }
    }
  }
}

.patient-option {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 8px;
  min-height: 56px;
  width: 100%;

  .el-avatar {
    flex-shrink: 0;
  }

  .patient-details {
    flex: 1;
    min-width: 0;
    overflow: visible;

    .patient-name {
      font-weight: 500;
      color: #1f2937;
      font-size: 15px;
      line-height: 1.4;
      margin-bottom: 4px;
    }

    .patient-phone {
      font-size: 13px;
      color: #6b7280;
      line-height: 1.3;
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
  padding: 8px 4px;
  min-height: 52px;
  gap: 12px;

  .doctor-option-left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
    overflow: hidden;

    .el-avatar {
      flex-shrink: 0;
    }

    .doctor-name {
      font-weight: 500;
      color: #1f2937;
      font-size: 14px;
      line-height: 1.4;
    }
  }

  .el-tag {
    flex-shrink: 0;
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

:deep(.el-radio-group) {
  display: flex;
  gap: 12px;
  width: 100%;

  .el-radio-button {
    flex: 1;

    .el-radio-button__inner {
      width: 100%;
      border-radius: 10px;
      padding: 14px 20px;
      transition: all 0.3s ease;
      font-weight: 500;
      border: 2px solid #e5e7eb;
    }

    // Ca sáng - Morning (Cyan/Blue)
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

    // Ca chiều - Afternoon (Yellow/Orange)
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

.form-hint {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 6px;
  font-style: italic;
  line-height: 1.4;
  display: block;
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
