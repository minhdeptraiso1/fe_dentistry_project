<template>
  <div class="p-4">
    <el-card>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="m-0 text-lg font-semibold">Quản lý bệnh nhân</h2>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            Thêm bệnh nhân
          </el-button>
        </div>
      </template>

      <!-- Search and filters -->
      <div class="flex gap-3 flex-wrap">
        <el-input
          v-model="searchParams.keyword"
          placeholder="Tìm kiếm theo mã BN, tên bệnh nhân..."
          :prefix-icon="Search"
          style="max-width: 300px"
          clearable
          @clear="loadPatients"
        />
        <el-input
          v-model="searchParams.phone"
          placeholder="Số điện thoại..."
          style="max-width: 200px"
          clearable
          @clear="loadPatients"
        />
        <el-button type="primary" @click="handleSearch" :icon="Search">
          Tìm kiếm
        </el-button>
      </div>

      <!-- Patient table -->
      <el-table :data="patients" class="w-full mt-4" v-loading="loading">
        <el-table-column type="index" label="STT" width="60" />
        <el-table-column prop="patientCode" label="Mã BN" width="120" />
        <el-table-column label="Họ tên" min-width="150">
          <template #default="{ row }">
            <div class="flex items-center gap-3">
              <el-avatar :size="32">
                {{ row.fullName[0] }}
              </el-avatar>
              <span>{{ row.fullName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="Số điện thoại" width="130" />
        <el-table-column label="Giới tính" width="100">
          <template #default="{ row }">
            {{ row.gender || "-" }}
          </template>
        </el-table-column>
        <el-table-column label="Ngày sinh" width="120">
          <template #default="{ row }">
            {{ row.dob ? formatDate(row.dob) : "-" }}
          </template>
        </el-table-column>
        <el-table-column
          prop="address"
          label="Địa chỉ"
          min-width="180"
          show-overflow-tooltip
        />
        <el-table-column label="Thao tác" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewDetail(row.id)">
              Chi tiết
            </el-button>
            <el-button link type="primary" @click="handleEdit(row)">
              Sửa
            </el-button>
            <el-button link type="danger" @click="handleDelete(row)">
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
    <PatientFormDialog
      v-model="dialogVisible"
      :patient="selectedPatient"
      @success="handleFormSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Plus, Search } from "@element-plus/icons-vue";
import { ElMessageBox } from "element-plus";
import { notification } from "@/utils/notification";
import { patientApi } from "@/api/patient";
import { formatDate } from "@/utils/date";
import PatientFormDialog from "./components/PatientFormDialog.vue";
import type { Patient } from "@/types";

const router = useRouter();
const loading = ref(false);
const dialogVisible = ref(false);
const selectedPatient = ref<Patient | null>(null);

const searchParams = reactive({
  keyword: "",
  phone: "",
});

// Pagination
const currentPage = ref(1);
const pageSize = ref(10);
const totalElements = ref(0);
const totalPages = ref(0);

const patients = ref<Patient[]>([]);

/**
 * Load patients from backend
 */
const loadPatients = async () => {
  try {
    loading.value = true;
    const pageData = await patientApi.search({
      ...searchParams,
      page: currentPage.value - 1, // Backend uses 0-based page index
      size: pageSize.value,
    });

    // pageData is PageResponse<Patient> (axios interceptor unwrapped ApiResponse)
    patients.value = pageData.content;
    totalElements.value = pageData.totalElements;
    totalPages.value = pageData.totalPages;
  } catch (error: any) {
    console.error("Load patients error:", error);
    notification.error(error?.message || "Không thể tải danh sách bệnh nhân");
  } finally {
    loading.value = false;
  }
};

/**
 * Handle search
 */
const handleSearch = () => {
  currentPage.value = 1; // Reset to first page
  loadPatients();
};

/**
 * Handle page change
 */
const handlePageChange = (page: number) => {
  currentPage.value = page;
  loadPatients();
};

/**
 * Handle page size change
 */
const handlePageSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1; // Reset to first page
  loadPatients();
};

/**
 * View patient detail
 */
const viewDetail = (id: string) => {
  router.push(`/patients/${id}`);
};

/**
 * Handle create new patient
 */
const handleCreate = () => {
  selectedPatient.value = null;
  dialogVisible.value = true;
};

/**
 * Handle edit patient
 */
const handleEdit = (patient: Patient) => {
  selectedPatient.value = patient;
  dialogVisible.value = true;
};

/**
 * Handle delete patient
 */
const handleDelete = async (patient: Patient) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa bệnh nhân "${patient.fullName}"?`,
      "Xác nhận xóa",
      {
        confirmButtonText: "Xóa",
        cancelButtonText: "Hủy",
        type: "warning",
      },
    );

    loading.value = true;
    await patientApi.delete(patient.id);
    notification.success("Xóa bệnh nhân thành công!");
    loadPatients();
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("Delete patient error:", error);
      notification.error(error?.message || "Không thể xóa bệnh nhân");
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
  loadPatients();
};

onMounted(() => {
  loadPatients();
});
</script>
