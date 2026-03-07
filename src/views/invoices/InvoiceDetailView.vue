<template>
  <div class="bg-gray-100 p-8 min-h-screen">
    <!-- ACTION BAR (hidden when print) -->
    <div class="flex justify-between mb-5 no-print">
      <button
        class="px-5 py-2.5 bg-gray-200 rounded-lg font-medium hover:bg-gray-300 transition-colors"
        @click="router.back()"
      >
        ← Quay lại
      </button>

      <div class="flex gap-2.5">
        <button
          v-if="invoice?.status === 'DRAFT'"
          class="px-5 py-2.5 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
          @click="handleIssue"
        >
          Phát hành
        </button>

        <button
          v-if="invoice?.status !== 'PAID'"
          class="px-5 py-2.5 bg-sky-500 text-white rounded-lg font-medium hover:bg-sky-600 transition-colors"
          @click="handleAddPayment"
        >
          Thanh toán
        </button>

        <button
          class="px-5 py-2.5 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors"
          @click="printInvoice"
        >
          In hóa đơn
        </button>
      </div>
    </div>

    <!-- INVOICE -->
    <div class="w-[210mm] bg-white mx-auto p-10 shadow-lg">
      <!-- COMPANY -->
      <div class="flex gap-5 mb-5">
        <img :src="logoImg" class="w-20 h-20 object-contain" />

        <div>
          <h2 class="text-xl font-bold m-0 mb-1">
            PHÒNG KHÁM NHA KHOA Việt SMILE
          </h2>
          <p class="m-0 text-sm">Địa chỉ: 123 Nguyễn Văn Linh, Đà Nẵng</p>
          <p class="m-0 text-sm">Điện thoại: 0868 030 043</p>
          <p class="m-0 text-sm">Mã số thuế: 0401234567</p>
        </div>
      </div>

      <!-- TITLE -->
      <div class="text-center my-8">
        <h1 class="text-3xl font-bold mb-2.5">HÓA ĐƠN THANH TOÁN</h1>

        <div>
          <span
            >Số hóa đơn: <b>{{ invoice?.invoiceCode }}</b></span
          >
        </div>
      </div>

      <!-- INFO -->
      <div class="grid grid-cols-2 gap-2.5 mb-5">
        <div class="flex gap-2.5">
          <span class="font-semibold w-[120px]">Bệnh nhân</span>
          <span>{{ invoice?.patientName }}</span>
        </div>

        <div class="flex gap-2.5">
          <span class="font-semibold w-[120px]">Mã bệnh nhân</span>
          <span>{{ invoice?.patientCode }}</span>
        </div>

        <div class="flex gap-2.5">
          <span class="font-semibold w-[120px]">Ngày lập</span>
          <span>{{ formatDateTime(invoice?.createdAt) }}</span>
        </div>

        <div class="flex gap-2.5">
          <span class="font-semibold w-[120px]">Thu ngân</span>
          <span>{{ invoice?.cashierUsername }}</span>
        </div>
      </div>

      <!-- TABLE -->
      <table class="w-full border-collapse mt-5">
        <thead>
          <tr>
            <th class="bg-gray-100 p-2.5 border border-gray-300">STT</th>
            <th class="bg-gray-100 p-2.5 border border-gray-300">
              Tên dịch vụ
            </th>
            <th class="bg-gray-100 p-2.5 border border-gray-300">SL</th>
            <th class="bg-gray-100 p-2.5 border border-gray-300">Đơn giá</th>
            <th class="bg-gray-100 p-2.5 border border-gray-300">Giảm</th>
            <th class="bg-gray-100 p-2.5 border border-gray-300">Thành tiền</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(item, index) in invoice?.items" :key="index">
            <td class="p-2.5 border border-gray-300">
              {{ Number(index) + 1 }}
            </td>

            <td class="p-2.5 border border-gray-300">{{ item.itemName }}</td>

            <td class="p-2.5 border border-gray-300 text-center">
              {{ item.quantity }}
            </td>

            <td class="p-2.5 border border-gray-300 text-right">
              {{ formatCurrency(item.unitPrice) }}
            </td>

            <td class="p-2.5 border border-gray-300 text-right">
              {{ formatCurrency(item.discountAmount) }}
            </td>

            <td class="p-2.5 border border-gray-300 text-right">
              {{ formatCurrency(item.lineTotal) }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- SUMMARY -->
      <div class="w-[350px] ml-auto mt-8">
        <div class="flex justify-between mb-2.5">
          <span>Tạm tính</span>
          <span>{{ formatCurrency(invoice?.subtotal) }}</span>
        </div>

        <div class="flex justify-between mb-2.5">
          <span>Giảm giá</span>
          <span>- {{ formatCurrency(invoice?.discountAmount) }}</span>
        </div>

        <div class="flex justify-between mb-2.5 text-lg font-bold">
          <span>Tổng tiền</span>
          <span>{{ formatCurrency(invoice?.totalAmount) }}</span>
        </div>

        <div class="flex justify-between mb-2.5 text-green-600">
          <span>Đã thanh toán</span>
          <span>{{ formatCurrency(invoice?.paidAmount) }}</span>
        </div>

        <div class="flex justify-between mb-2.5 text-red-600 font-bold">
          <span>Còn lại</span>
          <span>
            {{ formatCurrency(invoice?.totalAmount - invoice?.paidAmount) }}
          </span>
        </div>
      </div>

      <!-- SIGNATURE -->
      <div class="flex justify-between mt-16">
        <div class="text-center">
          <p class="mb-1">Thu ngân</p>
          <div class="border-b border-black w-[200px] mt-10"></div>
        </div>

        <div class="text-center">
          <p class="mb-1">Khách hàng</p>
          <div class="border-b border-black w-[200px] mt-10"></div>
        </div>
      </div>
    </div>

    <!-- Add Payment Dialog -->
    <AddPaymentDialog
      v-if="paymentDialogVisible"
      v-model="paymentDialogVisible"
      :invoice="invoice"
      @success="handlePaymentSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import logoImg from "@/assets/logo.png";
import { invoiceApi } from "@/api/invoice";
import AddPaymentDialog from "./components/AddPaymentDialog.vue";

const router = useRouter();
const route = useRoute();

const invoice = ref<any>(null);
const paymentDialogVisible = ref(false);

const loadInvoice = async () => {
  const id = route.params.id as string;

  try {
    invoice.value = await invoiceApi.getById(id);
  } catch (error) {
    ElMessage.error("Tải hóa đơn thất bại");
  }
};

onMounted(loadInvoice);

const handleIssue = async () => {
  await invoiceApi.issue(invoice.value.id);

  ElMessage.success("Phát hành thành công");

  loadInvoice();
};

const handleAddPayment = () => {
  paymentDialogVisible.value = true;
};

const handlePaymentSuccess = () => {
  paymentDialogVisible.value = false;
  loadInvoice();
};

const printInvoice = () => {
  window.print();
};

const formatCurrency = (value: number) => {
  if (!value) return "0";

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

const formatDateTime = (date: string) => {
  if (!date) return "";

  return new Date(date).toLocaleString("vi-VN");
};
</script>

<style scoped>
/* PRINT */
@media print {
  .no-print {
    display: none !important;
  }

  /* Hide background and padding from main container */
  div.bg-gray-100 {
    background: white !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  /* Remove shadow from invoice container */
  .w-\[210mm\] {
    box-shadow: none !important;
  }
}
</style>

<style>
/* Global print styles to hide MainLayout sidebar and header */
@media print {
  aside,
  header {
    display: none !important;
  }

  body {
    background: white !important;
  }

  /* Make the main content area full width */
  .flex-1 {
    width: 100% !important;
    max-width: 100% !important;
  }
}
</style>
