<template>
  <div class="medicine-list-view">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Quản lý thuốc</h1>
        <p class="page-subtitle">Quản lý danh mục thuốc và giá bán</p>
      </div>
      <el-button
        v-if="authStore.isAdmin"
        type="primary"
        @click="handleCreate"
        class="add-button"
      >
        <el-icon class="mr-1"><Plus /></el-icon>
        Thêm thuốc
      </el-button>
    </div>

    <!-- Search Card -->
    <div class="search-card">
      <div class="search-header">
        <el-icon :size="24" color="#14b8a6" class="search-header-icon"
          ><Search
        /></el-icon>
        <span class="search-header-text">Tìm kiếm thuốc</span>
      </div>
      <div class="search-content">
        <div class="search-row">
          <el-input
            v-model="filterForm.keyword"
            placeholder="Tên thuốc, thành phần..."
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
            class="search-input"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-select
            v-model="filterForm.active"
            placeholder="Trạng thái"
            clearable
            @change="handleSearch"
            class="search-select"
          >
            <el-option label="Đang bán" :value="true" />
            <el-option label="Ngừng bán" :value="false" />
          </el-select>
        </div>

        <div class="search-actions">
          <el-button type="primary" @click="handleSearch" class="search-button">
            <el-icon class="mr-1"><Search /></el-icon>
            Tìm kiếm
          </el-button>
          <el-button @click="handleReset" class="reset-button">
            Đặt lại
          </el-button>
        </div>
      </div>
    </div>

    <!-- Table Card -->
    <div class="table-card">
      <el-table
        v-loading="loading"
        :data="medicines"
        stripe
        class="modern-table"
        style="width: 100%"
      >
        <el-table-column type="index" label="STT" width="60" />
        <el-table-column prop="code" label="Mã thuốc" width="120" />
        <el-table-column prop="name" label="Tên thuốc" min-width="200" />
        <el-table-column
          prop="ingredient"
          label="Thành phần"
          min-width="200"
          show-overflow-tooltip
        />
        <el-table-column prop="unit" label="Đơn vị" width="100" />
        <el-table-column label="Giá bán" width="130" align="right">
          <template #default="{ row }">
            <span v-if="row.salePrice" class="text-green-600 font-semibold">
              {{ formatCurrency(row.salePrice) }}
            </span>
            <span v-else class="text-gray-400">Chưa có</span>
          </template>
        </el-table-column>
        <el-table-column label="Tồn kho" width="100" align="right">
          <template #default="{ row }">
            <span
              v-if="row.stockRemaining !== undefined"
              :class="{
                'text-red-600 font-semibold': row.stockRemaining === 0,
                'text-orange-600':
                  row.stockRemaining > 0 && row.stockRemaining < 10,
                'text-green-600': row.stockRemaining >= 10,
              }"
            >
              {{ row.stockRemaining }}
            </span>
            <span v-else class="text-gray-400">N/A</span>
          </template>
        </el-table-column>
        <el-table-column label="Trạng thái" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="row.active ? 'success' : 'danger'">
              {{ row.active ? "Đang bán" : "Ngừng bán" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="Thao tác"
          width="280"
          align="center"
          fixed="right"
        >
          <template #default="{ row }">
            <div class="action-buttons">
              <button
                @click="handleViewDetail(row)"
                class="action-btn-info"
                title="Xem chi tiết"
              >
                <component :is="EyeIcon" />
                <span>Chi tiết</span>
              </button>
              <button
                v-if="authStore.isAdmin"
                @click="handleSetPrice(row)"
                class="action-btn-warning"
                title="Đặt giá bán"
              >
                <component :is="PriceIcon" />
                <span>Đặt giá</span>
              </button>
              <button
                v-if="authStore.isAdmin || authStore.isCashier"
                @click="handleImportBatch(row)"
                class="action-btn-success"
                title="Nhập lô thuốc"
              >
                <component :is="ImportIcon" />
                <span>Nhập lô</span>
              </button>
              <button
                @click="handleViewBatches(row)"
                class="action-btn-secondary"
                title="Lịch sử lô thuốc"
              >
                <component :is="HistoryIcon" />
                <span>Lịch sử lô</span>
              </button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="flex justify-end mt-4">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSearch"
          @current-change="handleSearch"
        />
      </div>
    </div>

    <!-- Dialogs -->
    <MedicineFormDialog
      v-if="formDialogVisible"
      v-model="formDialogVisible"
      :medicine="selectedMedicine"
      @success="handleSearch"
    />

    <SetPriceDialog
      v-if="priceDialogVisible"
      v-model="priceDialogVisible"
      :medicine="selectedMedicine"
      @success="handleSearch"
    />

    <ImportBatchDialog
      v-if="batchDialogVisible"
      v-model="batchDialogVisible"
      :medicine="selectedMedicine"
      @success="handleBatchImported"
    />

    <BatchListDialog
      v-if="batchListDialogVisible"
      v-model="batchListDialogVisible"
      :medicine="selectedMedicine"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h } from "vue";
import { ElMessage } from "element-plus";
import { Plus, Search } from "@element-plus/icons-vue";
import { medicineApi } from "@/api/medicine";
import { sortByCreatedAtDesc } from "@/utils/sort";
import { useAuthStore } from "@/stores/auth";
import type { Medicine } from "@/types/medicine";
import MedicineFormDialog from "./components/MedicineFormDialog.vue";
import SetPriceDialog from "./components/SetPriceDialog.vue";
import ImportBatchDialog from "./components/ImportBatchDialog.vue";
import BatchListDialog from "./components/BatchListDialog.vue";

// Custom Icons
const EyeIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    [
      h("path", { d: "M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" }),
      h("circle", { cx: "12", cy: "12", r: "3" }),
    ],
  );

const PriceIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    [
      h("line", { x1: "12", y1: "2", x2: "12", y2: "22" }),
      h("path", { d: "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" }),
    ],
  );

const ImportIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    [
      h("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
      h("polyline", { points: "7 10 12 15 17 10" }),
      h("line", { x1: "12", y1: "15", x2: "12", y2: "3" }),
    ],
  );

const HistoryIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    [
      h("path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }),
      h("path", { d: "M3 3v5h5" }),
      h("path", { d: "M12 7v5l4 2" }),
    ],
  );

const authStore = useAuthStore();

const loading = ref(false);
const medicines = ref<Medicine[]>([]);

const filterForm = reactive({
  keyword: "",
  active: undefined as boolean | undefined,
});

const pagination = reactive({
  page: 1,
  size: 20,
  total: 0,
});

const formDialogVisible = ref(false);
const priceDialogVisible = ref(false);
const batchDialogVisible = ref(false);
const batchListDialogVisible = ref(false);
const selectedMedicine = ref<Medicine | undefined>();

const loadMedicines = async () => {
  try {
    loading.value = true;
    const response = await medicineApi.search({
      keyword: filterForm.keyword || undefined,
      active: filterForm.active,
      page: pagination.page - 1,
      size: pagination.size,
    });

    medicines.value = sortByCreatedAtDesc(response.content || []);
    pagination.total = response.totalElements || 0;
  } catch (error) {
    console.error("Failed to load medicines:", error);
    ElMessage.error("Không thể tải danh sách thuốc");
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.page = 1;
  loadMedicines();
};

const handleReset = () => {
  filterForm.keyword = "";
  filterForm.active = undefined;
  handleSearch();
};

const handleCreate = () => {
  selectedMedicine.value = undefined;
  formDialogVisible.value = true;
};

const handleViewDetail = (medicine: Medicine) => {
  selectedMedicine.value = medicine;
  formDialogVisible.value = true;
};

const handleSetPrice = (medicine: Medicine) => {
  selectedMedicine.value = medicine;
  priceDialogVisible.value = true;
};

const handleImportBatch = (medicine: Medicine) => {
  selectedMedicine.value = medicine;
  batchDialogVisible.value = true;
};

const handleViewBatches = (medicine: Medicine) => {
  selectedMedicine.value = medicine;
  batchListDialogVisible.value = true;
};

const handleBatchImported = () => {
  ElMessage.success("Nhập lô thuốc thành công");
  handleSearch();
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

onMounted(() => {
  loadMedicines();
});
</script>

<style scoped>
.medicine-list-view {
  padding: 24px;
  background: #f3f4f6;
  min-height: 100vh;
}

.page-header {
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

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
  padding: 26px 30px;
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);
}

.add-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(20, 184, 166, 0.4);
}

.add-button:active {
  transform: translateY(0);
}

/* Search Card */
.search-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.search-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f3f4f6;
}

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

.search-content {
  padding: 24px;
}

.search-row {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
}

.search-select {
  width: 200px;
}

.search-actions {
  display: flex;
  gap: 12px;
}

.search-button {
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  border: none;
  padding: 10px 24px;
  border-radius: 10px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(20, 184, 166, 0.3);
}

.search-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.4);
}

.reset-button {
  padding: 10px 24px;
  border-radius: 10px;
  background: white;
  border: 1px solid #d1d5db;
  color: #6b7280;
  font-weight: 500;
  transition: all 0.3s ease;
}

.reset-button:hover {
  border-color: #14b8a6;
  color: #14b8a6;
  background: #f0fdfa;
}

/* Table Card */
.table-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.table-card :deep(.el-table__header) {
  th {
    background: #f9fafb;
    color: #374151;
    font-weight: 600;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}

.table-card :deep(.el-table__row) {
  transition: all 0.2s ease;

  &:hover {
    background: #f0fdfa !important;
  }
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 6px;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;

  button {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;

    svg {
      width: 14px;
      height: 14px;
    }

    &:hover {
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
    }
  }

  .action-btn-info {
    background: #eff6ff;
    color: #2563eb;

    &:hover {
      background: #dbeafe;
    }
  }

  .action-btn-warning {
    background: #fffbeb;
    color: #ea580c;

    &:hover {
      background: #fef3c7;
    }
  }

  .action-btn-success {
    background: #f0fdf4;
    color: #16a34a;

    &:hover {
      background: #dcfce7;
    }
  }

  .action-btn-secondary {
    background: #f3f4f6;
    color: #6b7280;

    &:hover {
      background: #e5e7eb;
    }
  }
}
</style>
