<template>
  <article class="doctor-card">
    <img
      :src="item.thumbnailUrl || item.imageUrl || fallbackImage"
      :alt="item.title"
      class="doctor-image"
      @error="handleImageError"
    />
    <div class="doctor-body">
      <p class="doctor-type">Bác sĩ</p>
      <p class="doctor-specialty">{{ item.subtitle || "Bác sĩ nha khoa" }}</p>
      <h3 class="doctor-name">{{ item.title }}</h3>
      <p class="doctor-description">{{ item.description || "-" }}</p>
      <router-link
        :to="`/public/doctors/${item.slug || item.id}`"
        class="doctor-link"
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
  "https://images.unsplash.com/photo-1588776814546-bc5f4472d8f3?auto=format&fit=crop&w=600&q=80";

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement;
  target.src = fallbackImage;
};
</script>

<style scoped>
.doctor-card {
  background: #fff;
  border: 1px solid #dbeafe;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;
}

.doctor-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.14);
}

.doctor-image {
  width: 100%;
  aspect-ratio: 4 / 2.8;
  object-fit: cover;
}

.doctor-body {
  padding: 16px 16px 18px;
}

.doctor-type {
  margin: 0;
  color: #0369a1;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.7px;
}

.doctor-specialty {
  margin: 6px 0 0;
  color: #0d9488;
  font-size: 13px;
  font-weight: 600;
}

.doctor-name {
  margin: 8px 0;
  color: #0f172a;
  font-size: 22px;
}

.doctor-description {
  margin: 0 0 14px;
  color: #475569;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.doctor-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  background: linear-gradient(135deg, #f0fdfa 0%, #ecfeff 100%);
  border: 1px solid #bae6fd;
  color: #0369a1;
  font-weight: 700;
  text-decoration: none;
}
</style>
