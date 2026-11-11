"use client";

import { create } from "zustand";
import type { Order } from "@/types";
import { seedOrders } from "@/lib/mock-data";

interface OrdersState {
  orders: Order[];
  hydrated: boolean;
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrder: (id: string, patch: Partial<Order>) => void;
}

export const useOrdersStore = create<OrdersState>((set) => ({
  orders: seedOrders,
  hydrated: false,
  setOrders: (orders) => set({ orders, hydrated: true }),
  addOrder: (order) => set((s) => ({ orders: [order, ...s.orders] })),
  updateOrder: (id, patch) =>
    set((s) => ({
      orders: s.orders.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    })),
}));
