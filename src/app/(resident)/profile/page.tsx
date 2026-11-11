"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronRight, Loader2, LogOut, Moon, Smartphone, Sun } from "lucide-react";
import { TapButton } from "@/components/animated/tap-button";
import { ScreenHeader } from "@/components/shared/screen-header";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/hooks/use-theme";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_LABEL } from "@/types";

export default function ProfilePage() {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.currentUser);
  const authMode = useAuthStore((s) => s.authMode);
  const email = useAuthStore((s) => s.email);
  const signOut = useAuthStore((s) => s.signOut);
  const { theme, toggle } = useTheme();
  const [busy, setBusy] = useState(false);

  function handleSignOut() {
    setBusy(true);
    signOut();
    router.replace("/login");
  }

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
            <p className="text-sm text-muted-foreground">
              Phòng {currentUser.roomNumber} · {ROLE_LABEL[currentUser.role]}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {email ?? currentUser.phone}
            </p>
          </div>
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
          Dorm Utility · phiên bản 0.2.0 ·{" "}
          {authMode === "supabase" ? "Supabase" : "Demo"}
        </p>
      </div>
    </div>
  );
}
