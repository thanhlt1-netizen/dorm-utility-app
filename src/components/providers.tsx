"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRealtimeOrders } from "@/hooks/use-realtime-orders";
import { ThemeProvider } from "@/hooks/use-theme";
import { useAuthStore } from "@/stores/auth-store";
import { useMenusStore } from "@/stores/menus-store";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void useMenusStore.persist.rehydrate();
    useMenusStore.getState().markHydrated();
    void useAuthStore.persist.rehydrate();
    useAuthStore.getState().markHydrated();
  }, []);

  useRealtimeOrders();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>{children}</ThemeProvider>
    </QueryClientProvider>
  );
}
