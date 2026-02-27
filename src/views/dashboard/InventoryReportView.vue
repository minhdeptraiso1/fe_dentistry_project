<template>
  <div class="inventory-container">
    <el-card class="mb-4">
      <el-row :gutter="16" align="middle">
        <el-col :span="12">
          <h2 class="text-xl font-semibold">Báo cáo tồn kho</h2>
        </el-col>
        <el-col :span="12" class="text-right">
          <el-button type="primary" @click="loadData">
            <el-icon><Refresh /></el-icon>
            Làm mới
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- Expiry Warnings -->
    <el-card v-loading="loadingWarnings" class="mb-4">
      <template #header>
        <div class="card-header">
          <span class="font-semibold">Cảnh báo thuốc hết hạn</span>
          <el-badge :value="warnings.length" :max="99" type="danger" />
        </div>
      </template>

      <el-empty
        v-if="warnings.length === 0"
        description="Không có thuốc hết hạn hoặc sắp hết hạn"
      />

      <el-table v-else :data="warnings" border stripe>
        <el-table-column type="index" label="STT" width="60" />
        <el-table-column prop="medicineCode" label="Mã thuốc" width="120" />
        <el-table-column
          prop="medicineName"
          label="Tên thuốc"
          min-width="200"
        />
        <el-table-column prop="batchNo" label="Số lô" width="120" />
        <el-table-column label="Ngày hết hạn" width="150">
          <template #default="{ row }">
            {{ formatDate(row.expiryDate) }}
          </template>
        </el-table-column>
        <el-table-column label="SL còn" width="100" align="right">
          <template #default="{ row }">
            {{ row.quantityRemaining }}
          </template>
        </el-table-column>
        <el-table-column label="Trạng thái" width="130" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.warningType === 'EXPIRED'" type="danger">
              Đã hết hạn
            </el-tag>
            <el-tag v-else type="warning">Sắp hết hạn</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Ngày còn lại" width="120" align="center">
          <template #default="{ row }">
            <span
              :class="{
                'text-red-600 font-semibold':
                  daysUntilExpiry(row.expiryDate) <= 0,
                'text-orange-600': daysUntilExpiry(row.expiryDate) > 0,
              }"
            >
              {{ daysUntilExpiry(row.expiryDate) }} ngày
            </span>
          </template>
        </el-table-column>
        <el-table-column
          label="Thao tác"
          width="100"
          align="center"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              type="danger"
              size="small"
              link
              @click="handleDispose(row)"
            >
              Xử lý
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Stock Summary Table -->
    <el-card v-loading="loadingStock">
      <template #header>
        <div class="card-header">
          <span class="font-semibold">Tổng hợp tồn kho</span>
          <el-space>
            <el-switch
              v-model="filters.activeOnly"
              active-text="Chỉ thuốc đang dùng"
              @change="loadStockSummary"
            />
            <el-select
              v-model="filters.lowStockThreshold"
              placeholder="Ngưỡng cảnh báo"
              style="width: 180px"
              @change="loadStockSummary"
            >
              <el-option label="Dưới 5" :value="5" />
              <el-option label="Dưới 10" :value="10" />
              <el-option label="Dưới 20" :value="20" />
              <el-option label="Dưới 50" :value="50" />
            </el-select>
          </el-space>
        </div>
      </template>

      <el-table :data="stockSummary" border stripe>
        <el-table-column type="index" label="STT" width="60" />
        <el-table-column prop="medicineCode" label="Mã thuốc" width="120" />
        <el-table-column
          prop="medicineName"
          label="Tên thuốc"
          min-width="200"
        />
        <el-table-column label="Tồn kho" width="120" align="right">
          <template #default="{ row }">
            <span
              :class="{
                'text-red-600 font-semibold': row.lowStock,
                'text-green-600': !row.lowStock,
              }"
            >
              {{ row.totalRemaining }} {{ row.unit }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="Số lô" width="100" align="center">
          <template #default="{ row }">
            {{ row.totalBatches }}
          </template>
        </el-table-column>
        <el-table-column label="HSD gần nhất" width="130">
          <template #default="{ row }">
            <span v-if="row.nearestExpiryDate">
              {{ formatDate(row.nearestExpiryDate) }}
            </span>
            <span v-else class="text-gray-400">N/A</span>
          </template>
        </el-table-column>
        <el-table-column label="Cảnh báo" width="200" align="center">
          <template #default="{ row }">
            <el-space wrap>
              <el-tag v-if="row.lowStock" type="warning" size="small">
                Tồn kho thấp
              </el-tag>
              <el-tag v-if="row.hasExpired" type="danger" size="small">
                Có lô hết hạn ({{ row.expiredBatchesCount }})
              </el-tag>
              <el-tag v-if="row.hasNearExpiry" type="warning" size="small">
                Sắp hết hạn ({{ row.nearExpiryBatchesCount }})
              </el-tag>
              <el-tag
                v-if="!row.lowStock && !row.hasExpired && !row.hasNearExpiry"
                type="success"
                size="small"
              >
                Tốt
              </el-tag>
            </el-space>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Refresh } from "@element-plus/icons-vue";
import { inventoryApi } from "@/api/inventory";
import { medicineApi } from "@/api/medicine";
import type {
  MedicineStockSummary,
  BatchExpiryWarning,
} from "@/types/inventory";

const loadingStock = ref(false);
const loadingWarnings = ref(false);

const filters = reactive({
  nearDays: 30,
  lowStockThreshold: 10,
  activeOnly: false,
});

const stockSummary = ref<MedicineStockSummary[]>([]);
const warnings = ref<BatchExpiryWarning[]>([]);

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("vi-VN");
};

const daysUntilExpiry = (expiryDate: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diff = expiry.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const loadStockSummary = async () => {
  loadingStock.value = true;
  try {
    const res = await inventoryApi.stockSummary({
      nearDays: filters.nearDays,
      lowStockThreshold: filters.lowStockThreshold,
      activeOnly: filters.activeOnly,
    });
    stockSummary.value = res;
  } catch (error: any) {
    ElMessage.error(error.message || "Không thể tải báo cáo tồn kho");
  } finally {
    loadingStock.value = false;
  }
};

const loadExpiryWarnings = async () => {
  loadingWarnings.value = true;
  try {
    const res = await inventoryApi.expiryWarnings({
      nearDays: filters.nearDays,
    });
    warnings.value = res;
  } catch (error: any) {
    ElMessage.error(error.message || "Không thể tải cảnh báo hết hạn");
  } finally {
    loadingWarnings.value = false;
  }
};

const loadData = () => {
  loadStockSummary();
  loadExpiryWarnings();
};

const handleDispose = async (batch: BatchExpiryWarning) => {
  try {
    const result = await ElMessageBox.prompt(
      `Xác nhận xử lý lô thuốc "${batch.medicineName}" (${batch.batchNo})?\nSố lượng: ${batch.quantityRemaining} ${batch.warningType === "EXPIRED" ? "(Đã hết hạn)" : "(Sắp hết hạn)"}`,
      "Xử lý lô thuốc",
      {
        confirmButtonText: "Xác nhận",
        cancelButtonText: "Hủy",
        inputPlaceholder: "Nhập lý do xử lý (tùy chọn)",
        inputType: "textarea",
      },
    );

    loadingWarnings.value = true;
    const reason = typeof result === "string" ? result : (result as any).value;
    await medicineApi.disposeBatch(batch.batchId, reason || undefined);

    ElMessage.success("Đã xử lý lô thuốc thành công");
    await loadExpiryWarnings();
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(error.message || "Không thể xử lý lô thuốc");
    }
  } finally {
    loadingWarnings.value = false;
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped lang="scss">
.inventory-container {
  padding: 20px;

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
}

.mb-4 {
  margin-bottom: 16px;
}

.text-right {
  text-align: right;
}

.text-xl {
  font-size: 1.25rem;
}

.font-semibold {
  font-weight: 600;
}

.text-gray-400 {
  color: #a0a0a0;
}

.text-red-600 {
  color: #ff4d4f;
}

.text-orange-600 {
  color: #faad14;
}

.text-green-600 {
  color: #52c41a;
}
</style>
