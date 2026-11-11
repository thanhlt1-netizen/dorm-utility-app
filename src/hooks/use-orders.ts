"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchOrders } from "@/lib/orders";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useOrdersStore } from "@/stores/orders-store";

export function useOrders() {
  const setOrders = useOrdersStore((s) => s.setOrders);

  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const data = await fetchOrders();
      setOrders(data);
      return data;
    },
    enabled: isSupabaseConfigured,
    staleTime: 15_000,
  });
}
