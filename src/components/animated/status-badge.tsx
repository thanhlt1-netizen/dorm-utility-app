"use client";

import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/types";

const statusStyles: Record<OrderStatus, string> = {
  pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  confirmed: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  in_progress: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  ready: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  completed: "bg-slate-500/15 text-slate-600 dark:text-slate-300",
  cancelled: "bg-red-500/15 text-red-600 dark:text-red-400",
};

const dotStyles: Record<OrderStatus, string> = {
  pending: "bg-amber-500",
  confirmed: "bg-sky-500",
  in_progress: "bg-violet-500",
  ready: "bg-emerald-500",
  completed: "bg-slate-400",
  cancelled: "bg-red-500",
};

export function StatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <motion.span
      layout
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        statusStyles[status],
        className
      )}
    >
      <span className="relative flex size-1.5">
        {status !== "completed" && status !== "cancelled" && (
          <motion.span
            className={cn("absolute inline-flex size-full rounded-full opacity-60", dotStyles[status])}
            animate={{ scale: [1, 2.2, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <span className={cn("relative inline-flex size-1.5 rounded-full", dotStyles[status])} />
      </span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={status}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          {ORDER_STATUS_LABEL[status]}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
}
