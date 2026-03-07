<script setup lang="ts">
// Router guard sẽ tự động check auth, không cần gọi ở đây nữa
</script>

<template>
  <router-view />
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
    Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  padding: 0;
}

/* Modern Session Expired Dialog */
.modern-session-dialog.el-message-box {
  border-radius: 16px !important;
  padding: 0 !important;
  overflow: hidden;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
  max-width: 420px;
}

.modern-session-dialog .el-message-box__header {
  padding: 24px 24px 16px;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border-bottom: none;
}

.modern-session-dialog .el-message-box__title {
  color: #1e40af;
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 12px;
}

.modern-session-dialog .el-message-box__headerbtn {
  top: 20px;
  right: 20px;
}

.modern-session-dialog .el-message-box__close {
  color: #1e40af;
  font-size: 20px;
}

.modern-session-dialog .el-message-box__close:hover {
  color: #1e3a8a;
}

.modern-session-dialog .el-message-box__content {
  padding: 24px;
  color: #374151;
  font-size: 15px;
  line-height: 1.6;
}

.modern-session-dialog .el-message-box__container {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.modern-session-dialog .el-message-box__status {
  position: static;
  transform: none;
  margin: 0;
  font-size: 0;
}

.modern-session-dialog .el-message-box__message {
  padding: 0;
}

.modern-session-dialog .el-message-box__message p {
  margin: 0;
  color: #1f2937;
  font-weight: 500;
}

.modern-session-dialog .el-message-box__btns {
  padding: 16px 24px 24px;
  display: flex;
  justify-content: center;
  gap: 12px;
}

.modern-session-dialog .el-message-box__btns button {
  margin: 0 !important;
  padding: 12px 32px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  min-width: 100px;
}

.modern-session-icon {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.modern-session-icon svg {
  width: 28px;
  height: 28px;
  color: white;
}

.modern-session-confirm-button.el-button {
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%) !important;
  border: none !important;
  color: white !important;
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3) !important;
}

.modern-session-confirm-button.el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(20, 184, 166, 0.4) !important;
}

.modern-session-confirm-button.el-button:active {
  transform: translateY(0);
}

/* Modern Delete Confirm Dialog */
.modern-confirm-dialog.el-message-box {
  border-radius: 16px !important;
  padding: 0 !important;
  overflow: hidden;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
  max-width: 420px;
}

.modern-confirm-dialog .el-message-box__header {
  padding: 24px 24px 16px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-bottom: none;
}

.modern-confirm-dialog .el-message-box__title {
  color: #92400e;
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 12px;
}

.modern-confirm-dialog .el-message-box__headerbtn {
  top: 20px;
  right: 20px;
}

.modern-confirm-dialog .el-message-box__close {
  color: #92400e;
  font-size: 20px;
}

.modern-confirm-dialog .el-message-box__close:hover {
  color: #78350f;
}

.modern-confirm-dialog .el-message-box__content {
  padding: 24px;
  color: #374151;
  font-size: 15px;
  line-height: 1.6;
}

.modern-confirm-dialog .el-message-box__container {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.modern-confirm-dialog .el-message-box__status {
  position: static;
  transform: none;
  margin: 0;
  font-size: 0;
}

.modern-confirm-dialog .el-message-box__message {
  padding: 0;
}

.modern-confirm-dialog .el-message-box__message p {
  margin: 0;
  color: #1f2937;
  font-weight: 500;
}

.modern-confirm-dialog .el-message-box__btns {
  padding: 16px 24px 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.modern-confirm-dialog .el-message-box__btns button {
  margin: 0 !important;
  padding: 10px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  min-width: 80px;
}

.modern-warning-icon {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
}

.modern-warning-icon svg {
  width: 28px;
  height: 28px;
  color: white;
}

.modern-cancel-button.el-button {
  background: white !important;
  border: 1px solid #e5e7eb !important;
  color: #6b7280 !important;
}

.modern-cancel-button.el-button:hover {
  background: #f9fafb !important;
  border-color: #d1d5db !important;
  color: #374151 !important;
}

.modern-cancel-button.el-button:active {
  background: #f3f4f6 !important;
}

.modern-confirm-button.el-button {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
  border: none !important;
  color: white !important;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3) !important;
}

.modern-confirm-button.el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4) !important;
}

.modern-confirm-button.el-button:active {
  transform: translateY(0);
}

/* Modern Logout Dialog */
.modern-logout-dialog.el-message-box {
  border-radius: 16px !important;
  padding: 0 !important;
  overflow: hidden;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
  max-width: 420px;
}

.modern-logout-dialog .el-message-box__header {
  padding: 24px 24px 16px;
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  border-bottom: none;
}

.modern-logout-dialog .el-message-box__title {
  color: #0c4a6e;
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 12px;
}

.modern-logout-dialog .el-message-box__headerbtn {
  top: 20px;
  right: 20px;
}

.modern-logout-dialog .el-message-box__close {
  color: #0c4a6e;
  font-size: 20px;
}

.modern-logout-dialog .el-message-box__close:hover {
  color: #075985;
}

.modern-logout-dialog .el-message-box__content {
  padding: 24px;
  color: #374151;
  font-size: 15px;
  line-height: 1.6;
}

.modern-logout-dialog .el-message-box__container {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.modern-logout-dialog .el-message-box__status {
  position: static;
  transform: none;
  margin: 0;
  font-size: 0;
}

.modern-logout-dialog .el-message-box__message {
  padding: 0;
}

.modern-logout-dialog .el-message-box__message p {
  margin: 0;
  color: #1f2937;
  font-weight: 500;
}

.modern-logout-dialog .el-message-box__btns {
  padding: 16px 24px 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.modern-logout-dialog .el-message-box__btns button {
  margin: 0 !important;
  padding: 10px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  min-width: 80px;
}

.modern-logout-icon {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
}

.modern-logout-icon svg {
  width: 28px;
  height: 28px;
  color: white;
}

.modern-logout-confirm-button.el-button {
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%) !important;
  border: none !important;
  color: white !important;
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3) !important;
}

.modern-logout-confirm-button.el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(20, 184, 166, 0.4) !important;
}

.modern-logout-confirm-button.el-button:active {
  transform: translateY(0);
}

/* Fix for Date Picker - Prevent clear button from wrapping */
.el-date-editor {
  width: 100% !important;
}

.el-date-editor .el-input__wrapper {
  display: flex !important;
  align-items: center !important;
  flex-wrap: nowrap !important;
  width: 100% !important;
}

.el-date-editor .el-input__inner {
  flex: 1 1 auto !important;
  min-width: 0 !important;
}

.el-date-editor .el-input__prefix,
.el-date-editor .el-input__suffix {
  flex-shrink: 0 !important;
  display: inline-flex !important;
  align-items: center !important;
}

.el-date-editor .el-input__suffix-inner {
  display: inline-flex !important;
  align-items: center !important;
  gap: 2px !important;
}
</style>
