"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { seedMenus } from "@/lib/mock-data";
import type { DailyMenu } from "@/types";

interface MenusState {
  menus: DailyMenu[];
  hydrated: boolean;
  markHydrated: () => void;
  setMenus: (menus: DailyMenu[]) => void;
  addMenu: (menu: DailyMenu) => void;
  updateMenu: (id: string, patch: Partial<DailyMenu>) => void;
  removeMenu: (id: string) => void;
}

export const useMenusStore = create<MenusState>()(
  persist(
    (set) => ({
      menus: seedMenus,
      hydrated: false,
      markHydrated: () => set({ hydrated: true }),
      setMenus: (menus) => set({ menus, hydrated: true }),
      addMenu: (menu) => set((s) => ({ menus: [menu, ...s.menus] })),
      updateMenu: (id, patch) =>
        set((s) => ({
          menus: s.menus.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        })),
      removeMenu: (id) =>
        set((s) => ({ menus: s.menus.filter((m) => m.id !== id) })),
    }),
    {
      name: "dorm-menus",
      skipHydration: true,
      partialize: (state) => ({ menus: state.menus }),
    }
  )
);
