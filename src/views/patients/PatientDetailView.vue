<template>
  <div class="patient-detail-container">
    <!-- Header -->
    <div class="page-header">
      <button @click="router.back()" class="back-button">
        <component :is="BackIcon" />
        <span>Quay lại</span>
      </button>
      <div>
        <h1 class="page-title">Chi tiết bệnh nhân</h1>
        <p class="page-subtitle">{{ getCurrentDate() }}</p>
      </div>
    </div>

    <div v-loading="loading" class="content-wrapper">
      <div v-if="patient">
        <!-- Patient Info Card -->
        <div class="patient-card">
          <div class="patient-header">
            <el-avatar :size="100" class="patient-avatar">
              {{ patient.fullName[0] }}
            </el-avatar>
            <div class="patient-identity">
              <h2 class="patient-name">{{ patient.fullName }}</h2>
              <div class="patient-code">
                <component :is="IdIcon" />
                <span>{{ patient.patientCode }}</span>
              </div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">
                <component :is="GenderIcon" />
                <span>Giới tính</span>
              </div>
              <div class="info-value">
                <el-tag
                  :type="patient.gender === 'Nam' ? 'primary' : 'danger'"
                  size="small"
                  effect="light"
                >
                  {{ patient.gender || "-" }}
                </el-tag>
              </div>
            </div>

            <div class="info-item">
              <div class="info-label">
                <component :is="PhoneIcon" />
                <span>Số điện thoại</span>
              </div>
              <div class="info-value">{{ patient.phone || "-" }}</div>
            </div>

            <div class="info-item">
              <div class="info-label">
                <component :is="CalendarIcon" />
                <span>Ngày sinh</span>
              </div>
              <div class="info-value">
                {{ patient.dob ? formatDate(patient.dob) : "-" }}
              </div>
            </div>

            <div class="info-item full-width">
              <div class="info-label">
                <component :is="LocationIcon" />
                <span>Địa chỉ</span>
              </div>
              <div class="info-value">{{ patient.address || "-" }}</div>
            </div>

            <div class="info-item full-width">
              <div class="info-label">
                <component :is="NoteIcon" />
                <span>Ghi chú</span>
              </div>
              <div class="info-value note-value">{{ patient.note || "-" }}</div>
            </div>

            <div class="info-item">
              <div class="info-label">
                <component :is="ClockIcon" />
                <span>Ngày tạo</span>
              </div>
              <div class="info-value">
                {{ formatDateTime(patient.createdAt) }}
              </div>
            </div>

            <div class="info-item">
              <div class="info-label">
                <component :is="ClockIcon" />
                <span>Cập nhật lần cuối</span>
              </div>
              <div class="info-value">
                {{ formatDateTime(patient.updatedAt) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <el-empty
        v-else-if="!loading"
        description="Không tìm thấy thông tin bệnh nhân"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from "vue";
import { useRouter, useRoute } from "vue-router";
import { patientApi } from "@/api/patient";
import { formatDate } from "@/utils/date";
import { notification } from "@/utils/notification";
import type { Patient } from "@/types";

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
        d: "M10 19l-7-7m0 0l7-7m-7 7h18",
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
      class: "w-4 h-4",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2",
      }),
    ],
  );

const GenderIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "stroke-width": "2",
      stroke: "currentColor",
      class: "w-4 h-4",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
      }),
    ],
  );

const PhoneIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "stroke-width": "2",
      stroke: "currentColor",
      class: "w-4 h-4",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
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
      class: "w-4 h-4",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
      }),
    ],
  );

const LocationIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "stroke-width": "2",
      stroke: "currentColor",
      class: "w-4 h-4",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z",
      }),
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M15 11a3 3 0 11-6 0 3 3 0 016 0z",
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
      class: "w-4 h-4",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
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
      class: "w-4 h-4",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
      }),
    ],
  );

const getCurrentDate = () => {
  const days = [
    "Chủ Nhật",
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy",
  ];
  const now = new Date();
  const dayName = days[now.getDay()];
  const day = now.getDate();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  return `${dayName}, ${day} tháng ${month}, ${year}`;
};

const router = useRouter();
const route = useRoute();

const loading = ref(false);
const patient = ref<Patient | null>(null);

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
 * Load patient detail
 */
const loadPatient = async () => {
  const patientId = route.params.id as string;
  if (!patientId) {
    notification.error("Không tìm thấy ID bệnh nhân");
    router.back();
    return;
  }

  try {
    loading.value = true;
    patient.value = await patientApi.getById(patientId);
  } catch (error: any) {
    console.error("Load patient detail error:", error);
    notification.error(error?.message || "Không thể tải thông tin bệnh nhân");
    router.back();
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadPatient();
});
</script>

<style scoped lang="scss">
.patient-detail-container {
  padding: 0;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 20px 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  .back-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: white;
    color: #6b7280;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: #f9fafb;
      color: #14b8a6;
      border-color: #14b8a6;
      transform: translateX(-2px);
    }

    svg {
      width: 18px;
      height: 18px;
    }
  }

  .page-title {
    font-size: 28px;
    font-weight: 700;
    color: #111827;
    margin: 0;
    line-height: 1.2;
  }

  .page-subtitle {
    font-size: 14px;
    color: #6b7280;
    margin: 4px 0 0 0;
  }
}

.content-wrapper {
  min-height: 400px;
}

.patient-card {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;

  .patient-header {
    display: flex;
    align-items: center;
    gap: 24px;
    padding-bottom: 24px;
    margin-bottom: 24px;
    border-bottom: 2px solid #f3f4f6;

    .patient-avatar {
      background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
      font-size: 36px;
      font-weight: 600;
    }

    .patient-identity {
      flex: 1;

      .patient-name {
        font-size: 28px;
        font-weight: 700;
        color: #111827;
        margin: 0 0 8px 0;
      }

      .patient-code {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%);
        border-radius: 8px;
        color: #0d9488;
        font-weight: 600;
        width: fit-content;

        svg {
          width: 16px;
          height: 16px;
        }
      }
    }
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }

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
        gap: 6px;
        font-size: 13px;
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;

        svg {
          width: 16px;
          height: 16px;
          color: #14b8a6;
        }
      }

      .info-value {
        font-size: 15px;
        font-weight: 500;
        color: #111827;
        padding: 12px 16px;
        background: #f9fafb;
        border-radius: 10px;
        border: 1px solid #e5e7eb;

        &.note-value {
          white-space: pre-wrap;
          line-height: 1.6;
        }
      }
    }
  }
}
</style>
