import { getSupabase } from "@/lib/supabase/client";

export async function createPayosCheckout(code: string): Promise<string> {
  const supabase = getSupabase();
  const token = (await supabase!.auth.getSession()).data.session?.access_token;
  if (!token) {
    throw new Error("Phiên đăng nhập hết hạn, hãy đăng nhập lại.");
  }

  const res = await fetch("/api/payment/payos/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ code }),
  });

  const json = (await res.json().catch(() => null)) as
    | { checkoutUrl?: string; error?: string }
    | null;

  if (!res.ok || !json?.checkoutUrl) {
    throw new Error(json?.error ?? "Không tạo được lệnh thanh toán PayOS.");
  }

  return json.checkoutUrl;
}
