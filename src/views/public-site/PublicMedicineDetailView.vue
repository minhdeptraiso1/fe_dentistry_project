<template>
  <section class="container page" v-loading="loading">
    <article v-if="medicine" class="detail-card">
      <img
        :src="medicine.imageUrl || fallbackImage"
        :alt="medicine.title"
        class="hero-image"
      />
      <div>
        <p class="tag">Thuốc</p>
        <h1>{{ medicine.title }}</h1>
        <p class="subtitle">
          {{ medicine.subtitle || "Sản phẩm hỗ trợ điều trị" }}
        </p>
        <p class="lead">{{ medicine.description || "-" }}</p>
        <div class="cta-wrap">
          <router-link :to="bookAppointmentPath" class="btn-primary"
            >Đăng ký tư vấn</router-link
          >
          <router-link to="/public/contact" class="btn-ghost"
            >Liên hệ nhà thuốc</router-link
          >
        </div>
      </div>
    </article>

    <section v-if="medicine" class="detail-grid">
      <article class="panel">
        <h2>Thông tin chi tiết</h2>
        <p class="content">{{ medicine.content || "-" }}</p>
      </article>
      <article class="panel">
        <h2>Thông tin thêm</h2>
        <div v-if="extraEntries.length" class="extra-list">
          <div
            v-for="entry in extraEntries"
            :key="entry.key"
            class="extra-item"
          >
            <span>{{ entry.label }}</span>
            <b>{{ entry.value }}</b>
          </div>
        </div>
        <p v-else class="content">Chưa có thông tin thêm.</p>
      </article>
    </section>

    <section v-if="medicine?.subImages?.length" class="gallery">
      <h2>Hình ảnh liên quan</h2>
      <div class="gallery-grid">
        <img
          v-for="img in medicine.subImages"
          :key="img"
          :src="img"
          alt="Thuốc"
        />
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { publicWebsiteApi } from "@/api/publicWebsite";
import { useAuthStore } from "@/stores/auth";
import type { PublicContent } from "@/types/publicContent";

const route = useRoute();
const authStore = useAuthStore();
const loading = ref(false);
const medicine = ref<PublicContent | null>(null);
const appointmentPath = "/patient/appointments";
const bookAppointmentPath = computed(() => {
  if (authStore.isAuthenticated) {
    return appointmentPath;
  }
  return `/login?redirect=${encodeURIComponent(appointmentPath)}`;
});

const fallbackImage =
  "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=1200&q=80";

const fieldMap: Record<string, string> = {
  ingredient: "Hoạt chất",
  dosage: "Liều dùng",
  usage: "Cách dùng",
  contraindications: "Chống chỉ định",
  sideEffects: "Tác dụng phụ",
  note: "Lưu ý",
};

const extraEntries = computed(() => {
  const raw = medicine.value?.extraData;
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as Record<string, string>;
    return Object.entries(data)
      .filter(([, value]) => String(value || "").trim())
      .map(([key, value]) => ({
        key,
        label: fieldMap[key] || key,
        value: String(value),
      }));
  } catch {
    return [];
  }
});

onMounted(async () => {
  loading.value = true;
  const slug = String(route.params.slug || "");
  medicine.value = await publicWebsiteApi.getDetailBySlug(slug);
  loading.value = false;
});
</script>

<style scoped>
.container {
  width: min(1160px, 92vw);
  margin: 0 auto;
}
.page {
  padding-top: 34px;
}
.detail-card {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: 22px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 18px;
}
.hero-image {
  width: 100%;
  border-radius: 16px;
  min-height: 300px;
  object-fit: cover;
}
.tag {
  margin: 0;
  color: #0369a1;
  font-weight: 700;
}
h1 {
  margin: 6px 0;
  font-size: 42px;
}
.subtitle {
  margin: 0;
  color: #0f766e;
  font-weight: 700;
}
.lead {
  color: #475569;
  line-height: 1.7;
}
.cta-wrap {
  margin-top: 14px;
  display: flex;
  gap: 10px;
}
.btn-primary,
.btn-ghost {
  text-decoration: none;
  padding: 11px 16px;
  border-radius: 10px;
  font-weight: 700;
}
.btn-primary {
  background: linear-gradient(135deg, #0284c7 0%, #0ea5a1 100%);
  color: #fff;
}
.btn-ghost {
  border: 1px solid #bfdbfe;
  color: #0369a1;
  background: #eff6ff;
}
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-top: 16px;
}
.panel {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px;
}
.panel h2 {
  margin: 0 0 10px;
}
.content {
  margin: 0;
  color: #334155;
  line-height: 1.7;
  white-space: pre-wrap;
}
.extra-list {
  display: grid;
  gap: 8px;
}
.extra-item {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 9px 10px;
}
.extra-item span {
  color: #64748b;
}
.gallery {
  margin-top: 16px;
}
.gallery-grid {
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.gallery-grid img {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: 14px;
}
@media (max-width: 900px) {
  .detail-card,
  .detail-grid,
  .gallery-grid {
    grid-template-columns: 1fr;
  }
  h1 {
    font-size: 34px;
  }
}
</style>
