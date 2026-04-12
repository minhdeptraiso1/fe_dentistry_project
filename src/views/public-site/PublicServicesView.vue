<template>
  <section class="container page">
    <div class="page-hero">
      <p class="eyebrow">Danh mục dịch vụ</p>
      <h1>Dịch vụ nha khoa</h1>
      <p class="lead">
        Danh mục dịch vụ rõ ràng, dễ tham khảo trước khi đặt lịch.
      </p>
    </div>

    <div class="grid">
      <PublicServiceCard
        v-for="service in services"
        :key="service.id"
        :item="service"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { publicWebsiteApi } from "@/api/publicWebsite";
import type { PublicContentSummary } from "@/types/publicContent";
import PublicServiceCard from "./components/PublicServiceCard.vue";

const services = ref<PublicContentSummary[]>([]);

onMounted(async () => {
  services.value = await publicWebsiteApi.getList("SERVICE");
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

.page-hero {
  background: linear-gradient(120deg, #f0fdfa 0%, #eff6ff 100%);
  border: 1px solid #dbeafe;
  border-radius: 18px;
  padding: 22px 24px;
  margin-bottom: 14px;
}

.eyebrow {
  margin: 0;
  color: #0f766e;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.7px;
}

h1 {
  margin: 6px 0;
  font-size: 38px;
}
.lead {
  color: #475569;
  margin: 0;
}
.grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
@media (max-width: 980px) {
  .grid {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 700px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
