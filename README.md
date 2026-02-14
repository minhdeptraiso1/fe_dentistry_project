# 🦷 Hệ thống Quản lý Nha khoa - Frontend

[![Vue 3](https://img.shields.io/badge/Vue-3.5-42b883?logo=vue.js)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Element Plus](https://img.shields.io/badge/Element%20Plus-2.13-409eff)](https://element-plus.org/)
[![Vite](https://img.shields.io/badge/Vite-7.3-646cff?logo=vite)](https://vitejs.dev/)

Giao diện quản lý nha khoa hiện đại, responsive và thân thiện với người dùng.

## ✨ Tính năng

- 🔐 **Xác thực người dùng** - Đăng nhập/đăng xuất an toàn
- 👥 **Quản lý bệnh nhân** - CRUD đầy đủ, tìm kiếm, filter
- 📅 **Quản lý lịch hẹn** - Calendar view, đặt lịch, xác nhận
- 🩺 **Quản lý điều trị** - Hồ sơ điều trị, kê đơn, tiến trình
- 💳 **Thanh toán & Hóa đơn** - Tạo hóa đơn, theo dõi thanh toán
- 📊 **Dashboard & Thống kê** - Tổng quan hoạt động phòng khám
- 🎨 **UI/UX đẹp mắt** - Thiết kế hiện đại, responsive

## 🚀 Bắt đầu nhanh

### Yêu cầu

- Node.js >= 18.0.0
- npm >= 9.0.0

### Cài đặt

```bash
# Clone repository
git clone <repository-url>

# Di chuyển vào thư mục frontend
cd fe/dental-fe

# Cài đặt dependencies
npm install

# Chạy development server
npm run dev
```

Mở trình duyệt tại: **http://localhost:3000**

## 📦 Scripts

```bash
npm run dev      # Chạy development server
npm run build    # Build production
npm run preview  # Preview production build
```

## 🏗 Cấu trúc dự án

```
src/
├── api/              # API service layers
├── assets/           # Static assets
├── components/       # Reusable components
├── layouts/          # Layout components
├── router/           # Vue Router config
├── stores/           # Pinia stores
├── types/            # TypeScript types
├── utils/            # Utility functions
├── views/            # Page components
├── App.vue           # Root component
└── main.ts           # Entry point
```

Xem chi tiết: [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)

## 🛠 Tech Stack

| Công nghệ        | Mô tả                            |
| ---------------- | -------------------------------- |
| **Vue 3**        | Progressive JavaScript framework |
| **TypeScript**   | Type-safe JavaScript             |
| **Vite**         | Fast build tool                  |
| **Vue Router**   | Official routing                 |
| **Pinia**        | State management                 |
| **Element Plus** | UI component library             |
| **Axios**        | HTTP client                      |
| **SCSS**         | CSS preprocessor                 |

## 📝 Quy tắc code

### Component Naming

- **Components**: PascalCase (e.g., `PatientCard.vue`)
- **Views**: PascalCase + "View" (e.g., `PatientListView.vue`)
- **Composables**: camelCase + "use" prefix (e.g., `usePatient.ts`)

### File Structure

```vue
<template>
  <!-- HTML -->
</template>

<script setup lang="ts">
// Imports
// Props/Emits
// State
// Computed
// Methods
// Lifecycle hooks
</script>

<style scoped lang="scss">
/* Styles */
</style>
```

## 🔧 Cấu hình

### Environment Variables

**Development** (`.env.development`):

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

**Production** (`.env.production`):

```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

## 🎯 Roadmap phát triển

- [x] **Giai đoạn 1**: Setup dự án & Layout cơ bản
- [ ] **Giai đoạn 2**: Authentication hoàn chỉnh
- [ ] **Giai đoạn 3**: Quản lý bệnh nhân
- [ ] **Giai đoạn 4**: Quản lý lịch hẹn
- [ ] **Giai đoạn 5**: Quản lý điều trị
- [ ] **Giai đoạn 6**: Dịch vụ & Thanh toán

Xem chi tiết: [NEXT_STEPS.md](./NEXT_STEPS.md)

## 📸 Screenshots

### Dashboard

![Dashboard](docs/screenshots/dashboard.png)

### Quản lý bệnh nhân

![Patients](docs/screenshots/patients.png)

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng:

1. Fork repository
2. Tạo branch mới (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Your Name**

- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

---

⭐️ Nếu project hữu ích, hãy cho một star nhé!
