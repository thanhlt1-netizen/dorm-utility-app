"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChefHat,
  Database,
  Droplets,
  GraduationCap,
  HardHat,
  Loader2,
  MailCheck,
  ShieldCheck,
} from "lucide-react";
import { TapButton } from "@/components/animated/tap-button";
import { Input } from "@/components/ui/input";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { signInWithPassword, signUpWithProfile } from "@/lib/supabase/auth";
import { cn, roleHome } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_LABEL, type Role, type User } from "@/types";

const ROLE_TABS: { value: Role; icon: React.ElementType }[] = [
  { value: "resident", icon: GraduationCap },
  { value: "staff", icon: HardHat },
  { value: "vendor", icon: ChefHat },
  { value: "admin", icon: ShieldCheck },
];

export default function LoginPage() {
  const router = useRouter();
  const hydrated = useAuthStore((s) => s.hydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const currentUser = useAuthStore((s) => s.currentUser);
  const setSession = useAuthStore((s) => s.setSession);

  const [role, setRole] = useState<Role>("resident");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [studentId, setStudentId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [successUser, setSuccessUser] = useState<User | null>(null);

  useEffect(() => {
    if (hydrated && isAuthenticated) {
      router.replace(roleHome(currentUser.role));
    }
  }, [hydrated, isAuthenticated, currentUser.role, router]);

  function fail(message: string) {
    setError(message);
    setShakeKey((k) => k + 1);
  }

  function resetFormState() {
    setError(null);
    setNotice(null);
  }

  function finish(user: User) {
    setSession(user);
    setSuccessUser(user);
    setTimeout(() => router.replace(roleHome(user.role)), 900);
  }

  async function handleSubmit() {
    if (busy) return;
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      fail("Nhập đầy đủ email và mật khẩu.");
      return;
    }

    setBusy(true);
    resetFormState();

    try {
      if (role === "resident" && mode === "signup") {
        if (!fullName.trim() || !roomNumber.trim()) {
          fail("Nhập đầy đủ họ tên và số phòng.");
          return;
        }
        const result = await signUpWithProfile(trimmedEmail, password, {
          fullName: fullName.trim(),
          phone: phone.trim(),
          roomNumber: roomNumber.trim(),
          studentId: studentId.trim(),
        });
        if (result.needsEmailConfirmation) {
          setPendingEmail(trimmedEmail);
          setNotice(
            `Tạo tài khoản thành công! Kiểm tra hộp thư ${trimmedEmail} và bấm đường dẫn xác nhận, sau đó đăng nhập lại.`
          );
        } else if (result.user) {
          finish(result.user);
        }
        return;
      }

      const user = await signInWithPassword(trimmedEmail, password);
      finish(user);
    } catch (e) {
      fail(e instanceof Error ? e.message : "Đăng nhập thất bại.");
    } finally {
      setBusy(false);
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-dvh flex-col justify-center px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="mb-6 flex flex-col items-center text-center"
        >
          <div className="flex size-16 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-500 to-sky-700 shadow-lg shadow-sky-600/30">
            <Database className="size-8 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight">
            Chưa kết nối Supabase
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            App chạy chế độ production, cần Supabase để hoạt động.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28, delay: 0.06 }}
          className="space-y-2.5 rounded-3xl border border-border/60 bg-card p-5 text-sm"
        >
          {[
            "Tạo project trên supabase.com (Free tier).",
            "Mở SQL Editor, dán và chạy toàn bộ supabase/schema.sql.",
            "Authentication → Providers → bật Email, tắt Confirm email nếu muốn đăng ký vào dùng ngay.",
            "Tạo tài khoản staff/vendor/admin trong Authentication → Users, rồi UPDATE bảng users SET role = 'staff' | 'vendor' | 'admin'.",
            "Thêm 2 biến môi trường NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY vào Vercel → redeploy.",
          ].map((step, idx) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + idx * 0.06 }}
              className="flex gap-3"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sky-500/10 text-xs font-bold text-sky-600 dark:text-sky-400">
                {idx + 1}
              </span>
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                {step}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    );
  }

  if (!hydrated || isAuthenticated || successUser) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3">
        {successUser ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className="flex size-16 items-center justify-center rounded-full bg-sky-600 text-white shadow-lg shadow-sky-600/30"
          >
            <Check className="size-8" />
          </motion.div>
        ) : (
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        )}
        <p className="text-sm text-muted-foreground">
          {successUser ? `Xin chào, ${successUser.fullName}!` : "Đang tải..."}
        </p>
      </div>
    );
  }

  const isResident = role === "resident";

  return (
    <div className="flex min-h-dvh flex-col justify-center px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="mb-7 flex flex-col items-center text-center"
      >
        <div className="flex size-16 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-500 to-sky-700 shadow-lg shadow-sky-600/30">
          <Droplets className="size-8 text-white" />
        </div>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight">Dorm Utility</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Đổi nước 20L · Đặt cơm trưa · Ký túc xá
        </p>
      </motion.div>

      <div className="mb-4 grid grid-cols-2 gap-1.5">
        {ROLE_TABS.map(({ value, icon: Icon }) => {
          const active = role === value;
          return (
            <button
              key={value}
              onClick={() => {
                setRole(value);
                resetFormState();
              }}
              className={cn(
                "relative flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-3 text-xs font-semibold transition-colors",
                active
                  ? "border-transparent text-white"
                  : "border-border/60 bg-card text-muted-foreground"
              )}
            >
              {active && (
                <motion.span
                  layoutId="login-role"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  className={cn(
                    "absolute inset-0 rounded-2xl",
                    value === "vendor"
                      ? "bg-emerald-600 shadow-md shadow-emerald-600/25"
                      : value === "admin"
                        ? "bg-violet-600 shadow-md shadow-violet-600/25"
                        : "bg-sky-600 shadow-md shadow-sky-600/25"
                  )}
                />
              )}
              <span className="relative flex items-center gap-1.5">
                <Icon className="size-4" />
                {ROLE_LABEL[value]}
              </span>
            </button>
          );
        })}
      </div>

      <motion.div
        key={shakeKey}
        animate={error ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
          {isResident && (
            <div className="mb-4 flex gap-1.5 rounded-2xl bg-muted/60 p-1">
              {(
                [
                  { value: "signin", label: "Đăng nhập" },
                  { value: "signup", label: "Đăng kí" },
                ] as const
              ).map((m) => {
                const active = mode === m.value;
                return (
                  <button
                    key={m.value}
                    onClick={() => {
                      setMode(m.value);
                      resetFormState();
                    }}
                    className="relative min-h-9 flex-1 rounded-xl text-xs font-semibold"
                  >
                    {active && (
                      <motion.span
                        layoutId="auth-mode"
                        transition={{ type: "spring", stiffness: 420, damping: 32 }}
                        className="absolute inset-0 rounded-xl bg-background shadow-sm"
                      />
                    )}
                    <span
                      className={cn(
                        "relative transition-colors",
                        active ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {m.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${role}-${mode}`}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.18 }}
              className="space-y-2.5"
            >
              {isResident && mode === "signup" && (
                <>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Họ và tên"
                    autoComplete="name"
                  />
                  <div className="flex gap-2.5">
                    <Input
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value.toUpperCase())}
                      placeholder="Số phòng (VD: B304)"
                      className="w-36"
                    />
                    <Input
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="MSSV"
                      inputMode="numeric"
                      className="flex-1"
                    />
                  </div>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Số điện thoại"
                    inputMode="tel"
                    autoComplete="tel"
                  />
                </>
              )}

              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                type="email"
                autoComplete="email"
              />
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu"
                type="password"
                autoComplete={isResident && mode === "signup" ? "new-password" : "current-password"}
              />
            </motion.div>
          </AnimatePresence>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2.5 text-xs font-medium text-red-500"
            >
              {error}
            </motion.p>
          )}

          {notice && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 flex items-start gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3"
            >
              <MailCheck className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  {pendingEmail ? "Kiểm tra email của bạn" : notice}
                </p>
                {pendingEmail && (
                  <p className="mt-1 text-xs leading-relaxed text-emerald-700/80 dark:text-emerald-300/80">
                    {notice} Sau khi xác nhận, bấm tab “Đăng nhập” để vào app.
                  </p>
                )}
              </div>
            </motion.div>
          )}

          <TapButton
            onClick={handleSubmit}
            disabled={busy}
            className={cn(
              "mt-4 w-full",
              role === "vendor" ? "bg-emerald-600 shadow-emerald-600/25" : "bg-sky-600 shadow-sky-600/25"
            )}
          >
            {busy ? (
              <Loader2 className="size-5 animate-spin" />
            ) : isResident && mode === "signup" ? (
              "Tạo tài khoản"
            ) : (
              "Đăng nhập"
            )}
          </TapButton>
        </div>
      </motion.div>

      <p className="mt-5 text-center text-[11px] leading-relaxed text-muted-foreground">
        {isResident
          ? "Sinh viên tự đăng kí tài khoản và đăng nhập."
          : `Tài khoản ${ROLE_LABEL[role].toLowerCase()} do admin cấp sẵn.`}
      </p>
    </div>
  );
}
