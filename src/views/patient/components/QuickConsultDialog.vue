<template>
  <el-dialog
    v-model="visible"
    width="900px"
    :close-on-click-modal="false"
    :show-close="true"
    class="quick-consult-dialog"
  >
    <div class="dialog-content">
      <!-- Step 1: Input Consultation Query with Quick Chips -->
      <div v-if="step === 1" class="step-1">
        <!-- Step Header -->
        <div class="step-header">
          <div class="step-indicator">
            <span class="step-number">1</span>
            <span class="step-text">Mô tả triệu chứng</span>
          </div>
        </div>

        <!-- Main Title -->
        <h2 class="main-title">Bạn đang cần tư vấn về điều gì?</h2>
        
        <!-- Description -->
        <p class="description">
          Mô tả chi tiết triệu chứng hoặc vấn đề của bạn. AI sẽ phân tích và gợi ý dịch vụ phù hợp cùng bác sĩ chuyên môn.
        </p>

        <!-- Quick Chips -->
        <div class="quick-chips-section">
          <p class="chips-label">Hoặc chọn nhanh một trong các trường hợp phổ biến:</p>
          <div class="quick-chips">
            <el-button
              v-for="chip in quickChips"
              :key="chip"
              plain
              @click="selectQuickChip(chip)"
              class="chip-btn"
            >
              {{ chip }}
            </el-button>
          </div>
        </div>

        <!-- Textarea -->
        <div class="input-section">
          <label class="input-label">Mô tả chi tiết</label>
          <el-input
            v-model="consultQuery"
            type="textarea"
            :rows="6"
            placeholder="Hoặc nhập nhu cầu của bạn tại đây..."
            class="query-input"
          />
          <p class="input-hint">
            <el-icon><InfoFilled /></el-icon>
            Càng mô tả chi tiết, AI sẽ gợi ý càng chính xác
          </p>
        </div>

        <div class="step-actions">
          <el-button @click="handleCancel" class="cancel-btn">Hủy</el-button>
          <el-button
            type="primary"
            @click="handleConsult"
            :loading="loading"
            :disabled="!consultQuery.trim()"
            class="consult-btn"
          >
            <el-icon><Cpu /></el-icon>
            AI tư vấn
          </el-button>
        </div>
      </div>

      <!-- Step 2: Select Services and Doctors -->
      <div v-if="step === 2" class="step-2">
        <!-- Step Header -->
        <div class="step-header">
          <div class="step-indicator">
            <span class="step-number">2</span>
            <span class="step-text">Xác nhận gợi ý</span>
          </div>
        </div>

        <!-- Title -->
        <h2 class="main-title">Gợi ý từ AI</h2>
        
        <!-- AI Reply Section -->
        <div v-if="results.reply" class="ai-reply-box">
          <el-icon class="reply-icon"><ChatDotRound /></el-icon>
          <div class="reply-content">
            <p class="reply-label">Tư vấn từ AI</p>
            <p class="reply-text">{{ results.reply }}</p>
          </div>
        </div>

        <p v-if="results.reply" class="step-intro">
          Dựa trên tư vấn trên, bạn có thể chọn dịch vụ phù hợp:
        </p>

        <!-- Services Section -->
        <div class="results-section">
          <h3 class="section-title">
            <el-icon><ShoppingBag /></el-icon>
            Dịch vụ tham khảo
          </h3>

          <div v-if="results.services.length > 0" class="items-list">
            <div
              v-for="(service, index) in results.services"
              :key="index"
              class="list-item"
              :class="{ 'item-selected': isServiceSelected(index) }"
              @click="toggleService(index)"
            >
              <div class="item-checkbox">
                <el-checkbox :model-value="isServiceSelected(index)" @click.stop />
              </div>
              <div class="item-content">
                <div class="item-name">{{ service.title || service.tittle || service.name }}</div>
                <div v-if="service.reason" class="item-reason">
                  <el-icon><InfoFilled /></el-icon>
                  {{ service.reason }}
                </div>
                <div class="item-description">{{ service.description }}</div>
                <div v-if="service.estimatedPrice" class="item-price">
                  Giá: {{ formatPrice(service.estimatedPrice) }}
                </div>
              </div>
            </div>
          </div>

          <div v-else class="empty-state">
            <el-icon><Search /></el-icon>
            <p>Không tìm thấy dịch vụ phù hợp</p>
          </div>
        </div>

        <!-- Doctors Section -->
        <div class="results-section">
          <h3 class="section-title">
            <el-icon><User /></el-icon>
            Bác sĩ gợi ý
          </h3>

          <div v-if="results.doctors.length > 0" class="items-list">
            <div
              v-for="(doctor, index) in results.doctors"
              :key="index"
              class="list-item doctor-item"
              :class="{ 'item-selected': isDoctorSelected(index) }"
              @click="toggleDoctor(index)"
            >
              <div class="item-checkbox">
                <el-checkbox :model-value="isDoctorSelected(index)" @click.stop />
              </div>
              <el-avatar
                :size="48"
                :src="doctor.avatar || undefined"
                class="doctor-avatar"
              >
                {{ (doctor.name || "B")?.[0] || "B" }}
              </el-avatar>
              <div class="item-content">
                <div class="item-name">{{ doctor.name || doctor.doctorName || doctor.fullName }}</div>
                <div v-if="doctor.specialization" class="item-spec">
                  {{ doctor.specialization }}
                </div>
                <div v-if="doctor.experience" class="item-exp">
                  {{ doctor.experience }} năm kinh nghiệm
                </div>
              </div>
            </div>
          </div>

          <div v-else class="empty-state">
            <el-icon><InfoFilled /></el-icon>
            <p>Chưa có bác sĩ gợi ý phù hợp. Nhân viên sẽ phân công bác sĩ sau khi tiếp nhận lịch.</p>
          </div>
        </div>

        <!-- Next Question (if needMoreInfo) -->
        <div v-if="results.needMoreInfo && results.nextQuestion" class="next-question-box">
          <el-icon class="question-icon"><ChatDotRound /></el-icon>
          <div class="question-content">
            <p class="question-label">Câu hỏi tiếp theo</p>
            <p class="question-text">{{ results.nextQuestion }}</p>
            <el-button
              type="primary"
              size="small"
              @click="continueConsultation"
              class="continue-btn"
            >
              Tiếp tục tư vấn
            </el-button>
          </div>
        </div>

        <!-- Expandable Preview Section -->
        <div class="preview-collapsible">
          <div class="preview-toggle" @click="showPreview = !showPreview">
            <el-icon>
              <component :is="showPreview ? iconMap.ArrowUp : iconMap.ArrowDown" />
            </el-icon>
            <span>Xem trước ghi chú</span>
          </div>
          <div v-if="showPreview" class="preview-box">
            <pre class="preview-text">{{ generatedNote }}</pre>
          </div>
        </div>

        <!-- Disclaimer -->
        <div v-if="results.disclaimer" class="disclaimer-box">
          <el-icon><WarningFilled /></el-icon>
          <p>{{ results.disclaimer }}</p>
        </div>

        <!-- Action Buttons -->
        <div class="step-actions">
          <el-button @click="step = 1">← Quay lại</el-button>
          <el-button type="primary" @click="handleConfirm">
            Dùng gợi ý này
          </el-button>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { ElMessage } from "element-plus";
import { ChatDotRound, Search, ShoppingBag, User, InfoFilled, ArrowUp, ArrowDown, WarningFilled, Cpu } from "@element-plus/icons-vue";
import { quickConsultApi, type QuickConsultService, type QuickConsultDoctor } from "@/api/quickConsult";

// Expose icons for template
const iconMap = { ArrowUp, ArrowDown };

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "select", data: { service?: QuickConsultService; doctor?: QuickConsultDoctor; note: string }): void;
}>();

// Quick chips
const quickChips = [
  "Đau răng",
  "Lấy cao răng",
  "Tẩy trắng",
  "Niềng răng",
  "Răng khôn",
  "Chảy máu nướu"
];

// State
const step = ref(1);
const loading = ref(false);
const consultQuery = ref("");
const showPreview = ref(false);

const results = ref({
  reply: "",
  services: [] as QuickConsultService[],
  doctors: [] as QuickConsultDoctor[],
  needMoreInfo: false,
  nextQuestion: null as string | null,
  disclaimer: "",
});

// Track selected by index instead of ID
const selectedServiceIndices = ref<Set<number>>(new Set());
const selectedDoctorIndices = ref<Set<number>>(new Set());

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

// Helper functions
const formatPrice = (price: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(price);
};

const isServiceSelected = (index: number) => {
  return selectedServiceIndices.value.has(index);
};

const isDoctorSelected = (index: number) => {
  return selectedDoctorIndices.value.has(index);
};

const toggleService = (index: number) => {
  if (selectedServiceIndices.value.has(index)) {
    selectedServiceIndices.value.delete(index);
  } else {
    selectedServiceIndices.value.add(index);
  }
};

const toggleDoctor = (index: number) => {
  if (selectedDoctorIndices.value.has(index)) {
    selectedDoctorIndices.value.delete(index);
  } else {
    selectedDoctorIndices.value.add(index);
  }
};

const selectQuickChip = (chip: string) => {
  consultQuery.value = chip;
};

// Generate professional note format
const generatedNote = computed(() => {
  let note = `Nhu cầu bệnh nhân:\n${consultQuery.value}\n\n`;

  // Add selected services
  const selectedServicesList: QuickConsultService[] = [];
  results.value.services.forEach((service, index) => {
    if (isServiceSelected(index)) {
      selectedServicesList.push(service);
    }
  });

  if (selectedServicesList.length > 0) {
    note += `Dịch vụ tham khảo từ tư vấn nhanh:\n`;
    selectedServicesList.forEach((service) => {
      const serviceName = service.title || service.tittle || service.name;
      note += `- ${serviceName}\n`;
    });
    note += "\n";
  }

  // Add selected doctors
  const selectedDoctorsList: QuickConsultDoctor[] = [];
  results.value.doctors.forEach((doctor, index) => {
    if (isDoctorSelected(index)) {
      selectedDoctorsList.push(doctor);
    }
  });

  if (selectedDoctorsList.length > 0) {
    note += `Bác sĩ mong muốn từ tư vấn nhanh:\n`;
    selectedDoctorsList.forEach((doctor) => {
      const doctorName = doctor.name || doctor.doctorName || doctor.fullName;
      note += `- ${doctorName}\n`;
    });
    note += "\n";
  }

  note += `Lưu ý:\nDịch vụ chỉ mang tính tham khảo, bác sĩ sẽ xác nhận sau khi thăm khám.`;

  return note;
});

// API call
const handleConsult = async () => {
  if (!consultQuery.value.trim()) {
    ElMessage.warning("Vui lòng nhập nhu cầu tư vấn");
    return;
  }

  try {
    loading.value = true;
    const response = await quickConsultApi.consult({
      message: consultQuery.value,
      conversation: [],
    });

    console.log("===== API RESPONSE =====");
    console.log("Full Response:", response);
    console.log("Reply:", response.reply);
    console.log("Suggested Services:", response.suggestedServices);
    console.log("Suggested Doctors:", response.suggestedDoctors);
    console.log("Disclaimer:", response.disclaimer);

    results.value = {
      reply: response.reply || "",
      services: response.suggestedServices || [],
      doctors: response.suggestedDoctors || [],
      needMoreInfo: response.needMoreInfo || false,
      nextQuestion: response.nextQuestion || null,
      disclaimer: response.disclaimer || "",
    };

    // Auto-select all items by index on first load
    selectedServiceIndices.value = new Set(
      results.value.services.map((_, index) => index)
    );
    selectedDoctorIndices.value = new Set(
      results.value.doctors.map((_, index) => index)
    );

    step.value = 2;
  } catch (error: any) {
    console.error("Consultation Error:", error);
    ElMessage.error(error.message || "Tư vấn thất bại, vui lòng thử lại");
  } finally {
    loading.value = false;
  }
};

// Continue consultation with next question
const continueConsultation = async () => {
  if (!results.value.nextQuestion) return;

  try {
    loading.value = true;
    
    // Build conversation history
    const conversation = [
      { role: "USER" as const, content: consultQuery.value },
      { role: "ASSISTANT" as const, content: results.value.reply },
      { role: "USER" as const, content: results.value.nextQuestion },
    ];

    const response = await quickConsultApi.consult({
      message: results.value.nextQuestion,
      conversation,
    });

    console.log("===== CONTINUE CONSULTATION RESPONSE =====");
    console.log("Full Response:", response);

    results.value = {
      reply: response.reply || "",
      services: response.suggestedServices || [],
      doctors: response.suggestedDoctors || [],
      needMoreInfo: response.needMoreInfo || false,
      nextQuestion: response.nextQuestion || null,
      disclaimer: response.disclaimer || "",
    };

    // Auto-select all items
    selectedServiceIndices.value = new Set(
      results.value.services.map((_, index) => index)
    );
    selectedDoctorIndices.value = new Set(
      results.value.doctors.map((_, index) => index)
    );

    ElMessage.success("Tư vấn được cập nhật");
  } catch (error: any) {
    console.error("Continue Consultation Error:", error);
    ElMessage.error(error.message || "Tư vấn tiếp theo thất bại");
  } finally {
    loading.value = false;
  }
};

// Confirm and emit
const handleConfirm = () => {
  if (selectedServiceIndices.value.size === 0 && selectedDoctorIndices.value.size === 0) {
    ElMessage.warning("Vui lòng chọn ít nhất một dịch vụ hoặc bác sĩ");
    return;
  }

  // Get first selected service and doctor
  let selectedService: QuickConsultService | undefined;
  let selectedDoctor: QuickConsultDoctor | undefined;

  for (let i = 0; i < results.value.services.length; i++) {
    if (selectedServiceIndices.value.has(i)) {
      selectedService = results.value.services[i];
      break;
    }
  }

  for (let i = 0; i < results.value.doctors.length; i++) {
    if (selectedDoctorIndices.value.has(i)) {
      selectedDoctor = results.value.doctors[i];
      break;
    }
  }

  emit("select", {
    service: selectedService,
    doctor: selectedDoctor,
    note: generatedNote.value,
  });

  handleCancel();
};

// Cancel and reset
const handleCancel = () => {
  visible.value = false;
  setTimeout(() => {
    step.value = 1;
    consultQuery.value = "";
    showPreview.value = false;
    results.value = {
      reply: "",
      services: [],
      doctors: [],
      needMoreInfo: false,
      nextQuestion: null,
      disclaimer: "",
    };
    selectedServiceIndices.value = new Set();
    selectedDoctorIndices.value = new Set();
  }, 300);
};
</script>

<style scoped lang="scss">
.quick-consult-dialog {
  :deep(.el-dialog) {
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
  }

  :deep(.el-dialog__header) {
    display: none;
  }
}

.dialog-content {
  padding: 32px;
  max-height: 70vh;
  overflow-y: auto;
}

.step-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

.step-indicator {
  display: flex;
  align-items: center;
  gap: 12px;

  .step-number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
    color: white;
    border-radius: 50%;
    font-weight: 700;
    font-size: 16px;
  }

  .step-text {
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
  }
}

.main-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 12px 0;
  line-height: 1.3;
}

.description {
  font-size: 16px;
  color: #6b7280;
  line-height: 1.6;
  margin: 0 0 24px 0;
}

.quick-chips-section {
  margin-bottom: 24px;

  .chips-label {
    font-size: 15px;
    font-weight: 600;
    color: #374151;
    margin: 0 0 12px 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}

.quick-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 8px;

  .chip-btn {
    border-radius: 8px;
    border: 2px solid #e5e7eb;
    color: #6b7280;
    font-size: 15px;
    font-weight: 500;
    padding: 11px 20px;
    transition: all 0.25s ease;
    background: white;
    height: auto;

    &:hover {
      border-color: #14b8a6;
      color: #14b8a6;
      background: rgba(20, 184, 166, 0.05);
      box-shadow: 0 2px 8px rgba(20, 184, 166, 0.12);
    }

    &:active {
      border-color: #14b8a6;
      color: white;
      background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
    }
  }
}

.input-section {
  margin-bottom: 24px;

  .input-label {
    display: block;
    font-size: 15px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}

.query-input {
  margin-bottom: 8px;

  :deep(.el-textarea__inner) {
    border-radius: 10px;
    border: 2px solid #e5e7eb;
    font-size: 16px;
    line-height: 1.6;
    transition: all 0.25s ease;

    &:focus {
      border-color: #14b8a6;
      box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
    }
  }
}

.input-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #6b7280;
  margin: 0;

  :deep(.el-icon) {
    flex-shrink: 0;
    color: #14b8a6;
  }
}

.step-intro {
  font-size: 15px;
  color: #4b5563;
  line-height: 1.6;
  margin: 0;
  padding: 8px 0;
}

.step-2 {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.results-section {
  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 20px;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 16px 0;

    :deep(.el-icon) {
      color: #14b8a6;
      font-size: 20px;
    }
  }
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.list-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;

  &:hover {
    border-color: #14b8a6;
    background: rgba(20, 184, 166, 0.02);
  }

  &.item-selected {
    border-color: #14b8a6;
    background: rgba(20, 184, 166, 0.08);
  }

  &.doctor-item {
    .doctor-avatar {
      background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
      flex-shrink: 0;
    }
  }

  .item-checkbox {
    display: flex;
    align-items: center;
    justify-content: center;
    padding-top: 2px;
    flex-shrink: 0;

    :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
      background-color: #14b8a6;
      border-color: #14b8a6;
    }

    :deep(.el-checkbox__inner) {
      border-color: #d1d5db;
    }
  }

  .item-content {
    flex: 1;
    min-width: 0;
  }

  .item-name {
    font-weight: 600;
    color: #1f2937;
    font-size: 16px;
    margin-bottom: 4px;
  }

  .item-description {
    color: #6b7280;
    font-size: 15px;
    margin-bottom: 4px;
    line-height: 1.4;
  }

  .item-spec {
    color: #14b8a6;
    font-size: 12px;
    margin-bottom: 2px;
    font-weight: 500;
  }

  .item-exp {
    color: #6b7280;
    font-size: 12px;
  }

  .item-price {
    color: #f59e0b;
    font-weight: 600;
    font-size: 12px;
    margin-top: 4px;
  }
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #9ca3af;

  :deep(.el-icon) {
    font-size: 48px;
    color: #d1d5db;
    margin-bottom: 12px;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
}

.preview-collapsible {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.preview-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f9fafb;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
  font-weight: 600;
  color: #374151;

  &:hover {
    background: #f3f4f6;
    color: #14b8a6;
  }

  :deep(.el-icon) {
    color: #14b8a6;
    font-size: 18px;
  }
}

.preview-box {
  background: white;
  border-top: 1px solid #e5e7eb;
  border-radius: 0;
  padding: 16px;
  max-height: 250px;
  overflow-y: auto;
}

.preview-text {
  margin: 0;
  font-size: 14px;
  color: #374151;
  font-family: 'Courier New', monospace;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
}

.info-text {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
  background: #f0fdfa;
  border-left: 4px solid #14b8a6;
  border-radius: 6px;
  font-size: 14px;
  color: #0f766e;
  line-height: 1.6;

  :deep(.el-icon) {
    flex-shrink: 0;
    margin-top: 2px;
    color: #14b8a6;
    font-size: 18px;
  }
}

.ai-reply-box {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(20, 184, 166, 0.08) 0%, rgba(6, 182, 212, 0.04) 100%);
  border: 1px solid #a7f3d0;
  border-radius: 10px;
  margin-bottom: 12px;

  .reply-icon {
    flex-shrink: 0;
    font-size: 24px;
    color: #14b8a6;
    margin-top: 2px;
  }

  .reply-content {
    flex: 1;
  }

  .reply-label {
    font-size: 12px;
    font-weight: 600;
    color: #14b8a6;
    text-transform: uppercase;
    margin: 0 0 4px 0;
    letter-spacing: 0.5px;
  }

  .reply-text {
    font-size: 15px;
    color: #1f2937;
    line-height: 1.6;
    margin: 0;
  }
}

.next-question-box {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.04) 100%);
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  margin: 12px 0;

  .question-icon {
    flex-shrink: 0;
    font-size: 24px;
    color: #3b82f6;
    margin-top: 2px;
  }

  .question-content {
    flex: 1;
  }

  .question-label {
    font-size: 12px;
    font-weight: 600;
    color: #3b82f6;
    text-transform: uppercase;
    margin: 0 0 4px 0;
    letter-spacing: 0.5px;
  }

  .question-text {
    font-size: 15px;
    color: #1f2937;
    line-height: 1.6;
    margin: 0 0 8px 0;
  }

  .continue-btn {
    margin-top: 8px;
  }
}

.disclaimer-box {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
  border-radius: 6px;
  font-size: 13px;
  color: #92400e;
  line-height: 1.5;

  :deep(.el-icon) {
    flex-shrink: 0;
    margin-top: 2px;
    color: #f59e0b;
    font-size: 16px;
  }

  p {
    margin: 0;
  }
}

.item-reason {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 13px;
  color: #14b8a6;
  font-weight: 500;
  margin-bottom: 4px;
  line-height: 1.4;

  :deep(.el-icon) {
    flex-shrink: 0;
    margin-top: 2px;
    font-size: 14px;
  }
}

.step-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;

  .cancel-btn {
    :deep(.el-button__text) {
      display: flex;
      align-items: center;
      gap: 6px;
    }
  }

  .consult-btn {
    :deep(.el-button__text) {
      display: flex;
      align-items: center;
      gap: 8px;

      .el-icon {
        font-size: 18px;
      }
    }
  }

  :deep(.el-button) {
    padding: 10px 24px;
    font-weight: 600;
    border-radius: 8px;
    transition: all 0.25s ease;
  }

  :deep(.el-button.is-plain) {
    border: 2px solid #d1d5db;
    color: #6b7280;

    &:hover {
      border-color: #14b8a6;
      color: #14b8a6;
      background: rgba(20, 184, 166, 0.05);
    }
  }

  :deep(.el-button--primary) {
    background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
    border: none;

    &:hover:not(:disabled) {
      box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);
      transform: translateY(-2px);
    }
  }
}

.step-1 {
  display: flex;
  flex-direction: column;
}
</style>
