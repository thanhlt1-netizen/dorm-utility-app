import { getSupabase } from "@/lib/supabase/client";
import type { DailyMenu } from "@/types";

interface MenuRow {
  id: string;
  date: string;
  dish_name: string;
  description: string;
  price: number;
  image_url: string;
  max_quantity: number;
  remaining: number;
  is_active: boolean;
  nutrition_tags: string[] | null;
}

function requireSupabase() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase ch\u01b0a \u0111\u01b0\u1ee3c c\u1ea5u h\u00ecnh");
  return supabase;
}

function mapMenuRow(row: MenuRow): DailyMenu {
  return {
    id: row.id,
    date: row.date,
    dishName: row.dish_name,
    description: row.description,
    price: row.price,
    imageUrl: row.image_url,
    maxQuantity: row.max_quantity,
    remaining: row.remaining,
    isActive: row.is_active,
    nutritionTags: row.nutrition_tags ?? [],
  };
}

export async function fetchMenus(): Promise<DailyMenu[]> {
  const supabase = requireSupabase();
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("daily_menus")
    .select("*")
    .gte("date", today)
    .order("date", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as MenuRow[]).map(mapMenuRow);
}

export async function createMenu(input: {
  date: string;
  dishName: string;
  description: string;
  price: number;
  maxQuantity: number;
}): Promise<DailyMenu> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("daily_menus")
    .insert({
      date: input.date,
      dish_name: input.dishName,
      description: input.description,
      price: input.price,
      max_quantity: input.maxQuantity,
      remaining: input.maxQuantity,
      is_active: true,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapMenuRow(data as MenuRow);
}

export async function updateMenuFields(
  id: string,
  patch: { remaining?: number; isActive?: boolean }
): Promise<void> {
  const supabase = requireSupabase();
  const payload: Record<string, unknown> = {};
  if (patch.remaining !== undefined) payload.remaining = patch.remaining;
  if (patch.isActive !== undefined) payload.is_active = patch.isActive;

  const { error } = await supabase
    .from("daily_menus")
    .update(payload)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteMenu(id: string): Promise<void> {
  const supabase = requireSupabase();
  const { error } = await supabase.from("daily_menus").delete().eq("id", id);
  if (error) throw error;
}
