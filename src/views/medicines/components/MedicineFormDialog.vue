<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? 'Chi tiết thuốc' : 'Thêm thuốc mới'"
    :width="isEdit ? '900px' : '700px'"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="140px"
      label-position="left"
    >
      <el-form-item label="Tên thuốc" prop="name">
        <el-input
          v-model="form.name"
          placeholder="Nhập tên thuốc"
          :disabled="isEdit"
        />
      </el-form-item>

      <el-form-item label="Thành phần" prop="ingredient">
        <el-input
          v-model="form.ingredient"
          type="textarea"
          :rows="2"
          placeholder="Nhập thành phần"
          :disabled="isEdit"
        />
      </el-form-item>

      <el-form-item label="Đơn vị" prop="unit">
        <el-input
          v-model="form.unit"
          placeholder="VD: Viên, Hộp, Chai..."
          :disabled="isEdit"
        />
      </el-form-item>

      <el-form-item label="Hướng dẫn sử dụng" prop="usageGuide">
        <el-input
          v-model="form.usageGuide"
          type="textarea"
          :rows="3"
          placeholder="Nhập hướng dẫn sử dụng"
          :disabled="isEdit"
        />
      </el-form-item>

      <el-form-item v-if="isEdit" label="Mã thuốc">
        <span class="text-blue-600 font-semibold">{{ medicine?.code }}</span>
      </el-form-item>

      <el-form-item v-if="isEdit" label="Giá bán hiện tại">
        <span
          v-if="medicine?.salePrice"
          class="text-green-600 font-semibold text-lg"
        >
          {{ formatCurrency(medicine.salePrice) }}
        </span>
        <span v-else class="text-gray-400">Chưa có giá</span>
      </el-form-item>

      <el-form-item v-if="isEdit" label="Tồn kho">
        <span
          v-if="medicine?.stockRemaining !== undefined"
          :class="{
            'text-red-600 font-semibold text-lg': medicine.stockRemaining === 0,
            'text-orange-600 font-semibold text-lg':
              medicine.stockRemaining > 0 && medicine.stockRemaining < 10,
            'text-green-600 font-semibold text-lg':
              medicine.stockRemaining >= 10,
          }"
        >
          {{ medicine.stockRemaining }} {{ medicine.unit || "" }}
        </span>
        <span v-else class="text-gray-400">N/A</span>
      </el-form-item>

      <el-form-item v-if="isEdit" label="Trạng thái">
        <el-tag :type="medicine?.active ? 'success' : 'danger'">
          {{ medicine?.active ? "Đang bán" : "Ngừng bán" }}
        </el-tag>
      </el-form-item>

      <el-divider v-if="isEdit" />

      <!-- Price History Section -->
      <div v-if="isEdit && medicine">
        <h4 class="text-base font-semibold mb-3">Lịch sử thay đổi giá</h4>
        <el-table
          v-loading="priceHistoryLoading"
          :data="priceHistory"
          border
          stripe
          max-height="300"
          style="width: 100%"
        >
          <el-table-column label="Giá cũ" width="120" align="right">
            <template #default="{ row }">
              <span class="text-gray-600">
                {{ row.oldPrice ? formatCurrency(row.oldPrice) : "-" }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="Giá mới" width="120" align="right">
            <template #default="{ row }">
              <span class="text-green-600 font-semibold">
                {{ formatCurrency(row.newPrice) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="Lý do" min-width="150">
            <template #default="{ row }">
              {{ row.reason || "-" }}
            </template>
          </el-table-column>
          <el-table-column label="Người thay đổi" width="130">
            <template #default="{ row }">
              {{ row.changedBy }}
            </template>
          </el-table-column>
          <el-table-column label="Thời gian" width="160">
            <template #default="{ row }">
              {{ formatDateTime(row.changedAt) }}
            </template>
          </el-table-column>
        </el-table>
        <div
          v-if="priceHistory.length === 0 && !priceHistoryLoading"
          class="text-center text-gray-400 py-4"
        >
          Chưa có lịch sử thay đổi giá
        </div>
      </div>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">{{ isEdit ? "Đóng" : "Hủy" }}</el-button>
      <el-button
        v-if="!isEdit"
        type="primary"
        :loading="submitting"
        @click="handleSubmit"
      >
        Tạo thuốc
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { ElMessage } from "element-plus";
import { medicineApi } from "@/api/medicine";
import type { Medicine, MedicinePriceHistory } from "@/types/medicine";
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

const isEdit = computed(() => !!props.medicine);

const formRef = ref<FormInstance>();
const submitting = ref(false);
const priceHistoryLoading = ref(false);
const priceHistory = ref<MedicinePriceHistory[]>([]);

const form = reactive({
  name: "",
  ingredient: "",
  unit: "",
  usageGuide: "",
});

const rules: FormRules = {
  name: [
    {
      required: true,
      message: "Vui lòng nhập tên thuốc",
      trigger: "blur",
    },
  ],
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    submitting.value = true;

    await medicineApi.create({
      name: form.name,
      ingredient: form.ingredient || undefined,
      unit: form.unit || undefined,
      usageGuide: form.usageGuide || undefined,
    });

    ElMessage.success("Tạo thuốc thành công");
    emit("success");
    handleClose();
  } catch (error) {
    console.error("Failed to create medicine:", error);
    ElMessage.error("Tạo thuốc thất bại");
  } finally {
    submitting.value = false;
  }
};

const handleClose = () => {
  visible.value = false;
  if (!isEdit.value) {
    formRef.value?.resetFields();
    form.name = "";
    form.ingredient = "";
    form.unit = "";
    form.usageGuide = "";
  }
  priceHistory.value = [];
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString("vi-VN");
};

const loadPriceHistory = async () => {
  if (!props.medicine?.id) return;

  try {
    priceHistoryLoading.value = true;
    const response = await medicineApi.priceHistory(props.medicine.id, {
      page: 0,
      size: 50,
    });
    priceHistory.value = response.content || [];
  } catch (error) {
    console.error("Failed to load price history:", error);
  } finally {
    priceHistoryLoading.value = false;
  }
};

// Load medicine data if in edit mode
if (props.medicine) {
  form.name = props.medicine.name;
  form.ingredient = props.medicine.ingredient || "";
  form.unit = props.medicine.unit || "";
  form.usageGuide = props.medicine.usageGuide || "";
  loadPriceHistory();
}

// Watch for medicine changes
watch(
  () => props.medicine,
  (medicine) => {
    if (medicine) {
      form.name = medicine.name;
      form.ingredient = medicine.ingredient || "";
      form.unit = medicine.unit || "";
      form.usageGuide = medicine.usageGuide || "";
      loadPriceHistory();
    }
  },
);
</script>
