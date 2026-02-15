<template>
  <div class="treatment-plan-detail">
    <el-card v-loading="loading">
      <template #header>
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-3">
            <el-button
              type="default"
              :icon="ArrowLeft"
              circle
              @click="handleBack"
            />
            <h2 class="text-xl font-semibold">Chi tiết kế hoạch điều trị</h2>
          </div>
          <div class="flex gap-2">
            <el-button
              v-if="canEdit"
              type="warning"
              :icon="Edit"
              @click="handleEdit"
            >
              Sửa
            </el-button>
            <el-button
              v-if="authStore.isAdmin"
              type="danger"
              :icon="Delete"
              @click="handleDelete"
            >
              Xóa
            </el-button>
          </div>
        </div>
      </template>

      <div v-if="treatmentPlan">
        <!-- Basic Info -->
        <el-descriptions :column="2" border>
          <el-descriptions-item label="Mã kế hoạch">
            <span class="font-semibold">{{ treatmentPlan.planCode }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="Trạng thái">
            <el-tag :type="getStatusType(treatmentPlan.status)">
              {{ getStatusLabel(treatmentPlan.status) }}
            </el-tag>
          </el-descriptions-item>

          <el-descriptions-item label="Mã bệnh nhân">
            {{ treatmentPlan.patientCode }}
          </el-descriptions-item>
          <el-descriptions-item label="Tên bệnh nhân">
            <router-link
              :to="`/patients/${treatmentPlan.patientId}`"
              class="text-blue-600 hover:underline"
            >
              {{ treatmentPlan.patientName }}
            </router-link>
          </el-descriptions-item>

          <el-descriptions-item label="Bác sĩ">
            {{ treatmentPlan.doctorUsername }}
          </el-descriptions-item>
          <el-descriptions-item label="Mã hồ sơ">
            <router-link
              :to="`/medical-records/${treatmentPlan.medicalRecordId}`"
              class="text-blue-600 hover:underline"
            >
              {{ treatmentPlan.medicalRecordId }}
            </router-link>
          </el-descriptions-item>

          <el-descriptions-item label="Ngày tạo">
            {{ formatDateTime(treatmentPlan.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="Cập nhật">
            {{ formatDateTime(treatmentPlan.updatedAt) }}
          </el-descriptions-item>

          <el-descriptions-item label="Ghi chú" :span="2">
            {{ treatmentPlan.note || "—" }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- Treatment Items -->
        <el-divider content-position="left">
          <span class="text-lg font-semibold">Danh sách dịch vụ điều trị</span>
        </el-divider>

        <el-table
          :data="treatmentPlan.items"
          border
          stripe
          style="width: 100%"
          :summary-method="getSummaries"
          show-summary
        >
          <el-table-column type="index" label="STT" width="60" />
          <el-table-column prop="serviceCode" label="Mã DV" width="100" />
          <el-table-column
            prop="itemName"
            label="Tên dịch vụ"
            min-width="180"
          />
          <el-table-column label="Loại" width="100">
            <template #default="{ row }">
              <el-tag
                :type="row.serviceType === 'SINGLE' ? 'success' : 'warning'"
                size="small"
              >
                {{ row.serviceType === "SINGLE" ? "Đơn lẻ" : "Gói" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="quantity"
            label="SL"
            width="70"
            align="center"
          />
          <el-table-column label="Đơn giá" width="130" align="right">
            <template #default="{ row }">
              {{ formatCurrency(row.unitPrice) }}
            </template>
          </el-table-column>
          <el-table-column label="Giảm giá" width="120" align="right">
            <template #default="{ row }">
              <span class="text-red-600">
                {{ formatCurrency(row.discountAmount) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="Thành tiền" width="140" align="right">
            <template #default="{ row }">
              <span class="font-semibold text-green-600">
                {{ formatCurrency(row.lineTotal) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="Số răng" width="90">
            <template #default="{ row }">
              {{ row.toothNo || "—" }}
            </template>
          </el-table-column>
          <el-table-column label="Mặt răng" width="90">
            <template #default="{ row }">
              {{ row.toothSurface || "—" }}
            </template>
          </el-table-column>
          <el-table-column label="Trạng thái" width="120">
            <template #default="{ row }">
              <el-tag :type="getItemStatusType(row.status)" size="small">
                {{ getItemStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="Ghi chú" min-width="150">
            <template #default="{ row }">
              {{ row.note || "—" }}
            </template>
          </el-table-column>
          <el-table-column label="Thao tác" width="100" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="canMarkDone(row.status)"
                type="success"
                size="small"
                link
                @click="handleMarkDone(row.id)"
              >
                <el-icon><Check /></el-icon>
                Hoàn thành
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- Total Summary -->
        <div class="mt-6 flex justify-end">
          <el-card style="width: 400px" shadow="never">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="Tổng tiền">
                <span class="text-lg font-semibold">
                  {{ formatCurrency(treatmentPlan.totalAmount) }}
                </span>
              </el-descriptions-item>
              <el-descriptions-item label="Tổng giảm giá">
                <span class="text-lg font-semibold text-red-600">
                  {{ formatCurrency(treatmentPlan.discountAmount) }}
                </span>
              </el-descriptions-item>
              <el-descriptions-item label="Thành tiền">
                <span class="text-xl font-bold text-green-600">
                  {{ formatCurrency(treatmentPlan.finalAmount) }}
                </span>
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
        </div>
      </div>
    </el-card>

    <!-- Form Dialog -->
    <TreatmentPlanFormDialog
      v-if="formDialogVisible"
      v-model="formDialogVisible"
      :treatment-plan="treatmentPlan"
      @success="loadTreatmentPlan"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { ArrowLeft, Edit, Delete, Check } from "@element-plus/icons-vue";
import { treatmentPlanApi } from "@/api/treatmentPlan";
import { useAuthStore } from "@/stores/auth";
import type {
  TreatmentPlan,
  TreatmentPlanStatus,
  TreatmentItemStatus,
} from "@/types/treatmentPlan";
import TreatmentPlanFormDialog from "./components/TreatmentPlanFormDialog.vue";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const loading = ref(false);
const treatmentPlan = ref<TreatmentPlan | null>(null);
const formDialogVisible = ref(false);

const canEdit = computed(() => {
  if (!treatmentPlan.value) return false;
  return (
    (authStore.isDoctor || authStore.isAdmin) &&
    (treatmentPlan.value.status === "DRAFT" ||
      treatmentPlan.value.status === "APPROVED")
  );
});

const canMarkDone = (status: TreatmentItemStatus) => {
  return (authStore.isDoctor || authStore.isAdmin) && status === "PLANNED";
};

const loadTreatmentPlan = async () => {
  const id = route.params.id as string;
  if (!id) return;

  try {
    loading.value = true;
    const response = await treatmentPlanApi.getById(id);
    treatmentPlan.value = response;
  } catch (error) {
    console.error("Failed to load treatment plan:", error);
    ElMessage.error("Tải kế hoạch điều trị thất bại");
  } finally {
    loading.value = false;
  }
};

const handleBack = () => {
  router.back();
};

const handleEdit = () => {
  formDialogVisible.value = true;
};

const handleDelete = async () => {
  if (!treatmentPlan.value) return;

  try {
    await ElMessageBox.confirm(
      `Xác nhận xóa kế hoạch điều trị "${treatmentPlan.value.planCode}"?`,
      "Xác nhận",
      {
        confirmButtonText: "Xóa",
        cancelButtonText: "Hủy",
        type: "warning",
      },
    );

    await treatmentPlanApi.delete(treatmentPlan.value.id);
    ElMessage.success("Xóa kế hoạch điều trị thành công");
    router.push("/treatment-plans");
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("Failed to delete treatment plan:", error);
      ElMessage.error("Xóa kế hoạch điều trị thất bại");
    }
  }
};

const handleMarkDone = async (itemId: string) => {
  if (!treatmentPlan.value) return;

  try {
    await ElMessageBox.confirm(
      "Xác nhận đánh dấu dịch vụ này đã hoàn thành?",
      "Xác nhận",
      {
        confirmButtonText: "Xác nhận",
        cancelButtonText: "Hủy",
        type: "success",
      },
    );

    const response = await treatmentPlanApi.markItemDone(
      treatmentPlan.value.id,
      itemId,
    );
    treatmentPlan.value = response;
    ElMessage.success("Đánh dấu hoàn thành thành công");
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("Failed to mark item done:", error);
      ElMessage.error("Đánh dấu hoàn thành thất bại");
    }
  }
};

const getStatusType = (status: TreatmentPlanStatus) => {
  const typeMap: Record<TreatmentPlanStatus, any> = {
    DRAFT: "info",
    APPROVED: "success",
    IN_PROGRESS: "warning",
    DONE: "success",
    CANCELLED: "danger",
  };
  return typeMap[status];
};

const getStatusLabel = (status: TreatmentPlanStatus) => {
  const labelMap: Record<TreatmentPlanStatus, string> = {
    DRAFT: "Nháp",
    APPROVED: "Đã duyệt",
    IN_PROGRESS: "Đang thực hiện",
    DONE: "Hoàn thành",
    CANCELLED: "Đã hủy",
  };
  return labelMap[status];
};

const getItemStatusType = (status: TreatmentItemStatus) => {
  const typeMap: Record<TreatmentItemStatus, any> = {
    PLANNED: "info",
    DONE: "success",
    CANCELLED: "danger",
  };
  return typeMap[status];
};

const getItemStatusLabel = (status: TreatmentItemStatus) => {
  const labelMap: Record<TreatmentItemStatus, string> = {
    PLANNED: "Kế hoạch",
    DONE: "Hoàn thành",
    CANCELLED: "Đã hủy",
  };
  return labelMap[status];
};

const getSummaries = (param: any) => {
  const { columns } = param;
  const sums: string[] = [];

  columns.forEach((_column: any, index: number) => {
    if (index === 0) {
      sums[index] = "Tổng cộng";
      return;
    }
    if (index === 4) {
      // Quantity column
      const total = treatmentPlan.value?.items.reduce(
        (sum, item) => sum + item.quantity,
        0,
      );
      sums[index] = total?.toString() || "0";
      return;
    }
    if (index === 6) {
      // Discount column
      sums[index] = formatCurrency(treatmentPlan.value?.discountAmount || 0);
      return;
    }
    if (index === 7) {
      // Line total column
      sums[index] = formatCurrency(treatmentPlan.value?.finalAmount || 0);
      return;
    }
    sums[index] = "";
  });

  return sums;
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

onMounted(() => {
  loadTreatmentPlan();
});
</script>

<style scoped>
.treatment-plan-detail {
  padding: 20px;
}
</style>
