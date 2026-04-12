<template>
  <div class="public-content-view">
    <div class="page-header">
      <div>
        <h1 class="page-title">Quản lý thông tin công khai</h1>
        <p class="page-subtitle">Quản trị nội dung hiển thị ngoài website</p>
      </div>
      <button @click="handleCreate" class="add-button">
        <component :is="PlusIcon" />
        <span>Thêm nội dung</span>
      </button>
    </div>

    <div class="search-card">
      <div class="search-header">
        <component :is="SearchIcon" class="search-header-icon" />
        <span class="search-header-text">Bộ lọc tìm kiếm</span>
      </div>
      <div class="search-content">
        <div class="search-row">
          <el-input
            v-model="searchParams.keyword"
            placeholder="Tìm theo tiêu đề, mô tả..."
            clearable
            @clear="handleSearch"
            class="search-input"
          >
            <template #prefix>
              <component :is="SearchIcon" class="input-icon" />
            </template>
          </el-input>

          <el-select
            v-model="searchParams.refType"
            placeholder="Loại nội dung"
            clearable
            @change="handleSearch"
            class="search-select"
          >
            <el-option label="Bác sĩ" value="DOCTOR" />
            <el-option label="Dịch vụ" value="SERVICE" />
            <el-option label="Thuốc" value="MEDICINE" />
          </el-select>

          <el-select
            v-model="searchParams.active"
            placeholder="Trạng thái"
            clearable
            @change="handleSearch"
            class="search-select"
          >
            <el-option label="Đang hiển thị" :value="true" />
            <el-option label="Đang ẩn" :value="false" />
          </el-select>

          <el-select
            v-model="searchParams.featured"
            placeholder="Nổi bật"
            clearable
            @change="handleSearch"
            class="search-select"
          >
            <el-option label="Nổi bật" :value="true" />
            <el-option label="Không nổi bật" :value="false" />
          </el-select>
        </div>

        <div class="search-actions">
          <button @click="handleSearch" class="search-button">
            <component :is="SearchIcon" />
            <span>Tìm kiếm</span>
          </button>
          <button @click="handleReset" class="reset-button">
            <component :is="ResetIcon" />
            <span>Đặt lại</span>
          </button>
        </div>
      </div>
    </div>

    <div class="table-card">
      <el-table v-loading="loading" :data="items" stripe class="modern-table">
        <el-table-column
          prop="title"
          label="Tiêu đề"
          min-width="220"
          show-overflow-tooltip
        />
        <el-table-column label="Loại" width="120" align="center">
          <template #default="{ row }">
            <el-tag effect="light">{{ getTypeLabel(row.refType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="slug"
          label="Slug"
          min-width="160"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span class="text-gray-600">{{ row.slug || "-" }}</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="sortOrder"
          label="Thứ tự"
          width="90"
          align="center"
        >
          <template #default="{ row }">
            {{ row.sortOrder ?? 0 }}
          </template>
        </el-table-column>
        <el-table-column label="Nổi bật" width="110" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.featured" type="warning" effect="light"
              >Có</el-tag
            >
            <el-tag v-else type="info" effect="plain">Không</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Trạng thái" width="120" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.active" type="success" effect="light"
              >Hiển thị</el-tag
            >
            <el-tag v-else type="danger" effect="light">Ẩn</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="Thao tác"
          width="280"
          align="center"
          fixed="right"
        >
          <template #default="{ row }">
            <div class="action-buttons">
              <button
                @click="handleView(row.id)"
                class="action-btn action-btn-info"
              >
                <component :is="EyeIcon" />
                <span>Xem</span>
              </button>
              <button
                @click="handleEdit(row.id)"
                class="action-btn action-btn-primary"
              >
                <component :is="EditIcon" />
                <span>Sửa</span>
              </button>
              <button
                @click="handleDelete(row.id, row.title)"
                class="action-btn action-btn-danger"
              >
                <component :is="TrashIcon" />
                <span>Xóa</span>
              </button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="searchParams.page"
          v-model:page-size="searchParams.size"
          :total="totalElements"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="loadData"
          @size-change="handleSizeChange"
        />
      </div>
    </div>

    <PublicContentFormDialog ref="formDialogRef" @success="loadData" />
  </div>
</template>

<script setup lang="ts">
import { h, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessageBox } from "element-plus";
import { notification } from "@/utils/notification";
import { publicContentApi } from "@/api/publicContent";
import PublicContentFormDialog from "./components/PublicContentFormDialog.vue";
import type {
  PublicContentSearchRequest,
  PublicContentSummary,
  PublicContentType,
} from "@/types/publicContent";

const router = useRouter();

const PlusIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "stroke-width": "2",
      stroke: "currentColor",
      class: "w-5 h-5",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M12 4v16m8-8H4",
      }),
    ],
  );

const SearchIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "stroke-width": "2",
      stroke: "currentColor",
      class: "w-5 h-5",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
      }),
    ],
  );

const ResetIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "stroke-width": "2",
      stroke: "currentColor",
      class: "w-5 h-5",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99",
      }),
    ],
  );

const EyeIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "stroke-width": "2",
      stroke: "currentColor",
      class: "w-4 h-4",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z",
      }),
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z",
      }),
    ],
  );

const EditIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "stroke-width": "2",
      stroke: "currentColor",
      class: "w-4 h-4",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10",
      }),
    ],
  );

const TrashIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "stroke-width": "2",
      stroke: "currentColor",
      class: "w-4 h-4",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0",
      }),
    ],
  );

const loading = ref(false);
const items = ref<PublicContentSummary[]>([]);
const totalElements = ref(0);
const formDialogRef = ref<InstanceType<typeof PublicContentFormDialog> | null>(
  null,
);

const searchParams = reactive<PublicContentSearchRequest>({
  keyword: "",
  refType: undefined,
  active: undefined,
  featured: undefined,
  page: 1,
  size: 10,
  sort: ["sortOrder,asc", "id,desc"],
});

const getTypeLabel = (type: PublicContentType) => {
  if (type === "DOCTOR") return "Bác sĩ";
  if (type === "MEDICINE") return "Thuốc";
  return "Dịch vụ";
};

const loadData = async () => {
  try {
    loading.value = true;

    const params: PublicContentSearchRequest = {
      page: (searchParams.page || 1) - 1,
      size: searchParams.size || 10,
      sort: searchParams.sort,
    };

    if (searchParams.keyword?.trim())
      params.keyword = searchParams.keyword.trim();
    if (searchParams.refType) params.refType = searchParams.refType;
    if (searchParams.active !== undefined) params.active = searchParams.active;
    if (searchParams.featured !== undefined)
      params.featured = searchParams.featured;
    if (searchParams.refId?.trim()) params.refId = searchParams.refId.trim();

    const pageData = await publicContentApi.search(params);
    items.value = pageData.content || [];
    totalElements.value = pageData.totalElements || 0;
  } catch (error) {
    console.error("Load public content error:", error);
    notification.error("Không thể tải danh sách nội dung");
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  searchParams.page = 1;
  loadData();
};

const handleReset = () => {
  searchParams.keyword = "";
  searchParams.refType = undefined;
  searchParams.active = undefined;
  searchParams.featured = undefined;
  searchParams.page = 1;
  searchParams.size = 10;
  searchParams.sort = ["sortOrder,asc", "id,desc"];
  loadData();
};

const handleSizeChange = () => {
  searchParams.page = 1;
  loadData();
};

const handleCreate = () => {
  formDialogRef.value?.openCreate();
};

const handleView = (id: string) => {
  router.push(`/public-contents/${id}`);
};

const handleEdit = (id: string) => {
  formDialogRef.value?.openEdit(id);
};

const handleDelete = async (id: string, title: string) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc muốn xóa nội dung "${title}"?`,
      "Xác nhận xóa",
      {
        confirmButtonText: "Xóa",
        cancelButtonText: "Hủy",
        type: "warning",
      },
    );

    await publicContentApi.delete(id);
    notification.success("Xóa nội dung thành công");

    if (items.value.length === 1 && (searchParams.page || 1) > 1) {
      searchParams.page = (searchParams.page || 1) - 1;
    }

    loadData();
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("Delete public content error:", error);
      notification.error("Không thể xóa nội dung");
    }
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped lang="scss">
.public-content-view {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;

    .page-title {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      color: #111827;
    }

    .page-subtitle {
      margin: 4px 0 0;
      color: #6b7280;
      font-size: 14px;
    }

    .add-button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border: none;
      border-radius: 10px;
      background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
      color: #ffffff;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 18px rgba(20, 184, 166, 0.28);
      }
    }
  }

  .search-card,
  .table-card {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  .search-card {
    margin-bottom: 16px;

    .search-header {
      padding: 14px 18px;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      align-items: center;
      gap: 8px;

      .search-header-icon {
        width: 18px;
        height: 18px;
        color: #0d9488;
      }

      .search-header-text {
        color: #0f172a;
        font-size: 14px;
        font-weight: 700;
      }
    }

    .search-content {
      padding: 16px 18px;

      .search-row {
        display: grid;
        grid-template-columns: minmax(220px, 1.8fr) repeat(
            3,
            minmax(160px, 1fr)
          );
        gap: 12px;
      }

      .search-actions {
        margin-top: 14px;
        display: flex;
        gap: 10px;

        .search-button,
        .reset-button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 9px;
          padding: 9px 14px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid transparent;
        }

        .search-button {
          background: #0d9488;
          color: #ffffff;
        }

        .reset-button {
          background: #ffffff;
          color: #334155;
          border-color: #cbd5e1;
        }
      }
    }
  }

  .table-card {
    padding: 12px 12px 2px;

    .action-buttons {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 9px;
      border-radius: 8px;
      border: none;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }

    .action-btn-info {
      background: #dbeafe;
      color: #1e40af;
    }

    .action-btn-primary {
      background: #d1fae5;
      color: #065f46;
    }

    .action-btn-danger {
      background: #fee2e2;
      color: #991b1b;
    }

    .pagination-wrapper {
      display: flex;
      justify-content: flex-end;
      padding: 14px 10px 12px;
    }
  }
}

@media (max-width: 1280px) {
  .public-content-view .search-card .search-content .search-row {
    grid-template-columns: repeat(2, minmax(180px, 1fr));
  }
}

@media (max-width: 768px) {
  .public-content-view {
    .page-header {
      flex-direction: column;
      gap: 12px;
    }

    .search-card .search-content .search-row {
      grid-template-columns: 1fr;
    }
  }
}
</style>
