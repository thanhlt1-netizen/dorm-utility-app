"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Loader2,
  Minus,
  Plus,
  QrCode,
  UtensilsCrossed,
} from "lucide-react";
import { SuccessOverlay } from "@/components/animated/success-overlay";
import { TapButton } from "@/components/animated/tap-button";
import { ScreenHeader } from "@/components/shared/screen-header";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BANK_INFO,
  buildTransferContent,
  buildVietQRUrl,
} from "@/lib/payment";
import {
  formatVND,
  generateOrderCode,
  generatePickupCode,
  sleep,
  tomorrowISO,
} from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useMenusStore } from "@/stores/menus-store";
import { useOrdersStore } from "@/stores/orders-store";
import type { DailyMenu, Order } from "@/types";

type Phase = "idle" | "loading" | "success";

export default function FoodPage() {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.currentUser);
  const addOrder = useOrdersStore((s) => s.addOrder);

  const { menus: allMenus, hydrated: menusHydrated } = useMenusStore();

  const menus = useMemo(
    () =>
      allMenus.filter(
        (m) => m.date === tomorrowISO() && m.isActive && m.remaining > 0
      ),
    [allMenus]
  );

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [showPayment, setShowPayment] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [pickupCode, setPickupCode] = useState("");

  const selectedItems = menus
    .map((m) => ({ menu: m, qty: quantities[m.id] || 0 }))
    .filter((x) => x.qty > 0);

  const totalAmount = selectedItems.reduce(
    (sum, x) => sum + x.menu.price * x.qty,
    0
  );
  const totalQty = selectedItems.reduce((sum, x) => sum + x.qty, 0);

  function updateQty(menu: DailyMenu, delta: number) {
    setQuantities((prev) => {
      const current = prev[menu.id] || 0;
      const next = Math.max(0, Math.min(menu.remaining, current + delta));
      if (next === 0) {
        const rest = { ...prev };
        delete rest[menu.id];
        return rest;
      }
      return { ...prev, [menu.id]: next };
    });
  }

  async function handleConfirmPayment() {
    if (phase !== "idle" || selectedItems.length === 0) return;
    setPhase("loading");

    const code = generateOrderCode("food");
    const pickup = generatePickupCode();
    const now = new Date().toISOString();

    const order: Order = {
      id: `o-${Date.now()}`,
      code,
      userId: currentUser.id,
      userName: currentUser.fullName,
      roomNumber: currentUser.roomNumber,
      type: "food",
      status: "confirmed",
      totalAmount,
      paymentStatus: "paid",
      pickupCode: pickup,
      createdAt: now,
      updatedAt: now,
      foodDetails: {
        dishes: selectedItems.map((x) => ({
          dishId: x.menu.id,
          dishName: x.menu.dishName,
          price: x.menu.price,
          quantity: x.qty,
        })),
        pickupDate: tomorrowISO(),
        pickupTimeSlot: "11:30 - 12:30",
      },
    };

    addOrder(order);
    setPickupCode(pickup);
    await sleep(1600);
    setPhase("success");
    await sleep(2200);
    setShowPayment(false);
    router.push("/orders");
  }

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col">
      <ScreenHeader
        title="Đặt cơm trưa"
        subtitle={`Đặt hôm nay · nhận trưa mai tại điểm tụ`}
      />

      <div className="flex-1 space-y-4 px-4 py-5 pb-28">
        {!menusHydrated ? (
          <>
            <Skeleton className="h-44 w-full rounded-3xl" />
            <Skeleton className="h-44 w-full rounded-3xl" />
          </>
        ) : menus.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <UtensilsCrossed className="size-10 text-muted-foreground" />
            <p className="font-medium">Chưa có thực đơn ngày mai</p>
            <p className="text-sm text-muted-foreground">
              Nhà bếp sẽ cập nhật món trong ngày.
            </p>
          </div>
        ) : (
          menus.map((menu, idx) => {
            const qty = quantities[menu.id] || 0;
            return (
              <motion.div
                key={menu.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 28,
                  delay: idx * 0.05,
                }}
              >
                <Card className="overflow-hidden p-0">
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold leading-snug">
                          {menu.dishName}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {menu.description}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {menu.nutritionTags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">
                          {formatVND(menu.price)}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Còn {menu.remaining}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={() => updateQty(menu, -1)}
                          disabled={qty === 0}
                          className="flex size-9 items-center justify-center rounded-xl border border-border disabled:opacity-40"
                        >
                          <Minus className="size-4" />
                        </motion.button>
                        <AnimatePresence mode="popLayout" initial={false}>
                          <motion.span
                            key={qty}
                            initial={{ opacity: 0, y: 8, scale: 0.85 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.85 }}
                            className="w-6 text-center text-lg font-bold tabular-nums"
                          >
                            {qty}
                          </motion.span>
                        </AnimatePresence>
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={() => updateQty(menu, 1)}
                          disabled={qty >= menu.remaining}
                          className="flex size-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/25 disabled:opacity-40"
                        >
                          <Plus className="size-4" />
                        </motion.button>
                      </div>
                      {qty > 0 && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-sm font-semibold tabular-nums"
                        >
                          {formatVND(menu.price * qty)}
                        </motion.p>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      <AnimatePresence>
        {totalQty > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/90 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-xl"
          >
            <div className="mx-auto flex max-w-lg items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">
                  {totalQty} suất · nhận trưa mai
                </p>
                <p className="text-lg font-extrabold tabular-nums">
                  {formatVND(totalAmount)}
                </p>
              </div>
              <TapButton
                onClick={() => setShowPayment(true)}
                className="shrink-0 bg-emerald-600 px-5 shadow-emerald-600/30"
              >
                Thanh toán
              </TapButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
            onClick={() => phase === "idle" && setShowPayment(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 340, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-t-3xl bg-background p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl"
            >
              <div className="mb-4 flex items-center gap-2">
                <QrCode className="size-5 text-emerald-600" />
                <h2 className="text-lg font-bold">Thanh toán VietQR</h2>
              </div>

              <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-muted/30 p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={buildVietQRUrl("FOOD", totalAmount)}
                  alt="VietQR"
                  className="size-48 rounded-xl bg-white p-2"
                />
                <div className="w-full space-y-1 text-center text-sm">
                  <p className="font-medium">{BANK_INFO.bankName}</p>
                  <p className="tabular-nums">{BANK_INFO.accountNumber}</p>
                  <p className="text-muted-foreground">{BANK_INFO.accountName}</p>
                  <p className="mt-2 font-semibold text-emerald-600">
                    {formatVND(totalAmount)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Nội dung: {" "}
                    {buildTransferContent(currentUser.roomNumber, "FOOD")}
                  </p>
                </div>
              </div>

              <p className="mt-3 text-center text-xs text-muted-foreground">
                Sau khi chuyển khoản, bấm xác nhận bên dưới (mô phỏng webhook).
              </p>

              <div className="mt-4">
                <TapButton
                  onClick={handleConfirmPayment}
                  disabled={phase !== "idle"}
                  className="w-full bg-emerald-600 shadow-emerald-600/30"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {phase === "idle" && (
                      <motion.span
                        key="idle"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                      >
                        Tôi đã chuyển khoản
                      </motion.span>
                    )}
                    {phase === "loading" && (
                      <motion.span
                        key="loading"
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.7 }}
                      >
                        <Loader2 className="size-5 animate-spin" />
                      </motion.span>
                    )}
                    {phase === "success" && (
                      <motion.span
                        key="success"
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.7 }}
                        className="flex items-center gap-2"
                      >
                        <Check className="size-5" /> Thành công
                      </motion.span>
                    )}
                  </AnimatePresence>
                </TapButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <SuccessOverlay
        open={phase === "success"}
        title="Đặt cơm thành công!"
        message={
          pickupCode
            ? `Mã lấy đồ của bạn: ${pickupCode}. Mang mã này đến điểm tụ trưa mai.`
            : "Đơn đã được xác nhận."
        }
      />
    </div>
  );
}
