import { defineStore } from "pinia";
import { ref } from "vue";

export const useAppStore = defineStore("app", () => {
  // State
  const sidebarCollapsed = ref(false);
  const loading = ref(false);
  const pageTitle = ref("");

  // Actions
  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value;
  };

  const setSidebarCollapsed = (collapsed: boolean) => {
    sidebarCollapsed.value = collapsed;
  };

  const setLoading = (isLoading: boolean) => {
    loading.value = isLoading;
  };

  const setPageTitle = (title: string) => {
    pageTitle.value = title;
    document.title = title ? `${title} - Dental Clinic` : "Dental Clinic";
  };

  return {
    // State
    sidebarCollapsed,
    loading,
    pageTitle,

    // Actions
    toggleSidebar,
    setSidebarCollapsed,
    setLoading,
    setPageTitle,
  };
});
