"use client";

import { useEffect } from "react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchProfile, initAuth } from "@/lib/supabase/auth";
import { useAuthStore } from "@/stores/auth-store";

export function useAuthSession() {
  const markHydrated = useAuthStore((s) => s.markHydrated);
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      markHydrated();
      return;
    }

    let cancelled = false;

    initAuth()
      .then((user) => {
        if (!cancelled) setSession(user);
      })
      .catch(() => {
        if (!cancelled) setSession(null);
      })
      .finally(() => {
        if (!cancelled) markHydrated();
      });

    const supabase = getSupabase();
    if (!supabase) return;

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setSession(null);
        return;
      }
      if (session?.user) {
        fetchProfile(session.user.id)
          .then((user) => {
            if (!cancelled) setSession(user);
          })
          .catch(() => {});
      }
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, [markHydrated, setSession]);
}
