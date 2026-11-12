import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isPayosConfigured, verifyWebhookSignature } from "@/lib/payos";

interface OrderRow {
  id: string;
  code: string;
  type: string;
  total_amount: number;
  payment_status: string;
}

interface PayosWebhookBody {
  code?: string;
  desc?: string;
  success?: boolean;
  data?: Record<string, unknown>;
  signature?: string;
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
  if (!isPayosConfigured()) {
    return NextResponse.json(
      { error: 105, message: "Webhook chưa cấu hình" },
      { status: 503 }
    );
  }

  let body: PayosWebhookBody;
  try {
    body = (await request.json()) as PayosWebhookBody;
  } catch {
    return NextResponse.json(
      { error: 101, message: "Dữ liệu không hợp lệ" },
      { status: 400 }
    );
  }

  if (
    !body.data ||
    !body.signature ||
    !verifyWebhookSignature(body.data, body.signature)
  ) {
    return NextResponse.json(
      { error: 101, message: "Chữ ký không hợp lệ" },
      { status: 401 }
    );
  }

  if (!body.success || body.code !== "00") {
    return NextResponse.json({
      error: 0,
      message: "Bỏ qua giao dịch không thành công",
    });
  }

  const description =
    typeof body.data.description === "string" ? body.data.description : "";
  const rawAmount = body.data.amount;
  const amount =
    typeof rawAmount === "number"
      ? rawAmount
      : Number(String(rawAmount ?? ""));

  const code = extractOrderCode(description);
  if (!code || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 0, message: "Không khớp mã đơn" });
  }

  const supabase = serviceClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, code, type, total_amount, payment_status")
    .eq("code", code)
    .in("type", ["food", "water"])
    .eq("payment_status", "unpaid")
    .maybeSingle();

  if (!order) {
    return NextResponse.json({
      error: 0,
      message: "Không tìm thấy đơn chưa thanh toán",
    });
  }

  const row = order as OrderRow;
  if (row.total_amount !== amount) {
    return NextResponse.json({ error: 0, message: "Số tiền không khớp" });
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update(
      row.type === "food"
        ? { payment_status: "paid", status: "confirmed" }
        : { payment_status: "paid" }
    )
    .eq("id", row.id)
    .eq("payment_status", "unpaid");

  return NextResponse.json({
    error: updateError ? 1 : 0,
    message: updateError ? "Cập nhật thất bại" : "Xác nhận thành công",
  });
}
