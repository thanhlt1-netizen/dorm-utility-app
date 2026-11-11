"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChefHat,
  Droplets,
  GraduationCap,
  HardHat,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { TapButton } from "@/components/animated/tap-button";
import { Input } from "@/components/ui/input";
import { DEMO_ACCOUNTS, DEMO_PASSWORD, findMockAccount } from "@/lib/demo-accounts";
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
  const signInSession = useAuthStore((s) => s.signInSession);
  const addMockAccount = useAuthStore((s) => s.addMockAccount);
  const mockAccounts = useAuthStore((s) => s.mockAccounts);

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

  function finish(user: User, authMode: "mock" | "supabase", userEmail: string) {
    signInSession(user, authMode, userEmail);
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
    setError(null);

    try {
      if (isSupabaseConfigured) {
        await supabaseFlow(trimmedEmail);
      } else {
        mockFlow(trimmedEmail);
      }
    } catch (e) {
      fail(e instanceof Error ? e.message : "Đăng nhập thất bại.");
    } finally {
      setBusy(false);
    }
  }

  async function supabaseFlow(trimmedEmail: string) {
    if (role === "resident" && mode === "signup") {
      if (!fullName.trim() || !roomNumber.trim()) {
        fail("Nhập đầy đủ họ tên và số phòng.");
        return;
      }
      await signUpWithProfile(trimmedEmail, password, {
        fullName: fullName.trim(),
        phone: phone.trim(),
        roomNumber: roomNumber.trim(),
        studentId: studentId.trim(),
      });
      try {
        const user = await signInWithPassword(trimmedEmail, password);
        finish(user, "supabase", trimmedEmail);
      } catch {
        setError("Tạo tài khoản thành công. Hãy xác nhận email rồi đăng nhập.");
      }
      return;
    }

    const user = await signInWithPassword(trimmedEmail, password);
    finish(user, "supabase", trimmedEmail);
  }

  function mockFlow(trimmedEmail: string) {
    if (role === "resident" && mode === "signup") {
      if (!fullName.trim() || !roomNumber.trim()) {
        fail("Nhập đầy đủ họ tên và số phòng.");
        return;
      }
      if (mockAccounts.some((a) => a.email === trimmedEmail)) {
        fail("Email này đã được đăng ký. Hãy đăng nhập.");
        return;
      }
      const user: User = {
        id: `u-${Date.now()}`,
        fullName: fullName.trim(),
        phone: phone.trim(),
        roomNumber: roomNumber.trim(),
        role: "resident",
        studentId: studentId.trim(),
      };
      addMockAccount({ email: trimmedEmail, password, user });
      finish(user, "mock", trimmedEmail);
      return;
    }

    const demo = findMockAccount(trimmedEmail, password);
    const registered = mockAccounts.find(
      (a) => a.email === trimmedEmail && a.password === password
    );
    const user = demo?.user ?? registered?.user;

    if (!user) {
      fail("Email hoặc mật khẩu không đúng.");
      return;
    }
    if (user.role !== role) {
      fail(`Tài khoản này không phải ${ROLE_LABEL[role]}.`);
      return;
    }
    finish(user, "mock", trimmedEmail);
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

  const demoForRole = DEMO_ACCOUNTS.find((a) => a.user.role === role);
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
                setError(null);
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
                    value === "resident" && "bg-sky-600 shadow-md shadow-sky-600/25",
                    value === "staff" && "bg-sky-600 shadow-md shadow-sky-600/25",
                    value === "vendor" && "bg-emerald-600 shadow-md shadow-emerald-600/25",
                    value === "admin" && "bg-violet-600 shadow-md shadow-violet-600/25"
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
                  { value: "signup", label: "Đăng ký" },
                ] as const
              ).map((m) => {
                const active = mode === m.value;
                return (
                  <button
                    key={m.value}
                    onClick={() => {
                      setMode(m.value);
                      setError(null);
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

          {!isSupabaseConfigured && (
            <div className="mt-4 rounded-2xl bg-muted/50 px-3.5 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
              <p className="font-semibold text-foreground">Tài khoản dùng thử</p>
              <p className="mt-0.5 tabular-nums">
                {demoForRole?.email} · {DEMO_PASSWORD}
              </p>
              {!isResident && (
                <p className="mt-1">
                  Tài khoản {ROLE_LABEL[role].toLowerCase()} do ban quản lý cấp sẵn.
                </p>
              )}
            </div>
          )}
        </div>
      </motion.div>

      <p className="mt-5 text-center text-[11px] leading-relaxed text-muted-foreground">
        {isSupabaseConfigured
          ? "Sinh viên tự đăng ký. Tài khoản Ban quản lý / Nhà bếp / Quản lý do admin cấp."
          : "Chưa kết nối Supabase — đang chạy chế độ demo với dữ liệu mẫu."}
      </p>
    </div>
  );
}
