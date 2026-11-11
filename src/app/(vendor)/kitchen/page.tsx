"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChefHat,
  Loader2,
  Search,
  UtensilsCrossed,
} from "lucide-react";
import { StatusBadge } from "@/components/animated/status-badge";
import { TapButton } from "@/components/animated/tap-button";
import { EmptyState } from "@/components/shared/empty-state";
import { ScreenHeader } from "@/components/shared/screen-header";
import { Card } from "@/components/ui/card";
import { seedMenus } from "@/lib/mock-data";
import { cn, formatTime, formatVND, sleep, tomorrowISO } from "@/lib/utils";
import { useOrdersStore } from "@/stores/orders-store";
import type { Order } from "@/types";

type Tab = "orders" | "menu";

export default function VendorKitchenPage() {
  const { orders, updateOrder } = useOrdersStore();
  const [tab, setTab] = useState<Tab>("orders");
  const [codeInput, setCodeInput] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [verifyMsg, setVerifyMsg] = useState<string | null>(null);

  const foodOrders = useMemo(
    () =>
      orders
        .filter((o) => o.type === "food" && o.paymentStatus === "paid")
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
    [orders]
  );

  const activeOrders = foodOrders.filter(
    (o) => o.status === "confirmed" || o.status === "ready"
  );

  async function markReady(order: Order) {
    if (busyId) return;
    setBusyId(order.id);
    await sleep(500);
    updateOrder(order.id, {
      status: "ready",
      updatedAt: new Date().toISOString(),
    });
    setBusyId(null);
  }

  async function verifyPickup() {
    const code = codeInput.trim();
    if (!code) return;

    const found = foodOrders.find(
      (o) => o.pickupCode === code && o.status !== "completed"
    );

    if (!found) {
      setVerifyMsg("Không tìm thấy mã hoặc đơn đã hoàn thành.");
      return;
    }

    setBusyId(found.id);
    await sleep(700);
    updateOrder(found.id, {
      status: "completed",
      updatedAt: new Date().toISOString(),
    });
    setBusyId(null);
    setCodeInput("");
    setVerifyMsg(`Đã xác nhận lấy đồ · ${found.code} · Phòng ${found.roomNumber}`);
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col">
      <ScreenHeader
        title="Nhà bếp"
        subtitle={`Thực đơn ${tomorrowISO().slice(8, 10)}/${tomorrowISO().slice(5, 7)} · ${activeOrders.length} đơn đang xử lý`}
      />

      <div className="sticky top-[57px] z-30 bg-background/80 px-4 py-3 backdrop-blur-xl">
        <div className="flex gap-1.5">
          {(
            [
              { value: "orders", label: "Đơn hàng" },
              { value: "menu", label: "Thực đơn" },
            ] as const
          ).map((t) => {
            const active = tab === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className="relative min-h-9 rounded-full px-4 text-xs font-semibold"
              >
                {active && (
                  <motion.span
                    layoutId="vendor-tab"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    className="absolute inset-0 rounded-full bg-emerald-600"
                  />
                )}
                <span
                  className={cn(
                    "relative transition-colors",
                    active ? "text-white" : "text-muted-foreground"
                  )}
                >
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 space-y-3 px-4 pb-8">
        {tab === "orders" && (
          <>
            <Card className="p-4">
              <p className="mb-2 text-sm font-semibold">Xác nhận mã lấy đồ</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={codeInput}
                    onChange={(e) => {
                      setCodeInput(e.target.value.replace(/\D/g, "").slice(0, 6));
                      setVerifyMsg(null);
                    }}
                    placeholder="Nhập 6 số"
                    className="h-11 w-full rounded-xl border border-border bg-background pl-9 pr-3 font-mono text-sm tabular-nums tracking-widest outline-none focus:ring-2 focus:ring-emerald-500/40"
                    inputMode="numeric"
                  />
                </div>
                <TapButton
                  onClick={verifyPickup}
                  disabled={codeInput.length < 6 || !!busyId}
                  className="bg-emerald-600 px-4 shadow-emerald-600/25"
                >
                  {busyId ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Xác nhận"
                  )}
                </TapButton>
              </div>
              {verifyMsg && (
                <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                  {verifyMsg}
                </p>
              )}
            </Card>

            {activeOrders.length === 0 ? (
              <EmptyState
                icon={ChefHat}
                title="Chưa có đơn cần xử lý"
                description="Đơn cơm đã thanh toán sẽ xuất hiện tại đây."
              />
            ) : (
              <AnimatePresence mode="popLayout" initial={false}>
                {activeOrders.map((order) => (
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
                        <div className="min-w-0">
                          <p className="text-sm font-semibold tabular-nums">
                            {order.code}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Phòng {order.roomNumber} · {order.userName} ·{" "}
                            {formatTime(order.createdAt)}
                          </p>
                        </div>
                        <StatusBadge status={order.status} />
                      </div>

                      <div className="mt-3 space-y-1">
                        {order.foodDetails?.dishes.map((d) => (
                          <div
                            key={d.dishId}
                            className="flex justify-between text-sm"
                          >
                            <span>
                              {d.quantity}× {d.dishName}
                            </span>
                            <span className="tabular-nums text-muted-foreground">
                              {formatVND(d.price * d.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {order.pickupCode && (
                        <div className="mt-3 flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2">
                          <span className="text-xs text-muted-foreground">
                            Mã lấy đồ
                          </span>
                          <span className="font-mono text-sm font-bold tracking-[0.2em] tabular-nums">
                            {order.pickupCode}
                          </span>
                        </div>
                      )}

                      {order.status === "confirmed" && (
                        <TapButton
                          onClick={() => markReady(order)}
                          disabled={busyId === order.id}
                          className="mt-3 w-full bg-emerald-600 text-sm shadow-emerald-600/25"
                        >
                          {busyId === order.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <span className="flex items-center gap-1.5">
                              <Check className="size-4" /> Sẵn sàng lấy
                            </span>
                          )}
                        </TapButton>
                      )}
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </>
        )}

        {tab === "menu" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Thực đơn ngày mai (đọc từ dữ liệu mẫu). Có thể mở rộng thành form
              chỉnh sửa sau.
            </p>
            {seedMenus.map((menu) => (
              <Card key={menu.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <UtensilsCrossed className="size-4 text-emerald-600" />
                      <h3 className="font-semibold">{menu.dishName}</h3>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {menu.description}
                    </p>
                    <div className="mt-2 flex gap-1.5">
                      {menu.nutritionTags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold tabular-nums text-emerald-600">
                      {formatVND(menu.price)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Còn {menu.remaining}/{menu.maxQuantity}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
