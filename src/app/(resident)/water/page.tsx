"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, Minus, Plus } from "lucide-react";
import { SuccessOverlay } from "@/components/animated/success-overlay";
import { TapButton } from "@/components/animated/tap-button";
import { ScreenHeader } from "@/components/shared/screen-header";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { generateOrderCode, formatVND, sleep } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useOrdersStore } from "@/stores/orders-store";
import type { Order } from "@/types";

const SERVICE_FEE_PER_BOTTLE = 20000;

type Phase = "idle" | "loading" | "success";

export default function WaterPage() {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.currentUser);
  const addOrder = useOrdersStore((s) => s.addOrder);
  const [bottleCount, setBottleCount] = useState(1);
  const [note, setNote] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");

  const total = bottleCount * SERVICE_FEE_PER_BOTTLE;

  async function handleSubmit() {
    if (phase !== "idle") return;
    setPhase("loading");

    const now = new Date().toISOString();
    const order: Order = {
      id: `o-${Date.now()}`,
      code: generateOrderCode("water"),
      userId: currentUser.id,
      userName: currentUser.fullName,
      roomNumber: currentUser.roomNumber,
      type: "water",
      status: "pending",
      totalAmount: total,
      paymentStatus: "unpaid",
      note: note.trim() || undefined,
      createdAt: now,
      updatedAt: now,
      waterDetails: { bottleCount },
    };

    addOrder(order);
    await sleep(1400);
    setPhase("success");
    await sleep(1800);
    router.push("/orders");
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
                onClick={() => setBottleCount((c) => Math.min(4, c + 1))}
                disabled={bottleCount >= 4}
                className="flex size-12 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-lg shadow-sky-600/30 disabled:opacity-40"
                aria-label="Tăng số bình"
              >
                <Plus className="size-5" />
              </motion.button>
            </div>

            <div className="mt-5 flex justify-center gap-1.5">
              {[1, 2, 3, 4].map((n) => (
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
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28, delay: 0.06 }}
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
              Thanh toán khi
              <br />
              nhận nước
            </p>
          </Card>
        </motion.div>
      </div>

      <div className="sticky bottom-0 border-t border-border/60 bg-background/80 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-xl">
        <TapButton
          onClick={handleSubmit}
          disabled={phase !== "idle"}
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

      <SuccessOverlay
        open={phase === "success"}
        title="Gửi yêu cầu thành công!"
        message="Ban quản lý sẽ nhận việc trong ít phút."
      />
    </div>
  );
}
