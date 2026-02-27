<template>
  <div class="expense-list-view">
    <!-- Page Header -->
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Quản lý chi phí</h1>
      <el-button type="primary" @click="handleCreate">
        <el-icon class="mr-1"><Plus /></el-icon>
        Thêm chi phí
      </el-button>
    </div>

    <!-- Filter Card -->
    <el-card class="mb-4">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="Tìm kiếm">
          <el-input
            v-model="filterForm.keyword"
            placeholder="Tên chi phí..."
            clearable
            style="width: 250px"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="Danh mục">
          <el-select
            v-model="filterForm.category"
            placeholder="Tất cả"
            clearable
            style="width: 150px"
            @change="handleSearch"
          >
            <el-option
              v-for="(label, key) in ExpenseCategoryLabels"
              :key="key"
              :label="label"
              :value="key"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Từ ngày">
          <el-date-picker
            v-model="filterForm.fromDate"
            type="date"
            placeholder="Chọn ngày"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            style="width: 150px"
            @change="handleSearch"
          />
        </el-form-item>

        <el-form-item label="Đến ngày">
          <el-date-picker
            v-model="filterForm.toDate"
            type="date"
            placeholder="Chọn ngày"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            style="width: 150px"
            @change="handleSearch"
          />
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

    <!-- Summary Card -->
    <el-card class="mb-4">
      <el-row :gutter="16">
        <el-col :span="8">
          <el-statistic title="Tổng chi phí" :value="totalAmount">
            <template #suffix>đ</template>
          </el-statistic>
        </el-col>
        <el-col :span="8">
          <el-statistic title="Số bản ghi" :value="pagination.total" />
        </el-col>
        <el-col :span="8">
          <el-button type="success" @click="handleExport" :loading="exporting">
            <el-icon class="mr-1"><Download /></el-icon>
            Xuất Excel
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- Table Card -->
    <el-card>
      <el-table
        v-loading="loading"
        :data="expenses"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column type="index" label="STT" width="60" />
        <el-table-column prop="expenseCode" label="Mã chi phí" width="130" />
        <el-table-column label="Danh mục" width="120">
          <template #default="{ row }">
            <el-tag :type="getCategoryTagType(row.category)">
              {{ ExpenseCategoryLabels[row.category as ExpenseCategory] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="name"
          label="Tên chi phí"
          min-width="200"
          show-overflow-tooltip
        />
        <el-table-column label="Số tiền" width="150" align="right">
          <template #default="{ row }">
            <span class="text-red-600 font-semibold">
              {{ formatCurrency(row.amount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="Ngày chi" width="120">
          <template #default="{ row }">
            {{ formatDate(row.expenseDate) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="note"
          label="Ghi chú"
          min-width="150"
          show-overflow-tooltip
        />
        <el-table-column label="Ngày tạo" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column
          label="Thao tác"
          width="150"
          align="center"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              link
              @click="handleEdit(row)"
            >
              Sửa
            </el-button>
            <el-button
              type="danger"
              size="small"
              link
              @click="handleDelete(row)"
            >
              Xóa
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="flex justify-end mt-4">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSearch"
          @current-change="handleSearch"
        />
      </div>
    </el-card>

    <!-- Expense Form Dialog -->
    <ExpenseFormDialog
      v-model="dialogVisible"
      :expense="currentExpense"
      @success="handleSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Search, Download } from "@element-plus/icons-vue";
import { expenseApi } from "@/api/expense";
import {
  type Expense,
  ExpenseCategory,
  ExpenseCategoryLabels,
} from "@/types/expense";
import ExpenseFormDialog from "./components/ExpenseFormDialog.vue";

const loading = ref(false);
const exporting = ref(false);
const dialogVisible = ref(false);
const expenses = ref<Expense[]>([]);
const currentExpense = ref<Expense | null>(null);

const filterForm = reactive({
  keyword: "",
  category: undefined as ExpenseCategory | undefined,
  fromDate: "",
  toDate: "",
});

const pagination = reactive({
  page: 1,
  size: 20,
  total: 0,
});

const totalAmount = computed(() => {
  return expenses.value.reduce((sum, expense) => sum + expense.amount, 0);
});

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("vi-VN");
};

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleString("vi-VN");
};

const getCategoryTagType = (category: ExpenseCategory) => {
  const typeMap: Record<ExpenseCategory, any> = {
    [ExpenseCategory.RENT]: "warning",
    [ExpenseCategory.SALARY]: "danger",
    [ExpenseCategory.ELECTRIC]: "success",
    [ExpenseCategory.WATER]: "info",
    [ExpenseCategory.SUPPLIES]: "primary",
    [ExpenseCategory.OTHER]: "",
  };
  return typeMap[category];
};

const loadExpenses = async () => {
  loading.value = true;
  try {
    const response = await expenseApi.search({
      keyword: filterForm.keyword || undefined,
      category: filterForm.category,
      fromDate: filterForm.fromDate || undefined,
      toDate: filterForm.toDate || undefined,
      page: pagination.page - 1,
      size: pagination.size,
    });
    expenses.value = response.content;
    pagination.total = response.totalElements;
  } catch (error: any) {
    ElMessage.error(error.message || "Không thể tải danh sách chi phí");
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.page = 1;
  loadExpenses();
};

const handleReset = () => {
  filterForm.keyword = "";
  filterForm.category = undefined;
  filterForm.fromDate = "";
  filterForm.toDate = "";
  handleSearch();
};

const handleCreate = () => {
  currentExpense.value = null;
  dialogVisible.value = true;
};

const handleEdit = (expense: Expense) => {
  currentExpense.value = expense;
  dialogVisible.value = true;
};

const handleDelete = async (expense: Expense) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa chi phí "${expense.name}"?`,
      "Xác nhận xóa",
      {
        confirmButtonText: "Xóa",
        cancelButtonText: "Hủy",
        type: "warning",
      },
    );

    await expenseApi.delete(expense.id);
    ElMessage.success("Xóa chi phí thành công");
    loadExpenses();
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(error.message || "Không thể xóa chi phí");
    }
  }
};

const handleSuccess = () => {
  dialogVisible.value = false;
  loadExpenses();
};

const handleExport = () => {
  ElMessage.info("Chức năng xuất Excel đang được phát triển");
  // TODO: Implement export functionality
};

onMounted(() => {
  loadExpenses();
});
</script>

<style scoped lang="scss">
.expense-list-view {
  padding: 20px;
}

.flex {
  display: flex;
}

.justify-between {
  justify-content: space-between;
}

.justify-end {
  justify-content: flex-end;
}

.items-center {
  align-items: center;
}

.mb-4 {
  margin-bottom: 16px;
}

.mb-6 {
  margin-bottom: 24px;
}

.mt-4 {
  margin-top: 16px;
}

.mr-1 {
  margin-right: 4px;
}

.text-2xl {
  font-size: 1.5rem;
}

.font-bold {
  font-weight: 700;
}

.font-semibold {
  font-weight: 600;
}

.text-red-600 {
  color: #ff4d4f;
}
</style>
