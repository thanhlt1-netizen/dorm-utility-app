"use client";

import { motion } from "framer-motion";
import { ROLE_LABEL, type Role } from "@/types";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

const roles: Role[] = ["resident", "staff", "vendor", "admin"];

export function RoleSwitcher() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const switchRole = useAuthStore((s) => s.switchRole);

  return (
    <div className="pointer-events-none sticky top-3 z-[60] h-0">
      <div className="pointer-events-auto mx-auto mt-1 flex w-fit items-center gap-0.5 rounded-full border border-border/60 bg-background/70 p-1 shadow-lg backdrop-blur-xl">
        {roles.map((role) => {
          const active = currentUser.role === role;
          return (
            <button
              key={role}
              onClick={() => switchRole(role)}
              className="relative min-h-8 rounded-full px-3 text-xs font-medium"
            >
              {active && (
                <motion.span
                  layoutId="role-pill"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  className="absolute inset-0 rounded-full bg-sky-600 shadow-md shadow-sky-600/30"
                />
              )}
              <span
                className={cn(
                  "relative transition-colors",
                  active ? "text-white" : "text-muted-foreground"
                )}
              >
                {ROLE_LABEL[role]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
