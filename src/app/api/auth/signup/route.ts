import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface SignupBody {
  email?: string;
  password?: string;
  fullName?: string;
  phone?: string;
  roomNumber?: string;
  studentId?: string;
}

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: "Server thiếu SUPABASE_SERVICE_ROLE_KEY — thêm env rồi redeploy" },
      { status: 503 }
    );
  }

  let body: SignupBody;
  try {
    body = (await request.json()) as SignupBody;
  } catch {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  const fullName = body.fullName?.trim() ?? "";
  const roomNumber = body.roomNumber?.trim() ?? "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email không hợp lệ" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Mật khẩu tối thiểu 6 ký tự" },
      { status: 400 }
    );
  }
  if (!fullName || !roomNumber) {
    return NextResponse.json(
      { error: "Nhập đầy đủ họ tên và số phòng" },
      { status: 400 }
    );
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      phone: body.phone?.trim() ?? "",
      room_number: roomNumber,
      student_id: body.studentId?.trim() ?? "",
      role: "resident",
    },
  });

  if (error) {
    const message = /already|registered|exists|been taken/i.test(error.message)
      ? "Email này đã được đăng ký — hãy đăng nhập."
      : error.message;
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, userId: data.user?.id ?? null });
}
