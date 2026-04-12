<template>
  <section class="container page">
    <h1>Liên hệ</h1>
    <p class="lead">
      Gọi cho chúng tôi hoặc để lại thông tin để được tư vấn nhanh chóng.
    </p>

    <div class="grid">
      <article class="panel">
        <h2>Thông tin phòng khám</h2>
        <p><b>Địa chỉ:</b> 123 Nguyễn Văn Linh, Đà Nẵng</p>
        <p><b>Hotline:</b> 0868 030 043</p>
        <p><b>Email:</b> contact@vietsmile.vn</p>
        <p><b>Giờ làm việc:</b> 08:00 - 20:00</p>
      </article>

      <article class="panel">
        <h2>Gửi yêu cầu</h2>
        <form class="contact-form" @submit.prevent="handleSubmit">
          <input v-model="form.name" placeholder="Họ và tên" required />
          <input v-model="form.phone" placeholder="Số điện thoại" required />
          <textarea
            v-model="form.message"
            rows="4"
            placeholder="Nội dung cần tư vấn"
            required
          />
          <button type="submit">Gửi liên hệ</button>
        </form>
      </article>
    </div>

    <iframe
      class="map"
      loading="lazy"
      allowfullscreen
      referrerpolicy="no-referrer-when-downgrade"
      src="https://www.google.com/maps?q=Da%20Nang&output=embed"
    ></iframe>
  </section>
</template>

<script setup lang="ts">
import { reactive } from "vue";
import { ElMessage } from "element-plus";

const form = reactive({
  name: "",
  phone: "",
  message: "",
});

const handleSubmit = () => {
  ElMessage.success("Đã nhận yêu cầu. Chúng tôi sẽ liên hệ sớm nhất.");
  form.name = "";
  form.phone = "";
  form.message = "";
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
h1 {
  margin: 0;
  font-size: 38px;
}
.lead {
  color: #475569;
}
.grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: 1fr 1fr;
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
.panel p {
  color: #334155;
}
.contact-form {
  display: grid;
  gap: 10px;
}
.contact-form input,
.contact-form textarea {
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 12px;
  font: inherit;
}
.contact-form button {
  border: none;
  border-radius: 10px;
  padding: 12px;
  font-weight: 700;
  background: linear-gradient(135deg, #14b8a6 0%, #0284c7 100%);
  color: #fff;
}
.map {
  margin-top: 14px;
  width: 100%;
  min-height: 320px;
  border: 0;
  border-radius: 16px;
}
@media (max-width: 900px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
