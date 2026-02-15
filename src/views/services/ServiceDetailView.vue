<template>
  <div class="service-detail-view">
    <!-- Back button and actions -->
    <div class="flex justify-between items-center mb-6">
      <el-button @click="router.back()">
        <el-icon class="mr-2"><ArrowLeft /></el-icon>
        Quay lại
      </el-button>

      <div v-if="authStore.isAdmin && service" class="flex gap-2">
        <el-button type="primary" @click="handleEdit">
          <el-icon class="mr-2"><Edit /></el-icon>
          Chỉnh sửa
        </el-button>
        <el-button type="danger" @click="handleDelete">
          <el-icon class="mr-2"><Delete /></el-icon>
          Xóa
        </el-button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center items-center py-20">
      <el-icon class="is-loading" :size="40"><Loading /></el-icon>
    </div>

    <!-- Service Detail -->
    <template v-else-if="service">
      <!-- Basic Information Card -->
      <el-card class="mb-6">
        <template #header>
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-bold">Thông tin dịch vụ</h2>
            <el-tag v-if="service.active" type="success" size="large">
              Hoạt động
            </el-tag>
            <el-tag v-else type="danger" size="large"> Ngừng hoạt động </el-tag>
          </div>
        </template>

        <el-descriptions :column="2" border>
          <el-descriptions-item
            label="Mã dịch vụ"
            label-class-name="font-semibold"
          >
            <el-text class="font-mono">{{ service.code }}</el-text>
          </el-descriptions-item>

          <el-descriptions-item
            label="Tên dịch vụ"
            label-class-name="font-semibold"
          >
            <el-text class="text-lg font-semibold">{{ service.name }}</el-text>
          </el-descriptions-item>

          <el-descriptions-item
            label="Loại dịch vụ"
            label-class-name="font-semibold"
          >
            <el-tag v-if="service.type === 'SINGLE'" type="info">
              Dịch vụ đơn lẻ
            </el-tag>
            <el-tag v-else type="success"> Gói dịch vụ </el-tag>
          </el-descriptions-item>

          <el-descriptions-item
            label="Danh mục"
            label-class-name="font-semibold"
          >
            <el-text>{{ service.category || "-" }}</el-text>
          </el-descriptions-item>

          <el-descriptions-item
            label="Giá cơ bản"
            label-class-name="font-semibold"
          >
            <el-text class="text-lg font-bold text-primary">
              {{ formatCurrency(service.basePrice) }}
            </el-text>
          </el-descriptions-item>

          <el-descriptions-item label="Đơn vị" label-class-name="font-semibold">
            <el-text>{{ service.unit || "-" }}</el-text>
          </el-descriptions-item>

          <el-descriptions-item
            label="Thời gian dự kiến"
            label-class-name="font-semibold"
          >
            <el-text>
              {{ service.durationMin ? `${service.durationMin} phút` : "-" }}
            </el-text>
          </el-descriptions-item>

          <el-descriptions-item
            label="Ngày tạo"
            label-class-name="font-semibold"
          >
            <el-text>{{ formatDateTime(service.createdAt) }}</el-text>
          </el-descriptions-item>

          <el-descriptions-item
            v-if="service.description"
            label="Mô tả"
            label-class-name="font-semibold"
            :span="2"
          >
            <el-text class="whitespace-pre-wrap">{{
              service.description
            }}</el-text>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- Package Steps Card (only for PACKAGE type) -->
      <el-card
        v-if="
          service.type === 'PACKAGE' &&
          service.steps &&
          service.steps.length > 0
        "
      >
        <template #header>
          <h2 class="text-xl font-bold">Các bước điều trị</h2>
        </template>

        <el-table :data="service.steps" border stripe>
          <el-table-column label="Bước" width="80" align="center">
            <template #default="{ row }">
              <el-tag type="info" size="large">{{ row.stepNo }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column label="Tên bước" min-width="200">
            <template #default="{ row }">
              <el-text class="font-semibold">{{ row.stepName }}</el-text>
            </template>
          </el-table-column>

          <el-table-column label="Mô tả" min-width="250">
            <template #default="{ row }">
              <el-text class="text-gray-600">{{ row.stepDesc || "-" }}</el-text>
            </template>
          </el-table-column>

          <el-table-column label="Giá" width="150" align="right">
            <template #default="{ row }">
              <el-text class="font-semibold">{{
                formatCurrency(row.price)
              }}</el-text>
            </template>
          </el-table-column>

          <el-table-column label="Số lượng" width="100" align="center">
            <template #default="{ row }">
              <el-text>{{ row.quantity }}</el-text>
            </template>
          </el-table-column>

          <el-table-column label="Thành tiền" width="150" align="right">
            <template #default="{ row }">
              <el-text class="font-bold text-primary">
                {{ formatCurrency(row.price * row.quantity) }}
              </el-text>
            </template>
          </el-table-column>
        </el-table>

        <!-- Total -->
        <div class="flex justify-end mt-4 pr-4">
          <el-text class="text-lg">
            <span class="font-semibold">Tổng giá trị gói:</span>
            <span class="ml-3 font-bold text-primary text-xl">
              {{ formatCurrency(calculateTotalSteps()) }}
            </span>
          </el-text>
        </div>
      </el-card>
    </template>

    <!-- Error state -->
    <el-card v-else>
      <el-empty description="Không tìm thấy dịch vụ" />
    </el-card>

    <!-- Edit Dialog -->
    <ServiceFormDialog
      v-model="dialogVisible"
      :service="service"
      @success="handleSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessageBox } from "element-plus";
import { ArrowLeft, Edit, Delete, Loading } from "@element-plus/icons-vue";
import { notification } from "@/utils/notification";
import { serviceApi } from "@/api/service";
import { useAuthStore } from "@/stores/auth";
import ServiceFormDialog from "./components/ServiceFormDialog.vue";
import type { ServiceCatalog } from "@/types/service";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const loading = ref(false);
const service = ref<ServiceCatalog | null>(null);
const dialogVisible = ref(false);

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
 * Format datetime
 */
const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Calculate total steps price
 */
const calculateTotalSteps = () => {
  if (!service.value?.steps) return 0;
  return service.value.steps.reduce(
    (sum, step) => sum + step.price * step.quantity,
    0,
  );
};

/**
 * Load service detail
 */
const loadService = async () => {
  const serviceId = route.params.id as string;
  if (!serviceId) {
    notification.error("ID dịch vụ không hợp lệ");
    router.push({ name: "Services" });
    return;
  }

  try {
    loading.value = true;
    service.value = await serviceApi.getById(serviceId);
  } catch (error: any) {
    console.error("Load service error:", error);
    notification.error("Không thể tải thông tin dịch vụ");
    router.push({ name: "Services" });
  } finally {
    loading.value = false;
  }
};

/**
 * Handle edit
 */
const handleEdit = () => {
  dialogVisible.value = true;
};

/**
 * Handle delete
 */
const handleDelete = async () => {
  if (!service.value) return;

  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa dịch vụ "${service.value.name}"?`,
      "Xác nhận xóa",
      {
        confirmButtonText: "Xóa",
        cancelButtonText: "Hủy",
        type: "warning",
      },
    );

    loading.value = true;
    await serviceApi.delete(service.value.id);
    notification.success("Xóa dịch vụ thành công!");
    router.push({ name: "Services" });
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("Delete service error:", error);
      notification.error(error?.message || "Không thể xóa dịch vụ");
    }
  } finally {
    loading.value = false;
  }
};

/**
 * Handle success after edit
 */
const handleSuccess = () => {
  dialogVisible.value = false;
  loadService(); // Reload service data
};

/**
 * Load service on mount
 */
onMounted(() => {
  loadService();
});
</script>

<style scoped lang="scss">
.service-detail-view {
  :deep(.el-descriptions__label) {
    width: 180px;
  }

  :deep(.el-descriptions__content) {
    word-break: break-word;
  }
}
</style>
