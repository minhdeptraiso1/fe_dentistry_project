<template>
  <div class="appointment-list-container">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Quản lý lịch khám</h1>
        <p class="page-subtitle">Tạo và quản lý lịch hẹn khám bệnh</p>
      </div>
      <button @click="openCreateDialog" class="add-button">
        <el-icon><Plus /></el-icon>
        <span>Tạo lịch hẹn</span>
      </button>
    </div>

    <!-- Search Section -->
    <div class="search-card">
      <div class="search-header">
        <el-icon class="search-header-icon"><Search /></el-icon>
        <span class="search-header-text">Tìm kiếm lịch hẹn</span>
      </div>
      <div class="search-content">
        <div class="search-row">
          <el-date-picker
            v-model="searchParams.date"
            type="date"
            placeholder="Chọn ngày khám"
            class="search-input search-input-date"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            clearable
            @clear="loadAppointments"
          />
          <el-select
            v-model="searchParams.shift"
            placeholder="Chọn ca"
            class="search-input search-input-shift"
            clearable
            @clear="loadAppointments"
          >
            <el-option label="Sáng" value="MORNING" />
            <el-option label="Chiều" value="AFTERNOON" />
          </el-select>
          <el-select
            v-model="searchParams.status"
            placeholder="Trạng thái"
            class="search-input search-input-status"
            clearable
            @clear="loadAppointments"
          >
            <el-option label="Chờ phân công" value="WAITING" />
            <el-option label="Đã phân công" value="ASSIGNED" />
            <el-option label="Đang khám" value="IN_PROGRESS" />
            <el-option label="Hoàn thành" value="DONE" />
            <el-option label="Đã hủy" value="CANCELLED" />
          </el-select>
        </div>
        <div class="search-actions">
          <button @click="handleSearch" class="search-button">
            <el-icon><Search /></el-icon>
            <span>Tìm kiếm</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Appointments table -->
    <div class="table-card">
      <el-table :data="appointments" v-loading="loading" class="modern-table">
        <el-table-column type="index" label="STT" width="60" align="center" />
        <el-table-column
          prop="appointmentCode"
          label="Mã phiếu"
          width="120"
          align="center"
        >
          <template #default="{ row }">
            <span class="font-mono font-semibold text-primary-600">{{
              row.appointmentCode
            }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Bệnh nhân" min-width="180">
          <template #default="{ row }">
            <div class="flex items-center gap-3">
              <el-avatar
                :size="36"
                class="bg-gradient-to-br from-teal-500 to-teal-600"
              >
                {{ row.patientName?.[0] || "?" }}
              </el-avatar>
              <div>
                <div class="font-medium text-gray-900">
                  {{ row.patientName }}
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Ngày khám" width="140">
          <template #default="{ row }">
            <span class="text-gray-700">{{ formatDate(row.workDate) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Ca" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.shift === 'MORNING' ? 'warning' : 'primary'"
              size="small"
              effect="light"
            >
              {{ row.shift === "MORNING" ? "Sáng" : "Chiều" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Bác sĩ" min-width="150">
          <template #default="{ row }">
            <div v-if="row.doctorName" class="flex items-center gap-2">
              <el-avatar :size="28" class="bg-blue-500">
                {{ row.doctorName?.[0] || "?" }}
              </el-avatar>
              <span class="text-gray-700">{{ row.doctorName }}</span>
            </div>
            <span v-else class="text-gray-400 italic">Chưa phân công</span>
          </template>
        </el-table-column>
        <el-table-column label="Trạng thái" width="140" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="Thao tác"
          width="300"
          fixed="right"
          align="center"
        >
          <template #default="{ row }">
            <div class="action-buttons">
              <button
                v-if="row.status === 'WAITING'"
                @click="openAssignDialog(row)"
                class="action-btn action-btn-success"
              >
                <el-icon><UserFilled /></el-icon>
                <span>Phân BS</span>
              </button>
              <button
                @click="viewDetail(row)"
                class="action-btn action-btn-info"
              >
                <el-icon><View /></el-icon>
                <span>Chi tiết</span>
              </button>
              <button
                v-if="row.status === 'WAITING' || row.status === 'ASSIGNED'"
                @click="openCancelDialog(row)"
                class="action-btn action-btn-danger"
              >
                <el-icon><Close /></el-icon>
                <span>Hủy</span>
              </button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadAppointments"
          @current-change="loadAppointments"
        />
      </div>
    </div>

    <!-- Dialogs -->
    <CreateAppointmentDialog
      v-model="createDialogVisible"
      @success="loadAppointments"
    />
    <AssignDoctorDialog
      v-model="assignDialogVisible"
      :appointment="selectedAppointment"
      @success="loadAppointments"
    />

    <el-dialog
      v-model="cancelDialogVisible"
      title="Hủy lịch hẹn"
      width="520px"
      :close-on-click-modal="false"
    >
      <p class="cancel-dialog-text">
        Bạn có chắc muốn hủy lịch hẹn
        {{ cancelDialogAppointment?.appointmentCode }}?
      </p>

      <el-input
        v-model="cancelDialogNote"
        type="textarea"
        :rows="3"
        placeholder="Lý do hủy (tùy chọn)"
      />

      <template #footer>
        <div class="dialog-footer">
          <button
            class="cancel-button"
            :disabled="cancelDialogLoading"
            @click="cancelDialogVisible = false"
          >
            Đóng
          </button>
          <button
            class="submit-button"
            :disabled="cancelDialogLoading"
            @click="handleCancelAppointment"
          >
            Hủy lịch hẹn
          </button>
          <button
            class="cancel-all-button"
            :disabled="cancelDialogLoading"
            @click="handleCancelAllAppointments"
          >
            Hủy toàn bộ
          </button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { Plus, Search, View, UserFilled, Close } from "@element-plus/icons-vue";
import { appointmentApi } from "@/api/appointment";
import { emailApi } from "@/api/email";
import { userApi } from "@/api/user";
import { sortByCreatedAtDesc } from "@/utils/sort";
import CreateAppointmentDialog from "./components/CreateAppointmentDialog.vue";
import AssignDoctorDialog from "./components/AssignDoctorDialog.vue";
import type { Appointment, WorkShift } from "@/types";

const router = useRouter();

// State
const loading = ref(false);
const appointments = ref<Appointment[]>([]);
const selectedAppointment = ref<Appointment | null>(null);

// Pagination
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0,
});

const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Search params
const searchParams = reactive<{
  date?: string;
  shift?: WorkShift;
  status?: string;
}>({
  date: getTodayDateString(),
  shift: undefined,
  status: undefined,
});
const createDialogVisible = ref(false);
const assignDialogVisible = ref(false);
const cancelDialogVisible = ref(false);
const cancelDialogLoading = ref(false);
const cancelDialogNote = ref("");
const cancelDialogAppointment = ref<Appointment | null>(null);

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

const fireAppointmentCancelledEmail = async (
  appointment: Appointment,
  reason: string | undefined,
  cancelAll: boolean,
) => {
  const to = await resolvePatientEmail(appointment);
  if (!to) return;

  await emailApi.sendTemplate({
    to,
    subject: cancelAll
      ? "Thông báo hủy toàn bộ chuỗi lịch khám"
      : "Thông báo hủy lịch khám",
    template: "appointment-cancelled",
    model: {
      patientName: appointment.patientName || "Bệnh nhân",
      appointmentCode: appointment.appointmentCode,
      workDate: formatDate(appointment.workDate),
      shift: appointment.shift === "MORNING" ? "Ca sáng" : "Ca chiều",
      reason: reason || "Không có lý do cụ thể",
      cancelScope: cancelAll ? "Toàn bộ chuỗi lịch khám" : "Lịch khám này",
    },
  });
};

// Methods
const loadAppointments = async () => {
  try {
    loading.value = true;
    const params: any = {
      ...searchParams,
      page: pagination.page - 1,
      size: pagination.size,
    };
    const response = await appointmentApi.search(params);
    // Map doctorUsername to doctorName for display
    appointments.value = sortByCreatedAtDesc(response.content || []).map((apt: any) => ({
      ...apt,
      doctorName: apt.doctorUsername || null,
    }));
    pagination.total = response.totalElements;
  } catch (error: any) {
    ElMessage.error(error.message || "Không thể tải danh sách lịch hẹn");
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.page = 1;
  loadAppointments();
};

const openCreateDialog = () => {
  createDialogVisible.value = true;
};

const openAssignDialog = (appointment: Appointment) => {
  selectedAppointment.value = appointment;
  assignDialogVisible.value = true;
};

const openCancelDialog = (appointment: Appointment) => {
  cancelDialogAppointment.value = appointment;
  cancelDialogNote.value = "";
  cancelDialogVisible.value = true;
};

const handleCancelAppointment = async () => {
  if (!cancelDialogAppointment.value) {
    return;
  }

  try {
    cancelDialogLoading.value = true;
    const selected = cancelDialogAppointment.value;
    const reason = cancelDialogNote.value?.trim() || undefined;

    await appointmentApi.cancel(selected.id, reason, false);

    void fireAppointmentCancelledEmail(selected, reason, false).catch(() => {
      // Best-effort async email.
    });

    ElMessage.success("Đã hủy lịch hẹn");
    cancelDialogVisible.value = false;
    loadAppointments();
  } catch (error: any) {
    ElMessage.error(error.message || "Không thể hủy lịch hẹn");
  } finally {
    cancelDialogLoading.value = false;
  }
};

const handleCancelAllAppointments = async () => {
  if (!cancelDialogAppointment.value) {
    return;
  }

  try {
    cancelDialogLoading.value = true;
    const selected = cancelDialogAppointment.value;
    const reason = cancelDialogNote.value?.trim() || undefined;

    await appointmentApi.cancel(selected.id, reason, true);

    void fireAppointmentCancelledEmail(selected, reason, true).catch(() => {
      // Best-effort async email.
    });

    ElMessage.success("Đã hủy toàn bộ chuỗi lịch khám");
    cancelDialogVisible.value = false;
    loadAppointments();
  } catch (error: any) {
    ElMessage.error(error.message || "Không thể hủy toàn bộ chuỗi lịch khám");
  } finally {
    cancelDialogLoading.value = false;
  }
};

const viewDetail = (appointment: Appointment) => {
  router.push(`/appointments/${appointment.id}`);
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
  loadAppointments();
});
</script>

<style scoped lang="scss">
.appointment-list-container {
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

  .search-card {
    background: white;
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    .search-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 2px solid #f3f4f6;

      .search-header-icon {
        width: 24px;
        height: 24px;
        color: #14b8a6;
      }

      .search-header-text {
        font-size: 18px;
        font-weight: 600;
        color: #111827;
      }
    }

    .search-content {
      .search-row {
        display: flex;
        gap: 16px;
        margin-bottom: 20px;

        .search-input {
          flex: 1;
          min-width: 180px;
        }

        .search-input-date {
          flex: 1.35;
          min-width: 280px;
        }

        .search-input-shift {
          flex: 0.8;
          min-width: 170px;
        }

        .search-input-status {
          flex: 1;
          min-width: 190px;
        }

        :deep(.el-input) {
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

        :deep(.el-select) {
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

      .search-actions {
        display: flex;
        gap: 12px;

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

      @media (max-width: 1024px) {
        .search-row {
          flex-wrap: wrap;

          .search-input,
          .search-input-date,
          .search-input-shift,
          .search-input-status {
            flex: 1 1 calc(50% - 8px);
            min-width: 220px;
          }
        }
      }

      @media (max-width: 640px) {
        .search-row {
          .search-input,
          .search-input-date,
          .search-input-shift,
          .search-input-status {
            flex: 1 1 100%;
            min-width: 100%;
          }
        }
      }
    }
  }

  .cancel-dialog-text {
    margin: 0 0 12px;
    color: #374151;
    font-size: 16px;
  }

  .table-card {
    background: white;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    .modern-table {
      :deep(.el-table__header-wrapper) {
        th {
          background: #f9fafb;
          color: #374151;
          font-weight: 600;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      }

      :deep(.el-table__row) {
        transition: all 0.2s ease;

        &:hover {
          background: #f0fdfa !important;
        }

        td {
          padding: 16px 0;
          border-bottom: 1px solid #f3f4f6;
        }
      }
    }

    .action-buttons {
      display: flex;
      gap: 6px;
      justify-content: center;
      flex-wrap: nowrap;
    }

    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;

      &.action-btn-info {
        background: #eff6ff;
        color: #2563eb;

        &:hover {
          background: #dbeafe;
          transform: translateY(-1px);
        }
      }

      &.action-btn-primary {
        background: #ecfdf5;
        color: #14b8a6;

        &:hover {
          background: #d1fae5;
          transform: translateY(-1px);
        }
      }

      &.action-btn-success {
        background: #ecfdf5;
        color: #14b8a6;

        &:hover {
          background: #d1fae5;
          transform: translateY(-1px);
        }
      }

      &.action-btn-danger {
        background: #fef2f2;
        color: #ef4444;

        &:hover {
          background: #fee2e2;
          transform: translateY(-1px);
        }
      }

      &.action-btn-danger-outline {
        background: #fff7ed;
        color: #ea580c;

        &:hover {
          background: #ffedd5;
          transform: translateY(-1px);
        }
      }
    }

    .pagination-wrapper {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #f3f4f6;
      display: flex;
      justify-content: center;

      :deep(.el-pagination) {
        .btn-prev,
        .btn-next,
        .el-pager li {
          border-radius: 8px;
          font-weight: 500;

          &:hover {
            color: #14b8a6;
          }

          &.is-active {
            background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
            color: white;
          }
        }
      }
    }
  }

  // Assign Dialog Styles
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

  .dialog-footer-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }

  // Create Dialog Styles
  .patient-option {
    padding: 4px 0;

    .patient-option-left {
      display: flex;
      align-items: center;
      gap: 12px;

      .patient-details {
        .patient-name {
          font-weight: 500;
          color: #1f2937;
          font-size: 14px;
        }

        .patient-phone {
          font-size: 12px;
          color: #9ca3af;
        }
      }
    }
  }

  .radio-label {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .form-hint {
    font-size: 12px;
    color: #9ca3af;
    margin-top: 4px;
    font-style: italic;
  }
}

// Modern Dialog Styles
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

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  background: white;

  .cancel-button,
  .submit-button,
  .cancel-all-button {
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

  .cancel-all-button {
    padding: 10px 24px;
    border: none;
    background: #dc2626;
    color: #ffffff;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.28);

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      background: #b91c1c;
      box-shadow: 0 6px 20px rgba(220, 38, 38, 0.35);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}
</style>
