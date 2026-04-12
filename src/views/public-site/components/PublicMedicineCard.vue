<template>
  <article class="medicine-card">
    <img
      :src="item.thumbnailUrl || item.imageUrl || fallbackImage"
      :alt="item.title"
      class="medicine-image"
      @error="handleImageError"
    />
    <div class="medicine-body">
      <p class="medicine-type">Thuốc</p>
      <h3 class="medicine-name">{{ item.title }}</h3>
      <p class="medicine-subtitle">
        {{ item.subtitle || "Sản phẩm hỗ trợ điều trị" }}
      </p>
      <p class="medicine-description">{{ item.description || "-" }}</p>
      <router-link
        :to="`/public/medicines/${item.slug || item.id}`"
        class="medicine-link"
      >
        Xem chi tiết
      </router-link>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { PublicContentSummary } from "@/types/publicContent";

defineProps<{
  item: PublicContentSummary;
}>();

const fallbackImage =
  "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=700&q=80";

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement;
  target.src = fallbackImage;
};
</script>

<style scoped>
.medicine-card {
  background: #fff;
  border-radius: 18px;
  border: 1px solid #dbeafe;
  overflow: hidden;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
  transition: transform 0.25s ease;
}

.medicine-card:hover {
  transform: translateY(-4px);
}

.medicine-image {
  width: 100%;
  aspect-ratio: 16 / 10;
  object-fit: cover;
}

.medicine-body {
  padding: 16px 16px 18px;
}

.medicine-type {
  margin: 0;
  font-size: 12px;
  color: #0369a1;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.7px;
}

.medicine-name {
  margin: 8px 0;
  color: #0f172a;
  font-size: 21px;
}

.medicine-subtitle {
  margin: 0 0 8px;
  color: #0f766e;
  font-weight: 600;
}

.medicine-description {
  margin: 0 0 14px;
  color: #475569;
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.medicine-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  background: linear-gradient(135deg, #eff6ff 0%, #ecfeff 100%);
  border: 1px solid #bfdbfe;
  color: #0369a1;
  font-weight: 700;
  text-decoration: none;
}
</style>
