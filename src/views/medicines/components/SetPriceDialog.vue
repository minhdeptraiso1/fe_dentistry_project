<template>
  <el-dialog
    v-model="visible"
    width="700px"
    :close-on-click-modal="false"
    :show-close="false"
    class="set-price-dialog"
    @close="handleClose"
  >
    <template #header>
      <div class="dialog-header">
        <div class="header-content">
          <div class="header-icon">
            <component :is="DollarIcon" />
          </div>
          <div class="header-text">
            <h3 class="dialog-title">Đặt giá bán</h3>
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

      <div class="info-card card-price">
        <div class="card-header">
          <component :is="DollarIcon" class="card-icon" />
          <span class="card-label">Giá hiện tại</span>
        </div>
        <div class="card-value">
          <span v-if="medicine?.salePrice" class="current-price">
            {{ formatCurrency(medicine.salePrice) }}
          </span>
          <span v-else class="no-price">Chưa có giá</span>
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
        <el-form-item label="Giá bán mới" prop="newPrice">
          <el-input-number
            v-model="form.newPrice"
            :min="0"
            :precision="0"
            :controls="false"
            style="width: 100%"
            placeholder="Nhập giá bán mới"
          >
            <template #prefix>
              <component :is="DollarIcon" class="input-icon" />
            </template>
          </el-input-number>
        </el-form-item>

        <el-form-item label="Lý do thay đổi" prop="reason">
          <el-input
            v-model="form.reason"
            type="textarea"
            :rows="3"
            placeholder="Nhập lý do thay đổi giá (tùy chọn)"
          />
        </el-form-item>
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
          <span>{{ submitting ? "Đang lưu..." : "Lưu giá" }}</span>
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
  newPrice: props.medicine?.salePrice || 0,
  reason: "",
});

const rules: FormRules = {
  newPrice: [
    {
      required: true,
      message: "Vui lòng nhập giá bán mới",
      trigger: "blur",
    },
  ],
};

const handleSubmit = async () => {
  if (!formRef.value || !props.medicine) return;

  try {
    await formRef.value.validate();
    submitting.value = true;

    await medicineApi.setSalePrice(props.medicine.id, {
      newPrice: form.newPrice,
      reason: form.reason || undefined,
    });

    ElMessage.success("Cập nhật giá bán thành công");
    emit("success");
    handleClose();
  } catch (error) {
    console.error("Failed to set price:", error);
    ElMessage.error("Cập nhật giá bán thất bại");
  } finally {
    submitting.value = false;
  }
};

const handleClose = () => {
  visible.value = false;
  formRef.value?.resetFields();
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};
</script>

<style scoped lang="scss">
.set-price-dialog {
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
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.info-card {
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
    gap: 8px;
    margin-bottom: 12px;

    .card-icon {
      width: 18px;
      height: 18px;
      color: #6b7280;
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
    font-size: 16px;
    font-weight: 600;
    color: #111827;
    word-break: break-word;

    .current-price {
      color: #14b8a6;
      font-size: 18px;
      font-weight: 700;
    }

    .no-price {
      color: #9ca3af;
      font-size: 14px;
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

  :deep(.el-form-item) {
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
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
