<template>
  <el-dialog
    v-model="visible"
    :show-close="false"
    :close-on-click-modal="false"
    @close="handleClose"
    width="650px"
    class="modern-payment-dialog"
  >
    <template #header>
      <div class="dialog-header">
        <component :is="PaymentIconHeader" class="header-icon" />
        <span class="header-title">Thêm thanh toán</span>
      </div>
    </template>

    <!-- Invoice Info Cards -->
    <div v-if="props.invoice" class="info-cards">
      <div class="info-card">
        <div class="card-label">
          <component :is="InvoiceIcon" class="label-icon" />
          <span>Mã hóa đơn</span>
        </div>
        <div class="card-value">{{ props.invoice.invoiceCode }}</div>
      </div>

      <div class="info-card">
        <div class="card-label">
          <component :is="PatientIcon" class="label-icon" />
          <span>Bệnh nhân</span>
        </div>
        <div class="card-value">{{ props.invoice.patientName }}</div>
      </div>

      <div class="info-card highlight">
        <div class="card-label">
          <component :is="MoneyIcon" class="label-icon" />
          <span>Tổng tiền</span>
        </div>
        <div class="card-value total">
          {{ formatCurrency(props.invoice.totalAmount) }}
        </div>
      </div>

      <div class="info-card success">
        <div class="card-label">
          <component :is="PaidIcon" class="label-icon" />
          <span>Đã thanh toán</span>
        </div>
        <div class="card-value paid">
          {{ formatCurrency(props.invoice.paidAmount) }}
        </div>
      </div>

      <div class="info-card danger">
        <div class="card-label">
          <component :is="RemainingIcon" class="label-icon" />
          <span>Còn lại</span>
        </div>
        <div class="card-value remaining">
          {{ formatCurrency(remainingAmount) }}
        </div>
      </div>
    </div>

    <!-- Payment Form -->
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      class="modern-form"
    >
      <el-form-item label="Phương thức thanh toán" prop="method">
        <el-select
          v-model="form.method"
          placeholder="Chọn phương thức"
          size="large"
          style="width: 100%"
        >
          <template #prefix>
            <component :is="MethodIcon" class="input-icon" />
          </template>
          <el-option label="Tiền mặt" value="CASH">
            <div class="flex items-center gap-2">
              <component :is="CashIcon" class="option-icon" />
              <span>Tiền mặt</span>
            </div>
          </el-option>
          <el-option label="Chuyển khoản" value="TRANSFER">
            <div class="flex items-center gap-2">
              <component :is="TransferIcon" class="option-icon" />
              <span>Chuyển khoản</span>
            </div>
          </el-option>
          <el-option label="Thẻ" value="CARD">
            <div class="flex items-center gap-2">
              <component :is="CardIcon" class="option-icon" />
              <span>Thẻ</span>
            </div>
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="Số tiền thanh toán" prop="amount">
        <el-input
          v-model.number="form.amount"
          size="large"
          placeholder="Nhập số tiền"
        >
          <template #prefix>
            <component :is="AmountIcon" class="input-icon" />
          </template>
        </el-input>
        <button
          type="button"
          class="pay-all-button"
          @click="form.amount = remainingAmount"
        >
          Thanh toán hết
        </button>
      </el-form-item>

      <el-form-item label="Mã tham chiếu" prop="reference">
        <el-input
          v-model="form.reference"
          size="large"
          placeholder="Mã giao dịch, số chứng từ..."
          clearable
        >
          <template #prefix>
            <component :is="ReferenceIcon" class="input-icon" />
          </template>
        </el-input>
      </el-form-item>

      <el-form-item label="Ghi chú" prop="note">
        <el-input
          v-model="form.note"
          type="textarea"
          :rows="3"
          placeholder="Nhập ghi chú..."
          clearable
        >
          <template #prefix>
            <component :is="NoteIcon" class="input-icon" />
          </template>
        </el-input>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <button class="cancel-button" @click="handleClose">
          <component :is="CloseIcon" />
          <span>Hủy</span>
        </button>
        <button
          class="submit-button"
          :disabled="submitting"
          @click="handleConfirm"
        >
          <component :is="SaveIcon" />
          <span>{{ submitting ? "Đang xử lý..." : "Xác nhận" }}</span>
        </button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, h } from "vue";
import { ElMessage } from "element-plus";
import { invoiceApi } from "@/api/invoice";
import type { Invoice, PaymentMethod } from "@/types/invoice";
import type { FormInstance, FormRules } from "element-plus";

interface Props {
  modelValue: boolean;
  invoice: Invoice | null;
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

const remainingAmount = computed(() => {
  if (!props.invoice) return 0;
  return props.invoice.totalAmount - props.invoice.paidAmount;
});

const form = reactive<{
  method: PaymentMethod | "";
  amount: number;
  reference: string;
  note: string;
}>({
  method: "",
  amount: 0,
  reference: "",
  note: "",
});

const rules: FormRules = {
  method: [
    {
      required: true,
      message: "Vui lòng chọn phương thức thanh toán",
      trigger: "change",
    },
  ],
  amount: [
    { required: true, message: "Vui lòng nhập số tiền", trigger: "blur" },
    {
      type: "number",
      min: 1,
      message: "Số tiền phải lớn hơn 0",
      trigger: "blur",
    },
  ],
};

// Set default amount to remaining when dialog opens
if (props.invoice) {
  form.amount = remainingAmount.value;
}

const handleConfirm = async () => {
  if (!formRef.value || !props.invoice) return;

  try {
    await formRef.value.validate();

    submitting.value = true;

    await invoiceApi.addPayment(props.invoice.id, {
      method: form.method as PaymentMethod,
      amount: form.amount,
      reference: form.reference || undefined,
      note: form.note || undefined,
    });

    ElMessage.success("Thêm thanh toán thành công");
    emit("success");
    handleClose();
  } catch (error) {
    console.error("Failed to add payment:", error);
    ElMessage.error("Thêm thanh toán thất bại");
  } finally {
    submitting.value = false;
  }
};

const handleClose = () => {
  visible.value = false;
  formRef.value?.resetFields();
  form.method = "";
  form.amount = 0;
  form.reference = "";
  form.note = "";
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

// Custom Icons
const PaymentIconHeader = h("svg", {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  width: "28",
  height: "28",
  innerHTML: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>`,
});

const InvoiceIcon = h("svg", {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  width: "16",
  height: "16",
  innerHTML: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>`,
});

const PatientIcon = h("svg", {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  width: "16",
  height: "16",
  innerHTML: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>`,
});

const MoneyIcon = h("svg", {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  width: "16",
  height: "16",
  innerHTML: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>`,
});

const PaidIcon = h("svg", {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  width: "16",
  height: "16",
  innerHTML: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>`,
});

const RemainingIcon = h("svg", {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  width: "16",
  height: "16",
  innerHTML: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>`,
});

const MethodIcon = h("svg", {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  width: "16",
  height: "16",
  innerHTML: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>`,
});

const CashIcon = h("svg", {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  width: "18",
  height: "18",
  innerHTML: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>`,
});

const TransferIcon = h("svg", {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  width: "18",
  height: "18",
  innerHTML: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>`,
});

const CardIcon = h("svg", {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  width: "18",
  height: "18",
  innerHTML: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>`,
});

const AmountIcon = h("svg", {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  width: "16",
  height: "16",
  innerHTML: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>`,
});

const ReferenceIcon = h("svg", {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  width: "16",
  height: "16",
  innerHTML: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"/>`,
});

const NoteIcon = h("svg", {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  width: "16",
  height: "16",
  innerHTML: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>`,
});

const CloseIcon = h("svg", {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  width: "18",
  height: "18",
  innerHTML: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>`,
});

const SaveIcon = h("svg", {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  width: "18",
  height: "18",
  innerHTML: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>`,
});
</script>

<style scoped lang="scss">
.modern-payment-dialog {
  :deep(.el-dialog__header) {
    padding: 0;
    margin: 0;
  }

  :deep(.el-dialog__body) {
    padding: 24px;
  }

  :deep(.el-dialog__footer) {
    padding: 0;
  }

  .dialog-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 24px;
    background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
    border-radius: 8px 8px 0 0;

    .header-icon {
      width: 28px;
      height: 28px;
      color: white;
    }

    .header-title {
      font-size: 20px;
      font-weight: 700;
      color: white;
    }
  }

  // Info Cards
  .info-cards {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 24px;

    .info-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 16px;
      transition: all 0.3s ease;

      &:hover {
        border-color: #14b8a6;
        box-shadow: 0 4px 12px rgba(20, 184, 166, 0.1);
      }

      &.highlight {
        background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
        border-color: #93c5fd;

        .card-value {
          color: #2563eb;
        }
      }

      &.success {
        background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        border-color: #86efac;

        .card-value.paid {
          color: #16a34a;
        }
      }

      &.danger {
        background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
        border-color: #fca5a5;
        grid-column: 1 / -1;

        .card-value.remaining {
          color: #dc2626;
          font-size: 22px;
        }
      }

      .card-label {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #6b7280;
        font-size: 13px;
        font-weight: 500;
        margin-bottom: 8px;

        .label-icon {
          width: 16px;
          height: 16px;
        }
      }

      .card-value {
        font-size: 16px;
        font-weight: 600;
        color: #1f2937;
        padding-left: 24px;

        &.total {
          font-size: 18px;
        }

        &.paid {
          font-size: 18px;
        }

        &.remaining {
          font-size: 20px;
          font-weight: 700;
        }
      }
    }
  }

  // Modern Form
  .modern-form {
    :deep(.el-form-item__label) {
      font-weight: 600;
      color: #374151;
      margin-bottom: 8px;
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

    :deep(.el-textarea__inner) {
      border-radius: 10px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 2px 4px rgba(20, 184, 166, 0.1);
      }

      &:focus {
        box-shadow: 0 0 0 2px rgba(20, 184, 166, 0.2);
      }
    }

    .input-icon {
      width: 16px;
      height: 16px;
      color: #9ca3af;
    }

    .option-icon {
      width: 18px;
      height: 18px;
      color: #14b8a6;
    }

    .pay-all-button {
      margin-top: 8px;
      padding: 6px 16px;
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
      border: 1px solid #14b8a6;
      border-radius: 8px;
      color: #14b8a6;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
        color: white;
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(20, 184, 166, 0.3);
      }

      &:active {
        transform: translateY(0);
      }
    }
  }

  // Dialog Footer
  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 20px 24px;
    background: #f9fafb;
    border-radius: 0 0 8px 8px;

    button {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 24px;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 500;
      border: none;
      cursor: pointer;
      transition: all 0.3s ease;

      svg {
        width: 18px;
        height: 18px;
      }

      &:hover {
        transform: translateY(-2px);
      }

      &:active {
        transform: translateY(0);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
      }
    }

    .cancel-button {
      background: white;
      color: #6b7280;
      border: 1px solid #e5e7eb;

      &:hover {
        background: #f9fafb;
        border-color: #d1d5db;
        color: #374151;
      }
    }

    .submit-button {
      background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);

      &:hover {
        box-shadow: 0 6px 20px rgba(20, 184, 166, 0.4);
      }

      &:disabled {
        box-shadow: none;
      }
    }
  }
}
</style>
