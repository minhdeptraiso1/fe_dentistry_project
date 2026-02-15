<template>
  <el-dialog
    v-model="visible"
    title="Thêm dịch vụ điều trị"
    width="800px"
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
      <el-form-item label="Dịch vụ" prop="serviceId">
        <el-select
          v-model="form.serviceId"
          placeholder="Chọn dịch vụ"
          filterable
          remote
          :remote-method="searchServices"
          :loading="serviceLoading"
          style="width: 100%"
          @change="handleServiceChange"
          @focus="handleServiceFocus"
        >
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
              @change="calculateTotal"
            />
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
              @change="calculateTotal"
            />
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
              @change="calculateTotal"
            />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="Thành tiền">
            <el-input
              :model-value="formatCurrency(lineTotal)"
              disabled
              style="width: 100%"
            >
              <template #prefix>
                <span class="font-semibold text-green-600">💰</span>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">
        <span class="text-sm">Thông tin nha khoa</span>
      </el-divider>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="Số răng">
            <el-input v-model="form.toothNo" placeholder="VD: 11, 21, 36" />
            <div class="text-xs text-gray-500 mt-1">
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
            >
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
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">Hủy</el-button>
      <el-button type="primary" @click="handleConfirm">Thêm</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { serviceApi } from "@/api/service";
import type { ServiceCatalog } from "@/types/service";
import type { CreateTreatmentItemRequest } from "@/types/treatmentPlan";
import type { FormInstance, FormRules } from "element-plus";

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

<style scoped>
:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-input-number .el-input__inner) {
  text-align: right;
}
</style>
