"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMenus } from "@/lib/menus";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useMenusStore } from "@/stores/menus-store";

export function useMenus() {
  const setMenus = useMenusStore((s) => s.setMenus);

  return useQuery({
    queryKey: ["menus"],
    queryFn: async () => {
      const data = await fetchMenus();
      setMenus(data);
      return data;
    },
    enabled: isSupabaseConfigured,
    staleTime: 30_000,
  });
}
