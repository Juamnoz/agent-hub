import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidebarStore {
  collapsed: boolean;
  mobileOpen: boolean;
  modalOpen: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileOpen: (open: boolean) => void;
  setModalOpen: (open: boolean) => void;
}

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set) => ({
      collapsed: false,
      mobileOpen: false,
      modalOpen: false,
      toggleSidebar: () => set((state) => ({ collapsed: !state.collapsed })),
      setSidebarCollapsed: (collapsed) => set({ collapsed }),
      setMobileOpen: (open) => set({ mobileOpen: open }),
      setModalOpen: (open) => set({ modalOpen: open }),
    }),
    {
      name: "sidebar-collapsed",
      // Only persist desktop collapsed state, not mobile open state
      partialize: (state) => ({ collapsed: state.collapsed }),
    }
  )
);
