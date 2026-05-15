<template>
  <div class="expense-list-view">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Quản lý chi phí</h1>
        <p class="page-subtitle">Quản lý và theo dõi các khoản chi phí</p>
      </div>
      <button @click="handleCreate" class="add-button">
        <component :is="PlusIcon" />
        <span>Thêm chi phí</span>
      </button>
    </div>

    <!-- Search Card -->
    <div class="search-card">
      <div class="search-header">
        <component :is="SearchIcon" class="search-header-icon" />
        <span class="search-header-text">Tìm kiếm chi phí</span>
      </div>
      <div class="search-content">
        <div class="search-row">
          <el-input
            v-model="filterForm.keyword"
            placeholder="Tên chi phí..."
            clearable
            class="search-input"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <component :is="SearchIcon" style="width: 16px; height: 16px" />
            </template>
          </el-input>

          <el-select
            v-model="filterForm.category"
            placeholder="Tất cả danh mục"
            clearable
            class="search-select"
            @change="handleSearch"
          >
            <el-option
              v-for="(label, key) in ExpenseCategoryLabels"
              :key="key"
              :label="label"
              :value="key"
            />
          </el-select>

          <el-date-picker
            v-model="filterForm.fromDate"
            type="date"
            placeholder="Từ ngày"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            class="search-date"
            @change="handleSearch"
          />

          <el-date-picker
            v-model="filterForm.toDate"
            type="date"
            placeholder="Đến ngày"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            class="search-date"
            @change="handleSearch"
          />
        </div>

        <div class="search-actions">
          <button @click="handleSearch" class="search-button primary">
            <component :is="SearchIcon" />
            <span>Tìm kiếm</span>
          </button>
          <button @click="handleReset" class="search-button secondary">
            <component :is="RefreshIcon" />
            <span>Đặt lại</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Summary Card -->
    <div class="summary-card">
      <div class="summary-item">
        <div class="summary-icon money">
          <component :is="MoneyIcon" />
        </div>
        <div class="summary-content">
          <div class="summary-label">Tổng chi phí</div>
          <div class="summary-value">{{ formatCurrency(totalAmount) }}</div>
        </div>
      </div>
      <div class="summary-item">
        <div class="summary-icon records">
          <component :is="FileTextIcon" />
        </div>
        <div class="summary-content">
          <div class="summary-label">Số bản ghi</div>
          <div class="summary-value">{{ pagination.total }}</div>
        </div>
      </div>
      <div class="summary-item">
        <button
          @click="handleExport"
          :disabled="exporting"
          class="export-button"
        >
          <component :is="DownloadIcon" />
          <span>{{ exporting ? "Đang xuất..." : "Xuất Excel" }}</span>
        </button>
      </div>
    </div>

    <!-- Table Card -->
    <div class="table-card">
      <el-table
        v-loading="loading"
        :data="expenses"
        stripe
        class="modern-table"
      >
        <el-table-column type="index" label="STT" width="60" align="center" />
        <el-table-column prop="expenseCode" label="Mã chi phí" width="130" />
        <el-table-column label="Danh mục" width="150">
          <template #default="{ row }">
            <el-tag
              :type="getCategoryTagType(row.category)"
              effect="dark"
              size="small"
            >
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
              :icon="EditIcon"
              @click="handleEdit(row)"
              class="action-button edit-button"
            >
              Sửa
            </el-button>
            <el-button
              type="danger"
              size="small"
              :icon="TrashIcon"
              @click="handleDelete(row)"
              class="action-button delete-button"
            >
              Xóa
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-container">
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
    </div>

    <!-- Expense Form Dialog -->
    <ExpenseFormDialog
      v-model="dialogVisible"
      :expense="currentExpense"
      @success="handleSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, h } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { expenseApi } from "@/api/expense";
import { sortByCreatedAtDesc } from "@/utils/sort";
import ExcelJS from "exceljs";
import {
  type Expense,
  ExpenseCategory,
  ExpenseCategoryLabels,
} from "@/types/expense";
import ExpenseFormDialog from "./components/ExpenseFormDialog.vue";

// Custom Icons
const PlusIcon = () =>
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
      style: "width: 20px; height: 20px;",
    },
    [
      h("line", { x1: "12", y1: "5", x2: "12", y2: "19" }),
      h("line", { x1: "5", y1: "12", x2: "19", y2: "12" }),
    ],
  );

const SearchIcon = () =>
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
      style: "width: 20px; height: 20px;",
    },
    [
      h("circle", { cx: "11", cy: "11", r: "8" }),
      h("path", { d: "m21 21-4.35-4.35" }),
    ],
  );

const RefreshIcon = () =>
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
      style: "width: 18px; height: 18px;",
    },
    [
      h("path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" }),
      h("path", { d: "M21 3v5h-5" }),
      h("path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" }),
      h("path", { d: "M3 21v-5h5" }),
    ],
  );

const MoneyIcon = () =>
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
      style: "width: 24px; height: 24px;",
    },
    [
      h("line", { x1: "12", y1: "1", x2: "12", y2: "23" }),
      h("path", { d: "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" }),
    ],
  );

const FileTextIcon = () =>
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
      style: "width: 24px; height: 24px;",
    },
    [
      h("path", {
        d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z",
      }),
      h("polyline", { points: "14 2 14 8 20 8" }),
      h("line", { x1: "16", y1: "13", x2: "8", y2: "13" }),
      h("line", { x1: "16", y1: "17", x2: "8", y2: "17" }),
      h("polyline", { points: "10 9 9 9 8 9" }),
    ],
  );

const DownloadIcon = () =>
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
      style: "width: 18px; height: 18px;",
    },
    [
      h("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
      h("polyline", { points: "7 10 12 15 17 10" }),
      h("line", { x1: "12", y1: "15", x2: "12", y2: "3" }),
    ],
  );

const EditIcon = () =>
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
      style: "width: 16px; height: 16px;",
    },
    [
      h("path", {
        d: "M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z",
      }),
    ],
  );

const TrashIcon = () =>
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
      style: "width: 16px; height: 16px;",
    },
    [
      h("polyline", { points: "3 6 5 6 21 6" }),
      h("path", {
        d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
      }),
    ],
  );

const loading = ref(false);
const exporting = ref(false);
const dialogVisible = ref(false);
const expenses = ref<Expense[]>([]);
const currentExpense = ref<Expense | null>(null);

const getCurrentMonthRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const formatYMD = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  return {
    fromDate: formatYMD(firstDay),
    toDate: formatYMD(lastDay),
  };
};

const defaultMonthRange = getCurrentMonthRange();

const filterForm = reactive({
  keyword: "",
  category: undefined as ExpenseCategory | undefined,
  fromDate: defaultMonthRange.fromDate,
  toDate: defaultMonthRange.toDate,
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
    expenses.value = sortByCreatedAtDesc(response.content || []);
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
  const currentMonthRange = getCurrentMonthRange();
  filterForm.fromDate = currentMonthRange.fromDate;
  filterForm.toDate = currentMonthRange.toDate;
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
        customClass: "danger-confirm-dialog",
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
  exportExpensesToExcel();
};

const exportExpensesToExcel = async () => {
  exporting.value = true;

  try {
    const response = await expenseApi.search({
      keyword: filterForm.keyword || undefined,
      category: filterForm.category,
      fromDate: filterForm.fromDate || undefined,
      toDate: filterForm.toDate || undefined,
      page: 0,
      size: Math.max(pagination.total || 0, 1000),
    });

    const exportRows = sortByCreatedAtDesc(response.content || []);

    if (exportRows.length === 0) {
      ElMessage.warning("Không có dữ liệu để xuất Excel");
      return;
    }

    const fromLabel = filterForm.fromDate || "-";
    const toLabel = filterForm.toDate || "-";
    const title = `Thống Kê chi Phí Từ Ngày ${fromLabel} đến ${toLabel}`;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("ThongKeChiPhi");

    worksheet.columns = [
      { width: 8 },
      { width: 14 },
      { width: 14 },
      { width: 35 },
      { width: 14 },
      { width: 14 },
      { width: 28 },
      { width: 22 },
    ];

    worksheet.mergeCells("A1:H1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = title;
    titleCell.font = { bold: true, size: 18, name: "Calibri" };
    titleCell.alignment = { horizontal: "left", vertical: "middle" };

    const headerRow = worksheet.addRow([]);
    headerRow.commit();

    const labelsRow = worksheet.addRow([
      "STT",
      "Mã chi phí",
      "Danh mục",
      "Tên chi phí",
      "Số tiền",
      "Ngày chi",
      "Ghi chú",
      "Ngày tạo",
    ]);

    labelsRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0EA5E9" },
      };
      cell.alignment = { horizontal: "left", vertical: "middle" };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE5E7EB" } },
        left: { style: "thin", color: { argb: "FFE5E7EB" } },
        bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
        right: { style: "thin", color: { argb: "FFE5E7EB" } },
      };
    });

    exportRows.forEach((expense, index) => {
      const row = worksheet.addRow([
        index + 1,
        expense.expenseCode,
        ExpenseCategoryLabels[expense.category as ExpenseCategory],
        expense.name,
        expense.amount,
        formatDate(expense.expenseDate),
        expense.note || "",
        formatDateTime(expense.createdAt),
      ]);

      row.eachCell((cell, colNumber) => {
        cell.alignment = { horizontal: "left", vertical: "middle" };
        cell.border = {
          top: { style: "thin", color: { argb: "FFF3F4F6" } },
          left: { style: "thin", color: { argb: "FFF3F4F6" } },
          bottom: { style: "thin", color: { argb: "FFF3F4F6" } },
          right: { style: "thin", color: { argb: "FFF3F4F6" } },
        };

        if (colNumber === 5 && typeof cell.value === "number") {
          cell.numFmt = "#,##0";
        }
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const fileDate = new Date().toISOString().slice(0, 10);
    anchor.href = url;
    anchor.download = `Thong_Ke_Chi_Phi_${fileDate}.xlsx`;
    anchor.click();
    URL.revokeObjectURL(url);

    ElMessage.success("Xuất Excel thành công");
  } catch (error: any) {
    ElMessage.error(error.message || "Không thể xuất Excel");
  } finally {
    exporting.value = false;
  }
};

onMounted(() => {
  loadExpenses();
});
</script>

<style scoped lang="scss">
.expense-list-view {
  padding: 24px;
  max-width: 1600px;
  margin: 0 auto;
}

// Page Header
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);

  svg {
    width: 20px;
    height: 20px;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(20, 184, 166, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
}

// Search Card
.search-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
  overflow: hidden;
}

.search-header {
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  padding: 16px 24px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-header-icon {
  width: 20px;
  height: 20px;
  color: white;
}

.search-header-text {
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.search-content {
  padding: 24px;
}

.search-row {
  display: grid;
  grid-template-columns: 2fr 1.5fr 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.search-input {
  :deep(.el-input__wrapper) {
    border-radius: 8px;
  }
}

.search-select,
.search-date {
  :deep(.el-input__wrapper) {
    border-radius: 8px;
  }
}

.search-actions {
  display: flex;
  gap: 12px;
}

.search-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  svg {
    width: 18px;
    height: 18px;
  }

  &.primary {
    background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
    color: white;
    box-shadow: 0 2px 8px rgba(20, 184, 166, 0.3);

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(20, 184, 166, 0.4);
    }
  }

  &.secondary {
    background: #f3f4f6;
    color: #374151;

    &:hover {
      background: #e5e7eb;
    }
  }

  &:active {
    transform: translateY(0);
  }
}

// Summary Card
.summary-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px;
  margin-bottom: 24px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 16px;

  &:last-child {
    justify-content: flex-end;
  }
}

.summary-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.money {
    background: linear-gradient(135deg, #ef4444 15%, #dc2626 100%);
    color: white;
  }

  &.records {
    background: linear-gradient(135deg, #3b82f6 15%, #2563eb 100%);
    color: white;
  }

  svg {
    width: 28px;
    height: 28px;
  }
}

.summary-content {
  flex: 1;
}

.summary-label {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 4px;
}

.summary-value {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
}

.export-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);

  svg {
    width: 18px;
    height: 18px;
  }

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

// Table Card
.table-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.modern-table {
  :deep(.el-table__header) {
    th {
      background: #f9fafb;
      color: #374151;
      font-weight: 600;
      font-size: 13px;
      padding: 14px 0;
    }
  }

  :deep(.el-table__body) {
    td {
      padding: 14px 0;
      font-size: 14px;
    }
  }

  :deep(.el-table__row) {
    &:hover {
      background: #f9fafb;
    }
  }

  :deep(.el-button.action-button) {
    font-weight: 500;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 13px;
    border: none;
    margin: 0 4px;

    &.edit-button {
      background: #eff6ff;
      color: #3b82f6;

      &:hover {
        background: #dbeafe;
        transform: translateY(-1px);
      }
    }

    &.delete-button {
      background: #fef2f2;
      color: #ef4444;

      &:hover {
        background: #fee2e2;
        transform: translateY(-1px);
      }
    }
  }

  :deep(.el-tag) {
    font-weight: 500;
  }
}

// Pagination
.pagination-container {
  padding: 20px 24px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #f3f4f6;
}
</style>
