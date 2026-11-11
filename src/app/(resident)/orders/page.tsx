"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ClipboardList, Droplets, Package, UtensilsCrossed } from "lucide-react";
import { StatusBadge } from "@/components/animated/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ScreenHeader } from "@/components/shared/screen-header";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatDayLabel, formatVND } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useOrdersStore } from "@/stores/orders-store";
import type { OrderType } from "@/types";

const filters: { value: OrderType | "all"; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "water", label: "Đổi nước" },
  { value: "food", label: "Cơm trưa" },
];

export default function OrdersPage() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const { orders, hydrated } = useOrdersStore();
  const [filter, setFilter] = useState<OrderType | "all">("all");

  const myOrders = orders.filter((o) => o.userId === currentUser.id);
  const visible = filter === "all" ? myOrders : myOrders.filter((o) => o.type === filter);

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col">
      <ScreenHeader title="Đơn hàng của tôi" showBack={false} />

      <div className="sticky top-[57px] z-30 bg-background/80 px-4 py-3 backdrop-blur-xl">
        <div className="flex gap-1.5">
          {filters.map((f) => {
            const active = filter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className="relative min-h-9 rounded-full px-4 text-xs font-semibold"
              >
                {active && (
                  <motion.span
                    layoutId="filter-pill"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    className="absolute inset-0 rounded-full bg-foreground"
                  />
                )}
                <span
                  className={cn(
                    "relative transition-colors",
                    active ? "text-background" : "text-muted-foreground"
                  )}
                >
                  {f.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 space-y-2.5 px-4 pb-8">
        {!hydrated ? (
          <div className="space-y-2.5">
            <Skeleton className="h-20 w-full rounded-3xl" />
            <Skeleton className="h-20 w-full rounded-3xl" />
            <Skeleton className="h-20 w-full rounded-3xl" />
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Chưa có đơn hàng nào"
            description="Các đơn đổi nước và đặt cơm sẽ xuất hiện tại đây."
          />
        ) : (
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((order) => (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -6 }}
                transition={{ type: "spring", stiffness: 340, damping: 30 }}
              >
                <OrderCard order={order} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: import("@/types").Order }) {
  const router = useRouter();
  const Icon = order.type === "water" ? Droplets : order.type === "food" ? UtensilsCrossed : Package;
  return (
    <Card
      onClick={() => router.push(`/orders/${order.id}`)}
      className="cursor-pointer p-4 transition-shadow active:shadow-md"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-2xl",
              order.type === "water"
                ? "bg-sky-500/15 text-sky-600 dark:text-sky-400"
                : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            )}
          >
            <Icon className="size-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold tabular-nums">{order.code}</p>
            <p className="text-xs text-muted-foreground">
              {formatDayLabel(order.createdAt)} · {formatVND(order.totalAmount)}
            </p>
          </div>
        </div>
        <StatusBadge status={order.status} />
      </div>
      {order.pickupCode && order.status !== "completed" && (
        <div className="mt-3 flex items-center justify-between rounded-2xl bg-muted/60 px-3 py-2">
          <span className="text-xs text-muted-foreground">Mã lấy đồ</span>
          <span className="font-mono text-sm font-bold tracking-[0.2em] tabular-nums">
            {order.pickupCode}
          </span>
        </div>
      )}
      <p className="mt-2.5 text-center text-[11px] font-medium text-muted-foreground/70">
        Bấm để xem tiến trình đơn
      </p>
    </Card>
  );
}
