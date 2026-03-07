<template>
  <div class="service-detail-view">
    <!-- Header -->
    <div class="detail-header">
      <button @click="router.back()" class="back-button">
        <component :is="BackIcon" />
        <span>Quay lại</span>
      </button>

      <div v-if="authStore.isAdmin && service" class="header-actions">
        <button @click="handleEdit" class="action-button action-button-primary">
          <component :is="EditIcon" />
          <span>Chỉnh sửa</span>
        </button>
        <button
          @click="handleDelete"
          class="action-button action-button-danger"
        >
          <component :is="TrashIcon" />
          <span>Xóa</span>
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Đang tải thông tin dịch vụ...</p>
    </div>

    <!-- Service Detail -->
    <div v-if="service" class="detail-card">
      <div class="card-title">
        <component :is="ServiceIcon" class="title-icon" />
        <h2>{{ service.name }}</h2>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">
            <component :is="CodeIcon" />
            <span>Mã dịch vụ</span>
          </div>
          <div class="info-value">{{ service.code }}</div>
        </div>

        <div class="info-item">
          <div class="info-label">
            <component :is="TypeIcon" />
            <span>Loại dịch vụ</span>
          </div>
          <div class="info-value">
            <span v-if="service.type === 'SINGLE'">Dịch vụ đơn lẻ</span>
            <span v-else>Gói dịch vụ</span>
          </div>
        </div>

        <div class="info-item">
          <div class="info-label">
            <component :is="CategoryIcon" />
            <span>Danh mục</span>
          </div>
          <div class="info-value">{{ service.category || "-" }}</div>
        </div>

        <div class="info-item">
          <div class="info-label">
            <component :is="PriceIcon" />
            <span>Giá cơ bản</span>
          </div>
          <div class="info-value price-highlight">
            {{ formatCurrency(service.basePrice) }}
          </div>
        </div>

        <div class="info-item">
          <div class="info-label">
            <component :is="UnitIcon" />
            <span>Đơn vị</span>
          </div>
          <div class="info-value">{{ service.unit || "-" }}</div>
        </div>

        <div class="info-item">
          <div class="info-label">
            <component :is="TimeIcon" />
            <span>Thời gian dự kiến</span>
          </div>
          <div class="info-value">
            {{ service.durationMin ? `${service.durationMin} phút` : "-" }}
          </div>
        </div>

        <div class="info-item">
          <div class="info-label">
            <component :is="ClockIcon" />
            <span>Ngày tạo</span>
          </div>
          <div class="info-value">
            {{ formatDateTime(service.createdAt) }}
          </div>
        </div>

        <div class="info-item">
          <div class="info-label">
            <component :is="ClockIcon" />
            <span>Cập nhật lần cuối</span>
          </div>
          <div class="info-value">
            {{ formatDateTime(service.updatedAt) }}
          </div>
        </div>

        <div v-if="service.description" class="info-item full-width">
          <div class="info-label">
            <component :is="NoteIcon" />
            <span>Mô tả</span>
          </div>
          <div class="info-value whitespace-pre-wrap">
            {{ service.description }}
          </div>
        </div>
      </div>
    </div>

    <!-- Package Steps Card -->
    <div
      v-if="
        service &&
        service.type === 'PACKAGE' &&
        service.steps &&
        service.steps.length > 0
      "
      class="detail-card steps-card"
    >
      <div class="card-title">
        <component :is="StepsIcon" class="title-icon" />
        <h2>Các bước điều trị</h2>
      </div>

      <div class="steps-table">
        <el-table :data="service.steps" stripe class="modern-table">
          <el-table-column label="Bước" width="80" align="center">
            <template #default="{ row }">
              <el-tag type="info" effect="light" size="large">
                {{ row.stepNo }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="Tên bước" min-width="200">
            <template #default="{ row }">
              <span class="font-semibold text-gray-900">{{
                row.stepName
              }}</span>
            </template>
          </el-table-column>

          <el-table-column label="Mô tả" min-width="250">
            <template #default="{ row }">
              <span class="text-gray-600">{{ row.stepDesc || "-" }}</span>
            </template>
          </el-table-column>

          <el-table-column label="Giá" width="150" align="right">
            <template #default="{ row }">
              <span class="font-medium text-gray-900">{{
                formatCurrency(row.price)
              }}</span>
            </template>
          </el-table-column>

          <el-table-column label="Số lượng" width="100" align="center">
            <template #default="{ row }">
              <span class="text-gray-900">{{ row.quantity }}</span>
            </template>
          </el-table-column>

          <el-table-column label="Thành tiền" width="150" align="right">
            <template #default="{ row }">
              <span class="price-highlight font-semibold">
                {{ formatCurrency(row.price * row.quantity) }}
              </span>
            </template>
          </el-table-column>
        </el-table>

        <!-- Total -->
        <div class="total-row">
          <span class="total-label">Tổng giá trị gói:</span>
          <span class="total-value">
            {{ formatCurrency(calculateTotalSteps()) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="!loading" class="detail-card">
      <el-empty description="Không tìm thấy thông tin dịch vụ" />
    </div>

    <!-- Edit Dialog -->
    <ServiceFormDialog
      v-model="dialogVisible"
      :service="service"
      @success="handleSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { useAuthStore } from "@/stores/auth";
import ServiceFormDialog from "./components/ServiceFormDialog.vue";
import type { ServiceCatalog } from "@/types/service";
import { serviceApi } from "@/api/service";

// Custom Icons
const BackIcon = () =>
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
      style: "width: 20px; height: 20px;",
    },
    [h("path", { d: "M19 12H5" }), h("path", { d: "M12 19l-7-7 7-7" })],
  );

const EditIcon = () =>
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
      style: "width: 20px; height: 20px;",
    },
    [
      h("path", {
        d: "M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z",
      }),
    ],
  );

const TrashIcon = () =>
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
      style: "width: 20px; height: 20px;",
    },
    [
      h("path", { d: "M3 6h18" }),
      h("path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" }),
      h("path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" }),
      h("line", { x1: "10", y1: "11", x2: "10", y2: "17" }),
      h("line", { x1: "14", y1: "11", x2: "14", y2: "17" }),
    ],
  );

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
      style: "width: 20px; height: 20px;",
    },
    [
      h("path", {
        d: "M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z",
      }),
      h("polyline", { points: "14 2 14 8 20 8" }),
      h("line", { x1: "12", y1: "18", x2: "12", y2: "12" }),
      h("line", { x1: "9", y1: "15", x2: "15", y2: "15" }),
    ],
  );

const CodeIcon = () =>
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
      style: "width: 20px; height: 20px;",
    },
    [
      h("path", { d: "M4 7h16" }),
      h("path", { d: "M4 12h16" }),
      h("path", { d: "M4 17h16" }),
    ],
  );

const TypeIcon = () =>
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
      style: "width: 20px; height: 20px;",
    },
    [
      h("rect", {
        x: "3",
        y: "3",
        width: "18",
        height: "18",
        rx: "2",
        ry: "2",
      }),
      h("line", { x1: "9", y1: "3", x2: "9", y2: "21" }),
    ],
  );

const CategoryIcon = () =>
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
      style: "width: 20px; height: 20px;",
    },
    [
      h("rect", { x: "3", y: "3", width: "7", height: "7" }),
      h("rect", { x: "14", y: "3", width: "7", height: "7" }),
      h("rect", { x: "14", y: "14", width: "7", height: "7" }),
      h("rect", { x: "3", y: "14", width: "7", height: "7" }),
    ],
  );

const PriceIcon = () =>
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
      style: "width: 20px; height: 20px;",
    },
    [
      h("line", { x1: "12", y1: "1", x2: "12", y2: "23" }),
      h("path", { d: "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" }),
    ],
  );

const UnitIcon = () =>
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
      style: "width: 20px; height: 20px;",
    },
    [
      h("path", {
        d: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
      }),
    ],
  );

const TimeIcon = () =>
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
      style: "width: 20px; height: 20px;",
    },
    [
      h("circle", { cx: "12", cy: "12", r: "10" }),
      h("polyline", { points: "12 6 12 12 16 14" }),
    ],
  );

const ClockIcon = () =>
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
      style: "width: 20px; height: 20px;",
    },
    [
      h("rect", {
        x: "3",
        y: "4",
        width: "18",
        height: "18",
        rx: "2",
        ry: "2",
      }),
      h("line", { x1: "16", y1: "2", x2: "16", y2: "6" }),
      h("line", { x1: "8", y1: "2", x2: "8", y2: "6" }),
      h("line", { x1: "3", y1: "10", x2: "21", y2: "10" }),
    ],
  );

const NoteIcon = () =>
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
      style: "width: 20px; height: 20px;",
    },
    [
      h("path", {
        d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z",
      }),
      h("polyline", { points: "14 2 14 8 20 8" }),
      h("line", { x1: "16", y1: "13", x2: "8", y2: "13" }),
      h("line", { x1: "16", y1: "17", x2: "8", y2: "17" }),
      h("polyline", { points: "10 9 9 9 8 9" }),
    ],
  );

const StepsIcon = () =>
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
      style: "width: 20px; height: 20px;",
    },
    [
      h("line", { x1: "8", y1: "6", x2: "21", y2: "6" }),
      h("line", { x1: "8", y1: "12", x2: "21", y2: "12" }),
      h("line", { x1: "8", y1: "18", x2: "21", y2: "18" }),
      h("line", { x1: "3", y1: "6", x2: "3.01", y2: "6" }),
      h("line", { x1: "3", y1: "12", x2: "3.01", y2: "12" }),
      h("line", { x1: "3", y1: "18", x2: "3.01", y2: "18" }),
    ],
  );

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const loading = ref(false);
const service = ref<ServiceCatalog | null>(null);
const dialogVisible = ref(false);

const fetchService = async () => {
  loading.value = true;
  try {
    const id = String(route.params.id);
    service.value = await serviceApi.getById(id);
  } catch (error) {
    ElMessage.error("Không thể tải thông tin dịch vụ");
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const handleEdit = () => {
  dialogVisible.value = true;
};

const handleDelete = () => {
  if (!service.value) return;

  ElMessageBox.confirm(
    `Bạn có chắc chắn muốn xóa dịch vụ "${service.value.name}"?`,
    "Xác nhận xóa",
    {
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
      customClass: "modern-confirm-dialog",
      confirmButtonClass: "modern-confirm-button",
      cancelButtonClass: "modern-cancel-button",
    },
  )
    .then(async () => {
      try {
        await serviceApi.delete(service.value!.id);
        ElMessage.success("Xóa dịch vụ thành công");
        router.push("/services");
      } catch (error) {
        ElMessage.error("Không thể xóa dịch vụ");
        console.error(error);
      }
    })
    .catch(() => {
      // Cancelled
    });
};

const handleSuccess = () => {
  dialogVisible.value = false;
  fetchService();
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const calculateTotalSteps = (): number => {
  if (!service.value || !service.value.steps) return 0;
  return service.value.steps.reduce(
    (total, step) => total + step.price * step.quantity,
    0,
  );
};

onMounted(() => {
  fetchService();
});
</script>

<style scoped lang="scss">
.service-detail-view {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

// Header
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  .back-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    color: #6b7280;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: #f9fafb;
      border-color: #14b8a6;
      color: #14b8a6;
      transform: translateX(-4px);
    }

    svg {
      width: 20px;
      height: 20px;
    }
  }

  .header-actions {
    display: flex;
    gap: 12px;
  }

  .action-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    color: white;

    &.action-button-primary {
      background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
      box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(20, 184, 166, 0.4);
      }
    }

    &.action-button-danger {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
      }
    }

    &:active {
      transform: translateY(0);
    }
  }
}

// Loading
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: #6b7280;

  .loading-spinner {
    width: 48px;
    height: 48px;
    border: 4px solid #e5e7eb;
    border-top-color: #14b8a6;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: 16px;
  }

  p {
    font-size: 16px;
    color: #9ca3af;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// Detail Card
.detail-card {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;

  .card-title {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 32px;
    padding-bottom: 20px;
    border-bottom: 2px solid #f3f4f6;

    .title-icon {
      width: 32px;
      height: 32px;
      color: #14b8a6;
      flex-shrink: 0;
    }

    h2 {
      font-size: 24px;
      font-weight: 700;
      color: #111827;
      margin: 0;
      flex: 1;
    }
  }
}

// Info Grid
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 8px;

    &.full-width {
      grid-column: 1 / -1;
    }

    .info-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;

      svg {
        width: 18px;
        height: 18px;
        color: #14b8a6;
      }
    }

    .info-value {
      font-size: 15px;
      color: #111827;
      padding: 12px 16px;
      background: #f9fafb;
      border-radius: 10px;
      border-left: 3px solid #14b8a6;
      min-height: 44px;
      display: flex;
      align-items: center;

      &.price-highlight {
        font-weight: 600;
        color: #14b8a6;
        font-size: 16px;
      }
    }
  }
}

// Steps Card
.steps-card {
  .card-title {
    margin-bottom: 24px;
  }

  .steps-table {
    .modern-table {
      width: 100%;

      :deep(.el-table__header) {
        th {
          background: #f9fafb;
          color: #374151;
          font-weight: 600;
          font-size: 14px;
        }
      }

      :deep(.el-table__row) {
        &:hover {
          background: #f0fdfa;
        }

        td {
          padding: 16px 12px;
          font-size: 14px;
        }
      }
    }

    .total-row {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 16px;
      padding: 20px 24px;
      margin-top: 16px;
      background: linear-gradient(135deg, #f0fdfa 0%, #e0f2f0 100%);
      border-radius: 12px;

      .total-label {
        font-size: 16px;
        font-weight: 600;
        color: #374151;
      }

      .total-value {
        font-size: 20px;
        font-weight: 700;
        color: #14b8a6;
      }
    }
  }
}
</style>
