<template>
  <el-dialog
    v-model="visible"
    width="600px"
    :show-close="false"
    :close-on-click-modal="false"
    @close="handleClose"
    class="prescription-item-dialog"
  >
    <template #header>
      <div class="dialog-header">
        <component :is="MedicineIcon" class="header-icon" />
        <span class="header-title">Thêm thuốc</span>
      </div>
    </template>
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
      label-position="left"
    >
      <el-form-item label="Thuốc" prop="medicineId">
        <el-select
          v-model="form.medicineId"
          placeholder="Tìm và chọn thuốc"
          filterable
          remote
          clearable
          :remote-method="searchMedicines"
          :loading="medicineLoading"
          style="width: 100%"
          @change="handleMedicineChange"
          @focus="handleMedicineFocus"
        >
          <el-option
            v-for="medicine in medicineOptions"
            :key="medicine.id"
            :label="`${medicine.code} - ${medicine.name}`"
            :value="medicine.id"
          >
            <div class="flex justify-between items-center">
              <span>{{ medicine.code }} - {{ medicine.name }}</span>
              <div class="flex items-center gap-2">
                <span class="text-gray-400 text-sm">{{ medicine.unit }}</span>
                <span
                  v-if="medicine.stockRemaining !== undefined"
                  :class="{
                    'text-red-600 font-semibold text-xs':
                      medicine.stockRemaining === 0,
                    'text-orange-600 text-xs':
                      medicine.stockRemaining > 0 &&
                      medicine.stockRemaining < 10,
                    'text-green-600 text-xs': medicine.stockRemaining >= 10,
                  }"
                >
                  (Còn: {{ medicine.stockRemaining }})
                </span>
              </div>
            </div>
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item v-if="selectedMedicine" label="Tồn kho hiện tại">
        <span
          v-if="selectedMedicine.stockRemaining !== undefined"
          :class="{
            'text-red-600 font-semibold': selectedMedicine.stockRemaining === 0,
            'text-orange-600':
              selectedMedicine.stockRemaining > 0 &&
              selectedMedicine.stockRemaining < 10,
            'text-green-600': selectedMedicine.stockRemaining >= 10,
          }"
        >
          {{ selectedMedicine.stockRemaining }}
          {{ selectedMedicine.unit || "" }}
        </span>
        <span v-else class="text-gray-400">N/A</span>
      </el-form-item>

      <el-form-item label="Liều dùng" prop="dosage">
        <el-input
          v-model="form.dosage"
          placeholder="VD: Uống 2 viên/lần, 3 lần/ngày"
        />
      </el-form-item>

      <el-form-item label="Số lượng" prop="quantity">
        <el-input-number
          v-model="form.quantity"
          :min="1"
          :max="1000"
          :precision="0"
          :controls="false"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="Ghi chú" prop="note">
        <el-input
          v-model="form.note"
          type="textarea"
          :rows="2"
          placeholder="Ghi chú thêm..."
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <button @click="handleClose" class="footer-button cancel-button">
          <component :is="XIcon" />
          <span>Hủy</span>
        </button>
        <button @click="handleConfirm" class="footer-button submit-button">
          <component :is="CheckIcon" />
          <span>Thêm</span>
        </button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, h } from "vue";
import { ElMessage } from "element-plus";
import { medicineApi } from "@/api/medicine";
import type { Medicine } from "@/types/medicine";
import type { CreatePrescriptionItemRequest } from "@/types/prescription";
import type { FormInstance, FormRules } from "element-plus";

const MedicineIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    [
      h("rect", { x: "3", y: "8", width: "18", height: "4", rx: "1" }),
      h("path", { d: "M12 8v13" }),
      h("path", { d: "M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" }),
      h("path", {
        d: "M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5",
      }),
    ],
  );

const CheckIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "20",
      height: "20",
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
      width: "20",
      height: "20",
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

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (
    e: "confirm",
    item: CreatePrescriptionItemRequest & {
      medicineName: string;
      medicineCode: string;
      unit: string;
    },
  ): void;
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
const medicineLoading = ref(false);
const medicineOptions = ref<Medicine[]>([]);
const selectedMedicine = ref<Medicine>();

const form = reactive({
  medicineId: "",
  dosage: "",
  quantity: 1,
  note: "",
});

const rules: FormRules = {
  medicineId: [
    {
      required: true,
      message: "Vui lòng chọn thuốc",
      trigger: "change",
    },
  ],
  quantity: [
    {
      required: true,
      message: "Vui lòng nhập số lượng",
      trigger: "blur",
    },
  ],
};

const searchMedicines = async (keyword: string) => {
  if (!keyword) {
    medicineOptions.value = [];
    return;
  }

  try {
    medicineLoading.value = true;
    const response = await medicineApi.search({
      keyword,
      active: true,
      page: 0,
      size: 20,
    });
    medicineOptions.value = response.content || [];
  } catch (error) {
    console.error("Failed to search medicines:", error);
  } finally {
    medicineLoading.value = false;
  }
};

const handleMedicineFocus = async () => {
  if (medicineOptions.value.length === 0) {
    try {
      medicineLoading.value = true;
      const response = await medicineApi.search({
        active: true,
        page: 0,
        size: 20,
      });
      medicineOptions.value = response.content || [];
    } catch (error) {
      console.error("Failed to load medicines:", error);
    } finally {
      medicineLoading.value = false;
    }
  }
};

const handleMedicineChange = (medicineId: string) => {
  selectedMedicine.value = medicineOptions.value.find(
    (m) => m.id === medicineId,
  );
};

const handleConfirm = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();

    if (!selectedMedicine.value) {
      ElMessage.warning("Vui lòng chọn thuốc");
      return;
    }

    emit("confirm", {
      medicineId: form.medicineId,
      medicineName: selectedMedicine.value.name,
      medicineCode: selectedMedicine.value.code,
      unit: selectedMedicine.value.unit || "",
      dosage: form.dosage || undefined,
      quantity: form.quantity,
      note: form.note || undefined,
    });

    handleClose();
  } catch (error) {
    console.error("Validation failed:", error);
  }
};

const handleClose = () => {
  visible.value = false;
  formRef.value?.resetFields();
  form.medicineId = "";
  form.dosage = "";
  form.quantity = 1;
  form.note = "";
  medicineOptions.value = [];
  selectedMedicine.value = undefined;
};
</script>

<style scoped lang="scss">
.prescription-item-dialog {
  :deep(.el-dialog__header) {
    padding: 0;
    margin: 0;
  }

  :deep(.el-dialog__body) {
    padding: 20px;
  }

  :deep(.el-dialog__footer) {
    padding: 0;
  }

  .dialog-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
    color: white;

    .header-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      flex-shrink: 0;
    }

    .header-title {
      font-size: 16px;
      font-weight: 600;
      line-height: 1;
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 12px 16px;
    border-top: 1px solid #e5e7eb;

    .footer-button {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      outline: none;

      &.cancel-button {
        background: white;
        color: #6b7280;
        border: 1px solid #d1d5db;

        &:hover {
          background: #f9fafb;
          color: #374151;
          border-color: #9ca3af;
        }
      }

      &.submit-button {
        background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
        color: white;
        box-shadow: 0 2px 4px rgba(20, 184, 166, 0.2);

        &:hover {
          box-shadow: 0 4px 8px rgba(20, 184, 166, 0.3);
          transform: translateY(-1px);
        }

        &:active {
          transform: translateY(0);
        }
      }
    }
  }
}
</style>
