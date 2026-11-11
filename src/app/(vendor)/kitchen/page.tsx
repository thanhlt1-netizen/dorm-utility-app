"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import {
  Check,
  ChefHat,
  Loader2,
  Minus,
  Plus,
  Search,
  Trash2,
  UserRound,
  UtensilsCrossed,
} from "lucide-react";
import { StatusBadge } from "@/components/animated/status-badge";
import { TapButton } from "@/components/animated/tap-button";
import { EmptyState } from "@/components/shared/empty-state";
import { ScreenHeader } from "@/components/shared/screen-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useMenus } from "@/hooks/use-menus";
import { useOrders } from "@/hooks/use-orders";
import { createMenu, deleteMenu, updateMenuFields } from "@/lib/menus";
import { completePickupByCode, markFoodReady } from "@/lib/orders";
import { cn, formatTime, formatVND, tomorrowISO } from "@/lib/utils";
import { useMenusStore } from "@/stores/menus-store";
import { useOrdersStore } from "@/stores/orders-store";
import type { DailyMenu, Order } from "@/types";

type Tab = "orders" | "menu";

export default function VendorKitchenPage() {
  const { orders, updateOrder } = useOrdersStore();
  useOrders();
  const [tab, setTab] = useState<Tab>("orders");
  const [codeInput, setCodeInput] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [verifyMsg, setVerifyMsg] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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
    setActionError(null);
    updateOrder(order.id, {
      status: "ready",
      updatedAt: new Date().toISOString(),
    });
    try {
      await markFoodReady(order.id);
    } catch (e) {
      updateOrder(order.id, { status: order.status, updatedAt: order.updatedAt });
      setActionError(e instanceof Error ? e.message : "Cập nhật thất bại.");
    } finally {
      setBusyId(null);
    }
  }

  async function verifyPickup() {
    const code = codeInput.trim();
    if (!code || busyId) return;

    setBusyId("verify");
    setVerifyMsg(null);
    setActionError(null);
    try {
      const order = await completePickupByCode(code);
      updateOrder(order.id, {
        status: order.status,
        updatedAt: order.updatedAt,
      });
      setCodeInput("");
      setVerifyMsg(
        `Đã xác nhận lấy đồ · ${order.code} · Phòng ${order.roomNumber}`
      );
    } catch (e) {
      setActionError(
        e instanceof Error ? e.message : "Không tìm thấy mã hoặc đơn đã hoàn thành."
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col">
      <ScreenHeader
        title="Nhà bếp"
        subtitle={`Thực đơn ${tomorrowISO().slice(8, 10)}/${tomorrowISO().slice(5, 7)} · ${activeOrders.length} đơn đang xử lý`}
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
              {actionError && (
                <p className="mt-2 text-xs font-medium text-red-500">
                  {actionError}
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

        {tab === "menu" && <MenuEditor />}
      </div>
    </div>
  );
}

function MenuEditor() {
  const { menus, hydrated, addMenu, updateMenu, removeMenu } = useMenusStore();
  useMenus();
  const [showForm, setShowForm] = useState(false);
  const [dishName, setDishName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [maxQuantity, setMaxQuantity] = useState("");
  const [busy, setBusy] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);

  const tomorrowMenus = menus.filter((m) => m.date === tomorrowISO());

  async function handleAdd() {
    const name = dishName.trim();
    const parsedPrice = Number(price);
    const parsedQty = Number(maxQuantity);
    if (!name || !parsedPrice || !parsedQty || parsedQty < 1 || busy) return;

    setBusy(true);
    setEditorError(null);
    try {
      const menu = await createMenu({
        date: tomorrowISO(),
        dishName: name,
        description: description.trim(),
        price: parsedPrice,
        maxQuantity: parsedQty,
      });
      addMenu(menu);
      setDishName("");
      setDescription("");
      setPrice("");
      setMaxQuantity("");
      setShowForm(false);
    } catch (e) {
      setEditorError(e instanceof Error ? e.message : "Thêm món thất bại.");
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdate(
    menu: DailyMenu,
    patch: { remaining?: number; isActive?: boolean }
  ) {
    updateMenu(menu.id, patch);
    try {
      await updateMenuFields(menu.id, patch);
    } catch (e) {
      updateMenu(menu.id, {
        remaining: menu.remaining,
        isActive: menu.isActive,
      });
      setEditorError(e instanceof Error ? e.message : "Cập nhật thất bại.");
    }
  }

  async function handleRemove(menu: DailyMenu) {
    removeMenu(menu.id);
    try {
      await deleteMenu(menu.id);
    } catch (e) {
      addMenu(menu);
      setEditorError(e instanceof Error ? e.message : "Xóa món thất bại.");
    }
  }

  if (!hydrated) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-28 w-full rounded-3xl" />
        <Skeleton className="h-28 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Thực đơn ngày mai · {tomorrowMenus.length} món
        </p>
        <TapButton
          onClick={() => setShowForm((v) => !v)}
          className="bg-emerald-600 px-3.5 py-2 text-xs shadow-emerald-600/25"
        >
          <span className="flex items-center gap-1">
            <Plus className="size-3.5" /> Thêm món
          </span>
        </TapButton>
      </div>

      <AnimatePresence initial={false}>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="overflow-hidden"
          >
            <Card className="space-y-2.5 p-4">
              <Input
                value={dishName}
                onChange={(e) => setDishName(e.target.value)}
                placeholder="Tên món (VD: Cơm gà xào sả)"
              />
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả ngắn"
                className="min-h-16"
              />
              <div className="flex gap-2.5">
                <Input
                  value={price}
                  onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
                  placeholder="Giá (VNĐ)"
                  inputMode="numeric"
                  className="flex-1"
                />
                <Input
                  value={maxQuantity}
                  onChange={(e) =>
                    setMaxQuantity(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="Số suất"
                  inputMode="numeric"
                  className="w-28"
                />
              </div>
              <TapButton
                onClick={handleAdd}
                disabled={
                  busy ||
                  !dishName.trim() ||
                  !Number(price) ||
                  !Number(maxQuantity)
                }
                className="w-full bg-emerald-600 text-sm shadow-emerald-600/25"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : "Thêm vào thực đơn mai"}
              </TapButton>
              {editorError && (
                <p className="text-xs font-medium text-red-500">{editorError}</p>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {tomorrowMenus.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="Chưa có món cho ngày mai"
          description="Bấm Thêm món để đăng bán cho sinh viên đặt."
        />
      ) : (
        <AnimatePresence mode="popLayout" initial={false}>
          {tomorrowMenus.map((menu) => (
            <motion.div
              key={menu.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 340, damping: 30 }}
            >
              <Card className={cn("p-4", !menu.isActive && "opacity-60")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold leading-snug">{menu.dishName}</h3>
                    {menu.description && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {menu.description}
                      </p>
                    )}
                  </div>
                  <p className="shrink-0 font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatVND(menu.price)}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() =>
                        handleUpdate(menu, {
                          remaining: Math.max(0, menu.remaining - 1),
                        })
                      }
                      disabled={menu.remaining === 0}
                      className="flex size-8 items-center justify-center rounded-lg border border-border disabled:opacity-40"
                      aria-label="Giảm số suất"
                    >
                      <Minus className="size-3.5" />
                    </motion.button>
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span
                        key={menu.remaining}
                        initial={{ opacity: 0, y: 6, scale: 0.85 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.85 }}
                        className="w-14 text-center text-sm font-semibold tabular-nums"
                      >
                        Còn {menu.remaining}/{menu.maxQuantity}
                      </motion.span>
                    </AnimatePresence>
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() =>
                        handleUpdate(menu, {
                          remaining: Math.min(
                            menu.maxQuantity,
                            menu.remaining + 1
                          ),
                        })
                      }
                      disabled={menu.remaining >= menu.maxQuantity}
                      className="flex size-8 items-center justify-center rounded-lg bg-emerald-600 text-white disabled:opacity-40"
                      aria-label="Tăng số suất"
                    >
                      <Plus className="size-3.5" />
                    </motion.button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        handleUpdate(menu, { isActive: !menu.isActive })
                      }
                      className={cn(
                        "relative h-6 w-11 rounded-full transition-colors",
                        menu.isActive ? "bg-emerald-600" : "bg-border"
                      )}
                      aria-label={
                        menu.isActive ? "Đang bán — tắt" : "Đang tắt — bật"
                      }
                    >
                      <motion.span
                        layout
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                        }}
                        className={cn(
                          "absolute top-0.5 size-5 rounded-full bg-white shadow",
                          menu.isActive ? "right-0.5" : "left-0.5"
                        )}
                      />
                    </button>
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => handleRemove(menu)}
                      className="flex size-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-500/10"
                      aria-label="Xoá món"
                    >
                      <Trash2 className="size-4" />
                    </motion.button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}
