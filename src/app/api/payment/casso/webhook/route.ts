import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface CassoTransaction {
  id: number | string;
  tid?: string | null;
  amount: number;
  description: string;
  when?: string;
  bank_sub_acc_id?: string;
  subAccId?: string;
}

interface CassoWebhookBody {
  error?: number;
  data?: CassoTransaction[];
  secure_token?: string;
}

interface OrderRow {
  id: string;
  code: string;
  type: string;
  total_amount: number;
  payment_status: string;
}

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function extractOrderCode(description: string): string | null {
  const match = description.toUpperCase().match(/KTX-[FW]\d+/);
  return match ? match[0] : null;
}

export async function POST(request: Request) {
  const secureToken = process.env.CASSO_SECURE_TOKEN;
  if (!secureToken) {
    return NextResponse.json({ error: 105, message: "Webhook chưa cấu hình" }, { status: 503 });
  }

  const headerToken = request.headers.get("x-casso-token");
  let body: CassoWebhookBody;
  try {
    body = (await request.json()) as CassoWebhookBody;
  } catch {
    return NextResponse.json({ error: 101, message: "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  if (headerToken !== secureToken && body.secure_token !== secureToken) {
    return NextResponse.json({ error: 101, message: "Token không hợp lệ" }, { status: 401 });
  }

  const transactions = body.data ?? [];
  if (transactions.length === 0) {
    return NextResponse.json({ error: 0, message: "Không có giao dịch" });
  }

  const supabase = serviceClient();
  let confirmed = 0;

  for (const tx of transactions) {
    const code = extractOrderCode(tx.description ?? "");
    if (!code || typeof tx.amount !== "number" || tx.amount <= 0) continue;

    const { data: order } = await supabase
      .from("orders")
      .select("id, code, type, total_amount, payment_status")
      .eq("code", code)
      .in("type", ["food", "water"])
      .eq("payment_status", "unpaid")
      .maybeSingle();

    if (!order) continue;
    const row = order as OrderRow;
    if (row.total_amount !== tx.amount) continue;

    const { error: updateError } = await supabase
      .from("orders")
      .update(
        row.type === "food"
          ? { payment_status: "paid", status: "confirmed" }
          : { payment_status: "paid" }
      )
      .eq("id", row.id)
      .eq("payment_status", "unpaid");

    if (!updateError) confirmed += 1;
  }

  return NextResponse.json({ error: 0, message: `Xác nhận ${confirmed} đơn` });
}
