import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createPayosPaymentLink, isPayosConfigured } from "@/lib/payos";

interface OrderRow {
  id: string;
  code: string;
  user_id: string;
  total_amount: number;
  payment_status: string;
  status: string;
}

interface CreateBody {
  code: string;
}

export async function POST(request: Request) {
  if (!isPayosConfigured()) {
    return NextResponse.json(
      { error: "PayOS chưa được cấu hình trên server" },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Phiên đăng nhập không hợp lệ" },
      { status: 401 }
    );
  }

  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  const code = body.code?.trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ error: "Thiếu mã đơn" }, { status: 400 });
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, code, user_id, total_amount, payment_status, status")
    .eq("code", code)
    .in("type", ["food", "water"])
    .maybeSingle();

  if (!order || (order as OrderRow).user_id !== user.id) {
    return NextResponse.json(
      { error: "Không tìm thấy đơn hàng" },
      { status: 404 }
    );
  }

  const row = order as OrderRow;
  if (row.payment_status !== "unpaid" || row.status === "cancelled") {
    return NextResponse.json(
      { error: "Đơn đã được thanh toán hoặc đã huỷ" },
      { status: 400 }
    );
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const digits = row.code.replace(/\D/g, "");
  const orderCode = Number(
    `${digits || Date.now() % 1_000_000_000}${Date.now() % 1000}`
  );

  try {
    const link = await createPayosPaymentLink({
      orderCode,
      amount: row.total_amount,
      description: row.code,
      returnUrl: `${origin}/orders`,
      cancelUrl: `${origin}/orders`,
      expiredAt: Math.floor(Date.now() / 1000) + 15 * 60,
    });

    return NextResponse.json({
      checkoutUrl: link.checkoutUrl,
      code: row.code,
      orderId: row.id,
    });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? e.message
            : "PayOS: không tạo được lệnh thanh toán",
      },
      { status: 502 }
    );
  }
}
