"use client";

import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Clock,
  Droplets,
  MapPin,
  Package,
  StickyNote,
  UtensilsCrossed,
} from "lucide-react";
import { StatusBadge } from "@/components/animated/status-badge";
import { OrderTimeline } from "@/components/shared/order-timeline";
import { EmptyState } from "@/components/shared/empty-state";
import { ScreenHeader } from "@/components/shared/screen-header";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatDayLabel, formatTime, formatVND } from "@/lib/utils";
import { useOrdersStore } from "@/stores/orders-store";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const { orders, hydrated } = useOrdersStore();

  const order = orders.find((o) => o.id === params.id);

  if (!hydrated) {
    return (
      <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col">
        <ScreenHeader title="Chi tiết đơn" />
        <div className="space-y-3 px-4 py-5">
          <Skeleton className="h-28 w-full rounded-3xl" />
          <Skeleton className="h-48 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col">
        <ScreenHeader title="Chi tiết đơn" />
        <div className="flex-1 px-4 py-5">
          <EmptyState
            icon={Package}
            title="Không tìm thấy đơn"
            description="Đơn có thể đã bị xoá hoặc mã đường dẫn không đúng."
          />
        </div>
      </div>
    );
  }

  const Icon = order.type === "water" ? Droplets : UtensilsCrossed;

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col">
      <ScreenHeader
        title={order.code}
        subtitle={`${formatDayLabel(order.createdAt)} · ${formatTime(order.createdAt)}`}
      />

      <div className="flex-1 space-y-3 px-4 py-5 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
        >
          <Card className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-2xl",
                    order.type === "water"
                      ? "bg-sky-500/15 text-sky-600 dark:text-sky-400"
                      : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold">
                    {order.type === "water" ? "Đổi nước 20L" : "Cơm trưa"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Phòng {order.roomNumber} · {order.userName}
                  </p>
                </div>
              </div>
              <StatusBadge status={order.status} />
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
              <span className="text-sm text-muted-foreground">
                {order.paymentStatus === "paid" ? "Đã thanh toán" : "Thanh toán khi nhận"}
              </span>
              <span className="text-lg font-extrabold tabular-nums">
                {formatVND(order.totalAmount)}
              </span>
            </div>
          </Card>
        </motion.div>

        {order.type === "food" && order.pickupCode && order.status !== "completed" && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28, delay: 0.06 }}
          >
            <Card className="bg-emerald-500/5 p-4">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <MapPin className="size-4" />
                <p className="text-sm font-semibold">Mã lấy đồ tại điểm tụ</p>
              </div>
              <p className="mt-2 text-center font-mono text-3xl font-extrabold tracking-[0.3em] tabular-nums text-emerald-600 dark:text-emerald-400">
                {order.pickupCode}
              </p>
              {order.foodDetails && (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  {order.foodDetails.pickupTimeSlot} ·{" "}
                  {order.foodDetails.pickupDate.slice(8, 10)}/
                  {order.foodDetails.pickupDate.slice(5, 7)}
                </p>
              )}
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 28, delay: 0.1 }}
        >
          <Card className="p-4">
            <p className="mb-3 text-sm font-bold">Chi tiết</p>
            {order.type === "water" ? (
              <div className="flex items-center justify-between text-sm">
                <span>Số bình 20L</span>
                <span className="font-semibold tabular-nums">
                  {order.waterDetails?.bottleCount ?? 0} bình
                </span>
              </div>
            ) : (
              <div className="space-y-1.5">
                {order.foodDetails?.dishes.map((d) => (
                  <div key={d.dishId} className="flex justify-between text-sm">
                    <span>
                      {d.quantity}× {d.dishName}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatVND(d.price * d.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {order.note && (
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                <StickyNote className="mt-0.5 size-3.5 shrink-0" />
                {order.note}
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 28, delay: 0.14 }}
        >
          <Card className="p-4">
            <div className="mb-4 flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              <p className="text-sm font-bold">Tiến trình đơn</p>
            </div>
            <OrderTimeline order={order} />
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
