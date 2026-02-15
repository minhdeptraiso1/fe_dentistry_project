<template>
  <div class="treatment-plan-list">
    <!-- Header with title -->
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Kế hoạch điều trị</h1>
    </div>

    <!-- Filters -->
    <el-card class="mb-6">
      <el-form
        :inline="true"
        :model="searchForm"
        @submit.prevent="handleSearch"
      >
        <el-form-item label="Bệnh nhân">
          <el-select
            v-model="searchForm.patientId"
            placeholder="Chọn bệnh nhân"
            clearable
            filterable
            :loading="patientLoading"
            style="width: 240px"
            @change="handleSearch"
            @clear="handleSearch"
          >
            <el-option
              v-for="patient in patientOptions"
              :key="patient.id"
              :label="`${patient.patientCode} - ${patient.fullName}`"
              :value="patient.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Trạng thái">
          <el-select
            v-model="searchForm.status"
            placeholder="Tất cả"
            clearable
            style="width: 150px"
            @change="handleSearch"
          >
            <el-option label="Nháp" value="DRAFT" />
            <el-option label="Đã duyệt" value="APPROVED" />
            <el-option label="Đang thực hiện" value="IN_PROGRESS" />
            <el-option label="Hoàn thành" value="DONE" />
            <el-option label="Đã hủy" value="CANCELLED" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon class="mr-2"><Search /></el-icon>
            Tìm kiếm
          </el-button>
          <el-button @click="handleReset">Đặt lại</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Table -->
    <el-card>
      <el-table
        v-loading="loading"
        :data="tableData"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="planCode" label="Mã KH" width="120" />
        <el-table-column prop="patientCode" label="Mã BN" width="100" />
        <el-table-column prop="patientName" label="Bệnh nhân" min-width="150" />
        <el-table-column prop="doctorUsername" label="Bác sĩ" width="120" />
        <el-table-column label="Trạng thái" width="140">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Tổng tiền" width="140" align="right">
          <template #default="{ row }">
            {{ formatCurrency(row.totalAmount) }}
          </template>
        </el-table-column>
        <el-table-column label="Giảm giá" width="120" align="right">
          <template #default="{ row }">
            {{ formatCurrency(row.discountAmount) }}
          </template>
        </el-table-column>
        <el-table-column label="Thành tiền" width="140" align="right">
          <template #default="{ row }">
            <span class="font-semibold text-green-600">
              {{ formatCurrency(row.finalAmount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="Ngày tạo" width="110">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column
          label="Thao tác"
          width="180"
          align="center"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              size="small"
              @click="handleView(row.id)"
            >
              Xem
            </el-button>
            <el-button
              v-if="canEdit(row.status)"
              link
              type="primary"
              size="small"
              @click="handleEdit(row)"
            >
              Sửa
            </el-button>
            <el-button
              v-if="authStore.isAdmin"
              link
              type="danger"
              size="small"
              @click="handleDelete(row)"
            >
              Xóa
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="flex justify-end mt-4">
        <el-pagination
          v-model:current-page="searchForm.page"
          v-model:page-size="searchForm.size"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handleSearch"
          @size-change="handleSearch"
        />
      </div>
    </el-card>

    <!-- Form Dialog -->
    <TreatmentPlanFormDialog
      v-if="formDialogVisible"
      v-model="formDialogVisible"
      :treatment-plan="currentTreatmentPlan"
      @success="handleSearch"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { Search } from "@element-plus/icons-vue";
import { treatmentPlanApi } from "@/api/treatmentPlan";
import { patientApi } from "@/api/patient";
import { useAuthStore } from "@/stores/auth";
import type { TreatmentPlan, TreatmentPlanStatus } from "@/types/treatmentPlan";
import type { Patient } from "@/types";
import TreatmentPlanFormDialog from "./components/TreatmentPlanFormDialog.vue";

const router = useRouter();
const authStore = useAuthStore();

const loading = ref(false);
const tableData = ref<TreatmentPlan[]>([]);
const total = ref(0);
const formDialogVisible = ref(false);
const currentTreatmentPlan = ref<TreatmentPlan | null>(null);

const patientLoading = ref(false);
const patientOptions = ref<Patient[]>([]);

const searchForm = reactive({
  patientId: "",
  status: "",
  page: 1,
  size: 10,
});

// Load all patients for filter dropdown
const loadPatients = async () => {
  try {
    patientLoading.value = true;
    const response = await patientApi.search({
      page: 0,
      size: 1000, // Load all patients
    });
    patientOptions.value = response.content || [];
  } catch (error) {
    console.error("Failed to load patients:", error);
  } finally {
    patientLoading.value = false;
  }
};

// Load treatment plans
const loadTreatmentPlans = async () => {
  if (!searchForm.patientId) {
    tableData.value = [];
    total.value = 0;
    return;
  }

  try {
    loading.value = true;
    const response = await treatmentPlanApi.listByPatient(
      searchForm.patientId,
      {
        page: searchForm.page - 1,
        size: searchForm.size,
      },
    );

    // Filter by status if selected
    let content = response.content || [];
    if (searchForm.status) {
      content = content.filter(
        (plan: TreatmentPlan) => plan.status === searchForm.status,
      );
    }

    tableData.value = content;
    total.value = response.totalElements || 0;
  } catch (error) {
    console.error("Failed to load treatment plans:", error);
    ElMessage.error("Tải danh sách kế hoạch điều trị thất bại");
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  searchForm.page = 1;
  loadTreatmentPlans();
};

const handleReset = () => {
  searchForm.patientId = "";
  searchForm.status = "";
  searchForm.page = 1;
  searchForm.size = 10;
  tableData.value = [];
  total.value = 0;
  // Keep patientOptions loaded for reuse
};

const handleView = (id: string) => {
  router.push(`/treatment-plans/${id}`);
};

const handleEdit = (plan: TreatmentPlan) => {
  currentTreatmentPlan.value = plan;
  formDialogVisible.value = true;
};

const handleDelete = async (plan: TreatmentPlan) => {
  try {
    await ElMessageBox.confirm(
      `Xác nhận xóa kế hoạch điều trị "${plan.planCode}"?`,
      "Xác nhận",
      {
        confirmButtonText: "Xóa",
        cancelButtonText: "Hủy",
        type: "warning",
      },
    );

    await treatmentPlanApi.delete(plan.id);
    ElMessage.success("Xóa kế hoạch điều trị thành công");
    loadTreatmentPlans();
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("Failed to delete treatment plan:", error);
      ElMessage.error("Xóa kế hoạch điều trị thất bại");
    }
  }
};

const canEdit = (status: TreatmentPlanStatus) => {
  return (
    (authStore.isDoctor || authStore.isAdmin) &&
    (status === "DRAFT" || status === "APPROVED")
  );
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

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("vi-VN");
};

onMounted(() => {
  // Load patients list for filter dropdown
  loadPatients();

  // Load initial data if patientId is in route query
  const patientId = router.currentRoute.value.query.patientId as string;
  const medicalRecordId = router.currentRoute.value.query
    .medicalRecordId as string;

  if (patientId) {
    searchForm.patientId = patientId;
    handleSearch();
  }

  // If medicalRecordId is provided, open form dialog to create new treatment plan
  if (medicalRecordId) {
    // Create a mock treatment plan object with just the medicalRecordId
    // This will be used by the form dialog to pre-fill the medical record
    currentTreatmentPlan.value = {
      medicalRecordId,
    } as any;
    formDialogVisible.value = true;
  }
});
</script>

<style scoped>
.treatment-plan-list {
  padding: 20px;
}
</style>
