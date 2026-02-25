<template>
  <el-dialog
    v-model="visible"
    title="Thêm thuốc"
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
      <el-button @click="handleClose">Hủy</el-button>
      <el-button type="primary" @click="handleConfirm"> Thêm </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { ElMessage } from "element-plus";
import { medicineApi } from "@/api/medicine";
import type { Medicine } from "@/types/medicine";
import type { CreatePrescriptionItemRequest } from "@/types/prescription";
import type { FormInstance, FormRules } from "element-plus";

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
