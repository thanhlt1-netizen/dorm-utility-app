"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";
import { seedUsers } from "@/lib/mock-data";

export interface MockAccount {
  email: string;
  password: string;
  user: User;
}

type AuthMode = "mock" | "supabase";

interface AuthState {
  currentUser: User;
  isAuthenticated: boolean;
  authMode: AuthMode;
  email: string | null;
  mockAccounts: MockAccount[];
  hydrated: boolean;
  markHydrated: () => void;
  signInSession: (user: User, mode: AuthMode, email: string) => void;
  addMockAccount: (account: MockAccount) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: seedUsers[0],
      isAuthenticated: false,
      authMode: "mock",
      email: null,
      mockAccounts: [],
      hydrated: false,
      markHydrated: () => set({ hydrated: true }),
      signInSession: (user, mode, email) =>
        set({ currentUser: user, isAuthenticated: true, authMode: mode, email }),
      addMockAccount: (account) =>
        set((s) => ({ mockAccounts: [...s.mockAccounts, account] })),
      signOut: () =>
        set({
          currentUser: seedUsers[0],
          isAuthenticated: false,
          authMode: "mock",
          email: null,
        }),
    }),
    {
      name: "dorm-auth",
      skipHydration: true,
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        authMode: state.authMode,
        email: state.email,
        mockAccounts: state.mockAccounts,
      }),
    }
  )
);
