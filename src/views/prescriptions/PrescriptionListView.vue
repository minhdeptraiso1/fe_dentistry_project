<template>
  <div class="prescription-list-view">
    <!-- Page Header -->
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Danh sách đơn thuốc</h1>
      <el-button
        v-if="authStore.isDoctor || authStore.isAdmin"
        type="primary"
        @click="handleCreate"
      >
        <el-icon class="mr-1"><Plus /></el-icon>
        Tạo đơn thuốc
      </el-button>
    </div>

    <!-- Filter Card -->
    <el-card class="mb-4">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="Bệnh nhân">
          <el-select
            v-model="filterForm.patientId"
            placeholder="Chọn bệnh nhân"
            filterable
            clearable
            style="width: 250px"
            @change="handleSearch"
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
            v-model="filterForm.status"
            placeholder="Tất cả"
            clearable
            style="width: 150px"
            @change="handleSearch"
          >
            <el-option label="Nháp" value="DRAFT" />
            <el-option label="Đã kê" value="ISSUED" />
            <el-option label="Đã xuất" value="DISPENSED" />
            <el-option label="Đã hủy" value="CANCELLED" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon class="mr-1"><Search /></el-icon>
            Tìm kiếm
          </el-button>
          <el-button @click="handleReset">Đặt lại</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Table Card -->
    <el-card>
      <el-table
        v-loading="loading"
        :data="prescriptions"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column type="index" label="STT" width="60" />
        <el-table-column
          prop="prescriptionCode"
          label="Mã đơn thuốc"
          width="140"
        />
        <el-table-column label="Bệnh nhân" min-width="180">
          <template #default="{ row }">
            <div>
              <div class="font-semibold">{{ row.patientName }}</div>
              <div class="text-sm text-gray-500">{{ row.patientCode }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Bác sĩ" width="150">
          <template #default="{ row }">
            {{ row.doctorUsername }}
          </template>
        </el-table-column>
        <el-table-column label="Số loại thuốc" width="120" align="center">
          <template #default="{ row }">
            <span class="text-blue-600 font-semibold">
              {{ row.items?.length || 0 }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="Trạng thái" width="130" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Ngày tạo" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column
          label="Thao tác"
          width="280"
          align="center"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              link
              @click="handleView(row)"
            >
              Chi tiết
            </el-button>
            <el-button
              v-if="
                row.status === 'DRAFT' &&
                (authStore.isDoctor || authStore.isAdmin)
              "
              type="warning"
              size="small"
              link
              @click="handleEdit(row)"
            >
              Sửa
            </el-button>
            <el-button
              v-if="
                row.status === 'DRAFT' &&
                (authStore.isDoctor || authStore.isAdmin)
              "
              type="primary"
              size="small"
              link
              @click="handleIssue(row)"
            >
              Phát hành
            </el-button>
            <el-button
              v-if="
                row.status === 'ISSUED' &&
                (authStore.isCashier || authStore.isAdmin)
              "
              type="success"
              size="small"
              link
              @click="handleDispense(row)"
            >
              Xuất thuốc
            </el-button>
            <el-button
              v-if="
                row.status !== 'DISPENSED' &&
                row.status !== 'CANCELLED' &&
                (authStore.isDoctor || authStore.isAdmin)
              "
              type="danger"
              size="small"
              link
              @click="handleCancel(row)"
            >
              Hủy
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="flex justify-end mt-4">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSearch"
          @current-change="handleSearch"
        />
      </div>
    </el-card>

    <!-- Dialogs -->
    <PrescriptionFormDialog
      v-if="formDialogVisible"
      v-model="formDialogVisible"
      :prescription="selectedPrescription"
      @success="handleSearch"
    />

    <PrescriptionDetailDialog
      v-if="detailDialogVisible"
      v-model="detailDialogVisible"
      :prescription="selectedPrescription"
      @success="handleSearch"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Search } from "@element-plus/icons-vue";
import { prescriptionApi } from "@/api/prescription";
import { patientApi } from "@/api/patient";
import { useAuthStore } from "@/stores/auth";
import type { Prescription, PrescriptionStatus } from "@/types/prescription";
import type { Patient } from "@/types";
import PrescriptionFormDialog from "./components/PrescriptionFormDialog.vue";
import PrescriptionDetailDialog from "./components/PrescriptionDetailDialog.vue";

const authStore = useAuthStore();

const loading = ref(false);
const prescriptions = ref<Prescription[]>([]);
const patientOptions = ref<Patient[]>([]);

const filterForm = reactive({
  patientId: "",
  status: "" as PrescriptionStatus | "",
});

const pagination = reactive({
  page: 1,
  size: 20,
  total: 0,
});

const formDialogVisible = ref(false);
const detailDialogVisible = ref(false);
const selectedPrescription = ref<Prescription | undefined>();

const loadPrescriptions = async () => {
  try {
    loading.value = true;
    const response = await prescriptionApi.search({
      patientId: filterForm.patientId || undefined,
      status: filterForm.status || undefined,
      page: pagination.page - 1,
      size: pagination.size,
    });

    prescriptions.value = response.content || [];
    pagination.total = response.totalElements || 0;
  } catch (error) {
    console.error("Failed to load prescriptions:", error);
    ElMessage.error("Không thể tải danh sách đơn thuốc");
  } finally {
    loading.value = false;
  }
};

const loadPatients = async () => {
  try {
    const response = await patientApi.search({
      page: 0,
      size: 1000,
    });
    patientOptions.value = response.content || [];
  } catch (error) {
    console.error("Failed to load patients:", error);
  }
};

const handleSearch = () => {
  pagination.page = 1;
  loadPrescriptions();
};

const handleReset = () => {
  filterForm.patientId = "";
  filterForm.status = "";
  handleSearch();
};

const handleCreate = () => {
  selectedPrescription.value = undefined;
  formDialogVisible.value = true;
};

const handleView = (prescription: Prescription) => {
  selectedPrescription.value = prescription;
  detailDialogVisible.value = true;
};

const handleEdit = (prescription: Prescription) => {
  selectedPrescription.value = prescription;
  formDialogVisible.value = true;
};

const handleIssue = async (prescription: Prescription) => {
  try {
    await ElMessageBox.confirm(
      `Xác nhận phát hành đơn "${prescription.prescriptionCode}"?`,
      "Phát hành đơn thuốc",
      {
        confirmButtonText: "Phát hành",
        cancelButtonText: "Hủy",
        type: "info",
      },
    );

    await prescriptionApi.issue(prescription.id);
    ElMessage.success("Phát hành đơn thuốc thành công");
    handleSearch();
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("Failed to issue prescription:", error);
      ElMessage.error("Phát hành đơn thuốc thất bại");
    }
  }
};

const handleDispense = async (prescription: Prescription) => {
  try {
    const result = await ElMessageBox.prompt(
      `Xác nhận xuất thuốc cho đơn "${prescription.prescriptionCode}"?`,
      "Xuất thuốc",
      {
        confirmButtonText: "Xuất thuốc",
        cancelButtonText: "Hủy",
        inputPlaceholder: "Nhập ghi chú (tùy chọn)",
        inputType: "textarea",
      },
    );

    const note = typeof result === "string" ? result : (result as any).value;
    await prescriptionApi.dispense(prescription.id, {
      note: note || undefined,
    });
    ElMessage.success("Xuất thuốc thành công");
    handleSearch();
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("Failed to dispense:", error);
      ElMessage.error("Xuất thuốc thất bại");
    }
  }
};

const handleCancel = async (prescription: Prescription) => {
  try {
    const result = await ElMessageBox.prompt(
      `Xác nhận hủy đơn thuốc "${prescription.prescriptionCode}"?`,
      "Lý do hủy",
      {
        confirmButtonText: "Hủy đơn",
        cancelButtonText: "Đóng",
        inputPlaceholder: "Nhập lý do hủy (tùy chọn)",
        inputType: "textarea",
      },
    );

    const note = typeof result === "string" ? result : (result as any).value;
    await prescriptionApi.cancel(prescription.id, note || undefined);
    ElMessage.success("Hủy đơn thuốc thành công");
    handleSearch();
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("Failed to cancel prescription:", error);
      ElMessage.error("Hủy đơn thuốc thất bại");
    }
  }
};

const getStatusType = (status: PrescriptionStatus) => {
  const typeMap: Record<PrescriptionStatus, any> = {
    DRAFT: "info",
    ISSUED: "warning",
    DISPENSED: "success",
    CANCELLED: "danger",
  };
  return typeMap[status];
};

const getStatusLabel = (status: PrescriptionStatus) => {
  const labelMap: Record<PrescriptionStatus, string> = {
    DRAFT: "Nháp",
    ISSUED: "Đã kê",
    DISPENSED: "Đã xuất",
    CANCELLED: "Đã hủy",
  };
  return labelMap[status];
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString("vi-VN");
};

onMounted(() => {
  loadPrescriptions();
  loadPatients();
});
</script>

<style scoped>
.prescription-list-view {
  padding: 20px;
}
</style>
