"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ClipboardList, Droplets, Package, UtensilsCrossed, XCircle } from "lucide-react";
import { StatusBadge } from "@/components/animated/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ScreenHeader } from "@/components/shared/screen-header";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrders } from "@/hooks/use-orders";
import { cn, formatDayLabel, formatVND } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useOrdersStore } from "@/stores/orders-store";
import type { OrderType } from "@/types";

const filters: { value: OrderType | "all"; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "water", label: "Đổi nước" },
  { value: "food", label: "Cơm trưa" },
];

const VNPAY_FAIL_REASONS: Record<string, string> = {
  "24": "Bạn đã huỷ thanh toán tại cổng VNPay.",
  "11": "Đã hết thời gian chờ thanh toán.",
  "51": "Tài khoản không đủ số dư.",
  invalid_signature: "Chữ ký không hợp lệ.",
};

export default function OrdersPage() {
  return (
    <Suspense fallback={<OrdersSkeleton />}>
      <OrdersContent />
    </Suspense>
  );
}

function OrdersSkeleton() {
  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col">
      <ScreenHeader title="Đơn hàng của tôi" showBack={false} />
      <div className="space-y-3 px-4 py-3">
        <Skeleton className="h-24 w-full rounded-3xl" />
        <Skeleton className="h-24 w-full rounded-3xl" />
        <Skeleton className="h-24 w-full rounded-3xl" />
      </div>
    </div>
  );
}

function OrdersContent() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const { orders, hydrated } = useOrdersStore();
  useOrders();
  const [filter, setFilter] = useState<OrderType | "all">("all");
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const router = useRouter();
  const paymentResult = searchParams.get("payment");
  const paidCode = searchParams.get("code");
  const failReason = searchParams.get("reason");

  useEffect(() => {
    if (!paymentResult) return;
    queryClient.invalidateQueries({ queryKey: ["orders"] });
    const timer = setTimeout(() => {
      router.replace("/orders", { scroll: false });
    }, 4000);
    return () => clearTimeout(timer);
  }, [paymentResult, queryClient, router]);

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

      <AnimatePresence>
        {paymentResult === "success" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.8, y: 24, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 12, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
              className="mx-6 flex w-full max-w-xs flex-col items-center rounded-3xl bg-card p-8 text-center shadow-2xl"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.1 }}
                className="flex size-16 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
              >
                <Check className="size-8" />
              </motion.div>
              <h2 className="mt-4 text-lg font-bold">Thanh toán thành công!</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {paidCode
                  ? `Đơn ${paidCode} đã được xác nhận. Mang mã lấy đồ đến điểm tụ trưa mai.`
                  : "Đơn của bạn đã được xác nhận."}
              </p>
            </motion.div>
          </motion.div>
        )}
        {paymentResult === "failed" && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="fixed inset-x-0 bottom-24 z-[70] mx-auto flex w-[calc(100%-3rem)] max-w-sm items-start gap-2.5 rounded-2xl border border-red-500/30 bg-card p-4 shadow-xl"
          >
            <XCircle className="mt-0.5 size-5 shrink-0 text-red-500" />
            <div className="min-w-0">
              <p className="text-sm font-semibold">Thanh toán không thành công</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {VNPAY_FAIL_REASONS[failReason ?? ""] ??
                  "Giao dịch chưa hoàn tất — bạn có thể thử thanh toán lại."}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
      {order.paymentStatus === "unpaid" && (
        <div className="mt-3 rounded-2xl bg-amber-500/10 px-3 py-2">
          <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
            Chưa thanh toán — chuyển khoản theo lệnh đã tạo để tự động xác nhận
          </span>
        </div>
      )}
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
