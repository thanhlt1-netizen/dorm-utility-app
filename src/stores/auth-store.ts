"use client";

import { create } from "zustand";
import type { User } from "@/types";

export const GUEST_USER: User = {
  id: "",
  fullName: "",
  phone: "",
  roomNumber: "",
  role: "resident",
  studentId: "",
};

interface AuthState {
  currentUser: User;
  isAuthenticated: boolean;
  hydrated: boolean;
  markHydrated: () => void;
  setSession: (user: User | null) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: GUEST_USER,
  isAuthenticated: false,
  hydrated: false,
  markHydrated: () => set({ hydrated: true }),
  setSession: (user) =>
    set({
      currentUser: user ?? GUEST_USER,
      isAuthenticated: Boolean(user),
      hydrated: true,
    }),
  signOut: () =>
    set({ currentUser: GUEST_USER, isAuthenticated: false, hydrated: true }),
}));
