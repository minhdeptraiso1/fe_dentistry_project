<template>
  <div class="patient-list-container">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Quản lý bệnh nhân</h1>
        <p class="page-subtitle">Quản lý thông tin bệnh nhân</p>
      </div>

      <el-button type="primary" @click="handleCreate" class="add-patient-btn">
        <el-icon><Plus /></el-icon>
        Thêm bệnh nhân
      </el-button>
    </div>

    <!-- Search Section -->
    <div class="search-card">
      <div class="search-header">
        <component :is="SearchIcon" class="search-header-icon" />
        <span class="search-header-text">Tìm kiếm bệnh nhân</span>
      </div>
      <div class="search-content">
        <div class="search-row">
          <el-input
            v-model="searchParams.keyword"
            placeholder="Tìm kiếm theo mã BN, tên bệnh nhân..."
            class="search-input"
            clearable
            @clear="loadPatients"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <component
                :is="SearchIcon"
                style="width: 16px; height: 16px; color: #9ca3af"
              />
            </template>
          </el-input>

          <el-input
            v-model="searchParams.phone"
            placeholder="Số điện thoại..."
            class="search-input"
            clearable
            @clear="loadPatients"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <component
                :is="PhoneIcon"
                style="width: 16px; height: 16px; color: #9ca3af"
              />
            </template>
          </el-input>
        </div>

        <div class="search-actions">
          <button @click="handleSearch" class="search-button">
            <component :is="SearchIcon" />
            <span>Tìm kiếm</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Patient table -->
    <div class="table-card">
      <el-table :data="patients" v-loading="loading" class="modern-table">
        <el-table-column type="index" label="STT" width="60" align="center" />
        <el-table-column prop="patientCode" label="Mã BN" width="120" />

        <el-table-column label="Họ tên" min-width="180">
          <template #default="{ row }">
            <div class="flex items-center gap-3">
              <el-avatar
                :size="36"
                class="bg-gradient-to-br from-teal-500 to-teal-600"
              >
                {{ row.fullName?.[0] || "B" }}
              </el-avatar>
              <span class="font-medium text-gray-900">{{ row.fullName }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="phone" label="Số điện thoại" width="140">
          <template #default="{ row }">
            <span class="text-gray-700">{{ row.phone }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Giới tính" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.gender === 'Nam' ? 'primary' : 'danger'"
              size="small"
              effect="light"
            >
              {{ row.gender || "-" }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Ngày sinh" width="120">
          <template #default="{ row }">
            <span class="text-gray-600">
              {{ row.dob ? formatDate(row.dob) : "-" }}
            </span>
          </template>
        </el-table-column>

        <el-table-column
          prop="address"
          label="Địa chỉ"
          min-width="200"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span class="text-gray-600">{{ row.address || "-" }}</span>
          </template>
        </el-table-column>

        <el-table-column
          label="Thao tác"
          width="120"
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
    <PatientFormDialog
      v-model="dialogVisible"
      :patient="selectedPatient"
      @success="handleFormSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h } from "vue";
import { useRouter } from "vue-router";
import { Plus } from "@element-plus/icons-vue";
import { notification } from "@/utils/notification";
import { patientApi } from "@/api/patient";
import { formatDate } from "@/utils/date";
import PatientFormDialog from "./components/PatientFormDialog.vue";
import type { Patient } from "@/types";

// Custom Icons
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
        d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
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
      class: "w-5 h-5",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
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

const router = useRouter();
const loading = ref(false);
const dialogVisible = ref(false);
const selectedPatient = ref<Patient | null>(null);

const searchParams = reactive({
  keyword: "",
  phone: "",
});

const currentPage = ref(1);
const pageSize = ref(10);
const totalElements = ref(0);
const totalPages = ref(0);

const patients = ref<Patient[]>([]);

const handleCreate = () => {
  selectedPatient.value = null;
  dialogVisible.value = true;
};

const handleFormSuccess = () => {
  dialogVisible.value = false;
  loadPatients();
};

const loadPatients = async () => {
  try {
    loading.value = true;
    const pageData = await patientApi.search({
      ...searchParams,
      page: currentPage.value - 1,
      size: pageSize.value,
    });

    patients.value = pageData.content || [];
    totalElements.value = pageData.totalElements || 0;
    totalPages.value = pageData.totalPages || 0;
  } catch (error: any) {
    console.error("Load patients error:", error);
    notification.error(error?.message || "Không thể tải danh sách bệnh nhân");
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  currentPage.value = 1;
  loadPatients();
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
  loadPatients();
};

const handlePageSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
  loadPatients();
};

const viewDetail = (id: string) => {
  router.push(`/patients/${id}`);
};

onMounted(() => {
  loadPatients();
});
</script>

<style scoped lang="scss">
.patient-list-container {
  padding: 0;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
    margin: 0;
    line-height: 1.2;
  }

  .page-subtitle {
    font-size: 14px;
    color: #6b7280;
    margin: 4px 0 0 0;
  }
}

.add-patient-btn {
  border-radius: 12px;
}
</style>
