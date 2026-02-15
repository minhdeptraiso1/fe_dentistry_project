<template>
  <div class="p-4">
    <el-card>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="m-0 text-lg font-semibold">Quản lý phiếu khám</h2>
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-500"
              >Role: {{ authStore.user?.role || "N/A" }}</span
            >
            <el-button
              type="primary"
              @click="handleCreate"
              v-if="canCreateOrUpdate"
            >
              <el-icon><Plus /></el-icon>
              Tạo phiếu khám
            </el-button>
          </div>
        </div>
      </template>

      <!-- Search and filters -->
      <div class="flex gap-3 flex-wrap items-end">
        <div>
          <el-input
            v-model="searchParams.keyword"
            placeholder="Tìm kiếm theo mã phiếu khám, tên bệnh nhân..."
            :prefix-icon="Search"
            style="max-width: 300px"
            clearable
            @clear="loadMedicalRecords"
          />
        </div>
        <div>
          <el-select
            v-model="searchParams.patientId"
            placeholder="Chọn bệnh nhân"
            filterable
            clearable
            :loading="patientLoading"
            style="width: 200px"
            @clear="loadMedicalRecords"
          >
            <el-option
              v-for="patient in patientOptions"
              :key="patient.id"
              :label="patient.fullName"
              :value="patient.id"
            />
          </el-select>
        </div>
        <div>
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
          />
        </div>
        <el-button type="primary" @click="handleSearch" :icon="Search">
          Tìm kiếm
        </el-button>
      </div>

      <!-- Medical Record table -->
      <el-table :data="medicalRecords" class="w-full mt-4" v-loading="loading">
        <el-table-column type="index" label="STT" width="60" />
        <el-table-column prop="recordCode" label="Mã phiếu khám" width="130" />
        <el-table-column label="Bệnh nhân" min-width="150">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewPatient(row.patientId)">
              {{ row.patientName }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="doctorUsername" label="Bác sĩ" width="120" />
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
        <el-table-column label="Thao tác" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewDetail(row.id)">
              Chi tiết
            </el-button>
            <el-button
              link
              type="primary"
              @click="handleEdit(row)"
              v-if="canCreateOrUpdate"
            >
              Sửa
            </el-button>
            <el-button
              link
              type="danger"
              @click="handleDelete(row)"
              v-if="canDelete"
            >
              Xóa
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="totalElements"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        class="mt-4 !justify-center"
        @size-change="handlePageSizeChange"
        @current-change="handlePageChange"
      />
    </el-card>

    <!-- Add/Edit Dialog -->
    <MedicalRecordFormDialog
      v-model="dialogVisible"
      :record="selectedRecord"
      @success="handleFormSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { Plus, Search } from "@element-plus/icons-vue";
import { ElMessageBox } from "element-plus";
import { notification } from "@/utils/notification";
import { medicalRecordApi } from "@/api/medicalRecord";
import { patientApi } from "@/api/patient";
import { formatDate } from "@/utils/date";
import { useAuthStore } from "@/stores/auth";
import MedicalRecordFormDialog from "./components/MedicalRecordFormDialog.vue";
import type { MedicalRecord, Patient } from "@/types";

const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);
const dialogVisible = ref(false);
const selectedRecord = ref<MedicalRecord | null>(null);

const searchParams = reactive({
  keyword: "",
  patientId: "",
  doctorId: "",
  fromDate: "",
  toDate: "",
});

const dateRange = ref<[string, string] | null>(null);

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
    medicalRecords.value = pageData.content;
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
        type: "warning",
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
});
</script>
