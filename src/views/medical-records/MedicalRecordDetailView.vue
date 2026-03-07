<template>
  <div class="medical-record-detail-container">
    <!-- Header Actions -->
    <div class="detail-header">
      <button @click="router.back()" class="back-button">
        <component :is="BackIcon" />
        <span>Quay lại</span>
      </button>
      <div class="header-actions">
        <button
          v-if="canCreateTreatmentPlan"
          @click="handleCreateTreatmentPlan"
          class="action-button action-button-success"
        >
          <component :is="PlanIcon" />
          <span>Tạo kế hoạch điều trị</span>
        </button>
        <button
          v-if="canEdit"
          @click="handleEdit"
          class="action-button action-button-primary"
        >
          <component :is="EditIcon" />
          <span>Chỉnh sửa</span>
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="detail-card" v-loading="loading">
      <div v-if="record">
        <div class="card-title">
          <component :is="RecordIcon" class="title-icon" />
          <h2>Phiếu khám {{ record.recordCode }}</h2>
        </div>

        <div class="info-grid">
          <!-- Mã phiếu khám -->
          <div class="info-item">
            <div class="info-label">
              <component :is="IdIcon" />
              <span>Mã phiếu khám</span>
            </div>
            <div class="info-value">{{ record.recordCode }}</div>
          </div>

          <!-- Ngày khám -->
          <div class="info-item">
            <div class="info-label">
              <component :is="CalendarIcon" />
              <span>Ngày khám</span>
            </div>
            <div class="info-value">{{ formatDateTime(record.visitDate) }}</div>
          </div>

          <!-- Bệnh nhân -->
          <div class="info-item">
            <div class="info-label">
              <component :is="UserIcon" />
              <span>Bệnh nhân</span>
            </div>
            <button @click="viewPatient(record.patientId)" class="patient-link">
              {{ record.patientCode }} - {{ record.patientName }}
            </button>
          </div>

          <!-- Bác sĩ -->
          <div class="info-item">
            <div class="info-label">
              <component :is="DoctorIcon" />
              <span>Bác sĩ</span>
            </div>
            <div class="info-value">{{ record.doctorUsername }}</div>
          </div>

          <!-- Triệu chứng -->
          <div class="info-item full-width">
            <div class="info-label">
              <component :is="SymptomIcon" />
              <span>Triệu chứng</span>
            </div>
            <div class="info-value whitespace-pre-wrap">
              {{ record.symptom || "-" }}
            </div>
          </div>

          <!-- Chẩn đoán -->
          <div class="info-item full-width">
            <div class="info-label">
              <component :is="DiagnosisIcon" />
              <span>Chẩn đoán</span>
            </div>
            <div class="info-value whitespace-pre-wrap">
              {{ record.diagnosis || "-" }}
            </div>
          </div>

          <!-- Ghi chú -->
          <div class="info-item full-width">
            <div class="info-label">
              <component :is="NoteIcon" />
              <span>Ghi chú</span>
            </div>
            <div class="info-value whitespace-pre-wrap">
              {{ record.note || "-" }}
            </div>
          </div>

          <!-- Ngày tạo -->
          <div class="info-item">
            <div class="info-label">
              <component :is="ClockIcon" />
              <span>Ngày tạo</span>
            </div>
            <div class="info-value">{{ formatDateTime(record.createdAt) }}</div>
          </div>

          <!-- Cập nhật lần cuối -->
          <div class="info-item">
            <div class="info-label">
              <component :is="ClockIcon" />
              <span>Cập nhật lần cuối</span>
            </div>
            <div class="info-value">{{ formatDateTime(record.updatedAt) }}</div>
          </div>
        </div>
      </div>

      <el-empty
        v-else-if="!loading"
        description="Không tìm thấy thông tin phiếu khám"
      />
    </div>

    <!-- Edit Dialog -->
    <MedicalRecordFormDialog
      v-model="dialogVisible"
      :record="record"
      @success="handleUpdateSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, h } from "vue";
import { useRouter, useRoute } from "vue-router";
import { medicalRecordApi } from "@/api/medicalRecord";
import { notification } from "@/utils/notification";
import { useAuthStore } from "@/stores/auth";
import MedicalRecordFormDialog from "./components/MedicalRecordFormDialog.vue";
import type { MedicalRecord } from "@/types";

// Custom Icons
const BackIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "stroke-width": "2",
      stroke: "currentColor",
      class: "w-5 h-5",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18",
      }),
    ],
  );

const EditIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "stroke-width": "2",
      stroke: "currentColor",
      class: "w-5 h-5",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10",
      }),
    ],
  );

const RecordIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "stroke-width": "2",
      stroke: "currentColor",
      class: "w-6 h-6",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
      }),
    ],
  );

const IdIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "stroke-width": "2",
      stroke: "currentColor",
      class: "w-5 h-5",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M7.875 14.25l1.214 1.942a2.25 2.25 0 001.908 1.058h2.006c.776 0 1.497-.4 1.908-1.058l1.214-1.942M2.41 9h4.636a2.25 2.25 0 011.872 1.002l.164.246a2.25 2.25 0 001.872 1.002h2.092a2.25 2.25 0 001.872-1.002l.164-.246A2.25 2.25 0 0116.954 9h4.636M2.41 9a2.25 2.25 0 00-.16.832V12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 12V9.832c0-.287-.055-.57-.16-.832M2.41 9a2.25 2.25 0 01.382-.632l3.285-3.832a2.25 2.25 0 011.708-.786h8.43c.657 0 1.281.287 1.709.786l3.284 3.832c.163.19.291.404.382.632M4.5 20.25h15A2.25 2.25 0 0021.75 18v-2.625c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125V18a2.25 2.25 0 002.25 2.25z",
      }),
    ],
  );

const CalendarIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "stroke-width": "2",
      stroke: "currentColor",
      class: "w-5 h-5",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5",
      }),
    ],
  );

const UserIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "stroke-width": "2",
      stroke: "currentColor",
      class: "w-5 h-5",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z",
      }),
    ],
  );

const DoctorIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "stroke-width": "2",
      stroke: "currentColor",
      class: "w-5 h-5",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z",
      }),
    ],
  );

const SymptomIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "stroke-width": "2",
      stroke: "currentColor",
      class: "w-5 h-5",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z",
      }),
    ],
  );

const DiagnosisIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "stroke-width": "2",
      stroke: "currentColor",
      class: "w-5 h-5",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z",
      }),
    ],
  );

const NoteIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "stroke-width": "2",
      stroke: "currentColor",
      class: "w-5 h-5",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
      }),
    ],
  );

const ClockIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "stroke-width": "2",
      stroke: "currentColor",
      class: "w-5 h-5",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
      }),
    ],
  );

const PlanIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "stroke-width": "2",
      stroke: "currentColor",
      class: "w-5 h-5",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z",
      }),
    ],
  );

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const loading = ref(false);
const record = ref<MedicalRecord | null>(null);
const dialogVisible = ref(false);

/**
 * Check if current user can edit
 */
const canEdit = computed(() => {
  const role = authStore.user?.role;
  return role === "ADMIN" || role === "DOCTOR";
});

/**
 * Check if can create treatment plan
 */
const canCreateTreatmentPlan = computed(() => {
  const role = authStore.user?.role;
  return role === "ADMIN" || role === "DOCTOR";
});

/**
 * Format datetime
 */
const formatDateTime = (dateStr: string) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Load medical record detail
 */
const loadRecord = async () => {
  const recordId = route.params.id as string;
  if (!recordId) {
    notification.error("Không tìm thấy ID phiếu khám");
    router.back();
    return;
  }

  try {
    loading.value = true;
    record.value = await medicalRecordApi.getById(recordId);
  } catch (error: any) {
    console.error("Load medical record detail error:", error);
    notification.error(error?.message || "Không thể tải thông tin phiếu khám");
    router.back();
  } finally {
    loading.value = false;
  }
};

/**
 * View patient detail
 */
const viewPatient = (patientId: string) => {
  router.push(`/patients/${patientId}`);
};

/**
 * Handle edit
 */
const handleEdit = () => {
  dialogVisible.value = true;
};

/**
 * Handle update success
 */
const handleUpdateSuccess = () => {
  dialogVisible.value = false;
  loadRecord(); // Reload data
};

/**
 * Handle create treatment plan
 */
const handleCreateTreatmentPlan = () => {
  if (!record.value) return;
  // Navigate to treatment plans page with medicalRecordId in query
  router.push({
    name: "TreatmentPlans",
    query: {
      medicalRecordId: record.value.id,
      patientId: record.value.patientId,
    },
  });
};

onMounted(() => {
  loadRecord();
});
</script>

<style scoped lang="scss">
.medical-record-detail-container {
  padding: 24px;
  background: #f9fafb;
  min-height: calc(100vh - 64px);

  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding: 20px 24px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    .back-button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      color: #374151;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: #f9fafb;
        border-color: #14b8a6;
        color: #14b8a6;
      }
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .action-button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      color: white;

      &.action-button-primary {
        background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
        box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(20, 184, 166, 0.4);
        }
      }

      &.action-button-success {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
        }
      }

      &:active {
        transform: translateY(0);
      }
    }
  }

  .detail-card {
    background: white;
    border-radius: 16px;
    padding: 32px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    .card-title {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 32px;
      padding-bottom: 20px;
      border-bottom: 2px solid #f3f4f6;

      .title-icon {
        width: 32px;
        height: 32px;
        color: #14b8a6;
      }

      h2 {
        font-size: 24px;
        font-weight: 700;
        color: #111827;
        margin: 0;
      }
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;

      .info-item {
        display: flex;
        flex-direction: column;
        gap: 8px;

        &.full-width {
          grid-column: 1 / -1;
        }

        .info-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;

          svg {
            width: 18px;
            height: 18px;
            color: #14b8a6;
          }
        }

        .info-value {
          font-size: 15px;
          color: #111827;
          padding: 12px 16px;
          background: #f9fafb;
          border-radius: 10px;
          border-left: 3px solid #14b8a6;
          min-height: 44px;
          display: flex;
          align-items: center;
        }

        .patient-link {
          font-size: 15px;
          color: #14b8a6;
          font-weight: 500;
          padding: 12px 16px;
          background: #f0fdfa;
          border-radius: 10px;
          border-left: 3px solid #14b8a6;
          border: none;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: 44px;
          display: flex;
          align-items: center;

          &:hover {
            background: #ccfbf1;
            color: #0d9488;
          }
        }
      }
    }
  }
}
</style>
