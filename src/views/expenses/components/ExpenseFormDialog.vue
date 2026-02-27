<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? 'Cập nhật chi phí' : 'Thêm chi phí mới'"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
      label-position="left"
    >
      <el-form-item label="Danh mục" prop="category">
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

      <el-form-item label="Tên chi phí" prop="name">
        <el-input
          v-model="form.name"
          placeholder="Nhập tên chi phí"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="Số tiền" prop="amount">
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

      <el-form-item label="Ngày chi" prop="expenseDate">
        <el-date-picker
          v-model="form.expenseDate"
          type="date"
          placeholder="Chọn ngày chi"
          format="DD/MM/YYYY"
          value-format="YYYY-MM-DD"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="Ghi chú" prop="note">
        <el-input
          v-model="form.note"
          type="textarea"
          :rows="3"
          placeholder="Nhập ghi chú (tùy chọn)"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">Hủy</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        {{ isEdit ? "Cập nhật" : "Tạo mới" }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import { expenseApi } from "@/api/expense";
import {
  type Expense,
  type CreateExpenseRequest,
  type UpdateExpenseRequest,
  ExpenseCategory,
  ExpenseCategoryLabels,
} from "@/types/expense";

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
:deep(.el-input-number) {
  width: 100%;

  .el-input__inner {
    text-align: left;
  }
}
</style>
