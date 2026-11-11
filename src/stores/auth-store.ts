"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role, User } from "@/types";
import { seedUsers } from "@/lib/mock-data";

type AuthMode = "mock" | "supabase";

interface AuthState {
  currentUser: User;
  users: User[];
  authMode: AuthMode;
  email: string | null;
  switchRole: (role: Role) => void;
  setUser: (user: User, mode: AuthMode, email: string | null) => void;
  resetToMock: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: seedUsers[0],
      users: seedUsers,
      authMode: "mock",
      email: null,
      switchRole: (role) => {
        const user = get().users.find((u) => u.role === role);
        if (user) set({ currentUser: user });
      },
      setUser: (user, mode, email) =>
        set({ currentUser: user, authMode: mode, email }),
      resetToMock: () =>
        set({ currentUser: seedUsers[0], authMode: "mock", email: null }),
    }),
    { name: "dorm-auth" }
  )
);
