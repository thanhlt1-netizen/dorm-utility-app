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
    <nav className="sticky bottom-0 z-50 border-t border-border/60 bg-background/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
      <div className="grid grid-cols-5 px-2">
        {tabs.map((tab) => {
          const active =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          const badge = tab.href === "/orders" && activeCount > 0 ? activeCount : null;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="relative flex min-h-14 flex-col items-center justify-center gap-0.5 py-2"
            >
              {active && (
                <motion.span
                  layoutId="nav-active-pill"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  className="absolute inset-x-3 inset-y-1.5 rounded-2xl bg-sky-500/10"
                />
              )}
              <span className="relative">
                <motion.span
                  animate={active ? { y: -1, scale: 1.08 } : { y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                  className="flex"
                >
                  <Icon
                    className={cn(
                      "size-5 transition-colors",
                      active ? "text-sky-600 dark:text-sky-400" : "text-muted-foreground"
                    )}
                  />
                </motion.span>
                {badge && (
                  <span className="absolute -right-2 -top-1.5 flex size-4 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-bold text-white">
                    {badge}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "relative text-[10px] font-medium transition-colors",
                  active ? "text-sky-600 dark:text-sky-400" : "text-muted-foreground"
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
