import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyVnpayCallback } from "@/lib/vnpay";

interface OrderRow {
  id: string;
  code: string;
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

function respond(rspCode: string, message: string) {
  return NextResponse.json({ RspCode: rspCode, Message: message });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const result = verifyVnpayCallback(url.searchParams);

  if (!result.isValid) {
    return respond("97", "Sai chữ ký");
  }

  if (!result.txnRef) {
    return respond("01", "Đơn hàng không tồn tại");
  }

  const supabase = serviceClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, code, total_amount, payment_status")
    .eq("code", result.txnRef)
    .maybeSingle();

  if (!order) {
    return respond("01", "Đơn hàng không tồn tại");
  }

  const row = order as OrderRow;

  if (result.amount === null || result.amount !== row.total_amount) {
    return respond("04", "Số tiền không hợp lệ");
  }

  if (row.payment_status === "paid") {
    return respond("02", "Đơn hàng đã được xác nhận trước đó");
  }

  if (!result.isSuccess) {
    return respond("00", "Đã ghi nhận giao dịch không thành công");
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({ payment_status: "paid", status: "confirmed" })
    .eq("id", row.id)
    .eq("payment_status", "unpaid");

  if (updateError) {
    return respond("99", "Lỗi cập nhật đơn hàng");
  }

  return respond("00", "Xác nhận thanh toán thành công");
}
