<template>
  <el-dialog
    v-model="visible"
    width="750px"
    :close-on-click-modal="false"
    :show-close="false"
    class="modern-dialog"
  >
    <template #header>
      <div class="dialog-header">
        <div class="header-content">
          <el-icon class="header-icon"><Calendar /></el-icon>
          <span class="header-title">Tạo lịch tái khám</span>
        </div>
      </div>
    </template>

    <div v-loading="submitting" class="form-container">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="160px"
        label-position="left"
        class="modern-form"
      >
        <el-form-item label="Ngày khám" prop="workDate">
          <el-date-picker
            v-model="form.workDate"
            type="date"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            placeholder="Chọn ngày khám"
            style="width: 100%"
            :disabled-date="disabledDate"
          />
        </el-form-item>

        <el-form-item label="Ca khám" prop="shift" class="shift-field">
          <div class="shift-buttons">
            <button
              type="button"
              :class="['shift-btn', 'shift-morning', { active: form.shift === 'MORNING' }]"
              @click="form.shift = 'MORNING'"
            >
              <el-icon><Sunrise /></el-icon>
              <span>Ca sáng</span>
            </button>
            <button
              type="button"
              :class="['shift-btn', 'shift-afternoon', { active: form.shift === 'AFTERNOON' }]"
              @click="form.shift = 'AFTERNOON'"
            >
              <el-icon><Sunset /></el-icon>
              <span>Ca chiều</span>
            </button>
          </div>
        </el-form-item>

        <el-form-item label="Bác sĩ (tùy chọn)" prop="doctorId">
          <el-select
            v-model="form.doctorId"
            placeholder="Chọn bác sĩ hoặc để trống"
            clearable
            filterable
            style="width: 100%"
            :loading="doctorLoading"
          >
            <template #empty>
              <span>Không có bác sĩ có ca làm việc vào ngày này</span>
            </template>
            <el-option
              v-for="doctor in activeDoctors"
              :key="doctor.doctorId"
              :label="doctor.doctorName"
              :value="doctor.doctorId"
              :disabled="doctor.isFull"
            >
              <div class="doctor-option-row">
                <div class="doctor-info">
                  <el-avatar
                    :size="30"
                    :src="doctor.img || undefined"
                    class="doctor-avatar"
                  >
                    {{ doctor.doctorName?.[0] || "B" }}
                  </el-avatar>
                  <span class="doctor-name">{{ doctor.doctorName }}</span>
                </div>
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

        <el-form-item label="Ghi chú" prop="note">
          <el-input
            v-model="form.note"
            type="textarea"
            :rows="6"
            placeholder="Mô tả bệnh tình hoặc lưu ý cho bác sĩ"
          />
        </el-form-item>

        <div class="hint-text">
          <el-icon><InfoFilled /></el-icon>
          <span>Nếu không chọn bác sĩ, hệ thống sẽ giữ bác sĩ từ lịch khám trước (nếu có).</span>
        </div>
      </el-form>
    </div>

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
          <span>Tạo lịch tái khám</span>
        </button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { ElMessage, type FormInstance } from "element-plus";
import { Calendar, Sunrise, Sunset, Check, Close, InfoFilled } from "@element-plus/icons-vue";
import { appointmentApi } from "@/api/appointment";
import { doctorCapacityApi } from "@/api/doctorCapacity";
import type { CreateFollowUpAppointmentRequest, AvailableDoctor, WorkShift } from "@/types";

const props = defineProps<{
  modelValue: boolean;
  appointmentId: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "success"): void;
}>();

const formRef = ref<FormInstance>();
const submitting = ref(false);
const doctorLoading = ref(false);
const activeDoctors = ref<AvailableDoctor[]>([]);

const form = reactive<CreateFollowUpAppointmentRequest>({
  workDate: "",
  shift: "MORNING" as WorkShift,
  doctorId: undefined,
  note: "",
});

const rules = {
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

const disabledDate = (date: Date) =>
  date < new Date(new Date().setHours(0, 0, 0, 0));

const loadActiveDoctors = async () => {
  if (!form.workDate || !form.shift) {
    activeDoctors.value = [];
    return;
  }

  try {
    doctorLoading.value = true;
    const doctors = await doctorCapacityApi.getAvailableDoctors(
      form.workDate,
      form.shift,
    );
    activeDoctors.value = Array.isArray(doctors) ? doctors : [];

    if (
      form.doctorId &&
      !activeDoctors.value.some((doctor) => doctor.doctorId === form.doctorId)
    ) {
      form.doctorId = undefined;
    }
  } catch {
    activeDoctors.value = [];
    ElMessage.error("Không thể tải danh sách bác sĩ có ca làm việc vào ngày này");
  } finally {
    doctorLoading.value = false;
  }
};

const handleCancel = () => {
  visible.value = false;
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    submitting.value = true;

    await appointmentApi.createFollowUp(props.appointmentId, {
      workDate: form.workDate,
      shift: form.shift,
      doctorId: form.doctorId,
      note: form.note || undefined,
    });

    ElMessage.success("Tạo lịch tái khám thành công");
    emit("success");
    visible.value = false;
  } catch (error: any) {
    if (error?.message) {
      ElMessage.error(error.message);
    }
  } finally {
    submitting.value = false;
  }
};

watch(
  () => [form.workDate, form.shift],
  () => {
    if (form.workDate && form.shift) {
      loadActiveDoctors();
    }
  },
);

watch(
  () => visible.value,
  (newVal) => {
    if (!newVal) {
      formRef.value?.resetFields();
      form.workDate = "";
      form.shift = "MORNING";
      form.doctorId = undefined;
      form.note = "";
      activeDoctors.value = [];
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
    }

    .header-icon {
      font-size: 24px;
    }

    .header-title {
      font-size: 20px;
      font-weight: 600;
      letter-spacing: 0.3px;
    }
  }

  .form-container {
    padding: 28px 24px;
  }

  .modern-form {
    :deep(.el-form-item__label) {
      color: #374151;
      font-weight: 600;
      font-size: 15px;
    }

    :deep(.el-input__wrapper),
    :deep(.el-textarea__inner),
    :deep(.el-date-editor .el-input__wrapper),
    :deep(.el-select .el-input__wrapper) {
      border-radius: 10px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      transition: all 0.25s ease;
    }

    :deep(.el-input__wrapper:hover),
    :deep(.el-textarea__inner:hover),
    :deep(.el-date-editor .el-input__wrapper:hover),
    :deep(.el-select .el-input__wrapper:hover) {
      box-shadow: 0 2px 8px rgba(20, 184, 166, 0.15);
    }

    :deep(.el-input__wrapper.is-focus),
    :deep(.el-date-editor .el-input__wrapper.is-focus),
    :deep(.el-select .el-input__wrapper.is-focus) {
      box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
    }

    :deep(.el-textarea__inner:focus) {
      box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
      border-color: #14b8a6;
    }

    .shift-field {
      :deep(.el-form-item__content) {
        display: block;
      }

      .shift-buttons {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }

      .shift-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 20px;
        min-width: 130px;
        border: 2px solid #d1d5db;
        border-radius: 10px;
        background: white;
        color: #6b7280;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.25s ease;

        &:hover {
          border-color: #14b8a6;
          color: #14b8a6;
          box-shadow: 0 2px 8px rgba(20, 184, 166, 0.15);
        }
      }

      .shift-morning {
        &.active {
          background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
          border-color: #06b6d4;
          color: white;
          box-shadow: 0 2px 8px rgba(6, 182, 212, 0.25);
        }

        &:hover {
          border-color: #06b6d4;
          color: #06b6d4;
          box-shadow: 0 2px 8px rgba(6, 182, 212, 0.15);
        }
      }

      .shift-afternoon {
        &.active {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          border-color: #f59e0b;
          color: white;
          box-shadow: 0 2px 8px rgba(245, 158, 11, 0.25);
        }

        &:hover {
          border-color: #f59e0b;
          color: #f59e0b;
          box-shadow: 0 2px 8px rgba(245, 158, 11, 0.15);
        }
      }
    }

    .doctor-option-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      gap: 8px;
    }

    .doctor-info {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      flex: 1;
    }

    .doctor-avatar {
      flex-shrink: 0;
      background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%) !important;
      color: white;
      font-weight: 600;
    }

    .doctor-name {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .hint-text {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 14px 16px;
      background: #f0fdfa;
      border-left: 3px solid #14b8a6;
      border-radius: 6px;
      font-size: 14px;
      color: #0f766e;
      line-height: 1.6;

      :deep(.el-icon) {
        flex-shrink: 0;
        margin-top: 2px;
        color: #14b8a6;
      }
    }
  }

  .dialog-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    padding: 16px 24px;
    background: #f9fafb;
    border-top: 1px solid #e5e7eb;

    button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 20px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.25s ease;
    }

    .cancel-button {
      color: #6b7280;
      background: white;
      border: 1px solid #d1d5db;

      &:hover {
        background: #f3f4f6;
      }
    }

    .submit-button {
      color: white;
      background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
      box-shadow: 0 4px 12px rgba(20, 184, 166, 0.24);

      &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(20, 184, 166, 0.32);
      }

      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
    }
  }
}
</style>
