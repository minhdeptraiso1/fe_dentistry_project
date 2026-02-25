<template>
  <el-dialog
    v-model="visible"
    title="Đặt giá bán"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="mb-4">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="Tên thuốc">
          {{ medicine?.name }}
        </el-descriptions-item>
        <el-descriptions-item label="Mã thuốc">
          {{ medicine?.code }}
        </el-descriptions-item>
        <el-descriptions-item label="Giá hiện tại">
          <span v-if="medicine?.salePrice" class="text-green-600 font-semibold">
            {{ formatCurrency(medicine.salePrice) }}
          </span>
          <span v-else class="text-gray-400">Chưa có giá</span>
        </el-descriptions-item>
      </el-descriptions>
    </div>

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
        />
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

    <template #footer>
      <el-button @click="handleClose">Hủy</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        Lưu giá
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { ElMessage } from "element-plus";
import { medicineApi } from "@/api/medicine";
import type { Medicine } from "@/types/medicine";
import type { FormInstance, FormRules } from "element-plus";

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
