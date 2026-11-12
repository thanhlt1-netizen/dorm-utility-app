"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ClipboardList, Droplets, Home, User, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useOrdersStore } from "@/stores/orders-store";

const tabs = [
  { href: "/", label: "Trang chủ", icon: Home },
  { href: "/water", label: "Đổi nước", icon: Droplets },
  { href: "/food", label: "Đặt cơm", icon: UtensilsCrossed },
  { href: "/orders", label: "Đơn hàng", icon: ClipboardList },
  { href: "/profile", label: "Cá nhân", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const currentUser = useAuthStore((s) => s.currentUser);
  const activeCount = useOrdersStore((s) =>
    s.orders.filter(
      (o) => o.userId === currentUser.id && o.status !== "completed" && o.status !== "cancelled"
    ).length
  );

  return (
    <nav className="sticky bottom-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1">
      <div className="glass grid grid-cols-5 rounded-[1.75rem] border border-border/70 px-1.5 shadow-[0_12px_40px_-12px_rgba(2,8,23,0.35)]">
        {tabs.map((tab) => {
          const active =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          const badge = tab.href === "/orders" && activeCount > 0 ? activeCount : null;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="relative flex min-h-[3.75rem] flex-col items-center justify-center gap-0.5"
            >
              {active && (
                <motion.span
                  layoutId="nav-active-pill"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  className="absolute inset-x-1 inset-y-1.5 rounded-2xl bg-gradient-to-b from-sky-500/15 to-sky-500/5 ring-1 ring-inset ring-sky-500/25"
                />
              )}
              <span className="relative">
                <motion.span
                  animate={active ? { y: -1.5, scale: 1.12 } : { y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 420, damping: 20 }}
                  className="flex"
                >
                  <Icon
                    className={cn(
                      "size-5 transition-colors",
                      active ? "text-sky-600 dark:text-sky-400" : "text-muted-foreground"
                    )}
                    strokeWidth={active ? 2.4 : 2}
                  />
                </motion.span>
                {badge && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    className="absolute -right-2 -top-1.5 flex size-4 items-center justify-center rounded-full bg-gradient-to-b from-emerald-500 to-emerald-600 text-[9px] font-bold text-white shadow-sm shadow-emerald-600/40"
                  >
                    {badge}
                  </motion.span>
                )}
              </span>
              <span
                className={cn(
                  "relative text-[10px] transition-colors",
                  active
                    ? "font-semibold text-sky-600 dark:text-sky-400"
                    : "font-medium text-muted-foreground"
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
