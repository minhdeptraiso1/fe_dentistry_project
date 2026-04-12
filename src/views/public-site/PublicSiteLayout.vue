<template>
  <div class="public-layout">
    <header class="public-header">
      <div class="container nav-wrap">
        <router-link to="/public" class="brand">
          <img :src="logoImg" alt="Nha khoa Việt Smile" class="brand-logo" />
          <span>Nha Khoa Việt Smile</span>
        </router-link>
        <nav class="nav-links">
          <router-link to="/public">Trang chủ</router-link>
          <router-link to="/public/about">Giới thiệu</router-link>
          <router-link to="/public/doctors">Bác sĩ</router-link>
          <router-link to="/public/services">Dịch vụ</router-link>
          <router-link to="/public/medicines">Thuốc</router-link>
        </nav>
        <router-link :to="systemEntryPath" class="cta"
          >Trở lại hệ thống</router-link
        >
      </div>
    </header>

    <main>
      <router-view />
    </main>

    <footer class="public-footer">
      <div class="container footer-grid">
        <section>
          <img :src="logoImg" alt="Nha khoa Việt Smile" class="footer-logo" />
          <h4>Nha Khoa Việt Smile</h4>
          <p>
            Phòng khám nha khoa hiện đại, sạch sẽ, dịch vụ minh bạch và tận tâm.
          </p>
        </section>
        <section>
          <h4>Liên hệ</h4>
          <p>Địa chỉ: 123 Nguyễn Văn Linh, Đà Nẵng</p>
          <p>Hotline: 0868 030 043</p>
          <p>Email: contact@vietsmile.vn</p>
        </section>
        <section>
          <h4>Giờ làm việc</h4>
          <p>Thứ 2 - Thứ 7: 08:00 - 20:00</p>
          <p>Chủ nhật: 08:00 - 17:00</p>
        </section>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import logoImg from "@/assets/logo.png";

const route = useRoute();
const authStore = useAuthStore();
const returnToPath = computed(() => {
  const value = route.query.returnTo;
  if (typeof value === "string" && value.startsWith("/")) {
    return value;
  }
  return "/dashboard";
});

const systemEntryPath = computed(() => {
  if (!authStore.isAuthenticated) {
    return "/login";
  }
  return returnToPath.value;
});
</script>

<style scoped>
.public-layout {
  background: linear-gradient(180deg, #f8fbfc 0%, #ffffff 50%);
  color: #0f172a;
  min-height: 100vh;
}

.container {
  width: min(1160px, 92vw);
  margin: 0 auto;
}

.public-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(255, 255, 255, 0.96);
  border-bottom: 1px solid #e2e8f0;
  backdrop-filter: blur(8px);
}

.nav-wrap {
  min-height: 86px;
  display: flex;
  align-items: center;
  gap: 18px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 800;
  color: #0f766e;
  text-decoration: none;
}

.brand-logo {
  width: 58px;
  height: 58px;
  border-radius: 16px;
  background: #f8fafc;
  object-fit: contain;
  padding: 6px;
  border: 1px solid #dbeafe;
}

.nav-links {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 18px;
}

.nav-links a {
  text-decoration: none;
  color: #334155;
  font-weight: 600;
}

.nav-links a.router-link-active {
  color: #0f766e;
}

.cta {
  text-decoration: none;
  background: linear-gradient(135deg, #0ea5a1 0%, #0284c7 100%);
  color: #fff;
  padding: 10px 16px;
  border-radius: 999px;
  font-weight: 700;
}

.public-footer {
  margin-top: 50px;
  padding: 36px 0;
  border-top: 1px solid #e5e7eb;
  background: #f8fafc;
}

.footer-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.footer-grid h4 {
  margin: 0 0 10px;
  font-size: 18px;
}

.footer-logo {
  width: 110px;
  height: 110px;
  border-radius: 20px;
  background: #ffffff;
  object-fit: contain;
  border: 1px solid #dbeafe;
  margin-bottom: 10px;
}

.footer-grid p {
  margin: 4px 0;
  color: #475569;
  line-height: 1.6;
}

@media (max-width: 900px) {
  .nav-wrap {
    flex-wrap: wrap;
    padding: 10px 0;
  }

  .nav-links {
    order: 3;
    width: 100%;
    overflow-x: auto;
    white-space: nowrap;
    padding-bottom: 6px;
  }

  .footer-grid {
    grid-template-columns: 1fr;
  }
}
</style>
