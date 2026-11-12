import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface SetMethodBody {
  code?: string;
  method?: string;
}

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return NextResponse.json(
      { error: "Server chưa cấu hình đủ biến môi trường" },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, anonKey, {
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

  let body: SetMethodBody;
  try {
    body = (await request.json()) as SetMethodBody;
  } catch {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  const code = body.code?.trim().toUpperCase() ?? "";
  const method = body.method?.trim() ?? "";
  if (!code || !["cash", "bank_transfer"].includes(method)) {
    return NextResponse.json(
      { error: "Thiếu mã đơn hoặc hình thức thanh toán không hợp lệ" },
      { status: 400 }
    );
  }

  const service = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await service
    .from("orders")
    .update({ payment_method: method, updated_at: new Date().toISOString() })
    .eq("code", code)
    .eq("user_id", user.id)
    .eq("type", "water")
    .eq("status", "pending")
    .eq("payment_status", "unpaid")
    .select("code, payment_method")
    .maybeSingle();

  if (error) {
    if (/payment_method/i.test(error.message)) {
      return NextResponse.json(
        {
          error:
            "Cột payment_method chưa tồn tại — hãy chạy supabase/migration-004-payment-method.sql trong SQL Editor rồi thử lại.",
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(
      {
        error:
          "Chỉ đổi được hình thức thanh toán khi đơn còn chờ tiếp nhận và chưa trả tiền.",
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    code: data.code,
    method: data.payment_method,
  });
}
