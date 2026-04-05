<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? 'Sửa người dùng' : 'Thêm người dùng mới'"
    width="600px"
    :close-on-click-modal="false"
    :show-close="false"
  >
    <template #header>
      <div class="dialog-header">
        <div class="header-icon-box">
          <component :is="UserIcon" />
        </div>
        <div class="header-text">
          <h3 class="header-title">
            {{ isEdit ? "Sửa người dùng" : "Thêm người dùng mới" }}
          </h3>
          <p class="header-subtitle">
            {{
              isEdit
                ? "Cập nhật thông tin người dùng"
                : "Tạo tài khoản mới cho hệ thống"
            }}
          </p>
        </div>
      </div>
    </template>

    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-position="top"
      @submit.prevent="handleSubmit"
    >
      <div class="form-group">
        <label class="form-label">
          Tên đăng nhập
          <span class="required-star">*</span>
        </label>
        <el-form-item prop="username">
          <el-input
            v-model="formData.username"
            placeholder="Nhập tên đăng nhập"
            :disabled="isEdit"
          >
            <template #prefix>
              <component :is="AtIcon" style="width: 16px; height: 16px" />
            </template>
          </el-input>
        </el-form-item>
      </div>

      <div v-if="!isEdit" class="form-group">
        <label class="form-label">
          Email
          <span class="required-star">*</span>
        </label>
        <el-form-item prop="email">
          <el-input v-model="formData.email" placeholder="Nhập email">
            <template #prefix>
              <component :is="MailIcon" style="width: 16px; height: 16px" />
            </template>
          </el-input>
        </el-form-item>
      </div>

      <div v-if="!isEdit" class="form-group">
        <label class="form-label">
          Mật khẩu
          <span class="required-star">*</span>
        </label>
        <el-form-item prop="password">
          <el-input
            v-model="formData.password"
            type="password"
            show-password
            placeholder="Nhập mật khẩu"
          >
            <template #prefix>
              <component :is="LockIcon" style="width: 16px; height: 16px" />
            </template>
          </el-input>
        </el-form-item>
      </div>

      <div class="form-group">
        <label class="form-label">
          Tên
          <span class="required-star">*</span>
        </label>
        <el-form-item prop="name">
          <el-input v-model="formData.name" placeholder="Nhập tên">
            <template #prefix>
              <component :is="UserIcon" style="width: 16px; height: 16px" />
            </template>
          </el-input>
        </el-form-item>
      </div>

      <div class="form-group">
        <label class="form-label">Ảnh đại diện (URL)</label>
        <el-form-item prop="img">
          <div class="image-input-wrapper">
            <el-input
              v-model="formData.img"
              placeholder="Nhập URL ảnh đại diện"
            >
              <template #prefix>
                <component :is="ImageIcon" style="width: 16px; height: 16px" />
              </template>
            </el-input>
            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              style="display: none"
              @change="handleFileChange"
            />
            <el-button
              type="primary"
              :icon="UploadIcon"
              @click="fileInputRef?.click()"
              class="upload-btn"
            >
              Chọn ảnh
            </el-button>
            <div
              class="image-preview-small"
              :class="{ 'has-image': formData.img }"
            >
              <img v-if="formData.img" :src="formData.img" alt="Preview" />
            </div>
          </div>
        </el-form-item>
      </div>

      <div class="form-group">
        <label class="form-label">
          Vai trò
          <span class="required-star">*</span>
        </label>
        <el-form-item prop="role">
          <el-select
            v-model="formData.role"
            placeholder="Chọn vai trò"
            style="width: 100%"
          >
            <el-option
              v-for="(label, key) in UserRoleLabels"
              :key="key"
              :label="label"
              :value="key"
            >
              <div style="display: flex; align-items: center; gap: 8px">
                <component :is="ShieldIcon" style="width: 14px; height: 14px" />
                <span>{{ label }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
      </div>

      <div v-if="isEdit" class="form-group">
        <label class="form-label">Trạng thái</label>
        <el-form-item prop="enabled">
          <el-switch
            v-model="formData.enabled"
            active-text="Đang hoạt động"
            inactive-text="Đã khóa"
          />
        </el-form-item>
      </div>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <button @click="handleCancel" class="cancel-button">
          <component :is="XIcon" />
          <span>Hủy</span>
        </button>
        <button @click="handleSubmit" :disabled="loading" class="submit-button">
          <component
            :is="loading ? LoadingIcon : CheckIcon"
            :class="{ spinning: loading }"
          />
          <span>{{ isEdit ? "Cập nhật" : "Tạo mới" }}</span>
        </button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, h } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";
import { userApi } from "@/api/user";
import type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserRole,
} from "@/types/user";
import { UserRoleLabels } from "@/types/user";

// Props & Emits
interface Props {
  modelValue: boolean;
  user?: User | null;
}

const props = withDefaults(defineProps<Props>(), {
  user: null,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "success"): void;
}>();

// Custom Icons
const UserIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    [
      h("path", { d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" }),
      h("circle", { cx: "12", cy: "7", r: "4" }),
    ],
  );

const AtIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    [
      h("circle", { cx: "12", cy: "12", r: "4" }),
      h("path", { d: "M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" }),
    ],
  );

const MailIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    [
      h("rect", { width: "20", height: "16", x: "2", y: "4", rx: "2" }),
      h("path", { d: "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" }),
    ],
  );

const LockIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    [
      h("rect", {
        width: "18",
        height: "11",
        x: "3",
        y: "11",
        rx: "2",
        ry: "2",
      }),
      h("path", { d: "M7 11V7a5 5 0 0 1 10 0v4" }),
    ],
  );

const ImageIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    [
      h("rect", {
        width: "18",
        height: "18",
        x: "3",
        y: "3",
        rx: "2",
        ry: "2",
      }),
      h("circle", { cx: "9", cy: "9", r: "2" }),
      h("path", { d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" }),
    ],
  );

const ShieldIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    [h("path", { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" })],
  );

const CheckIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    [h("polyline", { points: "20 6 9 17 4 12" })],
  );

const XIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    [h("path", { d: "M18 6 6 18" }), h("path", { d: "m6 6 12 12" })],
  );

const LoadingIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    [h("path", { d: "M21 12a9 9 0 1 1-6.219-8.56" })],
  );

const UploadIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    [
      h("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
      h("polyline", { points: "17 8 12 3 7 8" }),
      h("line", { x1: "12", x2: "12", y1: "3", y2: "15" }),
    ],
  );

// State
const formRef = ref<FormInstance>();
const loading = ref(false);
const fileInputRef = ref<HTMLInputElement>();
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const isEdit = computed(() => !!props.user);

interface FormData {
  username?: string;
  email?: string;
  password?: string;
  name?: string;
  img?: string;
  role?: UserRole;
  enabled?: boolean;
}

const formData = reactive<FormData>({
  username: "",
  email: "",
  password: "",
  name: "",
  img: "",
  role: undefined,
  enabled: true,
});

// Validation Rules
const validateEmail = (_rule: any, value: any, callback: any) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!value) {
    callback(new Error("Vui lòng nhập email"));
  } else if (!emailRegex.test(value)) {
    callback(new Error("Email không hợp lệ"));
  } else {
    callback();
  }
};

const rules = reactive<FormRules>({
  username: [
    { required: true, message: "Vui lòng nhập tên đăng nhập", trigger: "blur" },
    {
      min: 3,
      max: 50,
      message: "Tên đăng nhập phải từ 3-50 ký tự",
      trigger: "blur",
    },
  ],
  email: [{ required: true, validator: validateEmail, trigger: "blur" }],
  password: [
    { required: true, message: "Vui lòng nhập mật khẩu", trigger: "blur" },
    { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự", trigger: "blur" },
  ],
  name: [{ required: true, message: "Vui lòng nhập tên", trigger: "blur" }],
  role: [
    { required: true, message: "Vui lòng chọn vai trò", trigger: "change" },
  ],
});

// Methods
const resetForm = () => {
  formData.username = "";
  formData.email = "";
  formData.password = "";
  formData.name = "";
  formData.img = "";
  formData.role = undefined as unknown as UserRole;
  formData.enabled = true;
  formRef.value?.clearValidate();
};

const loadUserData = () => {
  if (props.user) {
    formData.name = props.user.name;
    formData.img = props.user.img || "";
    formData.role = props.user.role;
    formData.enabled = props.user.enabled;
    formData.username = props.user.username;
  }
};

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    if (!file.type.startsWith("image/")) {
      ElMessage.error("Vui lòng chọn file ảnh");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      ElMessage.error("Kích thước ảnh không được vượt quá 20MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      formData.img = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    loading.value = true;

    if (isEdit.value && props.user) {
      const updateData: UpdateUserRequest = {
        password: formData.password,
        name: formData.name,
        img: formData.img || undefined,
        role: formData.role,
        enabled: formData.enabled,
      };
      await userApi.update(props.user.id, updateData);
      ElMessage.success("Cập nhật người dùng thành công");
    } else {
      const createData: CreateUserRequest = {
        username: formData.username!,
        email: formData.email!,
        password: formData.password!,
        name: formData.name!,
        img: formData.img || undefined,
        role: formData.role!,
      };
      await userApi.create(createData);
      ElMessage.success("Tạo người dùng thành công");
    }

    emit("success");
    resetForm();
  } catch (error: any) {
    ElMessage.error(error.message || "Có lỗi xảy ra");
  } finally {
    loading.value = false;
  }
};

const handleCancel = () => {
  resetForm();
  dialogVisible.value = false;
};

// Watchers
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      if (isEdit.value) {
        loadUserData();
      } else {
        resetForm();
      }
    }
  },
  { immediate: true },
);

watch(
  () => props.user,
  () => {
    if (props.modelValue && isEdit.value) {
      loadUserData();
    }
  },
);
</script>

<style scoped lang="scss">
:deep(.el-dialog__header) {
  padding: 0;
  margin-right: 0;
}

:deep(.el-dialog__body) {
  padding: 24px;
}

:deep(.el-dialog__footer) {
  padding: 0;
}

.dialog-header {
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon-box {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 24px;
    height: 24px;
    color: white;
  }
}

.header-text {
  flex: 1;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin-bottom: 4px;
}

.header-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.form-group {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;

  .required-star {
    color: #ef4444;
    margin-left: 2px;
  }
}

:deep(.el-form-item) {
  margin-bottom: 0;

  .el-form-item__error {
    padding-top: 4px;
  }
}

.image-input-wrapper {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  min-height: 60px;

  .el-input {
    flex: 1;
  }

  .upload-btn {
    flex-shrink: 0;
  }

  .image-preview-small {
    flex-shrink: 0;
    width: 60px;
    height: 60px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
    background: #f9fafb;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s ease;

    &.has-image {
      opacity: 1;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
}

.cancel-button,
.submit-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;

  svg {
    width: 16px;
    height: 16px;
  }
}

.cancel-button {
  background: white;
  color: #6b7280;
  border: 1px solid #d1d5db;

  &:hover {
    background: #f9fafb;
    border-color: #9ca3af;
  }
}

.submit-button {
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(20, 184, 166, 0.3);

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(20, 184, 166, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
