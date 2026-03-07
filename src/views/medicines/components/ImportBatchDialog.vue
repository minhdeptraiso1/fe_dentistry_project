<template>
  <el-dialog
    v-model="visible"
    width="800px"
    :close-on-click-modal="false"
    :show-close="false"
    class="import-batch-dialog"
    @close="handleClose"
  >
    <template #header>
      <div class="dialog-header">
        <div class="header-content">
          <div class="header-icon">
            <component :is="PackageIcon" />
          </div>
          <div class="header-text">
            <h3 class="dialog-title">Nhập lô thuốc</h3>
            <p class="medicine-name">{{ medicine?.name }}</p>
          </div>
        </div>
      </div>
    </template>

    <!-- Medicine Info Cards -->
    <div class="info-section">
      <div class="info-card">
        <div class="card-header">
          <component :is="PillIcon" class="card-icon" />
          <span class="card-label">Tên thuốc</span>
        </div>
        <div class="card-value">{{ medicine?.name }}</div>
      </div>

      <div class="info-card">
        <div class="card-header">
          <component :is="TagIcon" class="card-icon" />
          <span class="card-label">Mã thuốc</span>
        </div>
        <div class="card-value">{{ medicine?.code }}</div>
      </div>

      <div class="info-card">
        <div class="card-header">
          <component :is="BoxIcon" class="card-icon" />
          <span class="card-label">Đơn vị</span>
        </div>
        <div class="card-value">{{ medicine?.unit || "N/A" }}</div>
      </div>

      <div class="info-card card-price">
        <div class="card-header">
          <component :is="DollarIcon" class="card-icon" />
          <span class="card-label">Giá bán</span>
        </div>
        <div class="card-value">
          <span v-if="medicine?.salePrice" class="current-price">
            {{ formatCurrency(medicine.salePrice) }}
          </span>
          <span v-else class="no-price">Chưa có</span>
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
        <el-form-item label="Số lô" prop="batchNo">
          <el-input v-model="form.batchNo" placeholder="Nhập số lô (tùy chọn)">
            <template #prefix>
              <component :is="TagIcon" class="input-icon" />
            </template>
          </el-input>
        </el-form-item>

        <div class="form-grid">
          <el-form-item label="Ngày nhập" prop="importDate">
            <el-date-picker
              v-model="form.importDate"
              type="date"
              placeholder="Chọn ngày nhập"
              style="width: 100%"
              format="DD/MM/YYYY"
              value-format="YYYY-MM-DD"
            >
              <template #prefix>
                <component :is="CalendarIcon" class="input-icon" />
              </template>
            </el-date-picker>
          </el-form-item>

          <el-form-item label="Ngày hết hạn" prop="expiryDate">
            <el-date-picker
              v-model="form.expiryDate"
              type="date"
              placeholder="Chọn ngày hết hạn (tùy chọn)"
              style="width: 100%"
              format="DD/MM/YYYY"
              value-format="YYYY-MM-DD"
            >
              <template #prefix>
                <component :is="CalendarIcon" class="input-icon" />
              </template>
            </el-date-picker>
          </el-form-item>
        </div>

        <div class="form-grid">
          <el-form-item label="Giá nhập" prop="importPrice">
            <el-input-number
              v-model="form.importPrice"
              :min="0"
              :precision="0"
              :controls="false"
              style="width: 100%"
              placeholder="Nhập giá nhập"
            >
              <template #prefix>
                <component :is="DollarIcon" class="input-icon" />
              </template>
            </el-input-number>
          </el-form-item>

          <el-form-item label="Số lượng" prop="quantityIn">
            <el-input-number
              v-model="form.quantityIn"
              :min="1"
              :precision="0"
              :controls="false"
              style="width: 100%"
              placeholder="Nhập số lượng"
            >
              <template #prefix>
                <component :is="BoxIcon" class="input-icon" />
              </template>
            </el-input-number>
          </el-form-item>
        </div>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <button @click="handleClose" class="footer-button cancel-button">
          <component :is="XIcon" />
          <span>Hủy</span>
        </button>
        <button
          @click="handleSubmit"
          :disabled="submitting"
          class="footer-button submit-button"
        >
          <component :is="submitting ? LoadingIcon : CheckIcon" />
          <span>{{ submitting ? "Đang nhập..." : "Nhập lô" }}</span>
        </button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, h } from "vue";
import { ElMessage } from "element-plus";
import { medicineApi } from "@/api/medicine";
import type { Medicine } from "@/types/medicine";
import type { FormInstance, FormRules } from "element-plus";

// Custom Icons
const PackageIcon = () =>
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
      h("path", { d: "M16.5 9.4 7.55 4.24" }),
      h("path", {
        d: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
      }),
      h("polyline", { points: "3.29 7 12 12 20.71 7" }),
      h("line", { x1: "12", y1: "22", x2: "12", y2: "12" }),
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

const TagIcon = () =>
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
        d: "M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z",
      }),
      h("circle", { cx: "7.5", cy: "7.5", r: ".5", fill: "currentColor" }),
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

const CalendarIcon = () =>
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
      h("rect", {
        x: "3",
        y: "4",
        width: "18",
        height: "18",
        rx: "2",
        ry: "2",
      }),
      h("line", { x1: "16", y1: "2", x2: "16", y2: "6" }),
      h("line", { x1: "8", y1: "2", x2: "8", y2: "6" }),
      h("line", { x1: "3", y1: "10", x2: "21", y2: "10" }),
    ],
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

const formRef = ref<FormInstance>();
const submitting = ref(false);

const form = reactive({
  batchNo: "",
  importDate: new Date().toISOString().split("T")[0], // Today
  expiryDate: "",
  importPrice: 0,
  quantityIn: 1,
});

const rules: FormRules = {
  importDate: [
    {
      required: true,
      message: "Vui lòng chọn ngày nhập",
      trigger: "change",
    },
  ],
  importPrice: [
    {
      required: true,
      message: "Vui lòng nhập giá nhập",
      trigger: "blur",
    },
  ],
  quantityIn: [
    {
      required: true,
      message: "Vui lòng nhập số lượng",
      trigger: "blur",
    },
  ],
};

const handleSubmit = async () => {
  if (!formRef.value || !props.medicine || !form.importDate) return;

  try {
    await formRef.value.validate();
    submitting.value = true;

    await medicineApi.importBatch({
      medicineId: props.medicine.id,
      batchNo: form.batchNo || undefined,
      importDate: form.importDate,
      expiryDate: form.expiryDate || undefined,
      importPrice: form.importPrice,
      quantityIn: form.quantityIn,
    });

    ElMessage.success("Nhập lô thuốc thành công");
    emit("success");
    handleClose();
  } catch (error) {
    console.error("Failed to import batch:", error);
    ElMessage.error("Nhập lô thuốc thất bại");
  } finally {
    submitting.value = false;
  }
};

const handleClose = () => {
  visible.value = false;
  formRef.value?.resetFields();
  form.batchNo = "";
  form.importDate = new Date().toISOString().split("T")[0];
  form.expiryDate = "";
  form.importPrice = 0;
  form.quantityIn = 1;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};
</script>

<style scoped lang="scss">
.import-batch-dialog {
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

    .medicine-name {
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

.info-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.info-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 10px;

    .card-icon {
      width: 16px;
      height: 16px;
      color: #6b7280;
    }

    .card-label {
      font-size: 12px;
      color: #6b7280;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  }

  .card-value {
    font-size: 15px;
    font-weight: 600;
    color: #111827;
    word-break: break-word;

    .current-price {
      color: #14b8a6;
      font-size: 16px;
      font-weight: 700;
    }

    .no-price {
      color: #9ca3af;
      font-size: 13px;
      font-style: italic;
    }
  }

  &.card-price {
    .card-icon {
      color: #14b8a6;
    }
  }
}

.form-container {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0 16px;
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

  :deep(.el-input-number) {
    .el-input__wrapper {
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
  }

  :deep(.el-date-editor) {
    .el-input__wrapper {
      display: flex;
      align-items: center;
      flex-wrap: nowrap;
    }

    .el-input__inner {
      flex: 1;
      min-width: 0;
    }

    .el-input__prefix,
    .el-input__suffix {
      flex-shrink: 0;
    }
  }

  .input-icon {
    width: 16px;
    height: 16px;
    color: #14b8a6;
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
    background: white;
    color: #6b7280;
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
