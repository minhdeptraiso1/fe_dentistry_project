<template>
  <el-dialog
    v-model="visible"
    :title="`Lịch sử lô thuốc - ${medicine?.name}`"
    width="90%"
    @close="handleClose"
  >
    <el-table v-loading="loading" :data="batches" border stripe>
      <el-table-column type="index" label="STT" width="60" />
      <el-table-column prop="batchNo" label="Số lô" width="120">
        <template #default="{ row }">
          {{ row.batchNo || "N/A" }}
        </template>
      </el-table-column>
      <el-table-column label="Ngày nhập" width="120">
        <template #default="{ row }">
          {{ formatDate(row.importDate) }}
        </template>
      </el-table-column>
      <el-table-column label="Ngày hết hạn" width="120">
        <template #default="{ row }">
          <span v-if="row.expiryDate" :class="getExpiryClass(row.expiryDate)">
            {{ formatDate(row.expiryDate) }}
          </span>
          <span v-else class="text-gray-400">N/A</span>
        </template>
      </el-table-column>
      <el-table-column label="Giá nhập" width="130" align="right">
        <template #default="{ row }">
          {{ formatCurrency(row.importPrice) }}
        </template>
      </el-table-column>
      <el-table-column label="SL nhập" width="100" align="right">
        <template #default="{ row }">
          {{ row.quantityIn }}
        </template>
      </el-table-column>
    </el-table>

    <!-- Pagination -->
    <div class="flex justify-end mt-4">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadBatches"
        @current-change="loadBatches"
      />
    </div>

    <template #footer>
      <el-button @click="handleClose">Đóng</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { ElMessage } from "element-plus";
import { medicineApi } from "@/api/medicine";
import type { Medicine, MedicineBatch } from "@/types/medicine";

interface Props {
  modelValue: boolean;
  medicine?: Medicine;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const loading = ref(false);
const batches = ref<MedicineBatch[]>([]);

const pagination = reactive({
  page: 1,
  size: 20,
  total: 0,
});

const loadBatches = async () => {
  if (!props.medicine) return;

  try {
    loading.value = true;
    const response = await medicineApi.batchHistory(props.medicine.id, {
      page: pagination.page - 1, // Backend uses 0-based index
      size: pagination.size,
    });
    batches.value = response.content || [];
    pagination.total = response.totalElements || 0;
  } catch (error) {
    console.error("Failed to load batches:", error);
    ElMessage.error("Không thể tải lịch sử lô");
  } finally {
    loading.value = false;
  }
};

const handleClose = () => {
  visible.value = false;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("vi-VN");
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

const isExpired = (expiryDate: string) => {
  return new Date(expiryDate) < new Date();
};

const isExpiringSoon = (expiryDate: string) => {
  const diff = new Date(expiryDate).getTime() - new Date().getTime();
  const days = diff / (1000 * 60 * 60 * 24);
  return days <= 30 && days > 0;
};

const getExpiryClass = (expiryDate: string) => {
  if (isExpired(expiryDate)) return "text-red-600 font-semibold";
  if (isExpiringSoon(expiryDate)) return "text-orange-600 font-semibold";
  return "";
};

// Watch for medicine changes and dialog visibility
watch(
  () => [props.modelValue, props.medicine],
  ([isVisible, medicine]) => {
    if (isVisible && medicine) {
      loadBatches();
    }
  },
  { immediate: true },
);
</script>
