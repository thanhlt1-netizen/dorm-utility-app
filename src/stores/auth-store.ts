"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role, User } from "@/types";
import { seedUsers } from "@/lib/mock-data";

interface AuthState {
  currentUser: User;
  users: User[];
  switchRole: (role: Role) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: seedUsers[0],
      users: seedUsers,
      switchRole: (role) => {
        const user = get().users.find((u) => u.role === role);
        if (user) set({ currentUser: user });
      },
    }),
    { name: "dorm-auth" }
  )
);
