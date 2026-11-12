import { getSupabase } from "@/lib/supabase/client";
import type {
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/types";

interface WaterDetailRow {
  bottle_count: number;
  assigned_to: string | null;
  assigned_staff_name: string | null;
  completed_at: string | null;
}

interface FoodDetailRow {
  menu_id: string | null;
  dish_name: string;
  price: number;
  quantity: number;
  pickup_date: string | null;
  pickup_time_slot: string | null;
}

interface OrderRow {
  id: string;
  code: string;
  user_id: string;
  user_name: string;
  type: string;
  status: string;
  room_number: string;
  total_amount: number;
  payment_status: string;
  payment_method: string | null;
  pickup_code: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
  water_order_details?: WaterDetailRow[] | null;
  food_order_details?: FoodDetailRow[] | null;
}

function requireSupabase() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase chưa được cấu hình");
  return supabase;
}

function mapOrderRow(row: OrderRow): Order {
  const water = row.water_order_details?.[0];
  const foodRows = row.food_order_details ?? [];
  return {
    id: row.id,
    code: row.code,
    userId: row.user_id,
    userName: row.user_name,
    roomNumber: row.room_number,
    type: row.type as Order["type"],
    status: row.status as OrderStatus,
    totalAmount: row.total_amount,
    paymentStatus: row.payment_status as PaymentStatus,
    paymentMethod: (row.payment_method as PaymentMethod | null) ?? undefined,
    pickupCode: row.pickup_code ?? undefined,
    note: row.note ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    waterDetails: water
      ? {
          bottleCount: water.bottle_count,
          assignedStaffId: water.assigned_to ?? undefined,
          assignedStaffName: water.assigned_staff_name ?? undefined,
          completedAt: water.completed_at ?? undefined,
        }
      : undefined,
    foodDetails: foodRows.length
      ? {
          dishes: foodRows.map((d) => ({
            dishId: d.menu_id ?? "",
            dishName: d.dish_name,
            price: d.price,
            quantity: d.quantity,
          })),
          pickupDate: foodRows[0]?.pickup_date ?? "",
          pickupTimeSlot: foodRows[0]?.pickup_time_slot ?? "",
        }
      : undefined,
  };
}

export async function fetchOrders(): Promise<Order[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select("*, water_order_details(*), food_order_details(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as OrderRow[]).map(mapOrderRow);
}

export async function createWaterOrder(input: {
  bottleCount: number;
  note?: string;
  totalAmount: number;
}): Promise<Order> {
  const supabase = requireSupabase();
  const { data, error } = await supabase.rpc("create_water_order", {
    p_bottle_count: input.bottleCount,
    p_note: input.note ?? null,
    p_total_amount: input.totalAmount,
  });
  if (error) throw error;

  const order = mapOrderRow(data as OrderRow);
  return {
    ...order,
    waterDetails: {
      bottleCount: input.bottleCount,
    },
  };
}

export async function confirmPaymentSelf(code: string): Promise<Order> {
  const supabase = requireSupabase();
  const { data, error } = await supabase.rpc("confirm_payment_self", {
    p_code: code,
  });
  if (error) throw error;

  return mapOrderRow(data as OrderRow);
}

export async function cancelWaterOrderSelf(code: string): Promise<Order> {
  const supabase = requireSupabase();
  const { data, error } = await supabase.rpc("cancel_water_order_self", {
    p_code: code,
  });
  if (error) throw error;

  return mapOrderRow(data as OrderRow);
}

export async function setOrderPaymentMethod(
  code: string,
  method: PaymentMethod
): Promise<{ code: string; paymentMethod: PaymentMethod }> {
  const supabase = requireSupabase();
  const token = (await supabase.auth.getSession()).data.session?.access_token;
  if (!token) throw new Error("Phiên đăng nhập hết hạn, hãy đăng nhập lại.");

  const res = await fetch("/api/orders/set-method", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ code, method }),
  });
  const json = (await res.json().catch(() => null)) as
    | { ok?: boolean; method?: string; error?: string }
    | null;
  if (!res.ok || !json?.ok) {
    throw new Error(json?.error ?? "Đổi hình thức thanh toán thất bại.");
  }

  return {
    code,
    paymentMethod: (json.method as PaymentMethod | null) ?? method,
  };
}

export async function createFoodOrder(input: {
  items: { menuId: string; dishName: string; price: number; quantity: number }[];
  totalAmount: number;
}): Promise<Order> {
  const supabase = requireSupabase();
  const { data, error } = await supabase.rpc("create_food_order", {
    p_items: input.items,
    p_total_amount: input.totalAmount,
  });
  if (error) throw error;

  const order = mapOrderRow(data as OrderRow);
  return {
    ...order,
    foodDetails: {
      dishes: input.items.map((item) => ({
        dishId: item.menuId,
        dishName: item.dishName,
        price: item.price,
        quantity: item.quantity,
      })),
      pickupDate: "",
      pickupTimeSlot: "11:30 - 12:30",
    },
  };
}

export async function createFoodOrderUnpaid(input: {
  items: { menuId: string; dishName: string; price: number; quantity: number }[];
  totalAmount: number;
}): Promise<Order> {
  const supabase = requireSupabase();
  const { data, error } = await supabase.rpc("create_food_order_unpaid", {
    p_items: input.items,
    p_total_amount: input.totalAmount,
  });
  if (error) throw error;

  const order = mapOrderRow(data as OrderRow);
  return {
    ...order,
    foodDetails: {
      dishes: input.items.map((item) => ({
        dishId: item.menuId,
        dishName: item.dishName,
        price: item.price,
        quantity: item.quantity,
      })),
      pickupDate: "",
      pickupTimeSlot: "11:30 - 12:30",
    },
  };
}

export async function claimWaterOrder(
  orderId: string,
  staff: { id: string; fullName: string }
): Promise<void> {
  const supabase = requireSupabase();
  const { error: orderError } = await supabase
    .from("orders")
    .update({ status: "in_progress" })
    .eq("id", orderId);
  if (orderError) throw orderError;

  const { error: detailError } = await supabase
    .from("water_order_details")
    .upsert({
      order_id: orderId,
      assigned_to: staff.id,
      assigned_staff_name: `${staff.fullName} (Trực ca)`,
    });
  if (detailError) throw detailError;
}

export async function completeWaterOrder(orderId: string): Promise<void> {
  const supabase = requireSupabase();
  const now = new Date().toISOString();
  const { error: orderError } = await supabase
    .from("orders")
    .update({ status: "completed" })
    .eq("id", orderId);
  if (orderError) throw orderError;

  const { error: detailError } = await supabase
    .from("water_order_details")
    .update({ completed_at: now })
    .eq("order_id", orderId);
  if (detailError) throw detailError;
}

export async function markFoodReady(orderId: string): Promise<void> {
  const supabase = requireSupabase();
  const { error } = await supabase
    .from("orders")
    .update({ status: "ready" })
    .eq("id", orderId);
  if (error) throw error;
}

export async function completePickupByCode(code: string): Promise<Order> {
  const supabase = requireSupabase();
  const { data, error } = await supabase.rpc("complete_pickup", {
    p_code: code,
  });
  if (error) throw error;
  return mapOrderRow(data as OrderRow);
}
