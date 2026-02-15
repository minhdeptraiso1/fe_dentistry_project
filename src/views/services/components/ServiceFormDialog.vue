<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? 'Cập nhật dịch vụ' : 'Thêm dịch vụ mới'"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="140px"
      @submit.prevent="handleSubmit"
    >
      <el-form-item label="Tên dịch vụ" prop="name">
        <el-input
          v-model="formData.name"
          placeholder="Nhập tên dịch vụ..."
          maxlength="200"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="Loại dịch vụ" prop="type">
        <el-radio-group v-model="formData.type" :disabled="isEdit">
          <el-radio label="SINGLE">Dịch vụ đơn lẻ</el-radio>
          <el-radio label="PACKAGE">Gói dịch vụ</el-radio>
        </el-radio-group>
        <div class="text-gray-500 text-sm mt-1">
          {{
            formData.type === "PACKAGE"
              ? "Gói dịch vụ bao gồm nhiều bước điều trị"
              : "Dịch vụ đơn lẻ không có bước phụ"
          }}
        </div>
      </el-form-item>

      <el-form-item label="Danh mục" prop="category">
        <el-input
          v-model="formData.category"
          placeholder="VD: Khám tổng quát, Trám răng, Nha chu..."
        />
      </el-form-item>

      <el-form-item label="Giá cơ bản" prop="basePrice">
        <el-input-number
          v-model="formData.basePrice"
          :min="0"
          :step="10000"
          :precision="0"
          controls-position="right"
          style="width: 100%"
        />
        <div class="text-gray-500 text-sm mt-1">
          {{ formatCurrency(formData.basePrice || 0) }}
        </div>
      </el-form-item>

      <el-form-item label="Đơn vị" prop="unit">
        <el-input
          v-model="formData.unit"
          placeholder="VD: lần, răng, ca..."
          style="width: 200px"
        />
      </el-form-item>

      <el-form-item label="Thời gian dự kiến" prop="durationMin">
        <el-input-number
          v-model="formData.durationMin"
          :min="0"
          :step="15"
          controls-position="right"
          style="width: 200px"
        />
        <span class="ml-2">phút</span>
      </el-form-item>

      <el-form-item label="Mô tả" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="Nhập mô tả chi tiết về dịch vụ..."
          maxlength="500"
          show-word-limit
        />
      </el-form-item>

      <el-form-item v-if="isEdit" label="Trạng thái" prop="active">
        <el-switch
          v-model="formData.active"
          active-text="Hoạt động"
          inactive-text="Ngừng"
        />
      </el-form-item>

      <!-- Package Steps (only for PACKAGE type) -->
      <template v-if="formData.type === 'PACKAGE'">
        <el-divider content-position="left">
          <span class="font-semibold">Các bước điều trị</span>
        </el-divider>

        <div class="mb-4">
          <el-button type="primary" plain size="small" @click="handleAddStep">
            <el-icon class="mr-1"><Plus /></el-icon>
            Thêm bước
          </el-button>
        </div>

        <el-table
          v-if="formData.steps && formData.steps.length > 0"
          :data="formData.steps"
          border
          class="mb-4"
        >
          <el-table-column label="Bước" width="70" align="center">
            <template #default="{ row }">
              {{ row.stepNo }}
            </template>
          </el-table-column>
          <el-table-column label="Tên bước" min-width="150">
            <template #default="{ row }">
              <el-input
                v-model="row.stepName"
                placeholder="Nhập tên bước..."
                size="small"
              />
            </template>
          </el-table-column>
          <el-table-column label="Mô tả" min-width="180">
            <template #default="{ row }">
              <el-input
                v-model="row.stepDesc"
                placeholder="Mô tả..."
                size="small"
              />
            </template>
          </el-table-column>
          <el-table-column label="Giá" width="140">
            <template #default="{ row }">
              <el-input-number
                v-model="row.price"
                :min="0"
                :step="10000"
                controls-position="right"
                size="small"
                style="width: 100%"
              />
            </template>
          </el-table-column>
          <el-table-column label="SL" width="80">
            <template #default="{ row }">
              <el-input-number
                v-model="row.quantity"
                :min="1"
                controls-position="right"
                size="small"
                style="width: 100%"
              />
            </template>
          </el-table-column>
          <el-table-column label="" width="60" align="center">
            <template #default="{ $index }">
              <el-button
                type="danger"
                link
                size="small"
                @click="handleRemoveStep($index)"
              >
                Xóa
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-alert v-else type="info" :closable="false" show-icon>
          Chưa có bước điều trị nào. Nhấn "Thêm bước" để thêm.
        </el-alert>
      </template>
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
import { type FormInstance, type FormRules } from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import { notification } from "@/utils/notification";
import { serviceApi } from "@/api/service";
import type {
  ServiceCatalog,
  CreateServiceRequest,
  UpdateServiceRequest,
  CreateServiceStepRequest,
} from "@/types/service";

const props = defineProps<{
  modelValue: boolean;
  service?: ServiceCatalog | null;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "success"): void;
}>();

const formRef = ref<FormInstance>();
const loading = ref(false);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const isEdit = computed(() => !!props.service);

// Form data with all fields
interface FormData {
  name: string;
  type: "SINGLE" | "PACKAGE";
  category: string;
  description: string;
  basePrice: number;
  unit: string;
  durationMin: number | undefined;
  active: boolean;
  steps: CreateServiceStepRequest[];
}

const formData = reactive<FormData>({
  name: "",
  type: "SINGLE",
  category: "",
  description: "",
  basePrice: 0,
  unit: "lần",
  durationMin: 30,
  active: true,
  steps: [],
});

const rules: FormRules = {
  name: [
    { required: true, message: "Vui lòng nhập tên dịch vụ", trigger: "blur" },
  ],
  type: [
    {
      required: true,
      message: "Vui lòng chọn loại dịch vụ",
      trigger: "change",
    },
  ],
  basePrice: [
    { required: true, message: "Vui lòng nhập giá", trigger: "blur" },
    {
      type: "number",
      min: 0,
      message: "Giá phải lớn hơn hoặc bằng 0",
      trigger: "blur",
    },
  ],
};

/**
 * Format currency
 */
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

/**
 * Handle add step
 */
const handleAddStep = () => {
  const newStepNo = formData.steps.length + 1;
  formData.steps.push({
    stepNo: newStepNo,
    stepName: "",
    stepDesc: "",
    price: 0,
    quantity: 1,
  });
};

/**
 * Handle remove step
 */
const handleRemoveStep = (index: number) => {
  formData.steps.splice(index, 1);
  // Re-number steps
  formData.steps.forEach((step, idx) => {
    step.stepNo = idx + 1;
  });
};

/**
 * Reset form
 */
const resetForm = () => {
  formData.name = "";
  formData.type = "SINGLE";
  formData.category = "";
  formData.description = "";
  formData.basePrice = 0;
  formData.unit = "lần";
  formData.durationMin = 30;
  formData.active = true;
  formData.steps = [];
  formRef.value?.clearValidate();
};

/**
 * Watch service prop to populate form
 */
watch(
  () => props.service,
  (service) => {
    if (service) {
      formData.name = service.name;
      formData.type = service.type;
      formData.category = service.category || "";
      formData.description = service.description || "";
      formData.basePrice = service.basePrice;
      formData.unit = service.unit || "";
      formData.durationMin = service.durationMin;
      formData.active = service.active;

      // Load steps if PACKAGE
      if (service.type === "PACKAGE" && service.steps) {
        formData.steps = service.steps.map((s) => ({
          stepNo: s.stepNo,
          stepName: s.stepName,
          stepDesc: s.stepDesc || "",
          price: s.price,
          quantity: s.quantity,
        }));
      } else {
        formData.steps = [];
      }
    } else {
      resetForm();
    }
  },
  { immediate: true },
);

/**
 * Handle close
 */
const handleClose = () => {
  resetForm();
  visible.value = false;
};

/**
 * Handle submit
 */
const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    const valid = await formRef.value.validate();
    if (!valid) return;

    // Validate steps if type is PACKAGE
    if (formData.type === "PACKAGE") {
      if (!formData.steps || formData.steps.length === 0) {
        notification.warning("Gói dịch vụ phải có ít nhất 1 bước điều trị");
        return;
      }

      // Validate each step
      for (const step of formData.steps) {
        if (!step.stepName?.trim()) {
          notification.warning(`Bước ${step.stepNo}: Vui lòng nhập tên bước`);
          return;
        }
        if (step.price < 0) {
          notification.warning(`Bước ${step.stepNo}: Giá không hợp lệ`);
          return;
        }
        if (step.quantity < 1) {
          notification.warning(`Bước ${step.stepNo}: Số lượng phải >= 1`);
          return;
        }
      }
    }

    loading.value = true;

    if (isEdit.value && props.service) {
      // Update service
      const updateData: UpdateServiceRequest = {
        name: formData.name,
        category: formData.category || undefined,
        description: formData.description || undefined,
        basePrice: formData.basePrice,
        unit: formData.unit || undefined,
        durationMin: formData.durationMin,
        active: formData.active,
        steps: formData.type === "PACKAGE" ? formData.steps : undefined,
      };
      await serviceApi.update(props.service.id, updateData);
      notification.success("Cập nhật dịch vụ thành công!");
    } else {
      // Create service
      const createData: CreateServiceRequest = {
        name: formData.name,
        type: formData.type,
        category: formData.category || undefined,
        description: formData.description || undefined,
        basePrice: formData.basePrice,
        unit: formData.unit || undefined,
        durationMin: formData.durationMin,
        steps: formData.type === "PACKAGE" ? formData.steps : undefined,
      };
      await serviceApi.create(createData);
      notification.success("Tạo dịch vụ thành công!");
    }

    emit("success");
    handleClose();
  } catch (error: any) {
    console.error("Submit service error:", error);
    notification.error(error?.message || "Có lỗi xảy ra, vui lòng thử lại");
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped lang="scss">
// Custom styles if needed
</style>
