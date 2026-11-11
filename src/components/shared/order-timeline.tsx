"use client";

import { motion } from "framer-motion";
import { cn, formatDayLabel, formatTime } from "@/lib/utils";
import { ORDER_STATUS_LABEL, type Order, type OrderStatus } from "@/types";

const FLOW: Record<Order["type"], OrderStatus[]> = {
  water: ["pending", "in_progress", "completed"],
  food: ["confirmed", "ready", "completed"],
};

const dotStyles: Record<OrderStatus, string> = {
  pending: "bg-amber-500",
  confirmed: "bg-sky-500",
  in_progress: "bg-violet-500",
  ready: "bg-emerald-500",
  completed: "bg-slate-400",
  cancelled: "bg-red-500",
};

export function OrderTimeline({ order }: { order: Order }) {
  const flow = FLOW[order.type];
  const cancelled = order.status === "cancelled";
  const currentIndex = cancelled ? -1 : flow.indexOf(order.status);

  return (
    <div className="space-y-0">
      {flow.map((status, idx) => {
        const reached = idx <= currentIndex;
        const isCurrent = idx === currentIndex;
        const isLast = idx === flow.length - 1;
        const time = stepTime(order, idx, currentIndex);

        return (
          <div key={status} className="relative flex gap-3.5 pb-6 last:pb-0">
            {!isLast && (
              <div className="absolute left-[7px] top-5 h-[calc(100%-1.25rem)] w-0.5 overflow-hidden rounded-full bg-border">
                {idx < currentIndex && (
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 26,
                      delay: 0.15 + idx * 0.15,
                    }}
                    className="h-full w-full origin-top bg-sky-500"
                  />
                )}
              </div>
            )}

            <div className="relative mt-0.5 flex size-4 shrink-0 items-center justify-center">
              {isCurrent && (
                <motion.span
                  className={cn(
                    "absolute inline-flex size-full rounded-full opacity-50",
                    dotStyles[status]
                  )}
                  animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: reached ? 1 : 0.55 }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 22,
                  delay: 0.1 + idx * 0.12,
                }}
                className={cn(
                  "relative inline-flex size-4 rounded-full",
                  reached ? dotStyles[status] : "bg-border"
                )}
              />
            </div>

            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + idx * 0.12, duration: 0.25 }}
              className="min-w-0 flex-1 pt-0.5"
            >
              <p
                className={cn(
                  "text-sm font-semibold",
                  reached ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {ORDER_STATUS_LABEL[status]}
                {isCurrent && (
                  <span className="ml-2 rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-600 dark:text-sky-400">
                    Hiện tại
                  </span>
                )}
              </p>
              {time && (
                <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                  {formatDayLabel(time)} · {formatTime(time)}
                </p>
              )}
            </motion.div>
          </div>
        );
      })}

      {cancelled && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-1 rounded-2xl bg-red-500/10 px-3.5 py-2.5 text-sm font-medium text-red-600 dark:text-red-400"
        >
          Đơn đã bị huỷ · {formatDayLabel(order.updatedAt)} · {formatTime(order.updatedAt)}
        </motion.div>
      )}
    </div>
  );
}

function stepTime(order: Order, idx: number, currentIndex: number) {
  if (idx === 0) return order.createdAt;
  if (idx < currentIndex) return order.updatedAt;
  if (idx === currentIndex) {
    if (order.status === "completed" && order.waterDetails?.completedAt) {
      return order.waterDetails.completedAt;
    }
    return order.updatedAt;
  }
  return null;
}
