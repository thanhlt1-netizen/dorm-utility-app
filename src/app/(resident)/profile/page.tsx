"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronRight,
  KeyRound,
  Loader2,
  LogOut,
  Moon,
  Smartphone,
  Sun,
} from "lucide-react";
import { TapButton } from "@/components/animated/tap-button";
import { ScreenHeader } from "@/components/shared/screen-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/hooks/use-theme";
import { getSupabase } from "@/lib/supabase/client";
import { signOutSupabase } from "@/lib/supabase/auth";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_LABEL } from "@/types";

export default function ProfilePage() {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.currentUser);
  const signOut = useAuthStore((s) => s.signOut);
  const { theme, toggle } = useTheme();
  const [busy, setBusy] = useState(false);

  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  async function handleSignOut() {
    setBusy(true);
    await signOutSupabase();
    signOut();
    router.replace("/login");
  }

  async function handleChangePassword() {
    if (pwBusy) return;
    setPwError(null);
    setPwSuccess(false);

    if (pw.length < 6) {
      setPwError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }
    if (pw !== pw2) {
      setPwError("Mật khẩu nhập lại không khớp.");
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setPwError("Chưa kết nối Supabase.");
      return;
    }

    setPwBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      setPwSuccess(true);
      setPw("");
      setPw2("");
      setTimeout(() => {
        setPwSuccess(false);
        setPwOpen(false);
      }, 1800);
    } catch (e) {
      setPwError(e instanceof Error ? e.message : "Đổi mật khẩu thất bại.");
    } finally {
      setPwBusy(false);
    }
  }

  const roleLine = [
    ...(currentUser.roomNumber ? [`Phòng ${currentUser.roomNumber}`] : []),
    ROLE_LABEL[currentUser.role],
  ].join(" · ");

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col">
      <ScreenHeader title="Cá nhân" showBack={false} />

      <div className="space-y-3 px-4 py-5">
        <Card className="flex items-center gap-4 p-5">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-sky-600 text-xl font-bold text-white">
            {currentUser.fullName.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="font-bold">{currentUser.fullName}</p>
            <p className="text-sm text-muted-foreground">{roleLine}</p>
            <p className="truncate text-xs text-muted-foreground">
              {currentUser.phone || currentUser.roomNumber}
            </p>
          </div>
        </Card>

        <Card className="divide-y divide-border/60">
          <button
            onClick={() => {
              setPwOpen((v) => !v);
              setPwError(null);
              setPwSuccess(false);
            }}
            className="flex w-full items-center justify-between px-5 py-4"
          >
            <span className="flex items-center gap-3 text-sm font-medium">
              <KeyRound className="size-4.5" />
              Đổi mật khẩu
            </span>
            <ChevronRight
              className={`size-4 text-muted-foreground transition-transform ${pwOpen ? "rotate-90" : ""}`}
            />
          </button>
          <AnimatePresence initial={false}>
            {pwOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 34 }}
                className="overflow-hidden"
              >
                <div className="space-y-2.5 px-5 py-4">
                  <Input
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                    type="password"
                    autoComplete="new-password"
                  />
                  <Input
                    value={pw2}
                    onChange={(e) => setPw2(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    type="password"
                    autoComplete="new-password"
                  />
                  {pwError && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs font-medium text-red-500"
                    >
                      {pwError}
                    </motion.p>
                  )}
                  {pwSuccess && (
                    <motion.p
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400"
                    >
                      <Check className="size-3.5" /> Đã đổi mật khẩu thành công.
                    </motion.p>
                  )}
                  <TapButton
                    onClick={handleChangePassword}
                    disabled={pwBusy || pwSuccess}
                    className="w-full text-sm"
                  >
                    {pwBusy ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : pwSuccess ? (
                      <span className="flex items-center gap-1.5">
                        <Check className="size-4" /> Thành công
                      </span>
                    ) : (
                      "Cập nhật mật khẩu"
                    )}
                  </TapButton>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        <Card className="divide-y divide-border/60">
          <button
            onClick={toggle}
            className="flex w-full items-center justify-between px-5 py-4"
          >
            <span className="flex items-center gap-3 text-sm font-medium">
              {theme === "dark" ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
              Chế độ tối
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              {theme === "dark" ? "Bật" : "Tắt"} <ChevronRight className="size-4" />
            </span>
          </button>
          <div className="flex items-center justify-between px-5 py-4">
            <span className="flex items-center gap-3 text-sm font-medium">
              <Smartphone className="size-4.5" />
              Cài đặt vào màn hình chính
            </span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </div>
        </Card>

        <TapButton
          onClick={handleSignOut}
          disabled={busy}
          variant="secondary"
          className="w-full text-sm"
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <span className="flex items-center gap-2">
              <LogOut className="size-4" /> Đăng xuất
            </span>
          )}
        </TapButton>

        <p className="pt-2 text-center text-xs text-muted-foreground">
          Dorm Utility · phiên bản 1.0.0 · Supabase
        </p>
      </div>
    </div>
  );
}
