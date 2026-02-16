<template>
  <el-dialog
    v-model="visible"
    title="Thêm thanh toán"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <!-- Invoice Info -->
    <el-descriptions v-if="props.invoice" :column="2" border class="mb-4">
      <el-descriptions-item label="Mã hóa đơn">
        {{ props.invoice.invoiceCode }}
      </el-descriptions-item>
      <el-descriptions-item label="Bệnh nhân">
        {{ props.invoice.patientName }}
      </el-descriptions-item>
      <el-descriptions-item label="Tổng tiền">
        <span class="font-semibold">{{
          formatCurrency(props.invoice.totalAmount)
        }}</span>
      </el-descriptions-item>
      <el-descriptions-item label="Đã thanh toán">
        <span class="text-green-600">{{
          formatCurrency(props.invoice.paidAmount)
        }}</span>
      </el-descriptions-item>
      <el-descriptions-item label="Còn lại">
        <span class="text-red-600 font-semibold text-lg">{{
          formatCurrency(remainingAmount)
        }}</span>
      </el-descriptions-item>
    </el-descriptions>

    <!-- Payment Form -->
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="140px"
      label-position="left"
    >
      <el-form-item label="Phương thức" prop="method">
        <el-select
          v-model="form.method"
          placeholder="Chọn phương thức"
          style="width: 100%"
        >
          <el-option label="Tiền mặt" value="CASH">
            <span class="flex items-center">
              <el-icon class="mr-2"><Money /></el-icon>
              Tiền mặt
            </span>
          </el-option>
          <el-option label="Chuyển khoản" value="TRANSFER">
            <span class="flex items-center">
              <el-icon class="mr-2"><CreditCard /></el-icon>
              Chuyển khoản
            </span>
          </el-option>
          <el-option label="Thẻ" value="CARD">
            <span class="flex items-center">
              <el-icon class="mr-2"><Postcard /></el-icon>
              Thẻ
            </span>
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="Số tiền" prop="amount">
        <el-input-number
          v-model="form.amount"
          :min="1"
          :max="remainingAmount"
          :precision="0"
          :controls="false"
          style="width: 100%"
        />
        <el-button
          class="mt-2"
          size="small"
          @click="form.amount = remainingAmount"
        >
          Thanh toán hết
        </el-button>
      </el-form-item>

      <el-form-item label="Mã tham chiếu" prop="reference">
        <el-input
          v-model="form.reference"
          placeholder="Mã giao dịch, số chứng từ..."
          clearable
        />
      </el-form-item>

      <el-form-item label="Ghi chú" prop="note">
        <el-input
          v-model="form.note"
          type="textarea"
          :rows="3"
          placeholder="Nhập ghi chú..."
          clearable
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">Hủy</el-button>
      <el-button type="primary" :loading="submitting" @click="handleConfirm">
        Xác nhận
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { ElMessage } from "element-plus";
import { Money, CreditCard, Postcard } from "@element-plus/icons-vue";
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
</script>
