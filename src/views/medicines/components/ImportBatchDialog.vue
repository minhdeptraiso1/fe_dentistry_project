<template>
  <el-dialog
    v-model="visible"
    title="Nhập lô thuốc"
    width="700px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="mb-4">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="Tên thuốc">
          {{ medicine?.name }}
        </el-descriptions-item>
        <el-descriptions-item label="Mã thuốc">
          {{ medicine?.code }}
        </el-descriptions-item>
        <el-descriptions-item label="Đơn vị">
          {{ medicine?.unit || "N/A" }}
        </el-descriptions-item>
        <el-descriptions-item label="Giá bán">
          <span v-if="medicine?.salePrice" class="text-green-600">
            {{ formatCurrency(medicine.salePrice) }}
          </span>
          <span v-else class="text-gray-400">Chưa có</span>
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
      <el-form-item label="Số lô" prop="batchNo">
        <el-input v-model="form.batchNo" placeholder="Nhập số lô (tùy chọn)" />
      </el-form-item>

      <el-form-item label="Ngày nhập" prop="importDate">
        <el-date-picker
          v-model="form.importDate"
          type="date"
          placeholder="Chọn ngày nhập"
          style="width: 100%"
          format="DD/MM/YYYY"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>

      <el-form-item label="Ngày hết hạn" prop="expiryDate">
        <el-date-picker
          v-model="form.expiryDate"
          type="date"
          placeholder="Chọn ngày hết hạn (tùy chọn)"
          style="width: 100%"
          format="DD/MM/YYYY"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>

      <el-form-item label="Giá nhập" prop="importPrice">
        <el-input-number
          v-model="form.importPrice"
          :min="0"
          :precision="0"
          :controls="false"
          style="width: 100%"
          placeholder="Nhập giá nhập"
        />
      </el-form-item>

      <el-form-item label="Số lượng" prop="quantityIn">
        <el-input-number
          v-model="form.quantityIn"
          :min="1"
          :precision="0"
          :controls="false"
          style="width: 100%"
          placeholder="Nhập số lượng"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">Hủy</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        Nhập lô
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
