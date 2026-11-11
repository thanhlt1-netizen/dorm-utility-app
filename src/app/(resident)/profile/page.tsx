"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronRight,
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
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { signInWithPassword, signOutSupabase } from "@/lib/supabase/auth";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_LABEL, type User } from "@/types";

export default function ProfilePage() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const authMode = useAuthStore((s) => s.authMode);
  const email = useAuthStore((s) => s.email);
  const setUser = useAuthStore((s) => s.setUser);
  const resetToMock = useAuthStore((s) => s.resetToMock);
  const { theme, toggle } = useTheme();

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col">
      <ScreenHeader title="Cá nhân" showBack={false} />

      <div className="space-y-3 px-4 py-5">
        <Card className="flex items-center gap-4 p-5">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-sky-600 text-xl font-bold text-white">
            {currentUser.fullName.charAt(0)}
          </div>
          <div>
            <p className="font-bold">{currentUser.fullName}</p>
            <p className="text-sm text-muted-foreground">
              Phòng {currentUser.roomNumber} · {ROLE_LABEL[currentUser.role]}
            </p>
            {currentUser.studentId && (
              <p className="text-xs text-muted-foreground tabular-nums">
                MSSV {currentUser.studentId}
              </p>
            )}
          </div>
        </Card>

        {isSupabaseConfigured && (
          <SupabaseAuthCard
            authMode={authMode}
            email={email}
            setUser={setUser}
            resetToMock={resetToMock}
          />
        )}

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

        <p className="pt-2 text-center text-xs text-muted-foreground">
          Dorm Utility · phiên bản 0.1.0
        </p>
      </div>
    </div>
  );
}

function SupabaseAuthCard({
  authMode,
  email,
  setUser,
  resetToMock,
}: {
  authMode: "mock" | "supabase";
  email: string | null;
  setUser: (user: User, mode: "mock" | "supabase", email: string | null) => void;
  resetToMock: () => void;
}) {
  const [emailInput, setEmailInput] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    if (busy || !emailInput.trim() || !password) return;
    setBusy(true);
    setError(null);
    try {
      const user = await signInWithPassword(emailInput.trim(), password);
      setUser(user, "supabase", emailInput.trim());
      setPassword("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Đăng nhập thất bại");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    setBusy(true);
    try {
      await signOutSupabase();
      resetToMock();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold">Tài khoản Supabase</p>
        <span
          className={
            "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide " +
            (authMode === "supabase"
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              : "bg-muted text-muted-foreground")
          }
        >
          {authMode === "supabase" ? "Đã kết nối" : "Chế độ demo"}
        </span>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {authMode === "supabase" ? (
          <motion.div
            key="signed-in"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            <p className="mt-2 truncate text-sm text-muted-foreground">{email}</p>
            <TapButton
              onClick={handleSignOut}
              disabled={busy}
              variant="secondary"
              className="mt-3 w-full text-sm"
            >
              <span className="flex items-center gap-2">
                <LogOut className="size-4" /> Đăng xuất
              </span>
            </TapButton>
          </motion.div>
        ) : (
          <motion.div
            key="signed-out"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mt-3 space-y-2.5"
          >
            <Input
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Email"
              type="email"
              autoComplete="email"
            />
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mật khẩu"
              type="password"
              autoComplete="current-password"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <TapButton
              onClick={handleSignIn}
              disabled={busy || !emailInput.trim() || !password}
              className="w-full text-sm"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : "Đăng nhập"}
            </TapButton>
            <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
              Khi chưa đăng nhập, app chạy với dữ liệu mẫu 4 vai trò.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
