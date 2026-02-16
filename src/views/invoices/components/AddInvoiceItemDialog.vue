<template>
  <el-dialog
    v-model="visible"
    title="Thêm dịch vụ"
    width="700px"
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
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="Ghi chú">
        <el-input
          v-model="form.note"
          type="textarea"
          :rows="3"
          placeholder="Nhập ghi chú..."
        />
      </el-form-item>

      <!-- Summary -->
      <el-divider />
      <div class="flex justify-between items-center text-lg">
        <span class="font-semibold">Thành tiền:</span>
        <span class="text-2xl font-bold text-green-600">
          {{ formatCurrency(lineTotal) }}
        </span>
      </div>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">Hủy</el-button>
      <el-button type="primary" @click="handleConfirm">Thêm</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
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
</script>
