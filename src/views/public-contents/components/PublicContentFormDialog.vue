<template>
  <el-dialog
    v-model="formDialogVisible"
    :title="isEditing ? 'Cập nhật nội dung' : 'Tạo nội dung mới'"
    width="900px"
    top="4vh"
    destroy-on-close
    :show-close="false"
    class="public-content-dialog"
  >
    <template #header>
      <div class="public-content-dialog-header">
        <el-icon class="public-content-dialog-header-icon"><Edit /></el-icon>
        <div>
          <div class="public-content-dialog-header-title">
            {{ isEditing ? "Cập nhật nội dung công khai" : "Tạo nội dung mới" }}
          </div>
          <div class="public-content-dialog-header-subtitle">
            Điền thông tin rõ ràng để hiển thị tốt trên trang công khai
          </div>
        </div>
      </div>
    </template>

    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-position="top"
      class="public-content-form"
    >
      <div class="form-grid">
        <el-form-item label="Loại nội dung" prop="refType">
          <el-select
            v-model="formData.refType"
            placeholder="Chọn loại"
            style="width: 100%"
          >
            <el-option label="Bác sĩ" value="DOCTOR" />
            <el-option label="Dịch vụ" value="SERVICE" />
            <el-option label="Thuốc" value="MEDICINE" />
          </el-select>
        </el-form-item>

        <el-form-item label="Đối tượng tham chiếu">
          <el-select
            v-model="formData.refId"
            :loading="referenceLoading"
            clearable
            filterable
            placeholder="Chọn đối tượng"
            style="width: 100%"
          >
            <el-option
              v-for="option in referenceOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
          <div class="field-helper">
            Chọn đối tượng theo loại nội dung đã chọn để liên kết dữ liệu
          </div>
        </el-form-item>

        <el-form-item label="Tiêu đề" prop="title" class="span-2">
          <el-input v-model="formData.title" placeholder="Nhập tiêu đề" />
        </el-form-item>

        <el-form-item label="Đường dẫn thân thiện (slug)" class="span-2">
          <el-input
            v-model="formData.slug"
            placeholder="duong-dan-than-thien"
          />
        </el-form-item>

        <el-form-item label="Tiêu đề phụ" class="span-2">
          <el-input v-model="formData.subtitle" placeholder="Tiêu đề phụ" />
        </el-form-item>

        <el-form-item label="Mô tả ngắn" class="span-2">
          <el-input v-model="formData.description" type="textarea" :rows="2" />
        </el-form-item>

        <el-form-item label="Nội dung chi tiết" class="span-2">
          <el-input v-model="formData.content" type="textarea" :rows="6" />
        </el-form-item>

        <el-form-item label="Ảnh đại diện">
          <div class="image-input-wrapper">
            <el-input
              v-model="formData.imageUrl"
              placeholder="Dán đường dẫn ảnh hoặc chọn ảnh từ máy"
            />
            <input
              ref="mainImageInputRef"
              type="file"
              accept="image/*"
              style="display: none"
              @change="(event) => handleImageFileChange('main', event)"
            />
            <el-button
              type="primary"
              plain
              :icon="Upload"
              @click="openFilePicker('main')"
            >
              Chọn ảnh
            </el-button>
          </div>
          <div v-if="formData.imageUrl" class="image-preview-row">
            <img
              :src="formData.imageUrl"
              alt="Ảnh đại diện"
              class="image-preview"
            />
          </div>
        </el-form-item>

        <el-form-item label="Ảnh thu nhỏ">
          <div class="image-input-wrapper">
            <el-input
              v-model="formData.thumbnailUrl"
              placeholder="Dán đường dẫn ảnh hoặc chọn ảnh từ máy"
            />
            <input
              ref="thumbnailImageInputRef"
              type="file"
              accept="image/*"
              style="display: none"
              @change="(event) => handleImageFileChange('thumbnail', event)"
            />
            <el-button
              type="primary"
              plain
              :icon="Upload"
              @click="openFilePicker('thumbnail')"
            >
              Chọn ảnh
            </el-button>
          </div>
          <div v-if="formData.thumbnailUrl" class="image-preview-row">
            <img
              :src="formData.thumbnailUrl"
              alt="Ảnh thu nhỏ"
              class="image-preview"
            />
          </div>
        </el-form-item>

        <el-form-item label="Danh sách ảnh phụ" class="span-2">
          <div class="sub-images-wrap">
            <div class="sub-images-actions">
              <input
                ref="subImagesFileInputRef"
                type="file"
                accept="image/*"
                style="display: none"
                multiple
                @change="handleSubImagesFileChange"
              />
              <el-button
                type="primary"
                plain
                :icon="Upload"
                @click="openSubImagesPicker"
              >
                Thêm ảnh từ máy
              </el-button>
              <el-button plain @click="addSubImageRow">Thêm dòng URL</el-button>
            </div>

            <div v-if="subImageUrls.length" class="sub-images-list">
              <div
                v-for="(url, index) in subImageUrls"
                :key="index"
                class="sub-image-item"
              >
                <img
                  v-if="url"
                  :src="url"
                  alt="Ảnh phụ"
                  class="sub-image-thumb"
                />
                <div v-else class="sub-image-thumb sub-image-thumb-empty">
                  Ảnh
                </div>
                <el-input
                  v-model="subImageUrls[index]"
                  placeholder="Dán đường dẫn ảnh"
                  class="sub-image-url-input"
                />
                <el-button type="danger" plain @click="removeSubImage(index)"
                  >Xóa</el-button
                >
              </div>
            </div>

            <div v-else class="sub-images-empty">Chưa có ảnh phụ</div>
          </div>
        </el-form-item>

        <el-form-item label="Nội dung chuyên biệt theo loại" class="span-2">
          <div class="typed-extra-wrap">
            <div class="typed-extra-current">
              Đang nhập cho loại:
              <b>{{ getTypeLabel(formData.refType) }}</b>
            </div>

            <el-input
              v-if="formData.refType === 'DOCTOR'"
              v-model="extraDataByType.DOCTOR.degree"
              placeholder="Học vị"
            />
            <el-input
              v-if="formData.refType === 'DOCTOR'"
              v-model="extraDataByType.DOCTOR.experience"
              placeholder="Số năm kinh nghiệm"
            />
            <el-input
              v-if="formData.refType === 'DOCTOR'"
              v-model="extraDataByType.DOCTOR.specialty"
              placeholder="Chuyên khoa"
            />
            <el-input
              v-if="formData.refType === 'DOCTOR'"
              v-model="extraDataByType.DOCTOR.certificate"
              placeholder="Chứng chỉ nổi bật"
            />
            <el-input
              v-if="formData.refType === 'DOCTOR'"
              v-model="extraDataByType.DOCTOR.note"
              type="textarea"
              :rows="3"
              placeholder="Ghi chú thêm"
            />

            <el-input
              v-if="formData.refType === 'SERVICE'"
              v-model="extraDataByType.SERVICE.targetAudience"
              placeholder="Đối tượng phù hợp"
            />
            <el-input
              v-if="formData.refType === 'SERVICE'"
              v-model="extraDataByType.SERVICE.duration"
              placeholder="Thời lượng thực hiện"
            />
            <el-input
              v-if="formData.refType === 'SERVICE'"
              v-model="extraDataByType.SERVICE.benefits"
              type="textarea"
              :rows="2"
              placeholder="Lợi ích nổi bật"
            />
            <el-input
              v-if="formData.refType === 'SERVICE'"
              v-model="extraDataByType.SERVICE.process"
              type="textarea"
              :rows="3"
              placeholder="Quy trình thực hiện"
            />
            <el-input
              v-if="formData.refType === 'SERVICE'"
              v-model="extraDataByType.SERVICE.note"
              type="textarea"
              :rows="2"
              placeholder="Ghi chú thêm"
            />

            <el-input
              v-if="formData.refType === 'MEDICINE'"
              v-model="extraDataByType.MEDICINE.ingredient"
              placeholder="Hoạt chất chính"
            />
            <el-input
              v-if="formData.refType === 'MEDICINE'"
              v-model="extraDataByType.MEDICINE.dosage"
              placeholder="Liều dùng khuyến nghị"
            />
            <el-input
              v-if="formData.refType === 'MEDICINE'"
              v-model="extraDataByType.MEDICINE.usage"
              type="textarea"
              :rows="2"
              placeholder="Cách dùng"
            />
            <el-input
              v-if="formData.refType === 'MEDICINE'"
              v-model="extraDataByType.MEDICINE.contraindications"
              type="textarea"
              :rows="2"
              placeholder="Chống chỉ định"
            />
            <el-input
              v-if="formData.refType === 'MEDICINE'"
              v-model="extraDataByType.MEDICINE.sideEffects"
              type="textarea"
              :rows="2"
              placeholder="Tác dụng phụ"
            />
            <el-input
              v-if="formData.refType === 'MEDICINE'"
              v-model="extraDataByType.MEDICINE.note"
              type="textarea"
              :rows="2"
              placeholder="Ghi chú thêm"
            />
          </div>
        </el-form-item>

        <el-form-item label="Thứ tự hiển thị">
          <el-input-number
            v-model="formData.sortOrder"
            :min="0"
            :step="1"
            style="width: 100%"
          />
        </el-form-item>

        <div class="form-switches">
          <el-switch
            v-model="formData.active"
            active-text="Hiển thị"
            inactive-text="Ẩn"
          />
          <el-switch
            v-model="formData.featured"
            active-text="Nổi bật"
            inactive-text="Thường"
          />
        </div>
      </div>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="formDialogVisible = false">Hủy</el-button>
        <el-button
          type="primary"
          :loading="submitLoading"
          @click="handleSubmit"
        >
          {{ isEditing ? "Cập nhật" : "Tạo mới" }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import { ElMessage, type FormInstance } from "element-plus";
import { Edit, Upload } from "@element-plus/icons-vue";
import { notification } from "@/utils/notification";
import { publicContentApi } from "@/api/publicContent";
import { serviceApi } from "@/api/service";
import { medicineApi } from "@/api/medicine";
import { userApi } from "@/api/user";
import type {
  CreatePublicContentRequest,
  PublicContentType,
} from "@/types/publicContent";

const emit = defineEmits<{
  (e: "success"): void;
}>();

const formDialogVisible = ref(false);
const submitLoading = ref(false);
const formRef = ref<FormInstance>();
const isEditing = ref(false);
const editingId = ref<string | null>(null);
const subImageUrls = ref<string[]>([]);
const referenceLoading = ref(false);
const referenceOptions = ref<Array<{ label: string; value: string }>>([]);
const isEditInitializing = ref(false);
const mainImageInputRef = ref<HTMLInputElement | null>(null);
const thumbnailImageInputRef = ref<HTMLInputElement | null>(null);
const subImagesFileInputRef = ref<HTMLInputElement | null>(null);

type DoctorExtraForm = {
  degree: string;
  experience: string;
  specialty: string;
  certificate: string;
  note: string;
};

type ServiceExtraForm = {
  targetAudience: string;
  duration: string;
  benefits: string;
  process: string;
  note: string;
};

type MedicineExtraForm = {
  ingredient: string;
  dosage: string;
  usage: string;
  contraindications: string;
  sideEffects: string;
  note: string;
};

const emptyDoctorExtra = (): DoctorExtraForm => ({
  degree: "",
  experience: "",
  specialty: "",
  certificate: "",
  note: "",
});

const emptyServiceExtra = (): ServiceExtraForm => ({
  targetAudience: "",
  duration: "",
  benefits: "",
  process: "",
  note: "",
});

const emptyMedicineExtra = (): MedicineExtraForm => ({
  ingredient: "",
  dosage: "",
  usage: "",
  contraindications: "",
  sideEffects: "",
  note: "",
});

const extraDataByType = reactive<{
  DOCTOR: DoctorExtraForm;
  SERVICE: ServiceExtraForm;
  MEDICINE: MedicineExtraForm;
}>({
  DOCTOR: emptyDoctorExtra(),
  SERVICE: emptyServiceExtra(),
  MEDICINE: emptyMedicineExtra(),
});

const formData = reactive({
  refId: "",
  refType: "SERVICE" as PublicContentType,
  slug: "",
  title: "",
  subtitle: "",
  description: "",
  content: "",
  imageUrl: "",
  thumbnailUrl: "",
  sortOrder: 0,
  active: true,
  featured: false,
});

const formRules = {
  refType: [
    {
      required: true,
      message: "Vui lòng chọn loại nội dung",
      trigger: "change",
    },
  ],
  title: [
    { required: true, message: "Vui lòng nhập tiêu đề", trigger: "blur" },
  ],
};

const getTypeLabel = (type: PublicContentType) => {
  if (type === "DOCTOR") return "Bác sĩ";
  if (type === "MEDICINE") return "Thuốc";
  return "Dịch vụ";
};

const applyExtraDataFromRaw = (
  type: PublicContentType,
  raw?: string | null,
) => {
  if (!raw?.trim()) return;

  const assignRawNote = () => {
    if (type === "DOCTOR") extraDataByType.DOCTOR.note = raw;
    if (type === "SERVICE") extraDataByType.SERVICE.note = raw;
    if (type === "MEDICINE") extraDataByType.MEDICINE.note = raw;
  };

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      assignRawNote();
      return;
    }

    if (type === "DOCTOR") {
      Object.assign(extraDataByType.DOCTOR, {
        degree: parsed.degree ?? "",
        experience: parsed.experience ?? "",
        specialty: parsed.specialty ?? "",
        certificate: parsed.certificate ?? "",
        note: parsed.note ?? "",
      });
      return;
    }

    if (type === "SERVICE") {
      Object.assign(extraDataByType.SERVICE, {
        targetAudience: parsed.targetAudience ?? "",
        duration: parsed.duration ?? "",
        benefits: parsed.benefits ?? "",
        process: parsed.process ?? "",
        note: parsed.note ?? "",
      });
      return;
    }

    Object.assign(extraDataByType.MEDICINE, {
      ingredient: parsed.ingredient ?? "",
      dosage: parsed.dosage ?? "",
      usage: parsed.usage ?? "",
      contraindications: parsed.contraindications ?? "",
      sideEffects: parsed.sideEffects ?? "",
      note: parsed.note ?? "",
    });
  } catch {
    assignRawNote();
  }
};

const buildExtraDataPayload = (type: PublicContentType): string | undefined => {
  const source =
    type === "DOCTOR"
      ? extraDataByType.DOCTOR
      : type === "SERVICE"
        ? extraDataByType.SERVICE
        : extraDataByType.MEDICINE;

  const cleaned = Object.fromEntries(
    Object.entries(source).filter(
      ([, value]) => typeof value === "string" && value.trim() !== "",
    ),
  );

  return Object.keys(cleaned).length ? JSON.stringify(cleaned) : undefined;
};

const loadReferenceOptions = async (type: PublicContentType) => {
  try {
    referenceLoading.value = true;

    if (type === "DOCTOR") {
      const response = await userApi.search({ role: "DOCTOR" }, 0, 200);
      referenceOptions.value = (response.content || []).map((doctor: any) => {
        const name =
          doctor.name ||
          doctor.fullName ||
          doctor.username ||
          doctor.email ||
          doctor.id;
        return {
          value: doctor.id,
          label: name,
        };
      });
      return;
    }

    if (type === "SERVICE") {
      const response = await serviceApi.search({ page: 0, size: 200 });
      referenceOptions.value = (response.content || []).map((service: any) => ({
        value: service.id,
        label: `${service.name}${service.code ? ` - ${service.code}` : ""}`,
      }));
      return;
    }

    const response = await medicineApi.search({ page: 0, size: 200 });
    referenceOptions.value = (response.content || []).map((medicine: any) => ({
      value: medicine.id,
      label: `${medicine.name}${medicine.code ? ` - ${medicine.code}` : ""}`,
    }));
  } catch (error) {
    console.error("Load reference options error:", error);
    referenceOptions.value = [];
    notification.error("Không thể tải danh sách tham chiếu");
  } finally {
    referenceLoading.value = false;
  }
};

const resetFormData = () => {
  formData.refId = "";
  formData.refType = "SERVICE";
  formData.slug = "";
  formData.title = "";
  formData.subtitle = "";
  formData.description = "";
  formData.content = "";
  formData.imageUrl = "";
  formData.thumbnailUrl = "";
  formData.sortOrder = 0;
  formData.active = true;
  formData.featured = false;
  subImageUrls.value = [];
  referenceOptions.value = [];
  Object.assign(extraDataByType.DOCTOR, emptyDoctorExtra());
  Object.assign(extraDataByType.SERVICE, emptyServiceExtra());
  Object.assign(extraDataByType.MEDICINE, emptyMedicineExtra());
};

const openFilePicker = (type: "main" | "thumbnail") => {
  if (type === "main") {
    mainImageInputRef.value?.click();
    return;
  }
  thumbnailImageInputRef.value?.click();
};

const handleImageFileChange = (type: "main" | "thumbnail", event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    ElMessage.error("Vui lòng chọn đúng tệp ảnh");
    return;
  }

  const reader = new FileReader();
  reader.onload = (loadEvent) => {
    const imageData = (loadEvent.target?.result as string) || "";
    if (type === "main") {
      formData.imageUrl = imageData;
    } else {
      formData.thumbnailUrl = imageData;
    }
  };
  reader.readAsDataURL(file);

  target.value = "";
};

const addSubImageRow = () => {
  subImageUrls.value.push("");
};

const removeSubImage = (index: number) => {
  subImageUrls.value.splice(index, 1);
};

const openSubImagesPicker = () => {
  subImagesFileInputRef.value?.click();
};

const handleSubImagesFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = Array.from(target.files || []);

  if (!files.length) return;

  files.forEach((file) => {
    if (!file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const imageData = (loadEvent.target?.result as string) || "";
      if (imageData) {
        subImageUrls.value.push(imageData);
      }
    };
    reader.readAsDataURL(file);
  });

  target.value = "";
};

const openCreate = () => {
  isEditing.value = false;
  editingId.value = null;
  resetFormData();
  formDialogVisible.value = true;
  loadReferenceOptions(formData.refType);
};

const openEdit = async (id: string) => {
  try {
    const data = await publicContentApi.getById(id);
    isEditing.value = true;
    editingId.value = id;
    isEditInitializing.value = true;

    formData.refType = data.refType;
    await loadReferenceOptions(data.refType);

    if (data.refId) {
      const existed = referenceOptions.value.some(
        (option) => option.value === data.refId,
      );
      if (!existed) {
        referenceOptions.value.unshift({
          value: data.refId,
          label: `Đối tượng ${data.refId}`,
        });
      }
    }

    formData.refId = data.refId || "";
    formData.slug = data.slug || "";
    formData.title = data.title || "";
    formData.subtitle = data.subtitle || "";
    formData.description = data.description || "";
    formData.content = data.content || "";
    formData.imageUrl = data.imageUrl || "";
    formData.thumbnailUrl = data.thumbnailUrl || "";
    formData.sortOrder = data.sortOrder ?? 0;
    formData.active = Boolean(data.active);
    formData.featured = Boolean(data.featured);
    subImageUrls.value = [...(data.subImages || [])];

    Object.assign(extraDataByType.DOCTOR, emptyDoctorExtra());
    Object.assign(extraDataByType.SERVICE, emptyServiceExtra());
    Object.assign(extraDataByType.MEDICINE, emptyMedicineExtra());
    applyExtraDataFromRaw(data.refType, data.extraData);

    formDialogVisible.value = true;
  } catch (error) {
    console.error("Load data for edit error:", error);
    notification.error("Không thể tải dữ liệu để chỉnh sửa");
  } finally {
    isEditInitializing.value = false;
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    submitLoading.value = true;

    const subImages = subImageUrls.value
      .map((item) => item.trim())
      .filter(Boolean);

    const payload: CreatePublicContentRequest = {
      refId: formData.refId?.trim() || undefined,
      refType: formData.refType,
      slug: formData.slug?.trim() || undefined,
      title: formData.title?.trim(),
      subtitle: formData.subtitle?.trim() || undefined,
      description: formData.description?.trim() || undefined,
      content: formData.content?.trim() || undefined,
      imageUrl: formData.imageUrl?.trim() || undefined,
      subImages: subImages.length ? subImages : undefined,
      thumbnailUrl: formData.thumbnailUrl?.trim() || undefined,
      extraData: buildExtraDataPayload(formData.refType),
      active: formData.active,
      featured: formData.featured,
      sortOrder: formData.sortOrder ?? 0,
    };

    if (isEditing.value && editingId.value) {
      await publicContentApi.update(editingId.value, payload);
      notification.success("Cập nhật nội dung thành công");
    } else {
      await publicContentApi.create(payload);
      notification.success("Tạo nội dung thành công");
    }

    formDialogVisible.value = false;
    emit("success");
  } catch (error: any) {
    console.error("Submit public content error:", error);
    notification.error(
      error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error?.message ||
        "Không thể lưu nội dung",
    );
  } finally {
    submitLoading.value = false;
  }
};

watch(
  () => formData.refType,
  async (nextType, prevType) => {
    if (!formDialogVisible.value || !nextType || nextType === prevType) return;

    await loadReferenceOptions(nextType);

    if (!isEditInitializing.value) {
      formData.refId = "";
    }
  },
);

defineExpose({
  openCreate,
  openEdit,
});
</script>

<style scoped lang="scss">
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 14px;

  .span-2 {
    grid-column: span 2;
  }

  .form-switches {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-top: 28px;
  }

  .field-helper {
    margin-top: 6px;
    font-size: 12px;
    color: #64748b;
    line-height: 1.4;
  }

  .image-input-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
  }

  .image-preview-row {
    margin-top: 8px;
    width: 100%;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    padding: 8px;
  }

  .image-preview {
    width: 100%;
    max-height: 92px;
    object-fit: contain;
    border-radius: 8px;
    display: block;
    background: #fff;
  }

  .sub-images-wrap {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .sub-images-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .sub-images-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .sub-image-item {
    display: grid;
    grid-template-columns: 72px 1fr auto;
    gap: 8px;
    align-items: center;
  }

  .sub-image-thumb {
    width: 72px;
    height: 52px;
    border-radius: 8px;
    object-fit: cover;
    border: 1px solid #e2e8f0;
    background: #fff;
  }

  .sub-image-thumb-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #94a3b8;
    font-size: 12px;
  }

  .sub-images-empty {
    color: #64748b;
    font-size: 13px;
    padding: 8px 0;
  }

  .typed-extra-wrap {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;

    .el-input,
    .el-textarea {
      width: 100%;
    }
  }

  .typed-extra-current {
    font-size: 13px;
    color: #475569;
    padding: 6px 10px;
    border-radius: 8px;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;

    b {
      color: #0f766e;
      margin-left: 4px;
    }
  }
}

:deep(.public-content-dialog) {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.16);
}

:deep(.public-content-dialog .el-dialog__header) {
  margin-right: 0;
  padding: 16px 16px 0;
}

.public-content-dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  color: #fff;
  padding: 16px 18px;
}

.public-content-dialog-header-icon {
  font-size: 18px;
}

.public-content-dialog-header-title {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
}

.public-content-dialog-header-subtitle {
  margin-top: 3px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.92);
}

:deep(.public-content-dialog .el-dialog__body) {
  padding: 18px 24px 8px;
}

:deep(.public-content-dialog .public-content-form .el-form-item) {
  margin-bottom: 16px;
}

:deep(.public-content-dialog .public-content-form .el-form-item__label) {
  color: #374151;
  font-weight: 600;
  font-size: 14px;
}

:deep(.public-content-dialog .public-content-form .el-input__wrapper),
:deep(
  .public-content-dialog .public-content-form .el-select .el-input__wrapper
),
:deep(.public-content-dialog .public-content-form .el-input-number) {
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.25s ease;
}

:deep(.public-content-dialog .public-content-form .el-input__wrapper:hover),
:deep(
  .public-content-dialog
    .public-content-form
    .el-select
    .el-input__wrapper:hover
),
:deep(.public-content-dialog .public-content-form .el-input-number:hover) {
  box-shadow: 0 2px 8px rgba(20, 184, 166, 0.15);
}

:deep(.public-content-dialog .public-content-form .el-input__wrapper.is-focus),
:deep(
  .public-content-dialog
    .public-content-form
    .el-select
    .el-input__wrapper.is-focus
) {
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
}

:deep(.public-content-dialog .el-dialog__footer) {
  padding: 12px 24px 20px;
  border-top: 1px solid #f3f4f6;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;

    .image-input-wrapper {
      flex-direction: column;
      align-items: stretch;
    }

    .sub-image-item {
      grid-template-columns: 1fr;
    }

    .span-2 {
      grid-column: span 1;
    }
  }
}
</style>
