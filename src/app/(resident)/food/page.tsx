"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Loader2,
  Minus,
  Plus,
  QrCode,
  UtensilsCrossed,
  Wallet,
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
import { useMenus } from "@/hooks/use-menus";
import { createFoodOrder, createFoodOrderUnpaid } from "@/lib/orders";
import { createPayosCheckout } from "@/lib/payos-client";
import { getSupabase } from "@/lib/supabase/client";
import { cn, formatVND, sleep, tomorrowISO } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useOrdersStore } from "@/stores/orders-store";
import type { DailyMenu, Order } from "@/types";

type Phase = "idle" | "loading" | "success";

const vnpayEnabled = process.env.NEXT_PUBLIC_VNPAY_ENABLED === "true";
const cassoEnabled = process.env.NEXT_PUBLIC_CASSO_ENABLED === "true";
const payosEnabled = process.env.NEXT_PUBLIC_PAYOS_ENABLED === "true";

export default function FoodPage() {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.currentUser);
  const addOrder = useOrdersStore((s) => s.addOrder);
  const allOrders = useOrdersStore((s) => s.orders);

  const { data: allMenus = [], isLoading: menusLoading } = useMenus();

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
  const [vnpayBusy, setVnpayBusy] = useState(false);
  const [payosBusy, setPayosBusy] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [creatingPending, setCreatingPending] = useState(false);
  const [pickupCode, setPickupCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const livePending = pendingOrder
    ? allOrders.find((o) => o.id === pendingOrder.id)
    : null;

  useEffect(() => {
    if (!livePending || livePending.paymentStatus !== "paid" || phase !== "idle") {
      return;
    }
    let cancelled = false;
    setPickupCode(livePending.pickupCode ?? "");
    setPhase("success");
    (async () => {
      await sleep(2400);
      if (cancelled) return;
      setShowPayment(false);
      setPendingOrder(null);
      router.push("/orders");
    })();
    return () => {
      cancelled = true;
    };
  }, [livePending, phase, router]);

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
    setError(null);

    try {
      const order = await createFoodOrder({
        items: selectedItems.map((x) => ({
          menuId: x.menu.id,
          dishName: x.menu.dishName,
          price: x.menu.price,
          quantity: x.qty,
        })),
        totalAmount,
      });
      addOrder(order);
      setPickupCode(order.pickupCode ?? "");
      setPhase("success");
      await sleep(2200);
      setShowPayment(false);
      router.push("/orders");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Đặt cơm thất bại.");
      setPhase("idle");
    }
  }

  async function handleCreatePendingOrder() {
    if (creatingPending || selectedItems.length === 0) return;
    setCreatingPending(true);
    setError(null);

    try {
      const order = await createFoodOrderUnpaid({
        items: selectedItems.map((x) => ({
          menuId: x.menu.id,
          dishName: x.menu.dishName,
          price: x.menu.price,
          quantity: x.qty,
        })),
        totalAmount,
      });
      addOrder(order);
      setPendingOrder(order);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tạo được lệnh thanh toán.");
    } finally {
      setCreatingPending(false);
    }
  }

  async function handleVnpayPayment() {
    if (vnpayBusy || selectedItems.length === 0) return;
    setVnpayBusy(true);
    setError(null);

    try {
      const supabase = getSupabase();
      const token = (
        await supabase!.auth.getSession()
      ).data.session?.access_token;
      if (!token) throw new Error("Phiên đăng nhập hết hạn, hãy đăng nhập lại.");

      const res = await fetch("/api/payment/vnpay/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: selectedItems.map((x) => ({
            menuId: x.menu.id,
            dishName: x.menu.dishName,
            price: x.menu.price,
            quantity: x.qty,
          })),
          totalAmount,
        }),
      });
      const data = (await res.json()) as { paymentUrl?: string; error?: string };
      if (!res.ok || !data.paymentUrl) {
        throw new Error(data.error ?? "Không tạo được lệnh thanh toán VNPay.");
      }
      window.location.href = data.paymentUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Thanh toán VNPay thất bại.");
      setVnpayBusy(false);
    }
  }

  async function handlePayosPayment() {
    if (payosBusy || selectedItems.length === 0) return;
    setPayosBusy(true);
    setError(null);

    try {
      let code = pendingOrder?.code;
      if (!code) {
        const order = await createFoodOrderUnpaid({
          items: selectedItems.map((x) => ({
            menuId: x.menu.id,
            dishName: x.menu.dishName,
            price: x.menu.price,
            quantity: x.qty,
          })),
          totalAmount,
        });
        addOrder(order);
        setPendingOrder(order);
        code = order.code;
      }
      const checkoutUrl = await createPayosCheckout(code);
      window.location.href = checkoutUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tạo được lệnh thanh toán PayOS.");
      setPayosBusy(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col">
      <ScreenHeader
        title="Đặt cơm trưa"
        subtitle={`Đặt hôm nay · nhận trưa mai tại điểm tụ`}
      />

      <div className="flex-1 space-y-4 px-4 py-5 pb-28">
        {!menusLoading ? (
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
                <h2 className="text-lg font-bold">
                  {cassoEnabled ? "Thanh toán chuyển khoản" : "Thanh toán VietQR"}
                </h2>
              </div>

              {cassoEnabled && !payosEnabled && !pendingOrder ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-muted/30 p-5 text-center">
                  <p className="text-sm text-muted-foreground">
                    {totalQty} suất · nhận trưa mai tại điểm tụ
                  </p>
                  <p className="text-2xl font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatVND(totalAmount)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tạo lệnh thanh toán để nhận QR — hệ thống tự xác nhận khi tiền
                    về tài khoản nhà bếp.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-muted/30 p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      pendingOrder
                        ? buildVietQRUrl(pendingOrder.code, pendingOrder.totalAmount)
                        : buildVietQRUrl("FOOD", totalAmount)
                    }
                    alt="VietQR"
                    className="size-48 rounded-xl bg-white p-2"
                  />
                  <div className="w-full space-y-1 text-center text-sm">
                    <p className="font-medium">{BANK_INFO.bankName}</p>
                    <p className="tabular-nums">{BANK_INFO.accountNumber}</p>
                    <p className="text-muted-foreground">{BANK_INFO.accountName}</p>
                    <p className="mt-2 font-semibold text-emerald-600">
                      {formatVND(pendingOrder?.totalAmount ?? totalAmount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Nội dung: {" "}
                      {pendingOrder
                        ? buildTransferContent(currentUser.roomNumber, pendingOrder.code)
                        : buildTransferContent(currentUser.roomNumber, "FOOD")}
                    </p>
                    {pendingOrder && (
                      <p className="font-mono text-sm font-bold tracking-widest">
                        {pendingOrder.code}
                      </p>
                    )}
                  </div>
                  {pendingOrder && phase === "idle" && (
                    <div className="flex items-center gap-2 text-xs text-sky-600 dark:text-sky-400">
                      <Loader2 className="size-3.5 animate-spin" />
                      Đang chờ tiền về — tự động xác nhận trong ít phút...
                    </div>
                  )}
                </div>
              )}

              {payosEnabled && (
                <div className="mt-4">
                  <TapButton
                    onClick={handlePayosPayment}
                    disabled={phase !== "idle" || payosBusy}
                    className="w-full bg-sky-600 shadow-sky-600/30"
                  >
                    {payosBusy ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <span className="flex items-center gap-2">
                        <Wallet className="size-4" /> Thanh toán qua PayOS
                      </span>
                    )}
                  </TapButton>
                  <p className="mt-2 text-center text-[11px] text-muted-foreground">
                    Quét QR ngân hàng bất kỳ — hệ thống tự xác nhận qua PayOS.
                  </p>
                </div>
              )}

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 text-center text-xs font-medium text-red-500"
                >
                  {error}
                </motion.p>
              )}

              {vnpayEnabled && !cassoEnabled && !payosEnabled && (
                <div className="mt-4">
                  <TapButton
                    onClick={handleVnpayPayment}
                    disabled={phase !== "idle" || vnpayBusy}
                    className="w-full bg-sky-600 shadow-sky-600/30"
                  >
                    {vnpayBusy ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <span className="flex items-center gap-2">
                        <Wallet className="size-4" /> Thanh toán qua VNPay
                      </span>
                    )}
                  </TapButton>
                  <p className="mt-2 text-center text-[11px] text-muted-foreground">
                    Quét QR bằng app ngân hàng — xác nhận tự động qua VNPay.
                  </p>
                </div>
              )}

              {cassoEnabled && !payosEnabled ? (
                <div className="mt-4">
                  {!pendingOrder ? (
                    <TapButton
                      onClick={handleCreatePendingOrder}
                      disabled={creatingPending}
                      className="w-full bg-emerald-600 shadow-emerald-600/30"
                    >
                      {creatingPending ? (
                        <Loader2 className="size-5 animate-spin" />
                      ) : (
                        "Tạo lệnh thanh toán"
                      )}
                    </TapButton>
                  ) : (
                    <TapButton
                      onClick={() => {
                        setShowPayment(false);
                        setPendingOrder(null);
                        setError(null);
                      }}
                      disabled={phase !== "idle"}
                      className="w-full border border-border bg-muted/40 text-foreground shadow-none"
                    >
                      Đóng — đơn đã lưu, chờ tiền về
                    </TapButton>
                  )}
                </div>
              ) : (
                <>
                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    {vnpayEnabled
                      ? "Hoặc chuyển khoản thủ công qua VietQR bên dưới:"
                      : "Sau khi chuyển khoản, bấm xác nhận bên dưới để ghi đơn vào hệ thống."}
                  </p>

                  <div className="mt-4">
                    <TapButton
                      onClick={handleConfirmPayment}
                  disabled={phase !== "idle"}
                  className={cn(
                    "w-full",
                    vnpayEnabled
                      ? "border border-border bg-muted/40 text-foreground shadow-none"
                      : "bg-emerald-600 shadow-emerald-600/30"
                  )}
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
                </>
              )}
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
