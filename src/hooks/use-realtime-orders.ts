"use client";

import { useEffect } from "react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { useOrdersStore } from "@/stores/orders-store";
import type { OrderStatus, PaymentStatus } from "@/types";

interface OrderRow {
  id: string;
  code: string;
  total_amount: number;
  status: string;
  payment_status: string;
  pickup_code: string | null;
  updated_at: string;
}

export function useRealtimeOrders(enabled = true) {
  const addOrder = useOrdersStore((s) => s.addOrder);
  const updateOrder = useOrdersStore((s) => s.updateOrder);

  useEffect(() => {
    if (!enabled || !isSupabaseConfigured) return;
    const supabase = getSupabase();
    if (!supabase) return;

    const channel = supabase
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          const row = (payload.new ?? payload.old) as OrderRow | null;
          if (!row) return;

          const existing = useOrdersStore
            .getState()
            .orders.find((o) => o.id === row.id);

          if (payload.eventType === "INSERT" && !existing) {
            addOrder({
              id: row.id,
              code: row.code,
              userId: "",
              userName: "",
              roomNumber: "",
              type: "water",
              status: row.status as OrderStatus,
              totalAmount: row.total_amount,
              paymentStatus: row.payment_status as PaymentStatus,
              pickupCode: row.pickup_code ?? undefined,
              createdAt: row.updated_at,
              updatedAt: row.updated_at,
            });
            return;
          }

          if (payload.eventType === "UPDATE" || existing) {
            updateOrder(row.id, {
              status: row.status as OrderStatus,
              paymentStatus: row.payment_status as PaymentStatus,
              pickupCode: row.pickup_code ?? undefined,
              totalAmount: row.total_amount,
              updatedAt: row.updated_at,
            });
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, addOrder, updateOrder]);
}
