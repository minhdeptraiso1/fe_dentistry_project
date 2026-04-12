<template>
  <section class="container page">
    <div class="page-hero">
      <p class="eyebrow">Đội ngũ chuyên môn</p>
      <h1>Đội ngũ bác sĩ</h1>
      <p class="lead">Xem thông tin bác sĩ, chuyên môn và thế mạnh điều trị.</p>
    </div>

    <div class="grid">
      <PublicDoctorCard
        v-for="doctor in doctors"
        :key="doctor.id"
        :item="doctor"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { publicWebsiteApi } from "@/api/publicWebsite";
import type { PublicContentSummary } from "@/types/publicContent";
import PublicDoctorCard from "./components/PublicDoctorCard.vue";

const doctors = ref<PublicContentSummary[]>([]);

onMounted(async () => {
  doctors.value = await publicWebsiteApi.getList("DOCTOR");
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
