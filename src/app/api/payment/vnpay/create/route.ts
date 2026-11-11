import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildVnpayPaymentUrl, isVnpayConfigured } from "@/lib/vnpay";

interface OrderRow {
  id: string;
  code: string;
  room_number: string;
}

interface CreateBody {
  items: { menuId: string; dishName: string; price: number; quantity: number }[];
  totalAmount: number;
}

export async function POST(request: Request) {
  if (!isVnpayConfigured()) {
    return NextResponse.json(
      { error: "VNPay chưa được cấu hình trên server" },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });

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

  if (
    !Array.isArray(body.items) ||
    body.items.length === 0 ||
    !body.totalAmount ||
    body.totalAmount <= 0
  ) {
    return NextResponse.json(
      { error: "Giỏ hàng trống hoặc số tiền không hợp lệ" },
      { status: 400 }
    );
  }

  const { data: order, error: rpcError } = await supabase.rpc(
    "create_food_order_unpaid",
    {
      p_items: body.items.map((item) => ({
        menuId: item.menuId,
        dishName: item.dishName,
        price: item.price,
        quantity: item.quantity,
      })),
      p_total_amount: body.totalAmount,
    }
  );

  if (rpcError || !order) {
    return NextResponse.json(
      { error: rpcError?.message ?? "Không tạo được đơn hàng" },
      { status: 400 }
    );
  }

  const row = order as OrderRow;
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const ipAddr =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";

  const paymentUrl = buildVnpayPaymentUrl({
    amountVnd: body.totalAmount,
    txnRef: row.code,
    orderInfo: `KTX thanh toan don ${row.code} phong ${row.room_number}`,
    returnUrl: `${origin}/api/payment/vnpay/return`,
    ipAddr,
  });

  return NextResponse.json({
    paymentUrl,
    orderId: row.id,
    code: row.code,
  });
}
