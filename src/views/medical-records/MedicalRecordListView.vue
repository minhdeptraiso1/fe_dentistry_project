<template>
  <div class="medical-record-list-container">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Quản lý phiếu khám</h1>
        <p class="page-subtitle">Quản lý hồ sơ khám bệnh</p>
      </div>
      <button @click="handleCreate" class="add-button" v-if="canCreateOrUpdate">
        <component :is="PlusIcon" />
        <span>Tạo phiếu khám</span>
      </button>
    </div>

    <!-- Search Section -->
    <div class="search-card">
      <div class="search-header">
        <component :is="SearchIcon" class="search-header-icon" />
        <span class="search-header-text">Tìm kiếm phiếu khám</span>
      </div>

      <div class="search-content">
        <div class="search-row">
          <el-input
            v-model="searchParams.keyword"
            placeholder="Tìm kiếm theo mã phiếu khám, tên bệnh nhân..."
            clearable
            @clear="loadMedicalRecords"
            class="search-input"
          >
            <template #prefix>
              <component :is="SearchIcon" class="input-icon" />
            </template>
          </el-input>

          <el-select
            v-model="searchParams.patientId"
            placeholder="Chọn bệnh nhân"
            filterable
            clearable
            :loading="patientLoading"
            @clear="loadMedicalRecords"
            class="search-select"
          >
            <el-option
              v-for="patient in patientOptions"
              :key="patient.id"
              :label="patient.fullName"
              :value="patient.id"
            />
          </el-select>

          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="-"
            start-placeholder="Từ ngày"
            end-placeholder="Đến ngày"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            clearable
            @clear="loadMedicalRecords"
            class="search-date-range"
          />
        </div>

        <div class="search-actions">
          <button @click="handleSearch" class="search-button">
            <component :is="SearchIcon" />
            <span>Tìm kiếm</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Table Section -->
    <div class="table-card">
      <el-table :data="medicalRecords" v-loading="loading" class="modern-table">
        <el-table-column type="index" label="STT" width="60" align="center" />
        <el-table-column
          prop="recordCode"
          label="Mã phiếu khám"
          min-width="130"
        >
          <template #default="{ row }">
            <span class="font-semibold text-teal-600">{{
              row.recordCode
            }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Bệnh nhân" min-width="150">
          <template #default="{ row }">
            <button @click="viewPatient(row.patientId)" class="patient-link">
              {{ row.patientName }}
            </button>
          </template>
        </el-table-column>
        <el-table-column label="Bác sĩ" width="140">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <component
                :is="DoctorIcon"
                class="text-gray-400"
                style="width: 16px; height: 16px"
              />
              <span>{{ row.doctorUsername }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Ngày khám" width="120">
          <template #default="{ row }">
            {{ formatDate(row.visitDate) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="symptom"
          label="Triệu chứng"
          min-width="180"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ row.symptom || "-" }}
          </template>
        </el-table-column>
        <el-table-column
          prop="diagnosis"
          label="Chẩn đoán"
          min-width="180"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ row.diagnosis || "-" }}
          </template>
        </el-table-column>
        <el-table-column
          label="Thao tác"
          width="260"
          fixed="right"
          align="center"
        >
          <template #default="{ row }">
            <div class="action-buttons">
              <button
                @click="viewDetail(row.id)"
                class="action-btn action-btn-info"
              >
                <component :is="EyeIcon" />
                <span>Chi tiết</span>
              </button>
              <button
                v-if="canCreateOrUpdate"
                @click="handleEdit(row)"
                class="action-btn action-btn-primary"
              >
                <component :is="EditIcon" />
                <span>Sửa</span>
              </button>
              <button
                v-if="canDelete"
                @click="handleDelete(row)"
                class="action-btn action-btn-danger"
              >
                <component :is="TrashIcon" />
                <span>Xóa</span>
              </button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="totalElements"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- Add/Edit Dialog -->
    <MedicalRecordFormDialog
      v-model="dialogVisible"
      :record="selectedRecord"
      :preset-patient-id="presetPatientId"
      :appointment-id="appointmentId"
      @success="handleFormSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch, h } from "vue";
import { useRouter } from "vue-router";
import { ElMessageBox } from "element-plus";
import { notification } from "@/utils/notification";
import { medicalRecordApi } from "@/api/medicalRecord";
import { patientApi } from "@/api/patient";
import { formatDate } from "@/utils/date";
import { sortByCreatedAtDesc } from "@/utils/sort";
import { useAuthStore } from "@/stores/auth";
import MedicalRecordFormDialog from "./components/MedicalRecordFormDialog.vue";
import type { MedicalRecord, Patient } from "@/types";

// Custom Icons
const PlusIcon = () =>
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
        d: "M12 4v16m8-8H4",
      }),
    ],
  );

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

const EyeIcon = () =>
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
        d: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z",
      }),
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z",
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
      class: "w-4 h-4",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10",
      }),
    ],
  );

const TrashIcon = () =>
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
        d: "M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0",
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
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z",
      }),
    ],
  );

const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);
const dialogVisible = ref(false);
const selectedRecord = ref<MedicalRecord | null>(null);
const presetPatientId = ref<string>();
const appointmentId = ref<string>();

const getCurrentMonthRange = (): [string, string] => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const toYmd = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  return [toYmd(firstDay), toYmd(lastDay)];
};

const [defaultFromDate, defaultToDate] = getCurrentMonthRange();

const searchParams = reactive({
  keyword: "",
  patientId: "",
  doctorId: "",
  fromDate: `${defaultFromDate}T00:00:00Z`,
  toDate: `${defaultToDate}T23:59:59Z`,
});

const dateRange = ref<[string, string] | null>([
  defaultFromDate,
  defaultToDate,
]);

// Watch date range and update searchParams
watch(dateRange, (newValue) => {
  if (newValue && newValue.length === 2) {
    searchParams.fromDate = newValue[0] + "T00:00:00Z";
    searchParams.toDate = newValue[1] + "T23:59:59Z";
  } else {
    searchParams.fromDate = "";
    searchParams.toDate = "";
  }
});

// Pagination
const currentPage = ref(1);
const pageSize = ref(10);
const totalElements = ref(0);
const totalPages = ref(0);

const medicalRecords = ref<MedicalRecord[]>([]);

// Patient list
const patientLoading = ref(false);
const patientOptions = ref<Patient[]>([]);

/**
 * Load all patients from API
 */
const loadPatients = async () => {
  try {
    patientLoading.value = true;
    const pageData = await patientApi.search({
      page: 0,
      size: 1000, // Load all patients
    });
    patientOptions.value = pageData.content;
  } catch (error: any) {
    console.error("Load patients error:", error);
  } finally {
    patientLoading.value = false;
  }
};

/**
 * Role-based permissions
 */
const canCreateOrUpdate = computed(() => {
  const role = authStore.user?.role;
  return role === "ADMIN" || role === "DOCTOR";
});

const canDelete = computed(() => {
  const role = authStore.user?.role;
  return role === "ADMIN";
});

/**
 * Load medical records from backend
 */
const loadMedicalRecords = async () => {
  try {
    loading.value = true;

    // Filter out empty values to avoid backend parsing errors
    const params: any = {
      page: currentPage.value - 1, // Backend uses 0-based page index
      size: pageSize.value,
    };

    // Only add non-empty params
    if (searchParams.keyword?.trim()) {
      params.keyword = searchParams.keyword.trim();
    }
    if (searchParams.patientId) {
      params.patientId = searchParams.patientId;
    }
    if (searchParams.doctorId) {
      params.doctorId = searchParams.doctorId;
    }
    if (searchParams.fromDate) {
      params.fromDate = searchParams.fromDate;
    }
    if (searchParams.toDate) {
      params.toDate = searchParams.toDate;
    }

    const pageData = await medicalRecordApi.search(params);

    // pageData is PageResponse<MedicalRecord> (axios interceptor unwrapped ApiResponse)
    medicalRecords.value = sortByCreatedAtDesc(pageData.content || []);
    totalElements.value = pageData.totalElements;
    totalPages.value = pageData.totalPages;
  } catch (error: any) {
    console.error("Load medical records error:", error);
    notification.error(error?.message || "Không thể tải danh sách phiếu khám");
  } finally {
    loading.value = false;
  }
};

/**
 * Handle search
 */
const handleSearch = () => {
  currentPage.value = 1; // Reset to first page
  loadMedicalRecords();
};

/**
 * Handle page change
 */
const handlePageChange = (page: number) => {
  currentPage.value = page;
  loadMedicalRecords();
};

/**
 * Handle page size change
 */
const handlePageSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1; // Reset to first page
  loadMedicalRecords();
};

/**
 * View medical record detail
 */
const viewDetail = (id: string) => {
  router.push(`/medical-records/${id}`);
};

/**
 * View patient detail
 */
const viewPatient = (id: string) => {
  router.push(`/patients/${id}`);
};

/**
 * Handle create new medical record
 */
const handleCreate = () => {
  selectedRecord.value = null;
  dialogVisible.value = true;
};

/**
 * Handle edit medical record
 */
const handleEdit = (record: MedicalRecord) => {
  selectedRecord.value = record;
  dialogVisible.value = true;
};

/**
 * Handle delete medical record
 */
const handleDelete = async (record: MedicalRecord) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa phiếu khám "${record.recordCode}"?`,
      "Xác nhận xóa",
      {
        confirmButtonText: "Xóa",
        cancelButtonText: "Hủy",
        customClass: "modern-confirm-dialog",
        confirmButtonClass: "modern-confirm-button",
        cancelButtonClass: "modern-cancel-button",
      },
    );

    loading.value = true;
    await medicalRecordApi.delete(record.id);
    notification.success("Xóa phiếu khám thành công!");
    loadMedicalRecords();
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("Delete medical record error:", error);
      notification.error(error?.message || "Không thể xóa phiếu khám");
    }
  } finally {
    loading.value = false;
  }
};

/**
 * Handle form success (create/update)
 */
const handleFormSuccess = () => {
  dialogVisible.value = false;
  loadMedicalRecords();
};

onMounted(async () => {
  // Fetch latest user info from backend to ensure role is up-to-date
  await authStore.fetchUserInfo();

  console.log("🔍 Debug - User:", authStore.user);
  console.log("🔍 Debug - Role:", authStore.user?.role);
  console.log("🔍 Debug - canCreateOrUpdate:", canCreateOrUpdate.value);
  console.log("🔍 Debug - canDelete:", canDelete.value);

  // Load patients list for filter dropdown
  loadPatients();

  loadMedicalRecords();

  // Check if should open create dialog (from appointment)
  const query = router.currentRoute.value.query;
  if (query.create === "true" && query.patientId) {
    // Set patient and appointment for dialog
    presetPatientId.value = query.patientId as string;
    if (query.appointmentId) {
      appointmentId.value = query.appointmentId as string;
    }
    selectedRecord.value = null;
    dialogVisible.value = true;
  } else if (query.patientId || query.date) {
    // Filter by patient and/or date when viewing from appointment
    if (query.patientId) {
      searchParams.patientId = query.patientId as string;
    }
    if (query.date) {
      const dateStr = query.date as string;
      searchParams.fromDate = new Date(dateStr).toISOString();
      searchParams.toDate = new Date(
        new Date(dateStr).getTime() + 24 * 60 * 60 * 1000,
      ).toISOString();
      // Set dateRange for UI
      dateRange.value = [dateStr, dateStr];
    }
    // Reload with filters
    loadMedicalRecords();
  }
});
</script>

<style lang="scss" scoped>
.medical-record-list-container {
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
        }

        .search-select {
          width: 240px;
        }

        .search-date-range {
          width: 280px;
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

          .el-input__prefix {
            display: flex;
            align-items: center;
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
          \n\n .el-input__wrapper {
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

        .input-icon {
          width: 16px;
          height: 16px;
          color: #14b8a6;
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
    }
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

    .patient-link {
      color: #14b8a6;
      font-weight: 500;
      background: none;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      padding: 0;

      &:hover {
        color: #0d9488;
        text-decoration: underline;
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

      &.action-btn-danger {
        background: #fef2f2;
        color: #ef4444;

        &:hover {
          background: #fee2e2;
          transform: translateY(-1px);
        }
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

  .input-icon {
    width: 16px;
    height: 16px;
    color: #9ca3af;
  }
}
</style>
