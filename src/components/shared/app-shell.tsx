import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-background",
        "sm:border-x sm:border-border/60"
      )}
    >
      {children}
    </div>
  );
}
