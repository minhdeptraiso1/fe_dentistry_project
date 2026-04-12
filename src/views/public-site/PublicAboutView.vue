<template>
  <section class="container page">
    <div class="hero-about">
      <div>
        <h1>Giới thiệu phòng khám</h1>
        <p class="lead">
          Việt Smile xây dựng môi trường thăm khám sạch, hiện đại và thân thiện
          để mọi khách hàng đều an tâm.
        </p>
      </div>
      <img
        :src="heroImage"
        alt="Không gian phòng khám"
        class="hero-image"
        @error="onImageError"
      />
    </div>

    <div class="grid">
      <article class="panel">
        <h2>Tầm nhìn</h2>
        <p>
          Trở thành phòng khám nha khoa tin cậy, lấy chất lượng chuyên môn và
          trải nghiệm khách hàng làm trọng tâm.
        </p>
      </article>
      <article class="panel">
        <h2>Sứ mệnh</h2>
        <p>
          Mang đến giải pháp điều trị rõ ràng, an toàn, hiệu quả cùng chi phí
          minh bạch cho mọi đối tượng.
        </p>
      </article>
      <article class="panel">
        <h2>Điểm mạnh</h2>
        <ul>
          <li>Đội ngũ bác sĩ giàu kinh nghiệm</li>
          <li>Thiết bị hiện đại</li>
          <li>Quy trình chuẩn y khoa</li>
          <li>Dịch vụ chăm sóc tận tâm</li>
        </ul>
      </article>
    </div>

    <section class="photo-block">
      <h2>Không gian và đội ngũ</h2>
      <div class="photo-grid">
        <img
          v-for="img in photos"
          :key="img"
          :src="img"
          alt="Nha khoa Việt Smile"
          @error="onImageError"
        />
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
const fallbackImage =
  "https://placehold.co/1200x800/e2e8f0/334155?text=Nha+Khoa+Viet+Smile";

const heroImage =
  "https://images.pexels.com/photos/3845766/pexels-photo-3845766.jpeg?auto=compress&cs=tinysrgb&w=1600";

const photos = [
  "https://images.pexels.com/photos/3845810/pexels-photo-3845810.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/4269690/pexels-photo-4269690.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/6627562/pexels-photo-6627562.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/8376230/pexels-photo-8376230.jpeg?auto=compress&cs=tinysrgb&w=1200",
];

const onImageError = (event: Event) => {
  const target = event.target as HTMLImageElement;
  target.src = fallbackImage;
};
</script>

<style scoped>
.container {
  width: min(1160px, 92vw);
  margin: 0 auto;
}
.page {
  padding-top: 34px;
}
.hero-about {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 16px;
  align-items: center;
}
h1 {
  margin: 0;
  font-size: 38px;
}
.lead {
  color: #475569;
  line-height: 1.7;
  max-width: 70ch;
}
.hero-image {
  width: 100%;
  min-height: 260px;
  max-height: 340px;
  border-radius: 18px;
  object-fit: cover;
  border: 1px solid #e2e8f0;
  box-shadow: 0 14px 26px rgba(2, 132, 199, 0.12);
}
.grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
.panel {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 18px;
}
.panel h2 {
  margin: 0 0 10px;
}
.panel p,
.panel li {
  color: #334155;
  line-height: 1.7;
}
.panel ul {
  margin: 0;
  padding-left: 18px;
}
.photo-block {
  margin-top: 20px;
}
.photo-block h2 {
  margin: 0 0 10px;
  font-size: 28px;
}
.photo-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.photo-grid img {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
}
@media (max-width: 900px) {
  .hero-about,
  .photo-grid,
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
