<template>
  <div class="return-page" v-loading="loading">
    <div class="glow-orb glow-1"></div>
    <div class="glow-orb glow-2"></div>

    <div class="return-card" :class="`state-${status}`">
      <div class="status-icon-wrap">
        <svg
          v-if="status === 'success'"
          class="status-icon icon-check"
          viewBox="0 0 80 80"
          aria-hidden="true"
        >
          <circle class="icon-circle" cx="40" cy="40" r="32" />
          <path class="icon-path" d="M24 41.5L35 52L56 29" />
        </svg>

        <svg
          v-else-if="status === 'cancel'"
          class="status-icon icon-cancel"
          viewBox="0 0 80 80"
          aria-hidden="true"
        >
          <circle class="icon-circle" cx="40" cy="40" r="32" />
          <path class="icon-path" d="M27 40H53" />
        </svg>

        <svg
          v-else-if="status === 'pending'"
          class="status-icon icon-pending"
          viewBox="0 0 80 80"
          aria-hidden="true"
        >
          <circle class="icon-circle" cx="40" cy="40" r="32" />
          <path class="icon-path" d="M40 25V41L50 47" />
        </svg>

        <svg
          v-else
          class="status-icon icon-fail"
          viewBox="0 0 80 80"
          aria-hidden="true"
        >
          <circle class="icon-circle" cx="40" cy="40" r="32" />
          <path class="icon-path" d="M29 29L51 51" />
          <path class="icon-path" d="M51 29L29 51" />
        </svg>
      </div>

      <p class="eyebrow">KET QUA THANH TOAN VNPAY</p>
      <h1>{{ title }}</h1>
      <p class="message">{{ message }}</p>

      <div class="meta-grid">
        <p v-if="invoiceCode" class="meta-line">
          Hoa don: <b>{{ invoiceCode }}</b>
        </p>
        <p v-if="responseCode" class="meta-line">
          Ma phan hoi: <b>{{ responseCode }}</b>
        </p>
      </div>

      <p v-if="countdown > 0" class="countdown-line">
        Tu dong quay lai trong {{ countdown }} giay...
      </p>

      <div class="actions">
        <button type="button" class="btn-primary" @click="goBack">
          Tro ve hoa don cua toi
        </button>
        <router-link class="btn-ghost" to="/patient/appointments"
          >Trang dat lich</router-link
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import {
  paymentApi,
  VNPAY_INVOICE_ID_KEY,
  VNPAY_RETURN_TO_KEY,
} from "@/api/payment";
import { patientApi } from "@/api/patient";
import { emailApi } from "@/api/email";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const authStore = useAuthStore();

type ReturnStatus = "success" | "cancel" | "pending" | "fail";

const loading = ref(true);
const status = ref<ReturnStatus>("pending");
const message = ref("Dang xu ly ket qua thanh toan...");
const invoiceCode = ref("");
const responseCode = ref("");
const countdown = ref(5);
const timer = ref<number | null>(null);

const returnTo = computed(() => {
  const stored = localStorage.getItem(VNPAY_RETURN_TO_KEY);
  if (stored?.startsWith("/")) return stored;
  return "/patient";
});

const title = computed(() => {
  if (status.value === "success") return "Thanh toan thanh cong";
  if (status.value === "cancel") return "Ban da huy giao dich";
  if (status.value === "pending") return "Giao dich dang xu ly";
  return "Thanh toan chua thanh cong";
});

const resolveReturnStatus = (success: boolean, code: string) => {
  if (success) return "success" as const;
  if (code === "24") return "cancel" as const;
  if (code === "91") return "pending" as const;
  return "fail" as const;
};

const firePaymentEmail = async (invoiceId: string) => {
  const to = authStore.user?.email;
  if (!to) return;

  try {
    const detail = await patientApi.getMyInvoiceDetail(invoiceId);
    invoiceCode.value = detail.invoiceCode || "";

    await emailApi.sendTemplate({
      to,
      subject: "Xác nhận thanh toán hóa đơn",
      template: "payment-success",
      model: {
        patientName:
          authStore.user?.fullName || authStore.user?.username || "Khách hàng",
        invoiceCode: detail.invoiceCode,
        amount: detail.paidAmount,
        paidAt: new Date().toLocaleString("vi-VN"),
      },
    });
  } catch {
    // Email is best-effort, do not block UI.
  }
};

const goBack = () => {
  window.location.replace(returnTo.value);
};

onMounted(async () => {
  try {
    const params = Object.fromEntries(
      Object.entries(route.query).map(([key, value]) => [
        key,
        String(value ?? ""),
      ]),
    );

    const returnRes = await paymentApi.processVnPayReturn(params);
    if (!returnRes || typeof returnRes.success !== "boolean") {
      throw new Error("Du lieu tra ve tu VNPAY khong hop le");
    }

    responseCode.value = returnRes.responseCode || "";
    status.value = resolveReturnStatus(!!returnRes.success, responseCode.value);
    message.value = returnRes.message || message.value;

    if (status.value === "success" && returnRes.invoiceId) {
      await firePaymentEmail(returnRes.invoiceId);
    }
  } catch (error: any) {
    status.value = "fail";
    message.value = error?.message || "Khong the xac nhan ket qua thanh toan";
  } finally {
    loading.value = false;
    localStorage.removeItem(VNPAY_INVOICE_ID_KEY);

    timer.value = window.setInterval(() => {
      countdown.value -= 1;
      if (countdown.value <= 0) {
        if (timer.value) {
          window.clearInterval(timer.value);
          timer.value = null;
        }
        goBack();
      }
    }, 1000);
  }
});

onBeforeUnmount(() => {
  if (timer.value) {
    window.clearInterval(timer.value);
    timer.value = null;
  }
});
</script>

<style scoped>
.return-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 10% 10%, #e0f2fe 0%, transparent 30%),
    radial-gradient(circle at 90% 85%, #ccfbf1 0%, transparent 35%),
    linear-gradient(160deg, #f0fdfa 0%, #f8fafc 100%);
}

.glow-orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(2px);
  pointer-events: none;
}

.glow-1 {
  width: 280px;
  height: 280px;
  background: rgba(20, 184, 166, 0.16);
  top: -90px;
  right: -70px;
}

.glow-2 {
  width: 220px;
  height: 220px;
  background: rgba(2, 132, 199, 0.14);
  bottom: -70px;
  left: -50px;
}

.return-card {
  width: min(680px, 95vw);
  background: #ffffff;
  border: 1px solid #dbeafe;
  border-radius: 22px;
  padding: 28px;
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.14);
  position: relative;
  z-index: 1;
}

.return-card.state-success {
  border-color: #99f6e4;
}

.return-card.state-cancel {
  border-color: #fde68a;
}

.return-card.state-pending {
  border-color: #bfdbfe;
}

.return-card.state-fail {
  border-color: #fecaca;
}

.status-icon-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

.status-icon {
  width: 88px;
  height: 88px;
}

.icon-circle {
  fill: #ffffff;
  stroke-width: 4;
  stroke-dasharray: 201;
  stroke-dashoffset: 201;
  animation: draw-stroke 0.8s ease forwards;
}

.icon-path {
  fill: none;
  stroke-width: 5;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 80;
  stroke-dashoffset: 80;
  animation: draw-stroke 0.55s ease 0.3s forwards;
}

.icon-check .icon-circle,
.icon-check .icon-path {
  stroke: #10b981;
}

.icon-fail .icon-circle,
.icon-fail .icon-path {
  stroke: #ef4444;
}

.icon-cancel .icon-circle,
.icon-cancel .icon-path {
  stroke: #d97706;
}

.icon-pending .icon-circle,
.icon-pending .icon-path {
  stroke: #2563eb;
}

.icon-check,
.icon-fail,
.icon-cancel {
  animation: pop-in 0.45s ease;
}

.icon-pending {
  animation: spin-soft 2.5s linear infinite;
}

.eyebrow {
  margin: 0;
  color: #0f766e;
  font-weight: 700;
  font-size: 12px;
  text-align: center;
  letter-spacing: 0.08em;
}

h1 {
  margin: 10px 0 8px;
  font-size: clamp(28px, 3.8vw, 36px);
  line-height: 1.2;
  color: #0f172a;
  text-align: center;
}

.message {
  margin: 0;
  color: #334155;
  line-height: 1.6;
  text-align: center;
}

.meta-grid {
  margin-top: 14px;
  display: grid;
  gap: 6px;
}

.meta-line,
.countdown-line {
  margin: 0;
  color: #475569;
  text-align: center;
}

.countdown-line {
  margin-top: 10px;
  font-weight: 600;
}

.actions {
  margin-top: 18px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.btn-primary,
.btn-ghost {
  text-decoration: none;
  border-radius: 12px;
  padding: 10px 14px;
  font-weight: 700;
  border: none;
  cursor: pointer;
}

.btn-primary {
  background: linear-gradient(135deg, #14b8a6 0%, #0284c7 100%);
  color: #ffffff;
  box-shadow: 0 8px 18px rgba(2, 132, 199, 0.26);
}

.btn-ghost {
  color: #0f766e;
  border: 1px solid #99f6e4;
  background: #f0fdfa;
}

@keyframes draw-stroke {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes pop-in {
  0% {
    transform: scale(0.7);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes spin-soft {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .return-card {
    padding: 22px;
  }

  .actions {
    flex-direction: column;
  }

  .btn-primary,
  .btn-ghost {
    width: 100%;
    text-align: center;
  }
}
</style>
