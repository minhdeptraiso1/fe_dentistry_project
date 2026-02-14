<template>
  <div class="dashboard-view">
    <el-row :gutter="24">
      <!-- Statistics Cards -->
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard
          title="Tổng bệnh nhân"
          :value="statistics.totalPatients"
          icon="User"
          color="#1890ff"
          trend="+12%"
        />
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard
          title="Lịch hẹn hôm nay"
          :value="statistics.todayAppointments"
          icon="Calendar"
          color="#52c41a"
        />
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard
          title="Đang điều trị"
          :value="statistics.activeTreatments"
          icon="Document"
          color="#faad14"
        />
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard
          title="Doanh thu tháng"
          :value="`${statistics.monthlyRevenue.toLocaleString()} đ`"
          icon="Money"
          color="#f5222d"
          trend="+8%"
        />
      </el-col>
    </el-row>

    <el-row :gutter="24" style="margin-top: 24px">
      <!-- Recent Appointments -->
      <el-col :xs="24" :lg="12">
        <el-card class="dashboard-card">
          <template #header>
            <div class="card-header">
              <h3>Lịch hẹn gần đây</h3>
              <el-button
                text
                type="primary"
                @click="router.push('/appointments')"
              >
                Xem tất cả
              </el-button>
            </div>
          </template>
          <el-empty
            v-if="recentAppointments.length === 0"
            description="Chưa có lịch hẹn"
          />
          <div v-else class="appointment-list">
            <div
              v-for="appointment in recentAppointments"
              :key="appointment.id"
              class="appointment-item"
            >
              <div class="appointment-info">
                <div class="patient-name">{{ appointment.patientName }}</div>
                <div class="appointment-time">
                  <el-icon><Clock /></el-icon>
                  {{ formatDateTime(appointment.appointmentDate) }}
                </div>
              </div>
              <el-tag :type="getStatusType(appointment.status)">
                {{ getStatusText(appointment.status) }}
              </el-tag>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- Recent Patients -->
      <el-col :xs="24" :lg="12">
        <el-card class="dashboard-card">
          <template #header>
            <div class="card-header">
              <h3>Bệnh nhân mới</h3>
              <el-button text type="primary" @click="router.push('/patients')">
                Xem tất cả
              </el-button>
            </div>
          </template>
          <el-empty
            v-if="recentPatients.length === 0"
            description="Chưa có bệnh nhân"
          />
          <div v-else class="patient-list">
            <div
              v-for="patient in recentPatients"
              :key="patient.id"
              class="patient-item"
              @click="router.push(`/patients/${patient.id}`)"
            >
              <el-avatar :size="40" :src="patient.avatar">
                {{ patient.fullName[0] }}
              </el-avatar>
              <div class="patient-info">
                <div class="patient-name">{{ patient.fullName }}</div>
                <div class="patient-phone">{{ patient.phone }}</div>
              </div>
              <el-icon><ArrowRight /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Clock, ArrowRight } from "@element-plus/icons-vue";
import StatCard from "@/components/StatCard.vue";
import { formatDateTime } from "@/utils/date";
import type { Patient, Appointment } from "@/types";

const router = useRouter();

const statistics = ref({
  totalPatients: 156,
  todayAppointments: 8,
  activeTreatments: 12,
  monthlyRevenue: 45000000,
});

const recentAppointments = ref<Appointment[]>([
  {
    id: "1",
    patientId: "1",
    patientName: "Nguyễn Văn A",
    doctorId: "1",
    appointmentDate: new Date().toISOString(),
    startTime: "09:00",
    endTime: "10:00",
    status: "SCHEDULED",
    createdAt: new Date().toISOString(),
  },
]);

const recentPatients = ref<Patient[]>([
  {
    id: "1",
    fullName: "Trần Thị B",
    dateOfBirth: "1990-01-01",
    gender: "FEMALE",
    phone: "0123456789",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]);

const getStatusType = (status: string) => {
  const map: Record<string, any> = {
    SCHEDULED: "warning",
    CONFIRMED: "info",
    COMPLETED: "success",
    CANCELLED: "danger",
  };
  return map[status] || "info";
};

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    SCHEDULED: "Đã lên lịch",
    CONFIRMED: "Đã xác nhận",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã hủy",
  };
  return map[status] || status;
};

onMounted(() => {
  // Load dashboard data
});
</script>

<style scoped lang="scss">
.dashboard-view {
  .dashboard-card {
    :deep(.el-card__header) {
      padding: 16px 20px;
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }
    }
  }

  .appointment-list,
  .patient-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .appointment-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    background: #fafafa;
    border-radius: 8px;
    transition: all 0.3s;

    &:hover {
      background: #f0f0f0;
    }

    .appointment-info {
      flex: 1;

      .patient-name {
        font-weight: 500;
        color: #1f1f1f;
        margin-bottom: 4px;
      }

      .appointment-time {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 13px;
        color: #8c8c8c;
      }
    }
  }

  .patient-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: #fafafa;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      background: #f0f0f0;
      transform: translateX(4px);
    }

    .patient-info {
      flex: 1;

      .patient-name {
        font-weight: 500;
        color: #1f1f1f;
        margin-bottom: 4px;
      }

      .patient-phone {
        font-size: 13px;
        color: #8c8c8c;
      }
    }
  }
}
</style>
