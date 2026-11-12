"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  Bell,
  ChevronRight,
  Droplets,
  Moon,
  Package,
  Sun,
  UtensilsCrossed,
} from "lucide-react";
import { StatusBadge } from "@/components/animated/status-badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchOrders } from "@/lib/orders";
import { cn, formatDayLabel, formatTime, formatVND, roomLabel } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useOrdersStore } from "@/stores/orders-store";
import { useTheme } from "@/hooks/use-theme";

export default function HomePage() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const { theme, toggle } = useTheme();
  const setOrders = useOrdersStore((s) => s.setOrders);
  const hydrated = useOrdersStore((s) => s.hydrated);
  const orders = useOrdersStore((s) => s.orders);

  const { isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const data = await fetchOrders();
      setOrders(data);
      return data;
    },
  });

  const myOrders = orders.filter((o) => o.userId === currentUser.id);
  const activeOrders = myOrders.filter(
    (o) => o.status !== "completed" && o.status !== "cancelled"
  );
  const recentOrders = myOrders.slice(0, 3);

  return (
    <div className="px-4 pb-8 pt-4">
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="glass flex items-center justify-between rounded-3xl border border-border/60 p-4 shadow-[0_8px_30px_-16px_rgba(2,8,23,0.3)]"
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {roomLabel(currentUser.roomNumber) || "Ký túc xá"}
          </p>
          <h1 className="mt-0.5 text-xl font-extrabold tracking-tight">
            Chào{" "}
            <span className="text-gradient">
              {currentUser.fullName.split(" ").slice(-1).join(" ")}
            </span>{" "}
            👋
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={toggle}
            className="flex size-10 items-center justify-center rounded-full bg-muted/60 transition-colors hover:bg-muted"
            aria-label="Đổi giao diện sáng/tối"
          >
            {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.88 }}
            className="relative flex size-10 items-center justify-center rounded-full bg-muted/60 transition-colors hover:bg-muted"
            aria-label="Thông báo"
          >
            <Bell className="size-5" />
            <span className="absolute right-2.5 top-2.5 size-2 animate-pulse rounded-full bg-sky-600 ring-2 ring-card" />
          </motion.button>
        </div>
      </motion.header>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          Đơn đang xử lý
        </h2>
        {isLoading || !hydrated ? (
          <div className="space-y-2.5">
            <Skeleton className="h-24 w-full rounded-3xl" />
            <Skeleton className="h-24 w-full rounded-3xl" />
          </div>
        ) : (
          <AnimatePresence mode="popLayout" initial={false}>
            {activeOrders.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-3xl border border-dashed border-border bg-card/50 px-4 py-6 text-center text-sm text-muted-foreground"
              >
                Không có đơn nào đang xử lý 🎉
              </motion.div>
            ) : (
              activeOrders.map((order, i) => (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{
                    type: "spring",
                    stiffness: 320,
                    damping: 28,
                    delay: i * 0.05,
                  }}
                >
                  <ActiveOrderCard order={order} />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        )}
      </section>

      <section className="mt-7">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Dịch vụ</h2>
        <div className="grid grid-cols-2 gap-3">
          <ServiceCard
            href="/water"
            title="Đổi nước"
            subtitle="Bình 20L · giao tận phòng"
            icon={Droplets}
            gradient="from-sky-500/20 to-sky-500/5"
            iconBg="from-sky-400 to-sky-600 shadow-sky-600/30"
            delay={0}
          />
          <ServiceCard
            href="/food"
            title="Đặt cơm"
            subtitle="Đặt hôm nay · nhận trưa mai"
            icon={UtensilsCrossed}
            gradient="from-emerald-500/20 to-emerald-500/5"
            iconBg="from-emerald-400 to-emerald-600 shadow-emerald-600/30"
            delay={0.08}
          />
        </div>
      </section>

      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">Gần đây</h2>
          <Link
            href="/orders"
            className="flex items-center gap-0.5 text-xs font-medium text-sky-600 dark:text-sky-400"
          >
            Xem tất cả <ChevronRight className="size-3.5" />
          </Link>
        </div>
        {isLoading || !hydrated ? (
          <div className="space-y-2.5">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        ) : (
          <div className="space-y-2.5">
            <AnimatePresence initial={false}>
              {recentOrders.map((order) => (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 340, damping: 30 }}
                >
                  <RecentOrderRow order={order} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  );
}

function ActiveOrderCard({ order }: { order: import("@/types").Order }) {
  return (
    <Link href={`/orders/${order.id}`}>
      <Card className="card-elevated mb-2.5 p-4 transition-transform active:scale-[0.985]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-11 items-center justify-center rounded-2xl",
                order.type === "water"
                  ? "bg-sky-500/15 text-sky-600 dark:text-sky-400"
                  : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              )}
            >
              {order.type === "water" ? (
                <Droplets className="size-5" />
              ) : (
                <UtensilsCrossed className="size-5" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold">
                {order.type === "water"
                  ? `${order.waterDetails?.bottleCount ?? 1} bình nước 20L`
                  : "Đơn cơm trưa"}
              </p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {order.code} · {formatTime(order.createdAt)}
              </p>
            </div>
          </div>
          <StatusBadge status={order.status} />
        </div>
      </Card>
    </Link>
  );
}

function ServiceCard({
  href,
  title,
  subtitle,
  icon: Icon,
  gradient,
  iconBg,
  delay,
}: {
  href: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  gradient: string;
  iconBg: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 26, delay }}
    >
      <Link href={href} className="block">
        <motion.div
          whileTap={{ scale: 0.96 }}
          whileHover={{ y: -3 }}
          transition={{ type: "spring", stiffness: 400, damping: 24 }}
          className={cn(
            "card-elevated relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br p-4",
            gradient
          )}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-6 -top-8 size-24 rounded-full bg-white/25 blur-2xl dark:bg-white/5"
          />
          <div
            className={cn(
              "flex size-12 items-center justify-center rounded-2xl bg-gradient-to-b text-white shadow-lg ring-1 ring-inset ring-white/25",
              iconBg
            )}
          >
            <Icon className="size-5.5" strokeWidth={2.2} />
          </div>
          <p className="mt-3.5 font-bold tracking-tight">{title}</p>
          <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{subtitle}</p>
          <span className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-full bg-card/70 shadow-sm ring-1 ring-inset ring-border/60">
            <ArrowUpRight className="size-3.5 text-muted-foreground" />
          </span>
        </motion.div>
      </Link>
    </motion.div>
  );
}

function RecentOrderRow({ order }: { order: import("@/types").Order }) {
  return (
    <Link href={`/orders/${order.id}`}>
      <Card className="card-elevated flex items-center justify-between gap-3 px-4 py-3 transition-transform active:scale-[0.985]">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl",
              order.type === "water"
                ? "bg-sky-500/15 text-sky-600 dark:text-sky-400"
                : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            )}
          >
            {order.type === "water" ? (
              <Droplets className="size-4" />
            ) : (
              <Package className="size-4" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium tabular-nums">{order.code}</p>
            <p className="text-xs text-muted-foreground">
              {formatDayLabel(order.createdAt)} · {formatVND(order.totalAmount)}
            </p>
          </div>
        </div>
        <StatusBadge status={order.status} />
      </Card>
    </Link>
  );
}
