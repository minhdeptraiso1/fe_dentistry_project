<template>
  <div class="patient-appointment-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Đặt lịch khám</h1>
        <p class="page-subtitle">
          Chọn ngày, ca khám và bác sĩ mong muốn để đặt lịch.
        </p>
      </div>
    </div>

    <div class="content-grid">
      <div class="booking-card">
        <h2 class="card-title">Tạo lịch hẹn mới</h2>

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
            <el-radio-group v-model="form.shift">
              <el-radio-button value="MORNING">Ca sáng</el-radio-button>
              <el-radio-button value="AFTERNOON">Ca chiều</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="Bác sĩ mong muốn (tùy chọn)">
            <el-select
              v-model="selectedDoctorId"
              placeholder="Chọn bác sĩ mong muốn"
              clearable
              filterable
              style="width: 100%"
              :loading="doctorLoading"
            >
              <template #empty>
                <span>Không có bác sĩ đang hoạt động</span>
              </template>
              <el-option
                v-for="doctor in activeDoctors"
                :key="doctor.id"
                :label="doctor.name"
                :value="doctor.id"
              >
                <div class="doctor-option-row">
                  <div class="doctor-option-left">
                    <el-avatar :size="30" :src="doctor.img || undefined">
                      {{ doctor.name?.[0] || "?" }}
                    </el-avatar>
                    <span>{{ doctor.name }}</span>
                  </div>
                  <el-tag type="success" size="small">Đang hoạt động</el-tag>
                </div>
              </el-option>
            </el-select>
            <div class="hint-text">
              Tên bác sĩ mong muốn sẽ được ghi vào ghi chú để nhân viên/admin
              phân công.
            </div>
          </el-form-item>

          <el-form-item label="Ghi chú">
            <el-input
              v-model="form.note"
              type="textarea"
              :rows="3"
              placeholder="Mô tả triệu chứng hoặc lưu ý cho bác sĩ"
            />
          </el-form-item>

          <el-button
            type="primary"
            class="submit-btn"
            :loading="submitting"
            @click="handleSubmit"
          >
            Đặt lịch khám
          </el-button>
        </el-form>
      </div>

      <div class="list-card">
        <div class="list-header">
          <h2 class="card-title">Lịch hẹn của tôi</h2>
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
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage, type FormInstance } from "element-plus";
import { appointmentApi } from "@/api/appointment";
import { emailApi } from "@/api/email";
import { patientApi } from "@/api/patient";
import { useAuthStore } from "@/stores/auth";
import type {
  Appointment,
  AppointmentStatus,
  CreateAppointmentRequest,
  WorkShift,
} from "@/types";

type ActiveDoctorOption = {
  id: string;
  name: string;
  img?: string;
};

const formRef = ref<FormInstance>();
const authStore = useAuthStore();
const loading = ref(false);
const submitting = ref(false);
const doctorLoading = ref(false);
const listDate = ref(new Date().toISOString().split("T")[0]);

const patientId = ref("");
const patientName = ref("");
const appointments = ref<Appointment[]>([]);
const activeDoctors = ref<ActiveDoctorOption[]>([]);
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
  try {
    doctorLoading.value = true;
    const doctors = await patientApi.getActiveDoctors();
    const safeDoctors = Array.isArray(doctors) ? doctors : [];

    activeDoctors.value = safeDoctors.map((doctor) => ({
      id: doctor.id,
      name: doctor.name || "Bác sĩ chưa đặt tên",
      img: doctor.img,
    }));

    if (
      selectedDoctorId.value &&
      !activeDoctors.value.some(
        (doctor) => doctor.id === selectedDoctorId.value,
      )
    ) {
      selectedDoctorId.value = undefined;
    }
  } catch {
    activeDoctors.value = [];
    ElMessage.error("Không thể tải danh sách bác sĩ đang hoạt động");
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
    (doctor) => doctor.id === selectedDoctorId.value,
  );

  if (!selectedDoctor) return baseNote;

  const preference = `Bác sĩ mong muốn: ${selectedDoctor.name}`;
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
    await Promise.all([loadPatientProfile(), loadActiveDoctors()]);
    await loadMyAppointments();
  } catch {
    ElMessage.error("Không thể tải dữ liệu bệnh nhân");
  }
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

  .card-title {
    margin: 0 0 16px 0;
    font-size: 20px;
    font-weight: 700;
    color: #111827;
  }

  .list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;

    .list-actions {
      display: flex;
      align-items: center;
      gap: 12px;

      .list-date-filter {
        width: 180px;
      }
    }
  }

  .booking-form {
    .doctor-option-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
    }

    .doctor-option-left {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;

      span {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
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
      :deep(.el-radio-group) {
        display: inline-flex;
      }

      :deep(.el-radio-button__inner) {
        min-width: 106px;
        border-radius: 10px;
        font-weight: 600;
      }

      :deep(.el-radio-button:first-child .el-radio-button__inner),
      :deep(.el-radio-button:last-child .el-radio-button__inner) {
        border-radius: 10px;
      }

      :deep(.el-radio-button.is-active .el-radio-button__inner) {
        background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
        border-color: #14b8a6;
        box-shadow: 0 2px 8px rgba(20, 184, 166, 0.25);
      }
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
