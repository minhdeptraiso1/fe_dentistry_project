<template>
  <div class="medicine-list-view">
    <!-- Page Header -->
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Danh mục thuốc</h1>
      <el-button v-if="authStore.isAdmin" type="primary" @click="handleCreate">
        <el-icon class="mr-1"><Plus /></el-icon>
        Thêm thuốc
      </el-button>
    </div>

    <!-- Filter Card -->
    <el-card class="mb-4">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="Tìm kiếm">
          <el-input
            v-model="filterForm.keyword"
            placeholder="Tên thuốc, thành phần..."
            clearable
            style="width: 300px"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="Trạng thái">
          <el-select
            v-model="filterForm.active"
            placeholder="Tất cả"
            clearable
            style="width: 150px"
            @change="handleSearch"
          >
            <el-option label="Đang bán" :value="true" />
            <el-option label="Ngừng bán" :value="false" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon class="mr-1"><Search /></el-icon>
            Tìm kiếm
          </el-button>
          <el-button @click="handleReset">Đặt lại</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Table Card -->
    <el-card>
      <el-table
        v-loading="loading"
        :data="medicines"
        border
        stripe
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
            <el-button
              type="primary"
              size="small"
              link
              @click="handleViewDetail(row)"
            >
              Chi tiết
            </el-button>
            <el-button
              v-if="authStore.isAdmin"
              type="warning"
              size="small"
              link
              @click="handleSetPrice(row)"
            >
              Đặt giá
            </el-button>
            <el-button
              v-if="authStore.isAdmin || authStore.isCashier"
              type="success"
              size="small"
              link
              @click="handleImportBatch(row)"
            >
              Nhập lô
            </el-button>
            <el-button
              type="info"
              size="small"
              link
              @click="handleViewBatches(row)"
            >
              Lịch sử lô
            </el-button>
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
    </el-card>

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
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Plus, Search } from "@element-plus/icons-vue";
import { medicineApi } from "@/api/medicine";
import { useAuthStore } from "@/stores/auth";
import type { Medicine } from "@/types/medicine";
import MedicineFormDialog from "./components/MedicineFormDialog.vue";
import SetPriceDialog from "./components/SetPriceDialog.vue";
import ImportBatchDialog from "./components/ImportBatchDialog.vue";
import BatchListDialog from "./components/BatchListDialog.vue";

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

    medicines.value = response.content || [];
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
  padding: 20px;
}
</style>
