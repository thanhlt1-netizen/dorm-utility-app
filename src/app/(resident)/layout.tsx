import { AppShell } from "@/components/shared/app-shell";
import { BottomNav } from "@/components/shared/bottom-nav";
import { RequireAuth } from "@/components/shared/require-auth";

export default function ResidentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <RequireAuth>
      <AppShell>
        <main className="flex-1">{children}</main>
        <BottomNav />
      </AppShell>
    </RequireAuth>
  );
}
