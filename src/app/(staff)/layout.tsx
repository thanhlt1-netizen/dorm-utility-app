import { RequireAuth } from "@/components/shared/require-auth";

export default function StaffLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <RequireAuth>{children}</RequireAuth>;
}
