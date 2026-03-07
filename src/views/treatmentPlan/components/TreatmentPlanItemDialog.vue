<template>
  <el-dialog
    v-model="visible"
    width="800px"
    :show-close="false"
    :close-on-click-modal="false"
    @close="handleClose"
    class="modern-item-dialog"
  >
    <template #header>
      <div class="dialog-header">
        <component :is="ServiceIcon" class="header-icon" />
        <h3 class="header-title">Thêm dịch vụ điều trị</h3>
      </div>
    </template>
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
      label-position="left"
      class="modern-form"
    >
      <el-form-item label="Dịch vụ" prop="serviceId">
        <el-select
          v-model="form.serviceId"
          placeholder="Chọn dịch vụ"
          filterable
          remote
          :remote-method="searchServices"
          :loading="serviceLoading"
          style="width: 100%"
          size="large"
          @change="handleServiceChange"
          @focus="handleServiceFocus"
        >
          <template #prefix>
            <component :is="ServiceIcon" class="input-icon" />
          </template>
          <el-option
            v-for="service in serviceOptions"
            :key="service.id"
            :label="`${service.code} - ${service.name}`"
            :value="service.id"
          >
            <div class="flex justify-between items-center">
              <span>{{ service.code }} - {{ service.name }}</span>
              <span class="text-sm text-gray-500">
                {{ formatCurrency(service.basePrice) }}
              </span>
            </div>
          </el-option>
        </el-select>
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="Số lượng" prop="quantity">
            <el-input-number
              v-model="form.quantity"
              :min="1"
              :max="100"
              style="width: 100%"
              size="large"
              @change="calculateTotal"
            >
              <template #prefix>
                <component :is="QuantityIcon" class="input-icon" />
              </template>
            </el-input-number>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="Đơn giá" prop="unitPrice">
            <el-input-number
              v-model="form.unitPrice"
              :min="0"
              :step="1000"
              controls-position="right"
              style="width: 100%"
              size="large"
              @change="calculateTotal"
            >
              <template #prefix>
                <component :is="PriceIcon" class="input-icon" />
              </template>
            </el-input-number>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="Giảm giá">
            <el-input-number
              v-model="form.discountAmount"
              :min="0"
              :max="(form.unitPrice || 0) * (form.quantity || 1)"
              :step="1000"
              controls-position="right"
              style="width: 100%"
              size="large"
              @change="calculateTotal"
            >
              <template #prefix>
                <component :is="DiscountIcon" class="input-icon" />
              </template>
            </el-input-number>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="Thành tiền">
            <div class="total-amount">
              <component :is="MoneyIcon" class="money-icon" />
              <span class="amount-value">{{ formatCurrency(lineTotal) }}</span>
            </div>
          </el-form-item>
        </el-col>
      </el-row>

      <div class="section-divider">
        <component :is="ToothIcon" class="section-icon" />
        <span class="section-title">Thông tin nha khoa</span>
      </div>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="Số răng">
            <el-input
              v-model="form.toothNo"
              placeholder="VD: 11, 21, 36"
              size="large"
            >
              <template #prefix>
                <component :is="ToothNumberIcon" class="input-icon" />
              </template>
            </el-input>
            <div class="hint-text">
              Số răng theo hệ thống FDI (11-18, 21-28, 31-38, 41-48)
            </div>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="Mặt răng">
            <el-select
              v-model="form.toothSurface"
              placeholder="Chọn mặt răng"
              clearable
              style="width: 100%"
              size="large"
            >
              <template #prefix>
                <component :is="ToothSurfaceIcon" class="input-icon" />
              </template>
              <el-option label="M - Mặt gần" value="M" />
              <el-option label="D - Mặt xa" value="D" />
              <el-option label="O - Mặt nhai" value="O" />
              <el-option label="B - Mặt má" value="B" />
              <el-option label="L - Mặt lưỡi" value="L" />
              <el-option label="MOD - 3 mặt" value="MOD" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="Ghi chú">
        <el-input
          v-model="form.note"
          type="textarea"
          :rows="3"
          placeholder="Nhập ghi chú cho dịch vụ điều trị"
          size="large"
        >
          <template #prefix>
            <component :is="NoteIcon" class="input-icon" />
          </template>
        </el-input>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <button @click="handleClose" class="cancel-button">
          <component :is="CloseIcon" />
          <span>Hủy</span>
        </button>
        <button @click="handleConfirm" class="submit-button">
          <component :is="AddIcon" />
          <span>Thêm</span>
        </button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, h } from "vue";
import { serviceApi } from "@/api/service";
import type { ServiceCatalog } from "@/types/service";
import type { CreateTreatmentItemRequest } from "@/types/treatmentPlan";
import type { FormInstance, FormRules } from "element-plus";

// Custom Icons
const ServiceIcon = () =>
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
        width: "18",
        height: "18",
        x: "3",
        y: "3",
        rx: "2",
        ry: "2",
      }),
      h("line", { x1: "3", x2: "21", y1: "9", y2: "9" }),
      h("line", { x1: "9", x2: "9", y1: "21", y2: "9" }),
    ],
  );

const QuantityIcon = () =>
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
      h("path", { d: "M3 3h7v7H3z" }),
      h("path", { d: "M14 3h7v7h-7z" }),
      h("path", { d: "M14 14h7v7h-7z" }),
      h("path", { d: "M3 14h7v7H3z" }),
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
      h("line", { x1: "12", x2: "12", y1: "2", y2: "22" }),
      h("path", { d: "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" }),
    ],
  );

const DiscountIcon = () =>
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
      h("path", { d: "M21.801 10A10 10 0 1 1 17 3.335" }),
      h("path", { d: "m9 11 3 3L22 4" }),
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
    },
    [
      h("circle", { cx: "12", cy: "12", r: "8" }),
      h("line", { x1: "12", x2: "12", y1: "2", y2: "6" }),
      h("line", { x1: "12", x2: "12", y1: "18", y2: "22" }),
      h("path", { d: "M9 9.5a3 3 0 1 1 3 3h-3v3h6" }),
    ],
  );

const ToothIcon = () =>
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
        d: "M12 2a5 5 0 0 1 5 5v3a5 5 0 0 1-5 5 5 5 0 0 1-5-5V7a5 5 0 0 1 5-5z",
      }),
      h("path", { d: "M9 15v5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-5" }),
    ],
  );

const ToothNumberIcon = () =>
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
        width: "16",
        height: "20",
        x: "4",
        y: "2",
        rx: "2",
        ry: "2",
      }),
      h("line", { x1: "9", x2: "15", y1: "10", y2: "10" }),
      h("line", { x1: "12", x2: "12", y1: "7", y2: "13" }),
    ],
  );

const ToothSurfaceIcon = () =>
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
      h("path", { d: "M3 7V5a2 2 0 0 1 2-2h2" }),
      h("path", { d: "M17 3h2a2 2 0 0 1 2 2v2" }),
      h("path", { d: "M21 17v2a2 2 0 0 1-2 2h-2" }),
      h("path", { d: "M7 21H5a2 2 0 0 1-2-2v-2" }),
      h("rect", { width: "10", height: "10", x: "7", y: "7", rx: "1" }),
    ],
  );

const NoteIcon = () =>
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
        d: "M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z",
      }),
      h("polyline", { points: "14 2 14 8 20 8" }),
      h("line", { x1: "16", x2: "8", y1: "13", y2: "13" }),
      h("line", { x1: "16", x2: "8", y1: "17", y2: "17" }),
      h("line", { x1: "10", x2: "8", y1: "9", y2: "9" }),
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
    [h("path", { d: "M18 6 6 18" }), h("path", { d: "m6 6 12 12" })],
  );

const AddIcon = () =>
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
    [h("path", { d: "M5 12h14" }), h("path", { d: "M12 5v14" })],
  );

interface Props {
  modelValue: boolean;
  item?: CreateTreatmentItemRequest | null;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "confirm", item: any): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const formRef = ref<FormInstance>();
const serviceLoading = ref(false);
const serviceOptions = ref<ServiceCatalog[]>([]);
const selectedService = ref<ServiceCatalog | null>(null);

const form = reactive<
  CreateTreatmentItemRequest & {
    serviceCode?: string;
    itemName?: string;
  }
>({
  serviceId: "",
  quantity: 1,
  unitPrice: 0,
  discountAmount: 0,
  toothNo: "",
  toothSurface: "",
  note: "",
});

const rules: FormRules = {
  serviceId: [
    { required: true, message: "Vui lòng chọn dịch vụ", trigger: "change" },
  ],
  quantity: [
    { required: true, message: "Vui lòng nhập số lượng", trigger: "blur" },
  ],
  unitPrice: [
    { required: true, message: "Vui lòng nhập đơn giá", trigger: "blur" },
  ],
};

const lineTotal = computed(() => {
  const subtotal = (form.unitPrice || 0) * (form.quantity || 1);
  return subtotal - (form.discountAmount || 0);
});

// Search services with keyword (remote search)
const searchServices = async (keyword: string) => {
  if (!keyword) return;

  try {
    serviceLoading.value = true;
    const response = await serviceApi.search({
      keyword,
      active: true,
      page: 0,
      size: 20,
    });
    serviceOptions.value = response.content || [];
  } catch (error) {
    console.error("Failed to search services:", error);
  } finally {
    serviceLoading.value = false;
  }
};

// Load initial services when focus (empty search)
const handleServiceFocus = async () => {
  if (serviceOptions.value.length === 0) {
    try {
      serviceLoading.value = true;
      const response = await serviceApi.search({
        active: true,
        page: 0,
        size: 20,
      });
      serviceOptions.value = response.content || [];
    } catch (error) {
      console.error("Failed to load services:", error);
    } finally {
      serviceLoading.value = false;
    }
  }
};

const handleServiceChange = (serviceId: string) => {
  selectedService.value =
    serviceOptions.value.find((s) => s.id === serviceId) || null;

  if (selectedService.value) {
    form.serviceCode = selectedService.value.code;
    form.itemName = selectedService.value.name;
    form.unitPrice = selectedService.value.basePrice;
    form.discountAmount = 0;
    calculateTotal();
  }
};

const calculateTotal = () => {
  // Total is computed automatically
};

const handleConfirm = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();

    emit("confirm", {
      ...form,
      lineTotal: lineTotal.value,
    });

    handleClose();
  } catch (error) {
    console.error("Validation failed:", error);
  }
};

const handleClose = () => {
  visible.value = false;
  formRef.value?.resetFields();
  selectedService.value = null;
  serviceOptions.value = []; // Clear for next search
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};
</script>

<style scoped lang="scss">
.modern-item-dialog {
  :deep(.el-dialog) {
    border-radius: 16px;
    overflow: hidden;
  }

  .dialog-header {
    display: flex;
    align-items: center;
    gap: 12px;
    background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
    padding: 20px 24px;
    color: white;

    .header-icon {
      width: 24px;
      height: 24px;
      color: white;
    }

    .header-title {
      font-size: 18px;
      font-weight: 700;
      color: white;
      margin: 0;
    }
  }

  :deep(.el-dialog__body) {
    padding: 24px;
    background: #f9fafb;
  }

  :deep(.el-dialog__footer) {
    padding: 16px 24px;
    background: #f9fafb;
    border-top: 1px solid #e5e7eb;
  }
}

.modern-form {
  :deep(.el-form-item__label) {
    font-weight: 500;
    color: #374151;
  }

  :deep(.el-input__wrapper) {
    border-radius: 10px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 2px 4px rgba(20, 184, 166, 0.1);
    }

    &.is-focus {
      box-shadow: 0 0 0 2px rgba(20, 184, 166, 0.2);
    }
  }

  :deep(.el-select .el-input__wrapper) {
    border-radius: 10px;
  }

  :deep(.el-textarea__inner) {
    border-radius: 10px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

    &:hover {
      box-shadow: 0 2px 4px rgba(20, 184, 166, 0.1);
    }

    &:focus {
      box-shadow: 0 0 0 2px rgba(20, 184, 166, 0.2);
    }
  }

  :deep(.el-input-number) {
    width: 100%;

    .el-input__wrapper {
      border-radius: 10px;
    }
  }
}

.input-icon {
  width: 16px;
  height: 16px;
  color: #9ca3af;
  margin-right: 8px;
}

.total-amount {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%);
  border: 2px solid #14b8a6;
  border-radius: 10px;
  min-height: 48px;

  .money-icon {
    width: 24px;
    height: 24px;
    color: #059669;
  }

  .amount-value {
    font-size: 16px;
    font-weight: 700;
    color: #059669;
  }
}

.section-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 24px 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid #e5e7eb;

  .section-icon {
    width: 22px;
    height: 22px;
    color: #14b8a6;
  }

  .section-title {
    font-size: 15px;
    font-weight: 600;
    color: #111827;
  }
}

.hint-text {
  font-size: 12px;
  color: #6b7280;
  margin-top: 6px;
  line-height: 1.4;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;

  button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 24px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;

    svg {
      width: 18px;
      height: 18px;
    }

    &.cancel-button {
      background: white;
      color: #6b7280;
      border: 1px solid #e5e7eb;

      &:hover {
        background: #f9fafb;
        border-color: #d1d5db;
        color: #374151;
      }

      &:active {
        background: #f3f4f6;
      }
    }

    &.submit-button {
      background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(20, 184, 166, 0.4);
      }

      &:active {
        transform: translateY(0);
      }
    }
  }
}
</style>

<style scoped>
:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-input-number .el-input__inner) {
  text-align: right;
}
</style>
