import { create } from "zustand";

type UiState = {
  sidebarCollapsed: boolean;
  offlineBanner: boolean;
  lowStockBanner: boolean;
  reconnectingChat: boolean;
  toggleSidebar: () => void;
  toggleOffline: () => void;
  toggleLowStock: () => void;
  toggleReconnecting: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  setOfflineBanner: (v: boolean) => void;
  setLowStockBanner: (v: boolean) => void;
  setReconnectingChat: (v: boolean) => void;
};

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  offlineBanner: false,
  lowStockBanner: true,
  reconnectingChat: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleOffline: () => set((s) => ({ offlineBanner: !s.offlineBanner })),
  toggleLowStock: () => set((s) => ({ lowStockBanner: !s.lowStockBanner })),
  toggleReconnecting: () => set((s) => ({ reconnectingChat: !s.reconnectingChat })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  setOfflineBanner: (v) => set({ offlineBanner: v }),
  setLowStockBanner: (v) => set({ lowStockBanner: v }),
  setReconnectingChat: (v) => set({ reconnectingChat: v }),
}));
