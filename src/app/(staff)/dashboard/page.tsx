"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { Check, Droplets, HardHat, Loader2, User, UserRound } from "lucide-react";
import { StatusBadge } from "@/components/animated/status-badge";
import { TapButton } from "@/components/animated/tap-button";
import { EmptyState } from "@/components/shared/empty-state";
import { ScreenHeader } from "@/components/shared/screen-header";
import { Card } from "@/components/ui/card";
import { useOrders } from "@/hooks/use-orders";
import { claimWaterOrder, completeWaterOrder } from "@/lib/orders";
import { cn, formatTime, formatVND } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useOrdersStore } from "@/stores/orders-store";
import type { Order } from "@/types";

type Filter = "pending" | "in_progress" | "all";

export default function StaffDashboardPage() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const { orders, updateOrder } = useOrdersStore();
  useOrders();
  const [filter, setFilter] = useState<Filter>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const waterOrders = useMemo(
    () =>
      orders
        .filter((o) => o.type === "water")
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
    [orders]
  );

  const visible = waterOrders.filter((o) => {
    if (filter === "pending") return o.status === "pending";
    if (filter === "in_progress") return o.status === "in_progress";
    return o.status !== "completed" && o.status !== "cancelled";
  });

  async function claimOrder(order: Order) {
    if (busyId) return;
    setBusyId(order.id);
    setActionError(null);
    updateOrder(order.id, {
      status: "in_progress",
      updatedAt: new Date().toISOString(),
      waterDetails: {
        bottleCount: order.waterDetails?.bottleCount ?? 1,
        assignedStaffId: currentUser.id,
        assignedStaffName: `${currentUser.fullName} (Trực ca)`,
      },
    });
    try {
      await claimWaterOrder(order.id, currentUser);
    } catch (e) {
      updateOrder(order.id, {
        status: order.status,
        updatedAt: order.updatedAt,
        waterDetails: order.waterDetails,
      });
      setActionError(e instanceof Error ? e.message : "Nhận giao thất bại.");
    } finally {
      setBusyId(null);
    }
  }

  async function completeOrder(order: Order) {
    if (busyId) return;
    setBusyId(order.id);
    setActionError(null);
    updateOrder(order.id, {
      status: "completed",
      updatedAt: new Date().toISOString(),
      waterDetails: {
        bottleCount: order.waterDetails?.bottleCount ?? 1,
        assignedStaffId: order.waterDetails?.assignedStaffId,
        assignedStaffName: order.waterDetails?.assignedStaffName,
        completedAt: new Date().toISOString(),
      },
    });
    try {
      await completeWaterOrder(order.id);
    } catch (e) {
      updateOrder(order.id, {
        status: order.status,
        updatedAt: order.updatedAt,
        waterDetails: order.waterDetails,
      });
      setActionError(e instanceof Error ? e.message : "Cập nhật thất bại.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col">
      <ScreenHeader
        title="Trực ca · Đổi nước"
        subtitle={`${visible.length} yêu cầu đang chờ xử lý`}
        right={
          <Link
            href="/profile"
            className="flex size-10 items-center justify-center rounded-full hover:bg-muted"
            aria-label="Cá nhân"
          >
            <UserRound className="size-5" />
          </Link>
        }
      />

      <div className="sticky top-[57px] z-30 bg-background/80 px-4 py-3 backdrop-blur-xl">
        <div className="flex gap-1.5">
          {(
            [
              { value: "pending", label: "Chờ nhận" },
              { value: "in_progress", label: "Đang giao" },
              { value: "all", label: "Tất cả" },
            ] as const
          ).map((f) => {
            const active = filter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className="relative min-h-9 rounded-full px-4 text-xs font-semibold"
              >
                {active && (
                  <motion.span
                    layoutId="staff-filter"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    className="absolute inset-0 rounded-full bg-sky-600"
                  />
                )}
                <span
                  className={cn(
                    "relative transition-colors",
                    active ? "text-white" : "text-muted-foreground"
                  )}
                >
                  {f.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 space-y-3 px-4 pb-8">
        {actionError && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-medium text-red-500"
          >
            {actionError}
          </motion.p>
        )}

        {visible.length === 0 ? (
          <EmptyState
            icon={HardHat}
            title="Không có yêu cầu nào"
            description="Khi sinh viên gửi yêu cầu đổi nước, đơn sẽ xuất hiện tại đây."
          />
        ) : (
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((order) => (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 340, damping: 30 }}
              >
                <Card className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400">
                        <Droplets className="size-4.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold tabular-nums">
                          {order.code}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Phòng {order.roomNumber} ·{" "}
                          {order.waterDetails?.bottleCount ?? 0} bình ·{" "}
                          {formatTime(order.createdAt)}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>

                  {order.note && (
                    <p className="mt-3 rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                      {order.note}
                    </p>
                  )}

                  {order.waterDetails?.assignedStaffName && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <User className="size-3.5" />
                      {order.waterDetails.assignedStaffName}
                    </div>
                  )}

                  <div className="mt-3 flex gap-2">
                    {order.status === "pending" && (
                      <TapButton
                        onClick={() => claimOrder(order)}
                        disabled={busyId === order.id}
                        className="flex-1 bg-sky-600 text-sm shadow-sky-600/25"
                      >
                        {busyId === order.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          "Nhận giao"
                        )}
                      </TapButton>
                    )}
                    {order.status === "in_progress" && (
                      <TapButton
                        onClick={() => completeOrder(order)}
                        disabled={busyId === order.id}
                        className="flex-1 bg-emerald-600 text-sm shadow-emerald-600/25"
                      >
                        {busyId === order.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <Check className="size-4" /> Đã giao xong
                          </span>
                        )}
                      </TapButton>
                    )}
                    <div className="flex items-center rounded-xl bg-muted/40 px-3 text-xs font-medium tabular-nums">
                      {formatVND(order.totalAmount)}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
