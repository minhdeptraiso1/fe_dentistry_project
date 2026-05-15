<template>
  <div class="patient-appointment-page">
    <div class="page-header">
      <div class="page-hero">
        <div class="hero-icon">
          <el-icon><Calendar /></el-icon>
        </div>
        <div>
          <h1 class="page-title">Đặt lịch khám</h1>
          <p class="page-subtitle">
            Chọn ngày, ca khám và bác sĩ mong muốn để đặt lịch.
          </p>
        </div>
      </div>
      <div class="page-meta">
        <span class="meta-chip">Lịch hẹn</span>
        <span class="meta-chip muted">Bệnh nhân</span>
      </div>
    </div>

    <div class="content-grid">
      <div class="booking-card">
        <div class="card-header">
          <div class="card-icon">
            <el-icon><Calendar /></el-icon>
          </div>
          <div>
            <h2 class="card-title">Tạo lịch hẹn mới</h2>
            <p class="card-subtitle">
              Điền thông tin lịch khám và gửi yêu cầu.
            </p>
          </div>
        </div>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          class="booking-form"
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
          <!-- Bác sĩ mong muốn nhưng có ai nên comment -->
          <!-- <el-form-item label="Bác sĩ mong muốn (tùy chọn)">
            <el-select
              v-model="selectedDoctorId"
              placeholder="Chọn bác sĩ mong muốn"
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
            <div class="hint-text">
              Tên bác sĩ mong muốn sẽ được ghi vào ghi chú để nhân viên/admin
              phân công.
            </div>
          </el-form-item> -->

          <el-form-item label="Ghi chú">
            <el-input
              v-model="form.note"
              type="textarea"
              :rows="9"
              placeholder="Mô tả triệu chứng hoặc lưu ý cho bác sĩ"
            />
          </el-form-item>

          <div class="form-actions">
            <el-button
              plain
              @click="quickConsultDialogVisible = true"
              class="consult-btn"
            >
              <el-icon><ChatDotRound /></el-icon>
              <span>Tư vấn nhanh</span>
            </el-button>
            <el-button
              type="primary"
              class="submit-btn"
              :loading="submitting"
              @click="handleSubmit"
            >
              Đặt lịch khám
            </el-button>
          </div>
        </el-form>
      </div>

      <div class="list-card">
        <div class="list-header">
          <div class="card-header compact">
            <div class="card-icon alt">
              <el-icon><Document /></el-icon>
            </div>
            <div>
              <h2 class="card-title">Lịch hẹn của tôi</h2>
              <p class="card-subtitle">
                Theo dõi, xem chi tiết và hủy lịch khi cần.
              </p>
            </div>
          </div>
          <div class="list-actions">
            <el-date-picker
              v-model="listDate"
              type="date"
              format="DD/MM/YYYY"
              value-format="YYYY-MM-DD"
              :clearable="false"
              class="list-date-filter"
              @change="loadMyAppointments"
            />
            <el-button
              @click="loadMyAppointments"
              :loading="loading"
              class="refresh-btn"
            >
              Làm mới
            </el-button>
          </div>
        </div>

        <el-table
          :data="appointments"
          v-loading="loading"
          empty-text="Chưa có lịch hẹn"
          class="modern-table"
        >
          <el-table-column
            prop="appointmentCode"
            label="Mã lịch"
            min-width="120"
          />
          <el-table-column prop="workDate" label="Ngày khám" min-width="130">
            <template #default="{ row }">
              {{ formatDate(row.workDate) }}
            </template>
          </el-table-column>
          <el-table-column prop="shift" label="Ca" min-width="100">
            <template #default="{ row }">
              {{ row.shift === "MORNING" ? "Sáng" : "Chiều" }}
            </template>
          </el-table-column>
          <el-table-column prop="doctorName" label="Bác sĩ" min-width="160">
            <template #default="{ row }">
              {{ getDoctorDisplayName(row) }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="Trạng thái" min-width="140">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="Thao tác" min-width="220" fixed="right">
            <template #default="{ row }">
              <div class="action-buttons">
                <button
                  type="button"
                  class="action-btn action-btn-info"
                  @click="goToAppointmentDetail(row.id)"
                  :disabled="rowActionLoading === `detail-${row.id}`"
                >
                  <el-icon><View /></el-icon>
                  <span>Chi tiết</span>
                </button>
                <button
                  v-if="canCancelMyAppointment(row.status)"
                  type="button"
                  class="action-btn action-btn-danger"
                  @click="cancelMyAppointment(row)"
                  :disabled="rowActionLoading === `cancel-${row.id}`"
                >
                  <el-icon><Close /></el-icon>
                  <span>Hủy</span>
                </button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- Quick Consult Dialog -->
    <QuickConsultDialog
      v-model="quickConsultDialogVisible"
      @select="handleQuickConsultSelect"
    />

  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox, type FormInstance } from "element-plus";
import {
  Sunrise,
  Sunset,
  ChatDotRound,
  View,
  Calendar,
  Document,
} from "@element-plus/icons-vue";
import { appointmentApi } from "@/api/appointment";
import { emailApi } from "@/api/email";
import { patientApi } from "@/api/patient";
import { doctorCapacityApi } from "@/api/doctorCapacity";
import { useAuthStore } from "@/stores/auth";
import QuickConsultDialog from "./components/QuickConsultDialog.vue";
import type {
  Appointment,
  AppointmentStatus,
  CreateAppointmentRequest,
  WorkShift,
  AvailableDoctor,
} from "@/types";

const formRef = ref<FormInstance>();
const authStore = useAuthStore();
const router = useRouter();
const loading = ref(false);
const submitting = ref(false);
const doctorLoading = ref(false);
const listDate = ref(new Date().toISOString().split("T")[0]);
const quickConsultDialogVisible = ref(false);
const rowActionLoading = ref<string | null>(null);

const patientId = ref("");
const patientName = ref("");
const appointments = ref<Appointment[]>([]);
const activeDoctors = ref<AvailableDoctor[]>([]);
const selectedDoctorId = ref<string | undefined>(undefined);

const form = reactive<CreateAppointmentRequest>({
  patientId: "",
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

const disabledDate = (date: Date) =>
  date < new Date(new Date().setHours(0, 0, 0, 0));

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};


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

const getDoctorDisplayName = (row: Appointment) => {
  const extended = row as Appointment & {
    doctorUsername?: string;
  };
  return extended.doctorName || extended.doctorUsername || "Chờ phân công";
};

const canCancelMyAppointment = (status: AppointmentStatus) => {
  return status !== "DONE" && status !== "IN_PROGRESS" && status !== "CANCELLED";
};

const loadPatientProfile = async () => {
  const profile = await patientApi.getMyProfile();
  patientId.value = profile.id;
  patientName.value = profile.fullName || "";
  form.patientId = profile.id;
};

const fireAppointmentCreatedEmail = (appointment: Appointment) => {
  const to = authStore.user?.email;
  if (!to) return;

  emailApi
    .sendTemplate({
      to,
      subject: "Xác nhận đặt lịch khám",
      template: "appointment-created",
      model: {
        patientName:
          patientName.value || authStore.user?.fullName || "Bệnh nhân",
        appointmentCode: appointment.appointmentCode,
        workDate: formatDate(appointment.workDate),
        shift: appointment.shift === "MORNING" ? "Ca sáng" : "Ca chiều",
        doctorName:
          appointment.doctorName ||
          appointment.doctorUsername ||
          "Sẽ được phân công",
        note: appointment.note || "Không có",
      },
    })
    .catch(() => {
      // Best-effort async call only.
    });
};

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
      selectedDoctorId.value &&
      !activeDoctors.value.some(
        (doctor) => doctor.doctorId === selectedDoctorId.value,
      )
    ) {
      selectedDoctorId.value = undefined;
    }
  } catch {
    activeDoctors.value = [];
    ElMessage.error("Không thể tải danh sách bác sĩ có ca làm việc vào ngày này");
  } finally {
    doctorLoading.value = false;
  }
};

const normalizePatientNote = (value: string) => {
  const cleaned = value.trim();
  if (!cleaned) return "";

  const hasPrefix = /^l(ưu|uu)\s*ý\s*:/i.test(cleaned);
  return hasPrefix ? cleaned : `Lưu ý: ${cleaned}`;
};

const buildAppointmentNote = () => {
  const baseNote = normalizePatientNote(form.note || "");
  if (!selectedDoctorId.value) return baseNote;

  const selectedDoctor = activeDoctors.value.find(
    (doctor) => doctor.doctorId === selectedDoctorId.value,
  );

  if (!selectedDoctor) return baseNote;

  const preference = `Bác sĩ mong muốn: ${selectedDoctor.doctorName}`;
  return baseNote ? `${preference}. ${baseNote}` : preference;
};

const loadMyAppointments = async () => {
  if (!patientId.value) return;

  try {
    loading.value = true;
    const response = await appointmentApi.getMy({
      date: listDate.value,
      page: 0,
      size: 100,
    });
    const content = (response.content || []) as Array<
      Appointment & { doctorUsername?: string }
    >;
    appointments.value = content.map((item) => ({
      ...item,
      doctorName: item.doctorName || item.doctorUsername,
    }));
  } catch (error: any) {
    ElMessage.error(error?.message || "Không thể tải lịch hẹn");
  } finally {
    loading.value = false;
  }
};

const goToAppointmentDetail = async (appointmentId: string) => {
  rowActionLoading.value = `detail-${appointmentId}`;
  router.push(`/patient/appointments/${appointmentId}`);
  rowActionLoading.value = null;
};

const cancelMyAppointment = async (appointment: Appointment) => {
  try {
    const result = await ElMessageBox.prompt(
      `Bạn có chắc muốn hủy lịch ${appointment.appointmentCode}? Bạn có thể nhập lý do (không bắt buộc).`,
      "Xác nhận hủy lịch",
      {
        confirmButtonText: "Hủy lịch",
        cancelButtonText: "Đóng",
        inputType: "textarea",
        inputPlaceholder: "Nhập lý do hủy (không bắt buộc)",
      },
    );

    const note =
      typeof result === "object" && "value" in result
        ? String((result as { value?: string }).value || "").trim()
        : "";

    rowActionLoading.value = `cancel-${appointment.id}`;
    await appointmentApi.cancelMy(appointment.id, note || undefined);
    ElMessage.success("Hủy lịch hẹn thành công");

    await loadMyAppointments();
  } catch (error: any) {
    if (error !== "cancel" && error !== "close") {
      ElMessage.error(error?.message || "Không thể hủy lịch hẹn");
    }
  } finally {
    rowActionLoading.value = null;
  }
};

const handleQuickConsultSelect = (data: { service?: any; doctor?: any; note: string }) => {
  // Fill in the selected doctor if available
  if (data.doctor) {
    // Find doctor by name in available doctors list
    const matchedDoctor = activeDoctors.value.find(
      (d) => d.doctorName === data.doctor.name
    );
    if (matchedDoctor) {
      selectedDoctorId.value = matchedDoctor.doctorId;
    }
  }

  // Set consultation note to form note
  if (data.note) {
    form.note = data.note;
  }

  // Close dialog and scroll to form
  quickConsultDialogVisible.value = false;
  
  // Scroll to booking card
  setTimeout(() => {
    const bookingCard = document.querySelector(".booking-card");
    bookingCard?.scrollIntoView({ behavior: "smooth" });
  }, 100);

  ElMessage.success("Thông tin tư vấn đã được thêm vào form");
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    submitting.value = true;

    const createdAppointment = await appointmentApi.createMy({
      patientId: patientId.value,
      workDate: form.workDate,
      shift: form.shift,
      doctorId: undefined,
      note: buildAppointmentNote(),
    });

    ElMessage.success("Đặt lịch khám thành công");
    fireAppointmentCreatedEmail(createdAppointment);
    form.workDate = "";
    form.shift = "MORNING";
    selectedDoctorId.value = undefined;
    form.note = "";
    await loadMyAppointments();
  } catch (error: any) {
    if (error?.message) {
      ElMessage.error(error.message);
    }
  } finally {
    submitting.value = false;
  }
};

onMounted(async () => {
  try {
    await loadPatientProfile();
    await loadMyAppointments();

  } catch {
    ElMessage.error("Không thể tải dữ liệu bệnh nhân");
  }

  // Watch for changes in workDate or shift to reload available doctors
  watch(
    () => [form.workDate, form.shift],
    () => {
      if (form.workDate && form.shift) {
        loadActiveDoctors();
      }
    },
  );
});
</script>

<style scoped lang="scss">
.patient-appointment-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding: 20px 24px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    .page-hero {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .hero-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
      color: white;
      box-shadow: 0 6px 16px rgba(13, 148, 136, 0.2);
    }

    .page-meta {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .meta-chip {
      padding: 6px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      color: #0d9488;
      background: #f0fdfa;
      border: 1px solid #99f6e4;

      &.muted {
        color: #475569;
        background: #f8fafc;
        border-color: #e2e8f0;
      }
    }

    .page-title {
      margin: 0 0 4px 0;
      font-size: 28px;
      font-weight: 700;
      background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .page-subtitle {
      margin: 0;
      color: #6b7280;
      font-size: 14px;
    }
  }

  .content-grid {
    display: grid;
    grid-template-columns: 2fr 3fr;
    gap: 24px;
  }

  .booking-card,
  .list-card {
    background: white;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;

    &.compact {
      margin-bottom: 0;
    }
  }

  .card-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: #ecfeff;
    color: #0f766e;

    &.alt {
      background: #eff6ff;
      color: #1d4ed8;
    }
  }

  .card-title {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: #111827;
  }

  .card-subtitle {
    margin: 4px 0 0;
    font-size: 13px;
    color: #64748b;
  }

  .list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .booking-form {
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
      margin-top: 6px;
      font-size: 12px;
      color: #6b7280;
      line-height: 1.4;
    }

    :deep(.el-form-item__label) {
      color: #374151;
      font-size: 16px;
      font-weight: 500;
      margin-bottom: 8px;
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
        padding: 8px 16px;
        min-width: 120px;
        border: 2px solid #d1d5db;
        border-radius: 10px;
        background: white;
        color: #6b7280;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.25s ease;

        i {
          font-size: 16px;
        }

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
  }

  .form-actions {
    display: flex;
    gap: 12px;
    margin-top: 24px;

    .consult-btn {
      flex: 0 0 auto;
      min-width: 140px;
      height: 42px;
      border-radius: 10px;
      font-weight: 600;
      border: 2px solid #14b8a6;
      color: #14b8a6;
      background: white;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(20, 184, 166, 0.05);
        box-shadow: 0 2px 8px rgba(20, 184, 166, 0.15);
      }

      &:active {
        transform: translateY(1px);
      }

      :deep(.el-icon) {
        margin-right: 6px;
      }
    }

    .submit-btn {
      flex: 1;
    }
  }

  .submit-btn {
    width: 100%;
    height: 42px;
    border: none;
    border-radius: 10px;
    font-size: 18px;
    font-weight: 700;
    background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
    box-shadow: 0 2px 8px rgba(20, 184, 166, 0.25);

    &.form-actions .submit-btn {
      width: auto;
      flex: 1;
    }

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(20, 184, 166, 0.35);
    }

    &:active {
      transform: translateY(0);
    }
  }

  .refresh-btn {
    height: 36px;
    border-radius: 10px;
    color: #0d9488;
    border-color: #99f6e4;
    background: #f0fdfa;
    font-weight: 600;
  }

  :deep(.list-date-filter .el-input__wrapper) {
    border-radius: 10px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    transition: all 0.25s ease;

    &:hover {
      box-shadow: 0 2px 8px rgba(20, 184, 166, 0.15);
    }

    &.is-focus {
      box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
    }
  }

  .modern-table {
    :deep(.el-table__header-wrapper th) {
      background: #f9fafb;
      color: #374151;
      font-weight: 600;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    :deep(.el-table__row:hover td) {
      background: #f0fdfa !important;
    }

    .action-buttons {
      display: flex;
      gap: 6px;
      align-items: center;
      justify-content: center;
      flex-wrap: nowrap;
    }
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

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    &.action-btn-info {
      background: #eff6ff;
      color: #2563eb;

      &:hover:not(:disabled) {
        background: #dbeafe;
        transform: translateY(-1px);
      }
    }

    &.action-btn-danger {
      background: #fef2f2;
      color: #ef4444;

      &:hover:not(:disabled) {
        background: #fee2e2;
        transform: translateY(-1px);
      }
    }
  }

  @media (max-width: 1280px) {
    .content-grid {
      grid-template-columns: 1fr;
    }

    .list-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }
  }
}
</style>
