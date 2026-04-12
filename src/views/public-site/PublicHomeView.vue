<template>
  <div>
    <section class="hero">
      <div class="container hero-grid">
        <div>
          <p class="hero-badge">Phòng khám nha khoa hiện đại</p>
          <h1>Chăm sóc nụ cười an toàn, nhẹ nhàng và chất lượng</h1>
          <p class="hero-desc">
            Đội ngũ bác sĩ nhiều kinh nghiệm, thiết bị tiên tiến, quy trình vô
            khuẩn và minh bạch chi phí.
          </p>
          <div class="hero-actions">
            <router-link :to="bookAppointmentPath" class="btn-primary"
              >Đặt lịch ngay</router-link
            >
            <router-link to="/public/services" class="btn-ghost"
              >Xem dịch vụ</router-link
            >
          </div>
        </div>
        <img
          class="hero-image"
          src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80"
          alt="Phòng khám nha khoa"
        />
      </div>
    </section>

    <section class="section container">
      <h2>Giới thiệu nhanh</h2>
      <p class="section-lead">
        Phòng khám sạch, bác sĩ giỏi, quy trình rõ ràng và hỗ trợ nhanh.
      </p>
      <div class="quick-stats">
        <div v-for="stat in stats" :key="stat.label" class="stat-item">
          <span class="stat-value">{{ stat.value }}</span>
          <span class="stat-label">{{ stat.label }}</span>
        </div>
      </div>
      <div class="feature-grid">
        <article
          v-for="item in strengths"
          :key="item.title"
          class="feature-item"
        >
          <h3>{{ item.title }}</h3>
          <p>{{ item.desc }}</p>
        </article>
      </div>
    </section>

    <section class="section container">
      <div class="section-head">
        <h2>Bác sĩ nổi bật</h2>
        <router-link to="/public/doctors">Xem tất cả</router-link>
      </div>
      <div class="card-grid">
        <PublicDoctorCard
          v-for="doctor in featuredDoctors"
          :key="doctor.id"
          :item="doctor"
        />
      </div>
    </section>

    <section class="section container">
      <div class="section-head">
        <h2>Dịch vụ nổi bật</h2>
        <router-link to="/public/services">Xem tất cả</router-link>
      </div>
      <div class="card-grid">
        <PublicServiceCard
          v-for="service in featuredServices"
          :key="service.id"
          :item="service"
        />
      </div>
    </section>

    <section class="section container">
      <div class="section-head">
        <h2>Thuốc nổi bật</h2>
        <router-link to="/public/medicines">Xem tất cả</router-link>
      </div>
      <div class="card-grid">
        <PublicMedicineCard
          v-for="medicine in featuredMedicines"
          :key="medicine.id"
          :item="medicine"
        />
      </div>
    </section>

    <section class="section container">
      <h2>Thư viện không gian phòng khám</h2>
      <div class="gallery-grid">
        <img
          v-for="img in gallery"
          :key="img"
          :src="img"
          @error="handleGalleryImageError"
          alt="Không gian phòng khám"
        />
      </div>
    </section>

    <section class="section container cta-block">
      <h2>Sẵn sàng đặt lịch tư vấn?</h2>
      <p>Chọn khung giờ phù hợp để đội ngũ phòng khám hỗ trợ bạn tốt nhất.</p>
      <div class="hero-actions">
        <router-link :to="bookAppointmentPath" class="btn-primary"
          >Đặt lịch ngay</router-link
        >
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import { publicWebsiteApi } from "@/api/publicWebsite";
import type { PublicContentSummary } from "@/types/publicContent";
import PublicDoctorCard from "./components/PublicDoctorCard.vue";
import PublicServiceCard from "./components/PublicServiceCard.vue";
import PublicMedicineCard from "./components/PublicMedicineCard.vue";

const featuredDoctors = ref<PublicContentSummary[]>([]);
const featuredServices = ref<PublicContentSummary[]>([]);
const featuredMedicines = ref<PublicContentSummary[]>([]);
const authStore = useAuthStore();
const appointmentPath = "/patient/appointments";
const bookAppointmentPath = computed(() => {
  if (authStore.isAuthenticated) {
    return appointmentPath;
  }
  return `/login?redirect=${encodeURIComponent(appointmentPath)}`;
});

const strengths = [
  {
    title: "Bác sĩ chuyên sâu",
    desc: "Tư vấn rõ và theo sát từng giai đoạn điều trị.",
  },
  {
    title: "Thiết bị hiện đại",
    desc: "Công nghệ chẩn đoán chính xác, hỗ trợ điều trị hiệu quả.",
  },
  {
    title: "Quy trình an toàn",
    desc: "Chuẩn vô khuẩn nghiêm ngặt, an tâm trong mọi dịch vụ.",
  },
  {
    title: "Chăm sóc tận tâm",
    desc: "Luôn đồng hành trước, trong và sau điều trị.",
  },
];

const stats = [
  { value: "10+", label: "Năm kinh nghiệm" },
  { value: "5.000+", label: "Khách hàng tin chọn" },
  { value: "15+", label: "Dịch vụ chuyên sâu" },
  { value: "24/7", label: "Hỗ trợ tư vấn" },
];

const fallbackGalleryImage =
  "https://placehold.co/900x900/e2e8f0/475569?text=Nha+Khoa+Viet+Smile";

const gallery = [
  "https://images.pexels.com/photos/3845810/pexels-photo-3845810.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/4269690/pexels-photo-4269690.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/8376230/pexels-photo-8376230.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/6627562/pexels-photo-6627562.jpeg?auto=compress&cs=tinysrgb&w=1200",
];

const handleGalleryImageError = (event: Event) => {
  const target = event.target as HTMLImageElement;
  target.src = fallbackGalleryImage;
};

onMounted(async () => {
  featuredDoctors.value = await publicWebsiteApi.getList("DOCTOR", true);
  featuredServices.value = await publicWebsiteApi.getList("SERVICE", true);
  featuredMedicines.value = await publicWebsiteApi.getList("MEDICINE", true);

  if (!featuredDoctors.value.length) {
    featuredDoctors.value = await publicWebsiteApi.getList("DOCTOR");
  }
  if (!featuredServices.value.length) {
    featuredServices.value = await publicWebsiteApi.getList("SERVICE");
  }
  if (!featuredMedicines.value.length) {
    featuredMedicines.value = await publicWebsiteApi.getList("MEDICINE");
  }

  featuredDoctors.value = featuredDoctors.value.slice(0, 3);
  featuredServices.value = featuredServices.value.slice(0, 3);
  featuredMedicines.value = featuredMedicines.value.slice(0, 3);
});
</script>

<style scoped>
.container {
  width: min(1160px, 92vw);
  margin: 0 auto;
}

.hero {
  padding: 44px 0 26px;
}

.hero-grid {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 24px;
  align-items: center;
}

.hero h1 {
  margin: 10px 0;
  font-size: clamp(32px, 4.6vw, 54px);
  line-height: 1.12;
}

.hero-badge {
  display: inline-flex;
  padding: 7px 12px;
  border-radius: 999px;
  background: #ccfbf1;
  color: #0f766e;
  font-weight: 700;
}

.hero-desc {
  color: #475569;
  line-height: 1.75;
  max-width: 58ch;
}

.hero-actions {
  margin-top: 16px;
  display: flex;
  gap: 12px;
}

.btn-primary,
.btn-ghost {
  text-decoration: none;
  border-radius: 12px;
  padding: 12px 18px;
  font-weight: 700;
}

.btn-primary {
  color: #fff;
  background: linear-gradient(135deg, #14b8a6 0%, #0284c7 100%);
}

.btn-ghost {
  color: #0f766e;
  border: 1px solid #99f6e4;
  background: #f0fdfa;
}

.hero-image {
  width: 100%;
  border-radius: 26px;
  border: 6px solid #fff;
  box-shadow: 0 18px 30px rgba(15, 118, 110, 0.14);
  object-fit: cover;
  max-height: 470px;
}

.section {
  margin-top: 38px;
}

.section h2 {
  margin: 0;
  font-size: 32px;
}

.section-lead {
  color: #475569;
  line-height: 1.7;
  margin-top: 10px;
}

.quick-stats {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.stat-item {
  background: linear-gradient(130deg, #ffffff 0%, #f0fdfa 100%);
  border: 1px solid #cffafe;
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-value {
  font-size: 20px;
  font-weight: 800;
  color: #0f766e;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
}

.feature-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.feature-item {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 16px;
}

.feature-item h3 {
  margin: 0 0 8px;
  color: #0f172a;
}

.feature-item p {
  margin: 0;
  color: #475569;
  line-height: 1.55;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-head a {
  color: #0369a1;
  font-weight: 700;
  text-decoration: none;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-top: 14px;
}

.gallery-grid img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 16px;
}

.cta-block {
  background: linear-gradient(120deg, #ecfeff 0%, #f0fdf4 100%);
  border: 1px solid #d1fae5;
  border-radius: 20px;
  padding: 26px;
}

.cta-block p {
  color: #334155;
}

@media (max-width: 980px) {
  .hero-grid,
  .quick-stats,
  .feature-grid,
  .card-grid,
  .gallery-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 700px) {
  .hero-grid,
  .feature-grid,
  .card-grid,
  .gallery-grid {
    grid-template-columns: 1fr;
  }
}
</style>
