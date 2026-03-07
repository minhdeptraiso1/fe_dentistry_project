<template>
  <el-dialog
    v-model="visible"
    width="600px"
    :show-close="false"
    :close-on-click-modal="false"
    @close="handleClose"
    class="expense-form-dialog"
  >
    <template #header>
      <div class="dialog-header">
        <component :is="ExpenseIcon" class="header-icon" />
        <span class="header-title">
          {{ isEdit ? "Cập nhật chi phí" : "Thêm chi phí mới" }}
        </span>
      </div>
    </template>
    <el-form ref="formRef" :model="form" :rules="rules">
      <div class="form-group">
        <label class="form-label">
          <span class="required">*</span> Danh mục
        </label>
        <el-form-item prop="category">
          <el-select
            v-model="form.category"
            placeholder="Chọn danh mục"
            style="width: 100%"
          >
            <el-option
              v-for="(label, key) in ExpenseCategoryLabels"
              :key="key"
              :label="label"
              :value="key"
            />
          </el-select>
        </el-form-item>
      </div>

      <div class="form-group">
        <label class="form-label">
          <span class="required">*</span> Tên chi phí
        </label>
        <el-form-item prop="name">
          <el-input
            v-model="form.name"
            placeholder="Nhập tên chi phí"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </div>

      <div class="form-group">
        <label class="form-label">
          <span class="required">*</span> Số tiền
        </label>
        <el-form-item prop="amount">
          <el-input-number
            v-model="form.amount"
            :min="0"
            :max="999999999"
            :precision="0"
            :step="1000"
            :controls="true"
            style="width: 100%"
            placeholder="Nhập số tiền"
          />
        </el-form-item>
      </div>

      <div class="form-group">
        <label class="form-label">
          <span class="required">*</span> Ngày chi
        </label>
        <el-form-item prop="expenseDate">
          <el-date-picker
            v-model="form.expenseDate"
            type="date"
            placeholder="Chọn ngày chi"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
      </div>

      <div class="form-group">
        <label class="form-label">Ghi chú</label>
        <el-form-item prop="note">
          <el-input
            v-model="form.note"
            type="textarea"
            :rows="3"
            placeholder="Nhập ghi chú (tùy chọn)"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </div>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <button @click="handleClose" class="footer-button cancel-button">
          <component :is="XIcon" />
          <span>Hủy</span>
        </button>
        <button
          @click="handleSubmit"
          :disabled="loading"
          class="footer-button submit-button"
        >
          <component :is="loading ? LoadingIcon : CheckIcon" />
          <span>{{
            loading
              ? isEdit
                ? "Đang cập nhật..."
                : "Đang tạo..."
              : isEdit
                ? "Cập nhật"
                : "Tạo mới"
          }}</span>
        </button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, h } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import { expenseApi } from "@/api/expense";
import {
  type Expense,
  type CreateExpenseRequest,
  type UpdateExpenseRequest,
  ExpenseCategory,
  ExpenseCategoryLabels,
} from "@/types/expense";

// Custom Icons
const ExpenseIcon = () =>
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
      h("line", { x1: "12", y1: "1", x2: "12", y2: "23" }),
      h("path", { d: "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" }),
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
  expense?: Expense | null;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "success"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const formRef = ref<FormInstance>();
const loading = ref(false);

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const isEdit = computed(() => !!props.expense);

const form = reactive<CreateExpenseRequest>({
  category: ExpenseCategory.OTHER,
  name: "",
  amount: 0,
  expenseDate: new Date().toISOString().split("T")[0] as string,
  note: "",
});

const rules: FormRules = {
  category: [
    { required: true, message: "Vui lòng chọn danh mục", trigger: "change" },
  ],
  name: [
    { required: true, message: "Vui lòng nhập tên chi phí", trigger: "blur" },
    {
      min: 2,
      max: 200,
      message: "Tên chi phí phải từ 2-200 ký tự",
      trigger: "blur",
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
  expenseDate: [
    { required: true, message: "Vui lòng chọn ngày chi", trigger: "change" },
  ],
};

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      if (props.expense) {
        // Edit mode
        form.category = props.expense.category;
        form.name = props.expense.name;
        form.amount = props.expense.amount;
        form.expenseDate = props.expense.expenseDate;
        form.note = props.expense.note || "";
      } else {
        // Create mode - reset form
        resetForm();
      }
    }
  },
);

const resetForm = () => {
  form.category = ExpenseCategory.OTHER;
  form.name = "";
  form.amount = 0;
  form.expenseDate = new Date().toISOString().split("T")[0] as string;
  form.note = "";
  formRef.value?.clearValidate();
};

const handleClose = () => {
  visible.value = false;
  resetForm();
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    loading.value = true;

    if (isEdit.value && props.expense) {
      // Update expense
      const updateData: UpdateExpenseRequest = {
        category: form.category,
        name: form.name,
        amount: form.amount,
        expenseDate: form.expenseDate,
        note: form.note || undefined,
      };
      await expenseApi.update(props.expense.id, updateData);
      ElMessage.success("Cập nhật chi phí thành công");
    } else {
      // Create expense
      const createData: CreateExpenseRequest = {
        category: form.category,
        name: form.name,
        amount: form.amount,
        expenseDate: form.expenseDate,
        note: form.note || undefined,
      };
      await expenseApi.create(createData);
      ElMessage.success("Thêm chi phí thành công");
    }

    emit("success");
    handleClose();
  } catch (error: any) {
    if (error?.message) {
      ElMessage.error(error.message);
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped lang="scss">
.expense-form-dialog {
  :deep(.el-dialog__header) {
    padding: 0;
  }

  :deep(.el-dialog__body) {
    padding: 24px;
  }

  :deep(.el-dialog__footer) {
    padding: 0;
  }
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  color: white;

  .header-icon {
    width: 48px;
    height: 48px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    svg {
      width: 24px;
      height: 24px;
      stroke: white;
    }
  }

  .header-title {
    font-size: 20px;
    font-weight: 700;
    color: white;
  }
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  color: #374151;
  font-weight: 500;
  margin-bottom: 8px;

  .required {
    color: #ef4444;
    margin-right: 4px;
  }
}

:deep(.el-form-item) {
  margin-bottom: 0;

  .el-form-item__content {
    margin-left: 0 !important;
    line-height: normal;
  }

  .el-form-item__error {
    padding-top: 4px;
  }
}

:deep(.el-input-number) {
  width: 100%;

  .el-input__inner {
    text-align: left;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  background: white;
  border-top: 1px solid #f3f4f6;

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
    border: 1px solid #d1d5db;

    &:hover:not(:disabled) {
      background: #f9fafb;
      border-color: #9ca3af;
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

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
