"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Clock,
  Droplets,
  Loader2,
  MapPin,
  Package,
  QrCode,
  StickyNote,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { StatusBadge } from "@/components/animated/status-badge";
import { SuccessOverlay } from "@/components/animated/success-overlay";
import { TapButton } from "@/components/animated/tap-button";
import { OrderTimeline } from "@/components/shared/order-timeline";
import { EmptyState } from "@/components/shared/empty-state";
import { ScreenHeader } from "@/components/shared/screen-header";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BANK_INFO,
  buildTransferContent,
  buildVietQRUrl,
} from "@/lib/payment";
import { confirmPaymentSelf } from "@/lib/orders";
import { cn, formatDayLabel, formatTime, formatVND, sleep } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useOrdersStore } from "@/stores/orders-store";

const cassoEnabled = process.env.NEXT_PUBLIC_CASSO_ENABLED === "true";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const currentUser = useAuthStore((s) => s.currentUser);
  const { orders, hydrated } = useOrdersStore();
  const updateOrder = useOrdersStore((s) => s.updateOrder);

  const [showPay, setShowPay] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [phase, setPhase] = useState<"idle" | "success">("idle");
  const [error, setError] = useState<string | null>(null);

  const order = orders.find((o) => o.id === params.id);
  const unpaid = !!order && order.paymentStatus === "unpaid";

  useEffect(() => {
    if (!showPay || !order || order.paymentStatus !== "paid") return;
    setPhase("success");
    const timer = setTimeout(() => {
      setShowPay(false);
      setPhase("idle");
    }, 2400);
    return () => clearTimeout(timer);
  }, [showPay, order]);

  async function handleConfirmPay() {
    if (confirming || !order) return;
    setConfirming(true);
    setError(null);

    try {
      const paid = await confirmPaymentSelf(order.code);
      updateOrder(paid.id, { paymentStatus: "paid", status: paid.status });
      setPhase("success");
      await sleep(2200);
      setShowPay(false);
      setPhase("idle");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xác nhận thanh toán thất bại.");
    } finally {
      setConfirming(false);
    }
  }

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
                {order.paymentStatus === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}
              </span>
              <span className="text-lg font-extrabold tabular-nums">
                {formatVND(order.totalAmount)}
              </span>
            </div>
          </Card>
        </motion.div>

        {unpaid && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28, delay: 0.04 }}
          >
            <Card className="border-amber-500/30 bg-amber-500/5 p-4">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <Wallet className="size-4" />
                <p className="text-sm font-semibold">Đơn chưa được thanh toán</p>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {cassoEnabled
                  ? "Chuyển khoản theo QR bên dưới — hệ thống tự xác nhận khi tiền về."
                  : "Chuyển khoản theo QR rồi bấm xác nhận để ghi nhận thanh toán."}
              </p>
              <TapButton
                onClick={() => {
                  setError(null);
                  setShowPay(true);
                }}
                className="mt-3 w-full bg-amber-600 shadow-amber-600/30"
              >
                <span className="flex items-center gap-2">
                  <QrCode className="size-4" /> Thanh toán qua QR
                </span>
              </TapButton>
            </Card>
          </motion.div>
        )}

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

      <AnimatePresence>
        {showPay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
            onClick={() => phase === "idle" && setShowPay(false)}
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
                  src={buildVietQRUrl(order.code, order.totalAmount)}
                  alt="VietQR"
                  className="size-48 rounded-xl bg-white p-2"
                />
                <div className="w-full space-y-1 text-center text-sm">
                  <p className="font-medium">{BANK_INFO.bankName}</p>
                  <p className="tabular-nums">{BANK_INFO.accountNumber}</p>
                  <p className="text-muted-foreground">{BANK_INFO.accountName}</p>
                  <p className="mt-2 font-semibold text-sky-600 dark:text-sky-400">
                    {formatVND(order.totalAmount)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Nội dung: {buildTransferContent(currentUser.roomNumber, order.code)}
                  </p>
                  <p className="font-mono text-sm font-bold tracking-widest">
                    {order.code}
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
                      setShowPay(false);
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
                    onClick={handleConfirmPay}
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
        title="Thanh toán thành công!"
        message={`Đơn ${order.code} đã được xác nhận.`}
      />
    </div>
  );
}
