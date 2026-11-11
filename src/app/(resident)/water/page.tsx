"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Banknote, Check, Loader2, Minus, Plus, QrCode } from "lucide-react";
import { SuccessOverlay } from "@/components/animated/success-overlay";
import { TapButton } from "@/components/animated/tap-button";
import { ScreenHeader } from "@/components/shared/screen-header";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  BANK_INFO,
  buildTransferContent,
  buildVietQRUrl,
} from "@/lib/payment";
import {
  confirmPaymentSelf,
  createWaterOrder,
  setOrderPaymentMethod,
} from "@/lib/orders";
import { cn, formatVND, sleep } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useOrdersStore } from "@/stores/orders-store";
import type { Order } from "@/types";

const SERVICE_FEE_PER_BOTTLE = 20000;
const cassoEnabled = process.env.NEXT_PUBLIC_CASSO_ENABLED === "true";

type Phase = "idle" | "loading" | "success";
type PayMethod = "cash" | "qr";

export default function WaterPage() {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.currentUser);
  const addOrder = useOrdersStore((s) => s.addOrder);
  const allOrders = useOrdersStore((s) => s.orders);
  const updateOrder = useOrdersStore((s) => s.updateOrder);

  const [bottleCount, setBottleCount] = useState(1);
  const [note, setNote] = useState("");
  const [payMethod, setPayMethod] = useState<PayMethod>("cash");
  const [phase, setPhase] = useState<Phase>("idle");
  const [showPayment, setShowPayment] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = bottleCount * SERVICE_FEE_PER_BOTTLE;

  const livePending = pendingOrder
    ? allOrders.find((o) => o.id === pendingOrder.id)
    : null;

  useEffect(() => {
    if (!livePending || livePending.paymentStatus !== "paid" || phase !== "idle") {
      return;
    }
    let cancelled = false;
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

  async function handleSubmit() {
    if (phase !== "idle") return;
    setPhase("loading");
    setError(null);

    try {
      const order = await createWaterOrder({
        bottleCount,
        note: note.trim() || undefined,
        totalAmount: total,
      });
      addOrder(order);
      await setOrderPaymentMethod(
        order.code,
        payMethod === "qr" ? "bank_transfer" : "cash"
      ).catch(() => undefined);

      if (payMethod === "qr") {
        setPhase("idle");
        setPendingOrder(order);
        setShowPayment(true);
        return;
      }

      setPhase("success");
      await sleep(1800);
      router.push("/orders");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gửi yêu cầu thất bại.");
      setPhase("idle");
    }
  }

  async function handleManualConfirm() {
    if (confirming || !pendingOrder) return;
    setConfirming(true);
    setError(null);

    try {
      const paid = await confirmPaymentSelf(pendingOrder.code);
      updateOrder(paid.id, { paymentStatus: "paid" });
      setPhase("success");
      await sleep(2200);
      setShowPayment(false);
      setPendingOrder(null);
      router.push("/orders");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xác nhận thanh toán thất bại.");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col">
      <ScreenHeader title="Đổi nước 20L" subtitle="Giao tận phòng · phí dịch vụ 20.000₫/bình" />

      <div className="flex-1 space-y-4 px-4 py-5">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
        >
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Số bình cần đổi</p>
              <span className="rounded-full bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-600 dark:text-sky-400">
                Phòng {currentUser.roomNumber}
              </span>
            </div>

            <div className="mt-5 flex items-center justify-center gap-8">
              <motion.button
                whileTap={{ scale: 0.85 }}
                transition={{ type: "spring", stiffness: 500, damping: 22 }}
                onClick={() => setBottleCount((c) => Math.max(1, c - 1))}
                disabled={bottleCount <= 1}
                className="flex size-12 items-center justify-center rounded-2xl border border-border bg-card disabled:opacity-40"
                aria-label="Giảm số bình"
              >
                <Minus className="size-5" />
              </motion.button>

              <div className="relative flex h-16 w-20 items-center justify-center">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={bottleCount}
                    initial={{ opacity: 0, y: 16, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -16, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 420, damping: 26 }}
                    className="text-5xl font-extrabold tabular-nums text-sky-600 dark:text-sky-400"
                  >
                    {bottleCount}
                  </motion.span>
                </AnimatePresence>
              </div>

              <motion.button
                whileTap={{ scale: 0.85 }}
                transition={{ type: "spring", stiffness: 500, damping: 22 }}
                onClick={() => setBottleCount((c) => Math.min(2, c + 1))}
                disabled={bottleCount >= 2}
                className="flex size-12 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-lg shadow-sky-600/30 disabled:opacity-40"
                aria-label="Tăng số bình"
              >
                <Plus className="size-5" />
              </motion.button>
            </div>

            <div className="mt-5 flex justify-center gap-1.5">
              {[1, 2].map((n) => (
                <motion.span
                  key={n}
                  animate={{
                    width: n === bottleCount ? 22 : 6,
                    backgroundColor: n <= bottleCount ? "#0284c7" : "var(--muted)",
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  className="h-1.5 rounded-full"
                />
              ))}
            </div>

            <p className="mt-3 text-center text-xs text-muted-foreground">
              Tối đa 2 bình mỗi lần · 1 yêu cầu mỗi ngày
            </p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28, delay: 0.04 }}
        >
          <Card className="p-5">
            <p className="text-sm font-semibold">Hình thức thanh toán</p>
            <div className="mt-3 grid grid-cols-2 gap-1.5 rounded-2xl bg-muted/60 p-1">
              {(
                [
                  { value: "cash", label: "Tiền mặt", icon: Banknote },
                  { value: "qr", label: "Chuyển khoản QR", icon: QrCode },
                ] as const
              ).map((m) => {
                const active = payMethod === m.value;
                return (
                  <button
                    key={m.value}
                    onClick={() => setPayMethod(m.value)}
                    className="relative min-h-10 rounded-xl text-xs font-semibold"
                  >
                    {active && (
                      <motion.span
                        layoutId="water-pay-method"
                        transition={{ type: "spring", stiffness: 420, damping: 32 }}
                        className="absolute inset-0 rounded-xl bg-background shadow-sm"
                      />
                    )}
                    <span
                      className={cn(
                        "relative flex items-center justify-center gap-1.5 transition-colors",
                        active ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      <m.icon className="size-4" />
                      {m.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2.5 text-xs text-muted-foreground">
              {payMethod === "cash"
                ? "Trả tiền mặt cho người giao nước tại phòng."
                : cassoEnabled
                  ? "Quét QR chuyển khoản — hệ thống tự xác nhận khi tiền về."
                  : "Quét QR chuyển khoản rồi bấm xác nhận."}
            </p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28, delay: 0.08 }}
        >
          <Card className="p-5">
            <p className="text-sm font-semibold">Ghi chú cho ban quản lý</p>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Để trước cửa phòng, gọi trước khi lên..."
              className="mt-3 resize-none"
              maxLength={200}
            />
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28, delay: 0.12 }}
        >
          <Card className="flex items-center justify-between p-5">
            <div>
              <p className="text-xs text-muted-foreground">Phí dịch vụ tạm tính</p>
              <motion.p
                key={total}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-0.5 text-xl font-extrabold tabular-nums"
              >
                {formatVND(total)}
              </motion.p>
            </div>
            <p className="text-right text-xs text-muted-foreground">
              {payMethod === "cash" ? (
                <>
                  Thanh toán khi
                  <br />
                  nhận nước
                </>
              ) : (
                <>
                  Chuyển khoản
                  <br />
                  sau khi gửi
                </>
              )}
            </p>
          </Card>
        </motion.div>
      </div>

      <AnimatePresence>
        {error && !showPayment && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-4 mb-2 text-center text-xs font-medium text-red-500"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="sticky bottom-0 border-t border-border/60 bg-background/80 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-xl">
        <TapButton
          onClick={handleSubmit}
          disabled={phase !== "idle" || showPayment}
          className={phase === "success" ? "w-full bg-emerald-600 shadow-emerald-600/30" : "w-full"}
        >
          <AnimatePresence mode="wait" initial={false}>
            {phase === "idle" && (
              <motion.span
                key="idle"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-center gap-2"
              >
                Gửi yêu cầu · {formatVND(total)}
              </motion.span>
            )}
            {phase === "loading" && (
              <motion.span
                key="loading"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
              >
                <Loader2 className="size-5 animate-spin" />
              </motion.span>
            )}
            {phase === "success" && (
              <motion.span
                key="success"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                className="flex items-center gap-2"
              >
                <Check className="size-5" /> Đã gửi
              </motion.span>
            )}
          </AnimatePresence>
        </TapButton>
      </div>

      <AnimatePresence>
        {showPayment && pendingOrder && (
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
                <QrCode className="size-5 text-sky-600" />
                <h2 className="text-lg font-bold">Thanh toán chuyển khoản</h2>
              </div>

              <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-muted/30 p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={buildVietQRUrl(pendingOrder.code, pendingOrder.totalAmount)}
                  alt="VietQR"
                  className="size-48 rounded-xl bg-white p-2"
                />
                <div className="w-full space-y-1 text-center text-sm">
                  <p className="font-medium">{BANK_INFO.bankName}</p>
                  <p className="tabular-nums">{BANK_INFO.accountNumber}</p>
                  <p className="text-muted-foreground">{BANK_INFO.accountName}</p>
                  <p className="mt-2 font-semibold text-sky-600 dark:text-sky-400">
                    {formatVND(pendingOrder.totalAmount)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Nội dung: {buildTransferContent(currentUser.roomNumber, pendingOrder.code)}
                  </p>
                  <p className="font-mono text-sm font-bold tracking-widest">
                    {pendingOrder.code}
                  </p>
                </div>
                {cassoEnabled && phase === "idle" && (
                  <div className="flex items-center gap-2 text-xs text-sky-600 dark:text-sky-400">
                    <Loader2 className="size-3.5 animate-spin" />
                    Đang chờ tiền về — tự động xác nhận trong ít phút...
                  </div>
                )}
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 text-center text-xs font-medium text-red-500"
                >
                  {error}
                </motion.p>
              )}

              {cassoEnabled ? (
                <div className="mt-4">
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
                </div>
              ) : (
                <div className="mt-4">
                  <TapButton
                    onClick={handleManualConfirm}
                    disabled={confirming || phase !== "idle"}
                    className="w-full bg-sky-600 shadow-sky-600/30"
                  >
                    {confirming ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      "Tôi đã chuyển khoản"
                    )}
                  </TapButton>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <SuccessOverlay
        open={phase === "success"}
        title={payMethod === "qr" ? "Thanh toán thành công!" : "Gửi yêu cầu thành công!"}
        message={
          payMethod === "qr"
            ? `Đơn ${pendingOrder?.code ?? ""} đã được xác nhận. Ban quản lý sẽ giao nước tới phòng bạn.`
            : "Ban quản lý sẽ nhận việc trong ít phút."
        }
      />
    </div>
  );
}
