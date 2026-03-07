<template>
  <el-dialog
    v-model="visible"
    :show-close="false"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
    class="modern-dialog"
  >
    <template #header>
      <div class="dialog-header">
        <div class="header-content">
          <component :is="ServiceIcon" class="header-icon" />
          <span class="header-title">{{
            isEdit ? "Cập nhật dịch vụ" : "Thêm dịch vụ mới"
          }}</span>
        </div>
      </div>
    </template>
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="140px"
      label-position="left"
      class="modern-form"
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
          <button @click.prevent="handleAddStep" class="add-item-button">
            <component :is="PlusIcon" />
            <span>Thêm bước</span>
          </button>
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
      <div class="dialog-footer">
        <button @click="handleClose" class="cancel-button">
          <component :is="CloseIcon" />
          <span>Hủy</span>
        </button>
        <button @click="handleSubmit" :disabled="loading" class="submit-button">
          <component :is="loading ? LoadingIcon : CheckIcon" />
          <span>{{ isEdit ? "Cập nhật" : "Tạo mới" }}</span>
        </button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, h } from "vue";
import { type FormInstance, type FormRules } from "element-plus";
import { notification } from "@/utils/notification";
import { serviceApi } from "@/api/service";
import type {
  ServiceCatalog,
  CreateServiceRequest,
  UpdateServiceRequest,
  CreateServiceStepRequest,
} from "@/types/service";

// Icon components
const ServiceIcon = () =>
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
      style: { width: "24px", height: "24px" },
    },
    [
      h("path", {
        d: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
      }),
      h("polyline", { points: "3.27 6.96 12 12.01 20.73 6.96" }),
      h("line", { x1: "12", y1: "22.08", x2: "12", y2: "12" }),
    ],
  );

const CloseIcon = () =>
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
      style: { width: "20px", height: "20px" },
    },
    [
      h("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
      h("line", { x1: "6", y1: "6", x2: "18", y2: "18" }),
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
      style: { width: "20px", height: "20px" },
    },
    [h("polyline", { points: "20 6 9 17 4 12" })],
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
      style: { width: "20px", height: "20px" },
    },
    [
      h("line", { x1: "12", y1: "2", x2: "12", y2: "6" }),
      h("line", { x1: "12", y1: "18", x2: "12", y2: "22" }),
      h("line", { x1: "4.93", y1: "4.93", x2: "7.76", y2: "7.76" }),
      h("line", { x1: "16.24", y1: "16.24", x2: "19.07", y2: "19.07" }),
      h("line", { x1: "2", y1: "12", x2: "6", y2: "12" }),
      h("line", { x1: "18", y1: "12", x2: "22", y2: "12" }),
      h("line", { x1: "4.93", y1: "19.07", x2: "7.76", y2: "16.24" }),
      h("line", { x1: "16.24", y1: "7.76", x2: "19.07", y2: "4.93" }),
    ],
  );

const PlusIcon = () =>
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
    [h("path", { d: "M5 12h14" }), h("path", { d: "M12 5v14" })],
  );

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
.modern-dialog {
  :deep(.el-dialog) {
    border-radius: 16px;
    overflow: hidden;
  }

  .dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
    padding: 20px 24px;
    color: white;

    .header-content {
      display: flex;
      align-items: center;
      gap: 12px;

      .header-icon {
        width: 24px;
        height: 24px;
        color: white;
      }

      .header-title {
        font-size: 18px;
        font-weight: 600;
        color: white;
      }
    }

    .close-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      color: white;
      padding: 0;

      &:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: scale(1.1);
      }
    }
  }

  :deep(.el-dialog__body) {
    padding: 24px;
    max-height: 65vh;
    overflow-y: auto;
  }

  :deep(.el-dialog__footer) {
    padding: 16px 24px;
    border-top: 1px solid #f3f4f6;
  }
}

.modern-form {
  :deep(.el-form-item) {
    margin-bottom: 20px;

    .el-form-item__label {
      font-weight: 600;
      color: #374151;
      font-size: 14px;
    }

    .el-input__wrapper {
      border-radius: 10px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      padding: 8px 12px;
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
      }

      &.is-focus {
        box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
      }
    }

    .el-textarea__inner {
      border-radius: 10px;
      padding: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
      }

      &:focus {
        box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
      }
    }

    .el-select,
    .el-input-number {
      .el-input__wrapper {
        &.is-focus {
          box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
        }
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  background: white;

  .cancel-button,
  .submit-button {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .cancel-button {
    padding: 10px 24px;
    border: 1px solid #e5e7eb;
    background: white;
    color: #6b7280;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: #f9fafb;
      border-color: #d1d5db;
      color: #374151;
    }
  }

  .submit-button {
    padding: 10px 24px;
    border: none;
    background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
    color: white;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(20, 184, 166, 0.4);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

.add-item-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);

  svg {
    width: 20px;
    height: 20px;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(20, 184, 166, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
}
</style>
