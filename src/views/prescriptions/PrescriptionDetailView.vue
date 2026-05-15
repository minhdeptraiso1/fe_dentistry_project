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
          v-if="
            prescription?.status === 'DRAFT' &&
            (authStore.isDoctor || authStore.isAdmin)
          "
          class="px-5 py-2.5 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-600 transition-colors"
          @click="handleIssue"
        >
          Phát hành
        </button>

        <button
          v-if="
            prescription?.status === 'ISSUED' &&
            (authStore.isCashier || authStore.isAdmin)
          "
          class="px-5 py-2.5 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
          @click="handleDispense"
        >
          Xuất thuốc
        </button>

        <button
          v-if="
            prescription?.status === 'DISPENSED' &&
            (authStore.isCashier || authStore.isAdmin)
          "
          class="px-5 py-2.5 bg-sky-500 text-white rounded-lg font-medium hover:bg-sky-600 transition-colors"
          @click="handleCreateInvoice"
        >
          Tạo hóa đơn
        </button>

        <button
          v-if="
            prescription?.status !== 'DISPENSED' &&
            prescription?.status !== 'CANCELLED' &&
            (authStore.isDoctor || authStore.isAdmin)
          "
          class="px-5 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
          @click="handleCancel"
        >
          Hủy đơn
        </button>

        <button
          class="px-5 py-2.5 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors"
          @click="printPrescription"
        >
          In đơn thuốc
        </button>
      </div>
    </div>

    <!-- PRESCRIPTION -->
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
        <h1 class="text-3xl font-bold mb-2.5">ĐƠN THUỐC</h1>

        <div class="flex justify-center gap-5">
          <span
            >Mã đơn: <b>{{ prescription?.prescriptionCode }}</b></span
          >
          <span
            >Trạng thái:
            <b
              :class="{
                'text-gray-600': prescription?.status === 'DRAFT',
                'text-orange-600': prescription?.status === 'ISSUED',
                'text-green-600': prescription?.status === 'DISPENSED',
                'text-red-600': prescription?.status === 'CANCELLED',
              }"
              >{{ getStatusLabel(prescription?.status) }}</b
            >
          </span>
        </div>
      </div>

      <!-- INFO -->
      <div class="grid grid-cols-2 gap-2.5 mb-5">
        <div class="flex gap-2.5">
          <span class="font-semibold w-[120px]">Bệnh nhân</span>
          <span>{{ prescription?.patientName }}</span>
        </div>

        <div class="flex gap-2.5">
          <span class="font-semibold w-[120px]">Mã bệnh nhân</span>
          <span>{{ prescription?.patientCode }}</span>
        </div>

        <div class="flex gap-2.5">
          <span class="font-semibold w-[120px]">Bác sĩ kê đơn</span>
          <span>{{ prescription?.doctorUsername }}</span>
        </div>

        <div class="flex gap-2.5">
          <span class="font-semibold w-[120px]">Ngày tạo</span>
          <span>{{ formatDateTime(prescription?.createdAt) }}</span>
        </div>

        <div v-if="prescription?.note" class="col-span-2 flex gap-2.5">
          <span class="font-semibold w-[120px]">Ghi chú</span>
          <span>{{ prescription.note }}</span>
        </div>
      </div>

      <!-- TABLE -->
      <table class="w-full border-collapse mt-5">
        <thead>
          <tr>
            <th class="bg-gray-100 p-2.5 border border-gray-300">STT</th>
            <th class="bg-gray-100 p-2.5 border border-gray-300">Mã thuốc</th>
            <th class="bg-gray-100 p-2.5 border border-gray-300">Tên thuốc</th>
            <th class="bg-gray-100 p-2.5 border border-gray-300">ĐVT</th>
            <th class="bg-gray-100 p-2.5 border border-gray-300">Liều dùng</th>
            <th class="bg-gray-100 p-2.5 border border-gray-300">Số lượng</th>
            <th class="bg-gray-100 p-2.5 border border-gray-300">Ghi chú</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(item, index) in prescription?.items" :key="index">
            <td class="p-2.5 border border-gray-300 text-center">
              {{ Number(index) + 1 }}
            </td>

            <td class="p-2.5 border border-gray-300">
              {{ item.medicineCode }}
            </td>

            <td class="p-2.5 border border-gray-300">
              {{ item.medicineName }}
            </td>

            <td class="p-2.5 border border-gray-300 text-center">
              {{ item.unit }}
            </td>

            <td class="p-2.5 border border-gray-300">
              {{ item.dosage || "N/A" }}
            </td>

            <td class="p-2.5 border border-gray-300 text-center">
              {{ item.quantity }}
            </td>

            <td class="p-2.5 border border-gray-300">
              {{ item.note || "" }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- SIGNATURE -->
      <div class="flex justify-between mt-16">
        <div class="text-center">
          <p class="mb-1">Bác sĩ kê đơn</p>
          <div class="border-b border-black w-[200px] mt-10"></div>
          <p class="mt-1 text-sm">{{ prescription?.doctorUsername }}</p>
        </div>

        <div class="text-center">
          <p class="mb-1">Bệnh nhân</p>
          <div class="border-b border-black w-[200px] mt-10"></div>
          <p class="mt-1 text-sm">{{ prescription?.patientName }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import logoImg from "@/assets/logo.png";
import { prescriptionApi } from "@/api/prescription";
import { invoiceApi } from "@/api/invoice";
import { useAuthStore } from "@/stores/auth";
import type { Prescription, PrescriptionStatus } from "@/types/prescription";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const prescription = ref<Prescription>();

const loadPrescription = async () => {
  const id = route.params.id as string;

  try {
    prescription.value = await prescriptionApi.getById(id);
  } catch (error) {
    ElMessage.error("Tải đơn thuốc thất bại");
  }
};

onMounted(loadPrescription);

const handleIssue = async () => {
  if (!prescription.value) return;

  try {
    await ElMessageBox.confirm(
      `Xác nhận phát hành đơn "${prescription.value.prescriptionCode}"?`,
      "Phát hành đơn thuốc",
      {
        confirmButtonText: "Phát hành",
        cancelButtonText: "Hủy",
        type: "info",
      },
    );

    await prescriptionApi.issue(prescription.value.id);
    ElMessage.success("Phát hành đơn thuốc thành công");
    loadPrescription();
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("Failed to issue prescription:", error);
      ElMessage.error("Phát hành đơn thuốc thất bại");
    }
  }
};

const handleDispense = async () => {
  if (!prescription.value) return;

  try {
    const result = await ElMessageBox.prompt(
      `Xác nhận xuất thuốc cho đơn "${prescription.value.prescriptionCode}"?`,
      "Xuất thuốc",
      {
        confirmButtonText: "Xuất thuốc",
        cancelButtonText: "Hủy",
        inputPlaceholder: "Nhập ghi chú (tùy chọn)",
        inputType: "textarea",
      },
    );

    const note = typeof result === "string" ? result : (result as any).value;
    await prescriptionApi.dispense(prescription.value.id, {
      note: note || undefined,
    });

    ElMessage.success("Xuất thuốc thành công. Vui lòng tạo hóa đơn sau.");
    loadPrescription();
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("Failed to dispense:", error);
      ElMessage.error("Xuất thuốc thất bại");
    }
  }
};

const handleCreateInvoice = async () => {
  if (!prescription.value) return;

  try {
    await ElMessageBox.confirm(
      "Tạo hóa đơn cho đơn thuốc này?",
      "Tạo hóa đơn",
      {
        confirmButtonText: "Tạo hóa đơn",
        cancelButtonText: "Hủy",
        type: "info",
      },
    );

    await invoiceApi.createFromPrescription({
      prescriptionId: prescription.value.id,
    });

    ElMessage.success("Tạo hóa đơn thành công");
    loadPrescription();
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("Failed to create invoice:", error);
      ElMessage.error("Tạo hóa đơn thất bại");
    }
  }
};

const handleCancel = async () => {
  if (!prescription.value) return;

  try {
    const result = await ElMessageBox.prompt(
      `Xác nhận hủy đơn thuốc "${prescription.value.prescriptionCode}"?`,
      "Lý do hủy",
      {
        confirmButtonText: "Hủy đơn",
        cancelButtonText: "Đóng",
        inputPlaceholder: "Nhập lý do hủy (tùy chọn)",
        inputType: "textarea",
        type: "error",
        customClass: "danger-confirm-dialog",
      },
    );

    const note = typeof result === "string" ? result : (result as any).value;
    await prescriptionApi.cancel(prescription.value.id, note || undefined);
    ElMessage.success("Hủy đơn thuốc thành công");
    loadPrescription();
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("Failed to cancel prescription:", error);
      ElMessage.error("Hủy đơn thuốc thất bại");
    }
  }
};

const printPrescription = () => {
  window.print();
};

const getStatusLabel = (status?: PrescriptionStatus) => {
  if (!status) return "";
  const labelMap: Record<PrescriptionStatus, string> = {
    DRAFT: "Nháp",
    ISSUED: "Đã kê",
    DISPENSED: "Đã xuất",
    CANCELLED: "Đã hủy",
  };
  return labelMap[status];
};

const formatDateTime = (dateString?: string) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleString("vi-VN");
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

  /* Remove shadow from prescription container */
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
