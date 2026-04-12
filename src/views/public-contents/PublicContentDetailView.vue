<template>
  <div class="public-content-detail-container">
    <div class="detail-header">
      <button @click="router.back()" class="back-button">
        <component :is="BackIcon" />
        <span>Quay lại</span>
      </button>
    </div>

    <div class="detail-card" v-loading="loading">
      <template v-if="item">
        <div class="card-title">
          <component :is="ContentIcon" class="title-icon" />
          <h2>{{ item.title || "Chi tiết nội dung" }}</h2>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">
              <component :is="TypeIcon" />
              <span>Loại nội dung</span>
            </div>
            <div class="info-value">{{ getTypeLabel(item.refType) }}</div>
          </div>

          <div class="info-item">
            <div class="info-label">
              <component :is="LinkIcon" />
              <span>Đối tượng tham chiếu</span>
            </div>
            <div class="info-value">{{ referenceDisplayName }}</div>
          </div>

          <div class="info-item">
            <div class="info-label">
              <component :is="CodeIcon" />
              <span>Đường dẫn (slug)</span>
            </div>
            <div class="info-value">{{ item.slug || "-" }}</div>
          </div>

          <div class="info-item">
            <div class="info-label">
              <component :is="SortIcon" />
              <span>Thứ tự hiển thị</span>
            </div>
            <div class="info-value">{{ item.sortOrder ?? 0 }}</div>
          </div>

          <div class="info-item">
            <div class="info-label">
              <component :is="StatusIcon" />
              <span>Trạng thái</span>
            </div>
            <div class="tag-value">
              <el-tag :type="item.active ? 'success' : 'danger'" effect="light">
                {{ item.active ? "Hiển thị" : "Ẩn" }}
              </el-tag>
              <el-tag :type="item.featured ? 'warning' : 'info'" effect="plain">
                {{ item.featured ? "Nổi bật" : "Thường" }}
              </el-tag>
            </div>
          </div>

          <div class="info-item">
            <div class="info-label">
              <component :is="ClockIcon" />
              <span>Cập nhật</span>
            </div>
            <div class="info-value">{{ formatDateTime(item.updatedAt) }}</div>
          </div>

          <div class="info-item full-width">
            <div class="info-label">
              <component :is="TextIcon" />
              <span>Tiêu đề phụ</span>
            </div>
            <div class="info-value multiline">{{ item.subtitle || "-" }}</div>
          </div>

          <div class="info-item full-width">
            <div class="info-label">
              <component :is="TextIcon" />
              <span>Mô tả ngắn</span>
            </div>
            <div class="info-value multiline">
              {{ item.description || "-" }}
            </div>
          </div>

          <div class="info-item full-width">
            <div class="info-label">
              <component :is="TextIcon" />
              <span>Nội dung chi tiết</span>
            </div>
            <div class="info-value multiline">{{ item.content || "-" }}</div>
          </div>
        </div>

        <div class="section-card">
          <div class="section-title">Hình ảnh</div>

          <div class="image-grid">
            <div class="image-box">
              <div class="image-label">Ảnh đại diện</div>
              <img
                v-if="item.imageUrl"
                :src="item.imageUrl"
                alt="Ảnh đại diện"
                class="main-image"
              />
              <div v-else class="image-empty">Không có ảnh</div>
            </div>

            <div class="image-box">
              <div class="image-label">Ảnh thu nhỏ</div>
              <img
                v-if="item.thumbnailUrl"
                :src="item.thumbnailUrl"
                alt="Ảnh thu nhỏ"
                class="main-image"
              />
              <div v-else class="image-empty">Không có ảnh</div>
            </div>
          </div>

          <div class="sub-section-title">Danh sách ảnh phụ</div>
          <div v-if="(item.subImages || []).length" class="sub-image-grid">
            <img
              v-for="(img, index) in item.subImages"
              :key="`${index}-${img}`"
              :src="img"
              alt="Ảnh phụ"
              class="sub-image"
            />
          </div>
          <div v-else class="image-empty">Không có ảnh phụ</div>
        </div>

        <div class="section-card">
          <div class="section-title">Dữ liệu bổ sung</div>
          <div v-if="parsedExtraData" class="extra-grid">
            <div
              v-for="(value, key) in parsedExtraData"
              :key="key"
              class="extra-item"
            >
              <div class="extra-label">{{ prettifyKey(key) }}</div>
              <div class="extra-value">{{ stringifyValue(value) }}</div>
            </div>
          </div>
          <div v-else class="info-value multiline">
            {{ item.extraData || "-" }}
          </div>
        </div>
      </template>

      <el-empty
        v-else-if="!loading"
        description="Không tìm thấy thông tin nội dung"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { serviceApi } from "@/api/service";
import { medicineApi } from "@/api/medicine";
import { userApi } from "@/api/user";
import { publicContentApi } from "@/api/publicContent";
import { notification } from "@/utils/notification";
import type { PublicContent, PublicContentType } from "@/types/publicContent";

const BackIcon = () =>
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
        d: "M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18",
      }),
    ],
  );

const ContentIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24",
      "stroke-width": "2",
      stroke: "currentColor",
      class: "w-6 h-6",
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
      }),
    ],
  );

const TypeIcon = () =>
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
        d: "M9.568 3.05A2.25 2.25 0 0111.41 2.25h1.18a2.25 2.25 0 011.841.8l1.77 2.36a2.25 2.25 0 001.842.9h1.236A2.25 2.25 0 0121.53 8.56v9.69a2.25 2.25 0 01-2.25 2.25H4.72a2.25 2.25 0 01-2.25-2.25V8.56a2.25 2.25 0 012.25-2.25h1.236a2.25 2.25 0 001.842-.9l1.77-2.36z",
      }),
    ],
  );

const LinkIcon = () =>
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
        d: "M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-1.757l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244",
      }),
    ],
  );

const CodeIcon = () =>
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
        d: "M17.25 6.75L21 12l-3.75 5.25M6.75 6.75L3 12l3.75 5.25M14.25 3l-4.5 18",
      }),
    ],
  );

const SortIcon = () =>
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
        d: "M8.25 6.75h12m-12 5.25h9m-9 5.25h6M3.75 6.75h.008v.008H3.75V6.75zm0 5.25h.008v.008H3.75V12zm0 5.25h.008v.008H3.75v-.008z",
      }),
    ],
  );

const StatusIcon = () =>
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
        d: "M3.75 3v11.25A2.25 2.25 0 006 16.5h12a2.25 2.25 0 002.25-2.25V3M3.75 7.5h16.5M8.25 3v4.5",
      }),
    ],
  );

const TextIcon = () =>
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
        d: "M19.5 6h-15m15 6h-15m15 6h-15",
      }),
    ],
  );

const ClockIcon = () =>
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
        d: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
      }),
    ],
  );

const router = useRouter();
const route = useRoute();

const loading = ref(false);
const item = ref<PublicContent | null>(null);
const referenceDisplayName = ref("-");

const parsedExtraData = computed<Record<string, unknown> | null>(() => {
  const raw = item.value?.extraData;
  if (!raw?.trim()) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
});

const getTypeLabel = (type: PublicContentType) => {
  if (type === "DOCTOR") return "Bác sĩ";
  if (type === "MEDICINE") return "Thuốc";
  return "Dịch vụ";
};

const prettifyKey = (value: string) => {
  const keyMap: Record<string, string> = {
    note: "Ghi chú",
    process: "Quy trình",
    benefits: "Lợi ích",
    duration: "Thời lượng",
    targetAudience: "Đối tượng phù hợp",
    degree: "Học vị",
    experience: "Kinh nghiệm",
    specialty: "Chuyên khoa",
    certificate: "Chứng chỉ",
    ingredient: "Hoạt chất chính",
    dosage: "Liều dùng",
    usage: "Cách dùng",
    contraindications: "Chống chỉ định",
    sideEffects: "Tác dụng phụ",
  };

  if (keyMap[value]) return keyMap[value];

  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/^./, (s) => s.toUpperCase());
};

const stringifyValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN");
};

const resolveReferenceName = async (content: PublicContent) => {
  if (!content.refId) {
    referenceDisplayName.value = "-";
    return;
  }

  try {
    if (content.refType === "DOCTOR") {
      const doctor = await userApi.getById(content.refId);
      referenceDisplayName.value =
        doctor.fullName ||
        doctor.name ||
        doctor.username ||
        doctor.email ||
        "-";
      return;
    }

    if (content.refType === "SERVICE") {
      const service = await serviceApi.getById(content.refId);
      referenceDisplayName.value = service.name || "-";
      return;
    }

    const medicine = await medicineApi.getById(content.refId);
    referenceDisplayName.value = medicine.name || "-";
  } catch (error) {
    console.error("Resolve reference name error:", error);
    referenceDisplayName.value = content.refId;
  }
};

const loadDetail = async () => {
  const id = route.params.id as string;
  if (!id) {
    notification.error("Thiếu mã nội dung");
    router.push("/public-contents");
    return;
  }

  try {
    loading.value = true;
    item.value = await publicContentApi.getById(id);
    await resolveReferenceName(item.value);
  } catch (error) {
    console.error("Load public content detail error:", error);
    notification.error("Không thể tải chi tiết nội dung");
    router.push("/public-contents");
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadDetail();
});
</script>

<style scoped lang="scss">
.public-content-detail-container {
  padding: 24px;
  background: #f9fafb;
  min-height: calc(100vh - 64px);

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
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      color: #374151;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: #f9fafb;
        border-color: #14b8a6;
        color: #14b8a6;
      }
    }
  }

  .detail-card {
    background: white;
    border-radius: 16px;
    padding: 32px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

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
      }

      h2 {
        font-size: 24px;
        font-weight: 700;
        color: #111827;
        margin: 0;
      }
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
      margin-bottom: 24px;

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

        .info-value,
        .tag-value {
          font-size: 15px;
          color: #111827;
          padding: 12px 16px;
          background: #f9fafb;
          border-radius: 10px;
          border-left: 3px solid #14b8a6;
          min-height: 44px;
          display: flex;
          align-items: center;
        }

        .tag-value {
          gap: 8px;
          flex-wrap: wrap;
        }

        .multiline {
          white-space: pre-wrap;
          word-break: break-word;
          line-height: 1.55;
          align-items: flex-start;
        }
      }
    }
  }

  .section-card {
    margin-top: 20px;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    background: #fcfcfd;
    padding: 16px;

    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 12px;
    }

    .sub-section-title {
      font-size: 13px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 14px 0 8px;
    }

    .image-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;

      .image-box {
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 10px;
        background: #fff;

        .image-label {
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
          margin-bottom: 8px;
        }

        .main-image {
          width: 100%;
          height: 210px;
          border-radius: 10px;
          border: 1px solid #e5e7eb;
          object-fit: contain;
          background: #fff;
        }
      }
    }

    .image-empty {
      border: 1px dashed #cbd5e1;
      border-radius: 10px;
      min-height: 84px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
      font-size: 13px;
      background: #f8fafc;
      padding: 8px;
    }

    .sub-image-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 10px;

      .sub-image {
        width: 100%;
        height: 108px;
        border-radius: 10px;
        border: 1px solid #e5e7eb;
        object-fit: cover;
        background: #fff;
      }
    }

    .extra-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;

      .extra-item {
        background: #f8fafc;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        padding: 10px 12px;

        .extra-label {
          font-size: 12px;
          color: #6b7280;
          font-weight: 600;
          margin-bottom: 4px;
          text-transform: uppercase;
        }

        .extra-value {
          font-size: 14px;
          color: #111827;
          line-height: 1.5;
          word-break: break-word;
        }
      }
    }
  }
}

@media (max-width: 900px) {
  .public-content-detail-container {
    padding: 16px;

    .detail-card {
      padding: 20px;

      .info-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }
    }

    .section-card {
      .image-grid,
      .extra-grid {
        grid-template-columns: 1fr;
      }
    }
  }
}
</style>
