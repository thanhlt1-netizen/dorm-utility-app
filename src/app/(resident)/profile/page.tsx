"use client";

import { ChevronRight, Moon, Smartphone, Sun } from "lucide-react";
import { ScreenHeader } from "@/components/shared/screen-header";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/hooks/use-theme";
import { useAuthStore } from "@/stores/auth-store";
import { ROLE_LABEL } from "@/types";

export default function ProfilePage() {
  const currentUser = useAuthStore((s) => s.currentUser);
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
