<template>
  <el-dialog
    v-model="visible"
    width="700px"
    :close-on-click-modal="false"
    :show-close="false"
    custom-class="modern-item-dialog"
    @close="handleClose"
  >
    <template #header>
      <div class="dialog-header">
        <component :is="ServiceIcon" />
        <h3>Thêm dịch vụ</h3>
      </div>
    </template>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      size="large"
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
          :prefix-icon="ServiceIconPrefix"
          @change="handleServiceChange"
          @focus="handleServiceFocus"
        >
          <el-option
            v-for="service in serviceOptions"
            :key="service.id"
            :label="`${service.code} - ${service.name}`"
            :value="service.id"
          >
            <div
              style="
                display: flex;
                justify-content: space-between;
                align-items: center;
              "
            >
              <span>{{ service.code }} - {{ service.name }}</span>
              <span style="font-size: 13px; color: #6b7280">
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
              :prefix-icon="QuantityIcon"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="Đơn giá" prop="unitPrice">
            <el-input-number
              v-model="form.unitPrice"
              :min="0"
              :precision="0"
              :controls="false"
              :prefix-icon="PriceIcon"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="Giảm giá">
        <el-input-number
          v-model="form.discountAmount"
          :min="0"
          :max="(form.unitPrice || 0) * (form.quantity || 1)"
          :precision="0"
          :controls="false"
          :prefix-icon="DiscountIcon"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="Ghi chú">
        <el-input
          v-model="form.note"
          type="textarea"
          :rows="3"
          :prefix-icon="NoteIcon"
          placeholder="Nhập ghi chú..."
        />
      </el-form-item>

      <!-- Summary Card -->
      <div class="summary-card">
        <div class="summary-row">
          <span class="label">Thành tiền:</span>
          <span class="value">{{ formatCurrency(lineTotal) }}</span>
        </div>
      </div>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <button class="cancel-button" @click="handleClose">
          <component :is="CloseIcon" />
          <span>Hủy</span>
        </button>
        <button class="submit-button" @click="handleConfirm">
          <component :is="PlusIcon" />
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
import type { CreateInvoiceItemRequest } from "@/types/invoice";
import type { FormInstance, FormRules } from "element-plus";

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "confirm", item: CreateInvoiceItemRequest): void;
}

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<Emits>();

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const formRef = ref<FormInstance>();
const serviceLoading = ref(false);
const serviceOptions = ref<ServiceCatalog[]>([]);
const selectedService = ref<ServiceCatalog | null>(null);

const form = reactive<CreateInvoiceItemRequest & { serviceCode?: string }>({
  serviceId: undefined,
  itemName: "",
  serviceCode: "",
  serviceType: "",
  quantity: 1,
  unitPrice: 0,
  discountAmount: 0,
  note: "",
});

const rules: FormRules = {
  serviceId: [
    { required: true, message: "Vui lòng chọn dịch vụ", trigger: "change" },
  ],
  itemName: [
    { required: true, message: "Vui lòng nhập tên dịch vụ", trigger: "blur" },
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

// Search services with keyword
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

// Load initial services when focus
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
    form.serviceType = selectedService.value.type;
    form.unitPrice = selectedService.value.basePrice;
    form.discountAmount = 0;
  }
};

const handleConfirm = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();

    emit("confirm", {
      serviceId: form.serviceId,
      itemName: form.itemName,
      serviceCode: form.serviceCode,
      serviceType: form.serviceType,
      quantity: form.quantity,
      unitPrice: form.unitPrice,
      discountAmount: form.discountAmount,
      note: form.note,
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
  serviceOptions.value = [];
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

// Custom SVG Icons
const ServiceIcon = h(
  "svg",
  {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    style: { width: "20px", height: "20px" },
  },
  [
    h("path", {
      d: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
    }),
    h("polyline", { points: "3.27 6.96 12 12.01 20.73 6.96" }),
    h("line", { x1: "12", y1: "22.08", x2: "12", y2: "12" }),
  ],
);

const ServiceIconPrefix = h(
  "svg",
  {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    style: { width: "18px", height: "18px" },
  },
  [
    h("path", {
      d: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
    }),
    h("polyline", { points: "3.27 6.96 12 12.01 20.73 6.96" }),
    h("line", { x1: "12", y1: "22.08", x2: "12", y2: "12" }),
  ],
);

const QuantityIcon = h(
  "svg",
  {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    style: { width: "18px", height: "18px" },
  },
  [
    h("line", { x1: "8", y1: "6", x2: "21", y2: "6" }),
    h("line", { x1: "8", y1: "12", x2: "21", y2: "12" }),
    h("line", { x1: "8", y1: "18", x2: "21", y2: "18" }),
    h("line", { x1: "3", y1: "6", x2: "3.01", y2: "6" }),
    h("line", { x1: "3", y1: "12", x2: "3.01", y2: "12" }),
    h("line", { x1: "3", y1: "18", x2: "3.01", y2: "18" }),
  ],
);

const PriceIcon = h(
  "svg",
  {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    style: { width: "18px", height: "18px" },
  },
  [
    h("line", { x1: "12", y1: "1", x2: "12", y2: "23" }),
    h("path", { d: "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" }),
  ],
);

const DiscountIcon = h(
  "svg",
  {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    style: { width: "18px", height: "18px" },
  },
  [
    h("circle", { cx: "12", cy: "12", r: "10" }),
    h("line", { x1: "15", y1: "9", x2: "9", y2: "15" }),
    h("circle", { cx: "9", cy: "9", r: "0.5", fill: "currentColor" }),
    h("circle", { cx: "15", cy: "15", r: "0.5", fill: "currentColor" }),
  ],
);

const NoteIcon = h(
  "svg",
  {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    style: { width: "18px", height: "18px" },
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

const PlusIcon = h(
  "svg",
  {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    style: { width: "16px", height: "16px" },
  },
  [
    h("line", { x1: "12", y1: "5", x2: "12", y2: "19" }),
    h("line", { x1: "5", y1: "12", x2: "19", y2: "12" }),
  ],
);

const CloseIcon = h(
  "svg",
  {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    style: { width: "16px", height: "16px" },
  },
  [
    h("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
    h("line", { x1: "6", y1: "6", x2: "18", y2: "18" }),
  ],
);
</script>

<style scoped lang="scss">
.modern-item-dialog {
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
    max-height: 70vh;
    overflow-y: auto;
  }

  :deep(.el-dialog__footer) {
    padding: 20px 24px;
    border-top: 1px solid #e5e7eb;
  }
}

.dialog-header {
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;

  svg {
    flex-shrink: 0;
  }

  h3 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
  }
}

.modern-form {
  display: flex;
  flex-direction: column;
  gap: 20px;

  :deep(.el-form-item__label) {
    font-weight: 500;
    color: #374151;
    margin-bottom: 8px;
  }

  :deep(.el-select),
  :deep(.el-input-number) {
    width: 100%;
  }

  :deep(.el-input__wrapper) {
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    padding: 0 16px;
    transition: all 0.2s;

    &:hover {
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    &.is-focus {
      box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
    }
  }

  :deep(.el-input__inner) {
    height: 42px;
  }

  :deep(.el-input-number__decrease),
  :deep(.el-input-number__increase) {
    background: #f3f4f6;
    border-radius: 6px;

    &:hover {
      color: #14b8a6;
      background: #ccfbf1;
    }
  }

  :deep(.el-textarea__inner) {
    border-radius: 8px;
    padding: 12px 16px;
    min-height: 80px !important;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    transition: all 0.2s;

    &:hover {
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    &:focus {
      box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
    }
  }
}

.summary-card {
  margin-top: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%);
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  .summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 18px;

    .label {
      color: #0f766e;
      font-weight: 600;
    }

    .value {
      color: #059669;
      font-weight: 700;
      font-size: 24px;
    }
  }
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
    border: none;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;

    svg {
      width: 16px;
      height: 16px;
    }

    &.cancel-button {
      background: white;
      color: #6b7280;
      border: 1px solid #d1d5db;

      &:hover {
        background: #f9fafb;
        border-color: #9ca3af;
      }
    }

    &.submit-button {
      background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
      color: white;
      box-shadow: 0 2px 4px rgba(20, 184, 166, 0.3);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(20, 184, 166, 0.4);
      }
    }
  }
}
</style>
