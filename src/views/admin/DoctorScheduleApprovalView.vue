<template>
  <div class="approval-page-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">Duyệt lịch bác sĩ</h1>
        <p class="page-subtitle">
          Quản trị viên duyệt hoặc từ chối các yêu cầu lịch làm việc của bác sĩ.
        </p>
      </div>
    </div>

    <div class="search-card">
      <div class="search-header">
        <component :is="SearchIcon" class="search-header-icon" />
        <span class="search-header-text">Tìm kiếm yêu cầu lịch làm việc</span>
      </div>

      <div class="search-content">
        <div class="search-row">
          <el-date-picker
            v-model="filters.date"
            type="date"
            placeholder="Chọn ngày làm việc"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            class="search-date"
          />

          <el-select
            v-model="filters.shift"
            clearable
            placeholder="Chọn ca"
            class="search-select"
          >
            <el-option label="Ca sáng" value="MORNING" />
            <el-option label="Ca chiều" value="AFTERNOON" />
          </el-select>

          <el-select
            v-model="filters.doctorId"
            clearable
            filterable
            placeholder="Chọn bác sĩ"
            class="search-select"
          >
            <el-option
              v-for="doctor in doctors"
              :key="doctor.id"
              :label="doctor.name"
              :value="doctor.id"
            />
          </el-select>

          <el-select
            v-model="filters.status"
            placeholder="Chọn trạng thái"
            class="search-select"
          >
            <el-option label="Tất cả" value="ALL" />
            <el-option label="Chờ duyệt" value="PENDING" />
            <el-option label="Đã duyệt" value="APPROVED" />
            <el-option label="Đã từ chối" value="REJECTED" />
          </el-select>
        </div>

        <div class="search-actions">
          <button type="button" class="search-button" @click="applyFilters">
            <component :is="SearchIcon" />
            <span>Tìm kiếm</span>
          </button>
          <button type="button" class="reset-button" @click="resetFilters">
            Làm mới
          </button>
        </div>
      </div>
    </div>

    <div class="table-card" v-loading="loading">
      <el-table :data="rows" stripe class="modern-table">
        <el-table-column prop="doctorName" label="Bác sĩ" min-width="180">
          <template #default="{ row }">
            {{ row.doctorName || "Không rõ" }}
          </template>
        </el-table-column>

        <el-table-column prop="workDate" label="Ngày" min-width="120">
          <template #default="{ row }">
            {{ formatDate(row.workDate) }}
          </template>
        </el-table-column>

        <el-table-column prop="shift" label="Ca" min-width="120">
          <template #default="{ row }">
            {{ row.shift === "MORNING" ? "Ca sáng" : "Ca chiều" }}
          </template>
        </el-table-column>

        <el-table-column prop="maxPatients" label="Tối đa" min-width="90" />

        <el-table-column prop="status" label="Trạng thái" min-width="130">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Thao tác" min-width="170" fixed="right">
          <template #default="{ row }">
            <div class="actions" v-if="row.status === 'PENDING'">
              <button
                class="action-btn action-btn-primary"
                :disabled="actionLoadingId === row.id"
                @click="approve(row.id)"
              >
                <el-icon><Check /></el-icon>
                Duyệt
              </button>
              <button
                class="action-btn action-btn-danger"
                :disabled="actionLoadingId === row.id"
                @click="reject(row.id)"
              >
                <el-icon><Close /></el-icon>
                Từ chối
              </button>
            </div>
            <span v-else class="text-gray-400">Đã xử lý</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next"
          :current-page="page + 1"
          :page-size="size"
          :page-sizes="[10, 20, 50]"
          :total="total"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Check, Close } from "@element-plus/icons-vue";
import { doctorScheduleRequestApi } from "@/api/doctorScheduleRequest";
import { userApi } from "@/api/user";
import type {
  DoctorScheduleRequestItem,
  ScheduleRequestStatus,
  User,
  WorkShift,
} from "@/types";

const SearchIcon = () =>
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
        d: "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z",
      }),
    ],
  );

const loading = ref(false);
const actionLoadingId = ref("");
const rows = ref<DoctorScheduleRequestItem[]>([]);
const doctors = ref<User[]>([]);
const page = ref(0);
const size = ref(10);
const total = ref(0);

const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const filters = reactive<{
  date?: string;
  shift?: WorkShift;
  doctorId?: string;
  status: "ALL" | ScheduleRequestStatus;
}>({
  date: getTodayDateString(),
  shift: undefined,
  doctorId: undefined,
  status: "ALL",
});

const loadDoctors = async () => {
  try {
    const response = await userApi.search({ role: "DOCTOR" as any }, 0, 200);
    doctors.value = response.content || [];
  } catch {
    doctors.value = [];
  }
};

const buildSearchParams = () => ({
  ...(filters.date ? { date: filters.date } : {}),
  ...(filters.shift ? { shift: filters.shift } : {}),
  ...(filters.doctorId ? { doctorId: filters.doctorId } : {}),
  ...(filters.status !== "ALL" ? { status: filters.status } : {}),
});

const loadData = async () => {
  try {
    loading.value = true;
    const response = await doctorScheduleRequestApi.getAll(
      buildSearchParams(),
      page.value,
      size.value,
    );
    rows.value = response.content || [];
    total.value = response.totalElements || 0;
  } catch (error: any) {
    ElMessage.error(error?.message || "Không thể tải danh sách yêu cầu");
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (newPage: number) => {
  page.value = newPage - 1;
  loadData();
};

const handleSizeChange = (newSize: number) => {
  size.value = newSize;
  page.value = 0;
  loadData();
};

const applyFilters = () => {
  page.value = 0;
  loadData();
};

const resetFilters = () => {
  filters.date = getTodayDateString();
  filters.shift = undefined;
  filters.doctorId = undefined;
  filters.status = "ALL";
  page.value = 0;
  loadData();
};

const statusText = (status: ScheduleRequestStatus) => {
  if (status === "PENDING") return "Chờ duyệt";
  if (status === "APPROVED") return "Đã duyệt";
  return "Đã từ chối";
};

const statusTagType = (status: ScheduleRequestStatus) => {
  if (status === "PENDING") return "warning";
  if (status === "APPROVED") return "success";
  return "danger";
};

const approve = async (id: string) => {
  try {
    await ElMessageBox.confirm("Xác nhận duyệt yêu cầu lịch này?", "Xác nhận", {
      confirmButtonText: "Duyệt",
      cancelButtonText: "Hủy",
      type: "warning",
    });

    actionLoadingId.value = id;
    await doctorScheduleRequestApi.approve(id);
    ElMessage.success("Duyệt yêu cầu thành công");
    await loadData();
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(error?.message || "Không thể duyệt yêu cầu");
    }
  } finally {
    actionLoadingId.value = "";
  }
};

const reject = async (id: string) => {
  try {
    await ElMessageBox.confirm(
      "Xác nhận từ chối yêu cầu lịch này?",
      "Xác nhận",
      {
        confirmButtonText: "Từ chối",
        cancelButtonText: "Hủy",
        type: "warning",
      },
    );

    actionLoadingId.value = id;
    await doctorScheduleRequestApi.reject(id);
    ElMessage.success("Đã từ chối yêu cầu");
    await loadData();
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(error?.message || "Không thể từ chối yêu cầu");
    }
  } finally {
    actionLoadingId.value = "";
  }
};

const formatDate = (value: string) => {
  return new Date(value).toLocaleDateString("vi-VN");
};

onMounted(async () => {
  await loadDoctors();
  await loadData();
});
</script>

<style lang="scss" scoped>
.approval-page-container {
  padding: 24px;
  background: #f9fafb;
  min-height: calc(100vh - 64px);

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding: 20px 24px;
    background: #fff;
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
  }

  .search-card {
    background: #fff;
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

    .search-row {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 16px;
      margin-bottom: 20px;

      .search-select,
      .search-date {
        width: 100%;
      }

      :deep(.el-input__wrapper) {
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

    .search-actions {
      display: flex;
      gap: 12px;

      .search-button,
      .reset-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 12px 24px;
        border: none;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        height: 40px;
      }

      .search-button {
        background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
        color: #fff;
        box-shadow: 0 2px 8px rgba(20, 184, 166, 0.25);

        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(20, 184, 166, 0.35);
        }
      }

      .reset-button {
        background: #f3f4f6;
        color: #374151;

        &:hover {
          background: #e5e7eb;
        }
      }
    }
  }

  .table-card {
    background: #fff;
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

    .actions {
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

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      &.action-btn-primary {
        background: #ecfdf5;
        color: #14b8a6;

        &:hover:not(:disabled) {
          background: #d1fae5;
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
            color: #fff;
          }
        }
      }
    }
  }
}

@media (max-width: 1200px) {
  .approval-page-container {
    .search-card {
      .search-row {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  }
}

@media (max-width: 768px) {
  .approval-page-container {
    padding: 16px;

    .search-card {
      .search-row {
        grid-template-columns: 1fr;
      }

      .search-actions {
        .search-button,
        .reset-button {
          flex: 1;
        }
      }
    }
  }
}
</style>
