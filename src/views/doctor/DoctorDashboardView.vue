<template>
  <div class="dashboard-modern">
    <!-- Header Section with Date Filter -->
    <div class="dashboard-header">
      <div>
        <h1 class="text-5xl font-bold text-gray-900">Dashboard Bác Sĩ</h1>
        <p class="text-gray-500 mt-2">
          Quản lý lịch khám và hồ sơ bệnh nhân của bạn
        </p>
      </div>
      <div class="date-filter-card">
        <div class="date-filter-header">
          <svg
            class="w-5 h-5 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span class="date-filter-label">Ngày làm việc</span>
        </div>
        <el-date-picker
          v-model="selectedDate"
          type="date"
          placeholder="Chọn ngày"
          format="DD/MM/YYYY"
          value-format="YYYY-MM-DD"
          @change="loadData"
          size="default"
          class="date-picker-modern"
        />
      </div>
    </div>

    <!-- Bento Grid Layout -->
    <div class="bento-grid" v-loading="loading">
      <!-- Stats Cards - Row 1 -->
      <div class="bento-item stat-card-modern appointments-card">
        <div class="stat-icon-wrapper-sm">
          <svg
            class="w-6 h-6 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div class="stat-content-sm">
          <div class="stat-label-sm">Lịch hẹn hôm nay</div>
          <div class="stat-value-sm text-blue-600">
            {{ stats.todayAppointments }}
          </div>
        </div>
      </div>

      <!-- Quick Actions Card -->
      <div class="bento-item bento-half chart-card-modern">
        <div class="chart-header">
          <div>
            <h3 class="chart-title">Thao tác nhanh</h3>
            <p class="chart-subtitle">Các chức năng thường dùng</p>
          </div>
        </div>
        <div class="quick-actions-modern">
          <button
            class="action-button primary-action"
            @click="createMedicalRecord"
          >
            <div class="action-icon">
              <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div class="action-content">
              <div class="action-title">Tạo phiếu khám</div>
              <div class="action-subtitle">Lập phiếu khám bệnh mới</div>
            </div>
          </button>

          <button
            class="action-button success-action"
            @click="createPrescription"
          >
            <div class="action-icon">
              <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </div>
            <div class="action-content">
              <div class="action-title">Kê đơn thuốc</div>
              <div class="action-subtitle">Tạo đơn thuốc cho bệnh nhân</div>
            </div>
          </button>

          <button
            class="action-button warning-action"
            @click="createTreatmentPlan"
          >
            <div class="action-icon">
              <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
            </div>
            <div class="action-content">
              <div class="action-title">Kế hoạch điều trị</div>
              <div class="action-subtitle">Lập kế hoạch điều trị</div>
            </div>
          </button>

          <button class="action-button info-action" @click="viewMySchedule">
            <div class="action-icon">
              <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div class="action-content">
              <div class="action-title">Lịch làm việc</div>
              <div class="action-subtitle">Xem lịch làm việc của bạn</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { appointmentApi } from "@/api/appointment";
import { notification } from "@/utils/notification";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const authStore = useAuthStore();

// State
const loading = ref(false);
const loadingAppointments = ref(false);
const selectedDate = ref(new Date().toISOString().split("T")[0]);
const appointments = ref<any[]>([]);

const stats = ref({
  todayAppointments: 0,
});

// Load data
const loadData = async () => {
  loading.value = true;
  try {
    await loadAppointments();
    loadStats(); // Update stats after appointments are loaded
  } catch (error) {
    console.error("Error loading data:", error);
  } finally {
    loading.value = false;
  }
};

const loadAppointments = async () => {
  if (!authStore.user?.id) return;

  loadingAppointments.value = true;
  try {
    const response = await appointmentApi.search({
      date: selectedDate.value,
      doctorId: authStore.user.id,
      page: 0,
      size: 100,
    });
    appointments.value = response.content || [];
  } catch (error: any) {
    notification.error(error.message || "Không thể tải lịch hẹn");
  } finally {
    loadingAppointments.value = false;
  }
};

const loadStats = () => {
  stats.value = {
    todayAppointments: appointments.value.length,
  };
};

// Actions
const createMedicalRecord = () => {
  router.push({ name: "MedicalRecords" });
};

const createPrescription = () => {
  router.push({ name: "Prescriptions" });
};

const createTreatmentPlan = () => {
  router.push({ name: "TreatmentPlans" });
};

const viewMySchedule = () => {
  router.push({ name: "MyAppointments" });
};

// Lifecycle
onMounted(() => {
  loadData();
});
</script>

<style scoped lang="scss">
.dashboard-modern {
  max-width: 1600px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 2rem;
  flex-wrap: wrap;

  h1 {
    margin: 0;
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  p {
    margin: 0;
  }
}

.date-filter-card {
  background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);
  padding: 1rem 1.5rem;
  border-radius: 16px;
  border: 2px solid #bfdbfe;
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 0.05),
    0 2px 4px -2px rgb(0 0 0 / 0.05);
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.date-filter-card:hover {
  border-color: #93c5fd;
  box-shadow:
    0 10px 15px -3px rgb(0 0 0 / 0.08),
    0 4px 6px -4px rgb(0 0 0 / 0.05);
  transform: translateY(-2px);
}

.date-filter-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.date-filter-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #2563eb;
  letter-spacing: 0.025em;
}

.date-picker-modern {
  width: 240px;

  :deep(.el-input__wrapper) {
    background: white;
    border: 1.5px solid #dbeafe;
    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    border-radius: 12px;
    padding: 8px 12px;
    transition: all 0.3s ease;
  }

  :deep(.el-input__wrapper:hover) {
    border-color: #93c5fd;
    box-shadow: 0 0 0 3px rgba(147, 197, 253, 0.1);
  }

  :deep(.el-input__wrapper.is-focus) {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
  }

  :deep(.el-input__inner) {
    font-size: 0.875rem;
    font-weight: 500;
    color: #1e40af;
  }

  :deep(.el-input__inner::placeholder) {
    color: #94a3b8;
    font-weight: 400;
  }

  :deep(.el-input__prefix),
  :deep(.el-input__suffix) {
    color: #3b82f6;
  }

  :deep(.el-icon) {
    color: #3b82f6;
  }
}

/* Bento Grid Layout */
.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  grid-auto-rows: minmax(120px, auto);
}

.bento-item {
  background: white;
  border-radius: 20px;
  padding: 1.75rem;
  box-shadow:
    0 1px 3px 0 rgb(0 0 0 / 0.1),
    0 1px 2px -1px rgb(0 0 0 / 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(0, 0, 0, 0.05);

  &:hover {
    box-shadow:
      0 10px 15px -3px rgb(0 0 0 / 0.1),
      0 4px 6px -4px rgb(0 0 0 / 0.1);
    transform: translateY(-2px);
  }
}

.bento-wide {
  grid-column: span 4;
}

.bento-half {
  grid-column: span 2;
}

/* Stat Cards */
.stat-card-modern {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stat-icon-wrapper-sm {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.appointments-card .stat-icon-wrapper-sm {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
}

.completed-card .stat-icon-wrapper-sm {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
}

.pending-card .stat-icon-wrapper-sm {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
}

.records-card .stat-icon-wrapper-sm {
  background: linear-gradient(135deg, #e9d5ff 0%, #d8b4fe 100%);
}

.stat-content-sm {
  .stat-label-sm {
    font-size: 0.875rem;
    font-weight: 500;
    color: #6b7280;
    margin-bottom: 0.5rem;
  }

  .stat-value-sm {
    font-size: 1.5rem;
    font-weight: 700;
  }
}

/* Chart Cards */
.chart-card-modern {
  display: flex;
  flex-direction: column;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;

  .chart-title {
    font-size: 1.125rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 0.25rem 0;
  }

  .chart-subtitle {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
  }
}

.table-wrapper {
  flex: 1;
  overflow-x: auto;
}

/* Quick Actions Modern */
.quick-actions-modern {
  display: grid;
  gap: 1rem;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  border: 1.5px solid #e5e7eb;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  width: 100%;

  &:hover {
    border-color: #3b82f6;
    background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);
    transform: translateX(4px);
    box-shadow: 0 4px 6px -1px rgb(59 130 246 / 0.1);
  }
}

.action-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.primary-action .action-icon {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #3b82f6;
}

.success-action .action-icon {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #10b981;
}

.warning-action .action-icon {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #f59e0b;
}

.info-action .action-icon {
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  color: #6366f1;
}

.action-content {
  flex: 1;
}

.action-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.25rem;
}

.action-subtitle {
  font-size: 0.8125rem;
  color: #6b7280;
}

/* Recent Records Modern */
.recent-records-modern {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 400px;
  overflow-y: auto;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.record-item-modern {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: #3b82f6;
    background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);
    box-shadow: 0 4px 6px -1px rgb(59 130 246 / 0.1);
    transform: translateX(4px);
  }
}

.record-avatar {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
  flex-shrink: 0;
}

.record-info {
  flex: 1;
  min-width: 0;
}

.record-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.25rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.record-date {
  font-size: 0.8125rem;
  color: #6b7280;
  margin: 0;
}

/* Responsive */
@media (max-width: 1280px) {
  .bento-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .bento-wide {
    grid-column: span 2;
  }

  .bento-half {
    grid-column: span 1;
  }
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    gap: 1rem;
  }

  .bento-grid {
    grid-template-columns: 1fr;
  }

  .bento-wide,
  .bento-half {
    grid-column: span 1;
  }
}
</style>
