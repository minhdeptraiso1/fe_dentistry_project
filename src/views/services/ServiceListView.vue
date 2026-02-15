<template>
  <div class="service-list-view">
    <!-- Header with title and create button -->
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Danh mục dịch vụ</h1>
      <el-button v-if="authStore.isAdmin" type="primary" @click="handleCreate">
        <el-icon class="mr-2"><Plus /></el-icon>
        Thêm dịch vụ
      </el-button>
    </div>

    <!-- Filters -->
    <el-card class="mb-6">
      <el-form
        :inline="true"
        :model="searchParams"
        @submit.prevent="handleSearch"
      >
        <el-form-item label="Tìm kiếm">
          <el-input
            v-model="searchParams.keyword"
            placeholder="Tên hoặc mã dịch vụ..."
            clearable
            style="width: 250px"
            @clear="handleSearch"
          />
        </el-form-item>

        <el-form-item label="Loại">
          <el-select
            v-model="searchParams.type"
            placeholder="Tất cả"
            clearable
            style="width: 150px"
            @change="handleSearch"
          >
            <el-option label="Đơn lẻ" value="SINGLE" />
            <el-option label="Gói dịch vụ" value="PACKAGE" />
          </el-select>
        </el-form-item>

        <el-form-item label="Danh mục">
          <el-input
            v-model="searchParams.category"
            placeholder="Nhập danh mục..."
            clearable
            style="width: 200px"
            @clear="handleSearch"
          />
        </el-form-item>

        <el-form-item label="Trạng thái">
          <el-select
            v-model="searchParams.active"
            placeholder="Tất cả"
            clearable
            style="width: 150px"
            @change="handleSearch"
          >
            <el-option label="Hoạt động" :value="true" />
            <el-option label="Ngừng hoạt động" :value="false" />
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
      <el-table v-loading="loading" :data="services" stripe style="width: 100%">
        <el-table-column prop="code" label="Mã dịch vụ" width="120" />
        <el-table-column prop="name" label="Tên dịch vụ" min-width="200" />
        <el-table-column label="Loại" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.type === 'SINGLE'" type="info">Đơn lẻ</el-tag>
            <el-tag v-else type="success">Gói dịch vụ</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="Danh mục" width="150" />
        <el-table-column label="Giá" width="150" align="right">
          <template #default="{ row }">
            {{ formatCurrency(row.basePrice) }}
          </template>
        </el-table-column>
        <el-table-column prop="unit" label="Đơn vị" width="100" />
        <el-table-column label="Thời gian" width="110" align="center">
          <template #default="{ row }">
            {{ row.durationMin ? `${row.durationMin} phút` : "-" }}
          </template>
        </el-table-column>
        <el-table-column label="Trạng thái" width="130" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.active" type="success">Hoạt động</el-tag>
            <el-tag v-else type="danger">Ngừng</el-tag>
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
              @click="handleView(row)"
            >
              Xem
            </el-button>
            <el-button
              v-if="authStore.isAdmin"
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
          v-model:current-page="searchParams.page"
          v-model:page-size="searchParams.size"
          :total="totalElements"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="loadServices"
          @size-change="loadServices"
        />
      </div>
    </el-card>

    <!-- Form Dialog -->
    <ServiceFormDialog
      v-model="dialogVisible"
      :service="selectedService"
      @success="handleSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessageBox } from "element-plus";
import { Plus, Search } from "@element-plus/icons-vue";
import { notification } from "@/utils/notification";
import { serviceApi } from "@/api/service";
import { useAuthStore } from "@/stores/auth";
import ServiceFormDialog from "./components/ServiceFormDialog.vue";
import type { ServiceCatalog, ServiceSearchRequest } from "@/types/service";

const router = useRouter();
const authStore = useAuthStore();

const loading = ref(false);
const services = ref<ServiceCatalog[]>([]);
const totalElements = ref(0);
const dialogVisible = ref(false);
const selectedService = ref<ServiceCatalog | null>(null);

const searchParams = reactive<ServiceSearchRequest>({
  keyword: "",
  type: undefined,
  category: "",
  active: undefined,
  page: 1,
  size: 10,
});

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
 * Load services from API
 */
const loadServices = async () => {
  try {
    loading.value = true;

    // Build params, filter out empty values
    const params: any = {
      page: (searchParams.page || 1) - 1, // Backend uses 0-based index
      size: searchParams.size || 10,
    };

    if (searchParams.keyword?.trim()) {
      params.keyword = searchParams.keyword.trim();
    }
    if (searchParams.type) {
      params.type = searchParams.type;
    }
    if (searchParams.category?.trim()) {
      params.category = searchParams.category.trim();
    }
    if (searchParams.active !== undefined && searchParams.active !== null) {
      params.active = searchParams.active;
    }

    const pageData = await serviceApi.search(params);
    services.value = pageData.content;
    totalElements.value = pageData.totalElements;
  } catch (error: any) {
    console.error("Load services error:", error);
    notification.error("Không thể tải danh sách dịch vụ");
  } finally {
    loading.value = false;
  }
};

/**
 * Handle search
 */
const handleSearch = () => {
  searchParams.page = 1; // Reset to first page
  loadServices();
};

/**
 * Handle reset filters
 */
const handleReset = () => {
  searchParams.keyword = "";
  searchParams.type = undefined;
  searchParams.category = "";
  searchParams.active = undefined;
  searchParams.page = 1;
  loadServices();
};

/**
 * Handle create
 */
const handleCreate = () => {
  selectedService.value = null;
  dialogVisible.value = true;
};

/**
 * Handle view
 */
const handleView = (service: ServiceCatalog) => {
  router.push({ name: "ServiceDetail", params: { id: service.id } });
};

/**
 * Handle edit
 */
const handleEdit = (service: ServiceCatalog) => {
  selectedService.value = service;
  dialogVisible.value = true;
};

/**
 * Handle delete
 */
const handleDelete = async (service: ServiceCatalog) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa dịch vụ "${service.name}"?`,
      "Xác nhận xóa",
      {
        confirmButtonText: "Xóa",
        cancelButtonText: "Hủy",
        type: "warning",
      },
    );

    loading.value = true;
    await serviceApi.delete(service.id);
    notification.success("Xóa dịch vụ thành công!");
    await loadServices();
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
 * Handle success (after create/update)
 */
const handleSuccess = () => {
  dialogVisible.value = false;
  loadServices();
};

/**
 * Load services on mount
 */
onMounted(() => {
  loadServices();
});
</script>

<style scoped lang="scss">
.service-list-view {
  // Custom styles if needed
}
</style>
