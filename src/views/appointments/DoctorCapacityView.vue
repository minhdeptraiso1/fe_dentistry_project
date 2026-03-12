<template>
  <div class="doctor-capacity-container">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Phân công làm việc</h1>
        <p class="page-subtitle">Quản lý lịch làm việc và công suất bác sĩ</p>
      </div>
      <button @click="openSetCapacityDialog" class="add-button">
        <el-icon><Plus /></el-icon>
        <span>Thiết lập công suất</span>
      </button>
    </div>

    <!-- Date and Shift Selection -->
    <div class="filter-card">
      <div class="filter-header">
        <el-icon class="filter-header-icon"><Calendar /></el-icon>
        <span class="filter-header-text">Xem công suất bác sĩ</span>
      </div>
      <div class="filter-content">
        <el-date-picker
          v-model="viewDate"
          type="date"
          placeholder="Chọn ngày"
          format="DD/MM/YYYY"
          value-format="YYYY-MM-DD"
          class="filter-input"
          @change="loadAvailableDoctors"
        />
        <el-radio-group v-model="viewShift" @change="loadAvailableDoctors">
          <el-radio-button value="MORNING">
            <el-icon><Sunrise /></el-icon>
            Ca sáng
          </el-radio-button>
          <el-radio-button value="AFTERNOON">
            <el-icon><Sunset /></el-icon>
            Ca chiều
          </el-radio-button>
        </el-radio-group>
        <button @click="loadAvailableDoctors" class="search-button">
          <el-icon><Search /></el-icon>
          <span>Xem</span>
        </button>
      </div>
    </div>

    <!-- Available Doctors List -->
    <div v-if="viewDate && viewShift" class="doctors-card">
      <div class="card-header">
        <h3 class="card-title">
          Danh sách bác sĩ - {{ formatDate(viewDate) }} -
          {{ viewShift === "MORNING" ? "Ca sáng" : "Ca chiều" }}
        </h3>
      </div>

      <div v-loading="loading" class="doctors-grid">
        <div
          v-if="!loading && availableDoctors.length === 0"
          class="empty-state"
        >
          <el-empty description="Chưa có bác sĩ nào được phân công" />
        </div>

        <div
          v-for="doctor in availableDoctors"
          :key="doctor.doctorId"
          class="doctor-card"
          :class="{ 'is-full': doctor.isFull }"
        >
          <div class="doctor-header">
            <el-avatar
              :size="50"
              class="bg-gradient-to-br from-blue-500 to-blue-600"
            >
              {{ doctor.doctorName?.[0] || "?" }}
            </el-avatar>
            <div class="doctor-info">
              <h3 class="doctor-name">{{ doctor.doctorName }}</h3>
              <el-tag
                :type="doctor.isFull ? 'danger' : 'success'"
                size="small"
                effect="light"
              >
                {{ doctor.isFull ? "Đã đủ" : "Còn chỗ" }}
              </el-tag>
            </div>
          </div>

          <div class="doctor-stats">
            <div class="stat-item">
              <span class="stat-label">Công suất tối đa:</span>
              <span class="stat-value text-blue-600">{{
                doctor.maxPatients
              }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Hiện tại:</span>
              <span
                class="stat-value"
                :class="doctor.isFull ? 'text-red-600' : 'text-green-600'"
              >
                {{ doctor.currentPatients }}
              </span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Còn lại:</span>
              <span class="stat-value text-gray-600">{{
                doctor.remaining
              }}</span>
            </div>
          </div>

          <div class="progress-bar">
            <el-progress
              :percentage="(doctor.currentPatients / doctor.maxPatients) * 100"
              :status="doctor.isFull ? 'exception' : undefined"
              :stroke-width="8"
            />
          </div>

          <div class="doctor-actions">
            <el-button
              type="primary"
              size="small"
              @click="editDoctorCapacity(doctor)"
            >
              <el-icon><Edit /></el-icon>
              Chỉnh sửa
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- Set Capacity Dialog -->
    <el-dialog
      v-model="capacityDialogVisible"
      :title="isEdit ? 'Chỉnh sửa công suất' : 'Thiết lập công suất'"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="capacityFormRef"
        :model="capacityForm"
        :rules="capacityRules"
        label-width="120px"
        label-position="left"
      >
        <el-form-item label="Bác sĩ" prop="doctorId">
          <el-select
            v-model="capacityForm.doctorId"
            placeholder="Chọn bác sĩ"
            style="width: 100%"
            :disabled="isEdit"
            filterable
          >
            <el-option
              v-for="doctor in doctors"
              :key="doctor.id"
              :label="doctor.fullName"
              :value="doctor.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Ngày làm việc" prop="workDate">
          <el-date-picker
            v-model="capacityForm.workDate"
            type="date"
            placeholder="Chọn ngày"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            style="width: 100%"
            :disabled="isEdit"
            :disabled-date="disabledDate"
          />
        </el-form-item>

        <el-form-item label="Ca làm việc" prop="shift">
          <el-radio-group v-model="capacityForm.shift" :disabled="isEdit">
            <el-radio value="MORNING">
              <el-icon><Sunrise /></el-icon>
              Ca sáng
            </el-radio>
            <el-radio value="AFTERNOON">
              <el-icon><Sunset /></el-icon>
              Ca chiều
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="Số BN tối đa" prop="maxPatients">
          <el-input-number
            v-model="capacityForm.maxPatients"
            :min="1"
            :max="50"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="capacityDialogVisible = false">Hủy</el-button>
          <el-button
            type="primary"
            @click="handleSetCapacity"
            :loading="submitting"
          >
            {{ isEdit ? "Cập nhật" : "Thiết lập" }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, type FormInstance } from "element-plus";
import {
  Plus,
  Calendar,
  Sunrise,
  Sunset,
  Search,
  Edit,
} from "@element-plus/icons-vue";
import { doctorCapacityApi } from "@/api/doctorCapacity";
import { userApi } from "@/api/user";
import type {
  AvailableDoctor,
  SetDoctorShiftCapacityRequest,
  WorkShift,
  User,
} from "@/types";

// State
const loading = ref(false);
const submitting = ref(false);
const availableDoctors = ref<AvailableDoctor[]>([]);
const doctors = ref<User[]>([]);
const viewDate = ref(new Date().toISOString().split("T")[0]);
const viewShift = ref<WorkShift>("MORNING");
const capacityDialogVisible = ref(false);
const isEdit = ref(false);

// Forms
const capacityFormRef = ref<FormInstance>();
const capacityForm = reactive<SetDoctorShiftCapacityRequest>({
  doctorId: "",
  workDate: "",
  shift: "MORNING",
  maxPatients: 10,
});

// Validation rules
const capacityRules = {
  doctorId: [
    { required: true, message: "Vui lòng chọn bác sĩ", trigger: "change" },
  ],
  workDate: [
    {
      required: true,
      message: "Vui lòng chọn ngày làm việc",
      trigger: "change",
    },
  ],
  shift: [
    { required: true, message: "Vui lòng chọn ca làm việc", trigger: "change" },
  ],
  maxPatients: [
    {
      required: true,
      message: "Vui lòng nhập số bệnh nhân tối đa",
      trigger: "blur",
    },
  ],
};

// Methods
const loadAvailableDoctors = async () => {
  if (!viewDate.value || !viewShift.value) return;

  try {
    loading.value = true;
    const data = await doctorCapacityApi.getAvailableDoctors(
      viewDate.value,
      viewShift.value,
    );

    // Transform data to add computed fields and map field names
    availableDoctors.value = data.map((doctor: any) => ({
      ...doctor,
      doctorName: doctor.fullName || doctor.doctorName, // Map fullName from backend to doctorName
      remaining: doctor.maxPatients - doctor.currentPatients,
      isFull: doctor.currentPatients >= doctor.maxPatients,
    }));
  } catch (error: any) {
    ElMessage.error(error.message || "Không thể tải danh sách bác sĩ");
  } finally {
    loading.value = false;
  }
};

const loadDoctors = async () => {
  try {
    const response = await userApi.search({
      role: "DOCTOR",
    } as any);
    doctors.value = response.content;
  } catch (error: any) {
    ElMessage.error("Không thể tải danh sách bác sĩ");
  }
};

const openSetCapacityDialog = () => {
  isEdit.value = false;
  capacityDialogVisible.value = true;
  Object.assign(capacityForm, {
    doctorId: "",
    workDate: viewDate.value || "",
    shift: viewShift.value || "MORNING",
    maxPatients: 10,
  });
  capacityFormRef.value?.clearValidate();
};

const editDoctorCapacity = (doctor: AvailableDoctor) => {
  isEdit.value = true;
  capacityDialogVisible.value = true;
  Object.assign(capacityForm, {
    doctorId: doctor.doctorId,
    workDate: viewDate.value,
    shift: viewShift.value,
    maxPatients: doctor.maxPatients,
  });
  capacityFormRef.value?.clearValidate();
};

const handleSetCapacity = async () => {
  try {
    await capacityFormRef.value?.validate();
    submitting.value = true;

    await doctorCapacityApi.setCapacity(capacityForm);

    ElMessage.success(
      isEdit.value
        ? "Cập nhật công suất thành công"
        : "Thiết lập công suất thành công",
    );
    capacityDialogVisible.value = false;
    loadAvailableDoctors();
  } catch (error: any) {
    if (error.message) {
      ElMessage.error(error.message);
    }
  } finally {
    submitting.value = false;
  }
};

const disabledDate = (date: Date) => {
  // Disable past dates
  return date < new Date(new Date().setHours(0, 0, 0, 0));
};

const formatDate = (date: string) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("vi-VN");
};

// Lifecycle
onMounted(() => {
  loadDoctors();
  loadAvailableDoctors();
});
</script>

<style scoped lang="scss">
.doctor-capacity-container {
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

    .add-button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(20, 184, 166, 0.4);
      }

      &:active {
        transform: translateY(0);
      }
    }
  }

  .filter-card {
    background: white;
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    .filter-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 2px solid #f3f4f6;

      .filter-header-icon {
        width: 24px;
        height: 24px;
        color: #14b8a6;
      }

      .filter-header-text {
        font-size: 18px;
        font-weight: 600;
        color: #111827;
      }
    }

    .filter-content {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      align-items: center;

      .filter-input {
        flex: 1;
        min-width: 200px;

        :deep(.el-date-editor) {
          width: 100%;

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

      :deep(.el-radio-group) {
        .el-radio-button {
          .el-radio-button__inner {
            border-radius: 10px;
            transition: all 0.3s ease;

            &:hover {
              color: #14b8a6;
              border-color: #14b8a6;
            }
          }

          &.is-active {
            .el-radio-button__inner {
              background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
              border-color: #14b8a6;
              box-shadow: 0 2px 8px rgba(20, 184, 166, 0.25);
            }
          }
        }
      }

      .search-button {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 24px;
        background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
        color: white;
        border: none;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(20, 184, 166, 0.25);
        height: 40px;

        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(20, 184, 166, 0.35);
        }

        &:active {
          transform: translateY(0);
        }
      }
    }
  }

  .doctors-card {
    background: white;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    .card-header {
      margin-bottom: 20px;

      .card-title {
        font-size: 18px;
        font-weight: 600;
        color: #111827;
        margin: 0;
      }
    }

    .doctors-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;

      .empty-state {
        grid-column: 1 / -1;
        padding: 40px 20px;
      }
    }

    .doctor-card {
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px;
      transition: all 0.3s ease;
      background: white;

      &:hover {
        border-color: #14b8a6;
        box-shadow: 0 4px 12px rgba(20, 184, 166, 0.15);
      }

      &.is-full {
        border-color: #fca5a5;
        background: #fef2f2;
      }

      .doctor-header {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;

        .doctor-info {
          flex: 1;

          .doctor-name {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
            margin: 0 0 8px 0;
          }
        }
      }

      .doctor-stats {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 16px;

        .stat-item {
          display: flex;
          justify-content: space-between;
          font-size: 14px;

          .stat-label {
            color: #6b7280;
          }

          .stat-value {
            font-weight: 600;
          }
        }
      }

      .progress-bar {
        margin-bottom: 16px;
      }

      .doctor-actions {
        display: flex;
        gap: 8px;

        .el-button {
          flex: 1;
        }
      }
    }
  }

  @media (max-width: 768px) {
    .doctors-grid {
      grid-template-columns: 1fr;
    }

    .filter-content {
      flex-direction: column;

      .filter-input {
        width: 100%;
      }
    }
  }
}
</style>
