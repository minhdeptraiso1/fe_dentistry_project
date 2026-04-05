<template>
  <div class="schedule-request-page">
    <div class="header-card">
      <div>
        <h1 class="page-title">Đăng ký lịch làm việc</h1>
        <p class="page-subtitle">
          Gửi yêu cầu ca làm việc để quản trị viên duyệt và mở lịch nhận bệnh.
        </p>
      </div>
    </div>

    <div class="content-card">
      <div class="form-head">
        <el-icon class="form-head-icon"><Calendar /></el-icon>
        <span class="form-head-title">Thông tin đăng ký</span>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        class="request-form"
      >
        <el-form-item label="Ngày làm việc" prop="workDate">
          <el-date-picker
            v-model="form.workDate"
            type="date"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            placeholder="Chọn ngày làm việc"
            size="large"
            class="form-control"
            :disabled-date="disabledDate"
          />
        </el-form-item>

        <el-form-item label="Ca làm việc" prop="shift">
          <el-radio-group v-model="form.shift" class="shift-group">
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

        <el-form-item label="Số bệnh nhân tối đa" prop="maxPatients">
          <el-input-number
            v-model="form.maxPatients"
            :min="1"
            :max="50"
            class="form-control"
            size="large"
          />
        </el-form-item>

        <div class="actions">
          <button type="button" class="cancel-button" @click="resetForm">
            <el-icon><RefreshRight /></el-icon>
            <span>Làm mới</span>
          </button>
          <button
            type="button"
            class="submit-button"
            :disabled="submitting"
            @click="submit"
          >
            <el-icon v-if="!submitting"><Check /></el-icon>
            <span>Gửi yêu cầu</span>
          </button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import {
  Calendar,
  Sunrise,
  Sunset,
  RefreshRight,
  Check,
} from "@element-plus/icons-vue";
import { doctorScheduleRequestApi } from "@/api/doctorScheduleRequest";
import type { CreateDoctorScheduleRequest } from "@/types";

const formRef = ref<FormInstance>();
const submitting = ref(false);

const form = reactive<CreateDoctorScheduleRequest>({
  workDate: "",
  shift: "MORNING",
  maxPatients: 10,
});

const rules: FormRules<CreateDoctorScheduleRequest> = {
  workDate: [
    { required: true, message: "Vui lòng chọn ngày", trigger: "change" },
  ],
  shift: [{ required: true, message: "Vui lòng chọn ca", trigger: "change" }],
  maxPatients: [
    { required: true, message: "Vui lòng nhập số lượng", trigger: "blur" },
  ],
};

const disabledDate = (time: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return time.getTime() < today.getTime();
};

const resetForm = () => {
  form.workDate = "";
  form.shift = "MORNING";
  form.maxPatients = 10;
  formRef.value?.clearValidate();
};

const submit = async () => {
  if (!formRef.value) return;

  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  try {
    submitting.value = true;
    await doctorScheduleRequestApi.create(form);
    ElMessage.success("Đăng ký lịch làm việc thành công");
    resetForm();
  } catch (error: any) {
    ElMessage.error(error?.message || "Không thể gửi yêu cầu");
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped lang="scss">
.schedule-request-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.header-card,
.content-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.06);
}

.header-card {
  padding: 20px 24px;
}

.content-card {
  padding: 22px 24px;
  max-width: 620px;
}

.form-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 14px;
  margin-bottom: 18px;
  border-bottom: 1px solid #f1f5f9;
}

.form-head-icon {
  width: 20px;
  height: 20px;
  color: #14b8a6;
}

.form-head-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.page-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
}

.page-subtitle {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 14px;
}

.request-form {
  display: flex;
  flex-direction: column;
  gap: 6px;

  :deep(.el-form-item__label) {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
  }

  :deep(.el-input__wrapper) {
    border-radius: 10px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
    }

    &.is-focus {
      box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.12);
    }
  }

  :deep(.el-input-number) {
    width: 100%;
  }

  :deep(.el-input-number .el-input__inner) {
    text-align: center;
  }
}

.shift-group {
  width: 100%;
}

.form-control {
  width: 100%;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 0;
  font-size: 14px;
  font-weight: 500;
}

:deep(.el-radio-group) {
  display: flex;
  gap: 10px;
  width: 100%;

  .el-radio-button {
    flex: 1;

    .el-radio-button__inner {
      width: 100%;
      border-radius: 10px;
      padding: 12px 16px;
      transition: all 0.25s ease;
      border: 2px solid #e5e7eb;
      font-weight: 500;
    }

    &:first-child {
      .el-radio-button__inner:hover {
        background: #ecfeff;
        border-color: #06b6d4;
      }

      &.is-active .el-radio-button__inner {
        background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
        border-color: #06b6d4;
        color: #fff;
        box-shadow: 0 4px 12px rgba(6, 182, 212, 0.28);
      }
    }

    &:last-child {
      .el-radio-button__inner:hover {
        background: #fef3c7;
        border-color: #f59e0b;
      }

      &.is-active .el-radio-button__inner {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        border-color: #f59e0b;
        color: #fff;
        box-shadow: 0 4px 12px rgba(245, 158, 11, 0.28);
      }
    }
  }
}

.actions {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;

  .cancel-button,
  .submit-button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    padding: 10px 18px;
    transition: all 0.25s ease;
    cursor: pointer;
  }

  .cancel-button {
    border: 1px solid #e5e7eb;
    background: #fff;
    color: #4b5563;

    &:hover {
      background: #f9fafb;
      border-color: #d1d5db;
      color: #1f2937;
    }
  }

  .submit-button {
    border: none;
    background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
    color: #fff;
    box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);

    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(20, 184, 166, 0.38);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

@media (max-width: 768px) {
  .content-card {
    max-width: 100%;
    padding: 18px;
  }

  .actions {
    justify-content: stretch;

    .cancel-button,
    .submit-button {
      flex: 1;
      justify-content: center;
    }
  }
}
</style>
