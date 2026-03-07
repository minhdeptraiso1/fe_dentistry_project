<template>
  <el-dialog
    v-model="visible"
    :width="isEdit ? '1000px' : '700px'"
    :close-on-click-modal="false"
    :show-close="false"
    class="medicine-detail-dialog"
  >
    <template #header>
      <div class="dialog-header">
        <div class="header-content">
          <div class="header-icon">
            <component :is="PillIcon" />
          </div>
          <div class="header-text">
            <h3 class="dialog-title">
              {{ isEdit ? "Chi tiết thuốc" : "Thêm thuốc mới" }}
            </h3>
            <p v-if="isEdit && medicine" class="medicine-code">
              {{ medicine.code }}
            </p>
          </div>
        </div>
      </div>
    </template>

    <!-- Summary Cards for Edit Mode -->
    <div v-if="isEdit && medicine" class="summary-section">
      <div class="summary-card card-price">
        <div class="card-header">
          <component :is="DollarIcon" class="card-icon" />
          <span class="card-label">Giá bán</span>
        </div>
        <div class="card-value">
          <span v-if="medicine.salePrice">{{
            formatCurrency(medicine.salePrice)
          }}</span>
          <span v-else class="no-data">Chưa có giá</span>
        </div>
      </div>

      <div class="summary-card card-stock">
        <div class="card-header">
          <component :is="BoxIcon" class="card-icon" />
          <span class="card-label">Tồn kho</span>
        </div>
        <div class="card-value">
          <span
            v-if="medicine.stockRemaining !== undefined"
            :class="{
              'stock-empty': medicine.stockRemaining === 0,
              'stock-low':
                medicine.stockRemaining > 0 && medicine.stockRemaining < 10,
              'stock-good': medicine.stockRemaining >= 10,
            }"
          >
            {{ medicine.stockRemaining }}
            <span class="unit">{{ medicine.unit || "đơn vị" }}</span>
          </span>
          <span v-else class="no-data">N/A</span>
        </div>
      </div>

      <div class="summary-card card-status">
        <div class="card-header">
          <component :is="StatusIcon" class="card-icon" />
          <span class="card-label">Trạng thái</span>
        </div>
        <div class="card-value">
          <el-tag
            :type="medicine.active ? 'success' : 'danger'"
            effect="dark"
            size="large"
          >
            {{ medicine.active ? "Đang bán" : "Ngừng bán" }}
          </el-tag>
        </div>
      </div>
    </div>

    <!-- Form -->
    <div class="form-container">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="140px"
        label-position="left"
      >
        <div class="form-grid">
          <el-form-item label="Tên thuốc" prop="name">
            <el-input
              v-model="form.name"
              placeholder="Nhập tên thuốc"
              :disabled="isEdit"
            >
              <template #prefix>
                <component :is="PillIcon" class="input-icon" />
              </template>
            </el-input>
          </el-form-item>

          <el-form-item label="Đơn vị" prop="unit">
            <el-input
              v-model="form.unit"
              placeholder="VD: Viên, Hộp, Chai..."
              :disabled="isEdit"
            >
              <template #prefix>
                <component :is="UnitIcon" class="input-icon" />
              </template>
            </el-input>
          </el-form-item>
        </div>

        <el-form-item label="Thành phần" prop="ingredient">
          <el-input
            v-model="form.ingredient"
            type="textarea"
            :rows="2"
            placeholder="Nhập thành phần"
            :disabled="isEdit"
          />
        </el-form-item>

        <el-form-item label="Hướng dẫn sử dụng" prop="usageGuide">
          <el-input
            v-model="form.usageGuide"
            type="textarea"
            :rows="3"
            placeholder="Nhập hướng dẫn sử dụng"
            :disabled="isEdit"
          />
        </el-form-item>
      </el-form>
    </div>

    <!-- Price History Section -->
    <div v-if="isEdit && medicine" class="price-history-section">
      <div class="section-header">
        <component :is="HistoryIcon" class="section-icon" />
        <h4 class="section-title">Lịch sử thay đổi giá</h4>
      </div>

      <div class="table-container">
        <el-table
          v-loading="priceHistoryLoading"
          :data="priceHistory"
          stripe
          class="modern-table"
          max-height="350"
        >
          <el-table-column label="Giá cũ" width="140" align="right">
            <template #default="{ row }">
              <span class="old-price">
                {{ row.oldPrice ? formatCurrency(row.oldPrice) : "-" }}
              </span>
            </template>
          </el-table-column>

          <el-table-column label="Giá mới" width="140" align="right">
            <template #default="{ row }">
              <span class="new-price">
                {{ formatCurrency(row.newPrice) }}
              </span>
            </template>
          </el-table-column>

          <el-table-column label="Lý do" min-width="200">
            <template #default="{ row }">
              <span class="reason">{{ row.reason || "-" }}</span>
            </template>
          </el-table-column>

          <el-table-column label="Người thay đổi" width="150">
            <template #default="{ row }">
              <div class="user-cell">
                <component :is="UserIcon" class="user-icon" />
                <span>{{ row.changedBy }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="Thời gian" width="180">
            <template #default="{ row }">
              <div class="time-cell">
                <component :is="ClockIcon" class="time-icon" />
                <span>{{ formatDateTime(row.changedAt) }}</span>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <div
          v-if="priceHistory.length === 0 && !priceHistoryLoading"
          class="empty-state"
        >
          <component :is="EmptyIcon" class="empty-icon" />
          <p class="empty-text">Chưa có lịch sử thay đổi giá</p>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <button @click="handleClose" class="footer-button cancel-button">
          <component :is="XIcon" />
          <span>{{ isEdit ? "Đóng" : "Hủy" }}</span>
        </button>
        <button
          v-if="!isEdit"
          @click="handleSubmit"
          :disabled="submitting"
          class="footer-button submit-button"
        >
          <component :is="submitting ? LoadingIcon : CheckIcon" />
          <span>{{ submitting ? "Đang tạo..." : "Tạo thuốc" }}</span>
        </button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, h } from "vue";
import { ElMessage } from "element-plus";
import { medicineApi } from "@/api/medicine";
import type { Medicine, MedicinePriceHistory } from "@/types/medicine";
import type { FormInstance, FormRules } from "element-plus";

// Custom Icons
const PillIcon = () =>
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
      h("path", {
        d: "m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z",
      }),
      h("path", { d: "m8.5 8.5 7 7" }),
    ],
  );

const CloseIcon = () =>
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
      h("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
      h("line", { x1: "6", y1: "6", x2: "18", y2: "18" }),
    ],
  );

const DollarIcon = () =>
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

const BoxIcon = () =>
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
      h("path", {
        d: "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z",
      }),
      h("path", { d: "m3.3 7 8.7 5 8.7-5" }),
      h("path", { d: "M12 22V12" }),
    ],
  );

const StatusIcon = () =>
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
      h("path", { d: "M22 11.08V12a10 10 0 1 1-5.93-9.14" }),
      h("polyline", { points: "22 4 12 14.01 9 11.01" }),
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

const UserIcon = () =>
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
      h("path", { d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" }),
      h("circle", { cx: "12", cy: "7", r: "4" }),
    ],
  );

const ClockIcon = () =>
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
      h("circle", { cx: "12", cy: "12", r: "10" }),
      h("polyline", { points: "12 6 12 12 16 14" }),
    ],
  );

const UnitIcon = () =>
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
    [h("path", { d: "M3 3v18h18" }), h("path", { d: "m19 9-5 5-4-4-3 3" })],
  );

const CheckIcon = () =>
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
    [h("polyline", { points: "20 6 9 17 4 12" })],
  );

const XIcon = () =>
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
      h("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
      h("line", { x1: "6", y1: "6", x2: "18", y2: "18" }),
    ],
  );

const EmptyIcon = () =>
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
      h("path", { d: "M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" }),
      h("path", {
        d: "m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9",
      }),
      h("path", { d: "M12 3v6" }),
    ],
  );

const LoadingIcon = () =>
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
      class: "animate-spin",
    },
    [h("path", { d: "M21 12a9 9 0 1 1-6.219-8.56" })],
  );

interface Props {
  modelValue: boolean;
  medicine?: Medicine;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "success"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const isEdit = computed(() => !!props.medicine);

const formRef = ref<FormInstance>();
const submitting = ref(false);
const priceHistoryLoading = ref(false);
const priceHistory = ref<MedicinePriceHistory[]>([]);

const form = reactive({
  name: "",
  ingredient: "",
  unit: "",
  usageGuide: "",
});

const rules: FormRules = {
  name: [
    {
      required: true,
      message: "Vui lòng nhập tên thuốc",
      trigger: "blur",
    },
  ],
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    submitting.value = true;

    await medicineApi.create({
      name: form.name,
      ingredient: form.ingredient || undefined,
      unit: form.unit || undefined,
      usageGuide: form.usageGuide || undefined,
    });

    ElMessage.success("Tạo thuốc thành công");
    emit("success");
    handleClose();
  } catch (error) {
    console.error("Failed to create medicine:", error);
    ElMessage.error("Tạo thuốc thất bại");
  } finally {
    submitting.value = false;
  }
};

const handleClose = () => {
  visible.value = false;
  if (!isEdit.value) {
    formRef.value?.resetFields();
    form.name = "";
    form.ingredient = "";
    form.unit = "";
    form.usageGuide = "";
  }
  priceHistory.value = [];
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString("vi-VN");
};

const loadPriceHistory = async () => {
  if (!props.medicine?.id) return;

  try {
    priceHistoryLoading.value = true;
    const response = await medicineApi.priceHistory(props.medicine.id, {
      page: 0,
      size: 50,
    });
    priceHistory.value = response.content || [];
  } catch (error) {
    console.error("Failed to load price history:", error);
  } finally {
    priceHistoryLoading.value = false;
  }
};

// Load medicine data if in edit mode
if (props.medicine) {
  form.name = props.medicine.name;
  form.ingredient = props.medicine.ingredient || "";
  form.unit = props.medicine.unit || "";
  form.usageGuide = props.medicine.usageGuide || "";
  loadPriceHistory();
}

// Watch for medicine changes
watch(
  () => props.medicine,
  (medicine) => {
    if (medicine) {
      form.name = medicine.name;
      form.ingredient = medicine.ingredient || "";
      form.unit = medicine.unit || "";
      form.usageGuide = medicine.usageGuide || "";
      loadPriceHistory();
    }
  },
);
</script>

<style scoped lang="scss">
.medicine-detail-dialog {
  :deep(.el-dialog) {
    border-radius: 16px;
    overflow: hidden;
  }

  :deep(.el-dialog__header) {
    padding: 0;
    margin: 0;
  }

  :deep(.el-dialog__body) {
    padding: 24px;
    background: #f9fafb;
    max-height: 80vh;
    overflow-y: auto;
  }

  :deep(.el-dialog__footer) {
    padding: 0;
    border-top: 1px solid #e5e7eb;
  }
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  color: white;

  .header-content {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .header-icon {
    width: 48px;
    height: 48px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
      width: 24px;
      height: 24px;
      stroke: white;
    }
  }

  .header-text {
    .dialog-title {
      font-size: 20px;
      font-weight: 700;
      margin: 0 0 4px 0;
      color: white;
    }

    .medicine-code {
      font-size: 14px;
      margin: 0;
      color: rgba(255, 255, 255, 0.9);
      font-weight: 500;
    }
  }

  .close-button {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: none;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;

    svg {
      width: 20px;
      height: 20px;
    }

    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }
}

.summary-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.summary-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;

    .card-icon {
      width: 20px;
      height: 20px;
    }

    .card-label {
      font-size: 13px;
      color: #6b7280;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  }

  .card-value {
    font-size: 24px;
    font-weight: 700;

    .no-data {
      color: #9ca3af;
      font-size: 16px;
      font-style: italic;
    }

    .unit {
      font-size: 14px;
      font-weight: 500;
      opacity: 0.7;
      margin-left: 4px;
    }

    .stock-empty {
      color: #ef4444;
    }

    .stock-low {
      color: #ea580c;
    }

    .stock-good {
      color: #16a34a;
    }
  }

  &.card-price {
    .card-icon {
      color: #14b8a6;
    }

    .card-value {
      color: #14b8a6;
    }
  }

  &.card-stock {
    .card-icon {
      color: #3b82f6;
    }
  }

  &.card-status {
    .card-icon {
      color: #8b5cf6;
    }
  }
}

.form-container {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  :deep(.el-form-item) {
    margin-bottom: 20px;
  }

  :deep(.el-input__wrapper) {
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
    }

    &.is-focus {
      box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
    }
  }

  :deep(.el-textarea__inner) {
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
    }

    &:focus {
      box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
    }
  }

  .input-icon {
    width: 16px;
    height: 16px;
    color: #14b8a6;
  }
}

.price-history-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  .section-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 2px solid #f3f4f6;

    .section-icon {
      width: 24px;
      height: 24px;
      color: #14b8a6;
    }

    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }
  }

  .table-container {
    .modern-table {
      :deep(.el-table__header) {
        th {
          background: #f9fafb;
          color: #374151;
          font-weight: 600;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #e5e7eb;
        }
      }

      :deep(.el-table__row) {
        transition: all 0.2s ease;

        &:hover {
          background: #f0fdfa !important;
        }

        td {
          border-bottom: 1px solid #f3f4f6;
        }
      }
    }

    .old-price {
      color: #9ca3af;
      font-weight: 500;
      text-decoration: line-through;
    }

    .new-price {
      color: #16a34a;
      font-weight: 700;
      font-size: 15px;
    }

    .reason {
      color: #374151;
      font-weight: 500;
    }

    .user-cell {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #6b7280;

      .user-icon {
        width: 16px;
        height: 16px;
        color: #14b8a6;
      }
    }

    .time-cell {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #6b7280;
      font-size: 13px;

      .time-icon {
        width: 14px;
        height: 14px;
        color: #9ca3af;
      }
    }

    .empty-state {
      text-align: center;
      padding: 48px 24px;

      .empty-icon {
        width: 64px;
        height: 64px;
        margin: 0 auto 16px;
        color: #d1d5db;
      }

      .empty-text {
        font-size: 15px;
        color: #9ca3af;
        margin: 0;
        font-style: italic;
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  background: white;

  .footer-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 24px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;

    svg {
      width: 20px;
      height: 20px;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .cancel-button {
    background: rgb(255, 255, 255);
    color: #374151;
    border: 1px solid #e5e7eb;

    &:hover:not(:disabled) {
      background: #f9fafb;
      border-color: #d1d5db;
      color: #374151;
    }
  }

  .submit-button {
    background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);

    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(20, 184, 166, 0.4);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
