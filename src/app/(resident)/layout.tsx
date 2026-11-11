import { AppShell } from "@/components/shared/app-shell";
import { BottomNav } from "@/components/shared/bottom-nav";
import { RoleSwitcher } from "@/components/shared/role-switcher";

export default function ResidentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AppShell>
      <RoleSwitcher />
      <main className="flex-1">{children}</main>
      <BottomNav />
    </AppShell>
  );
}
