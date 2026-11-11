import { NextResponse } from "next/server";
import { verifyVnpayCallback } from "@/lib/vnpay";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const result = verifyVnpayCallback(url.searchParams);

  if (!result.isValid) {
    return NextResponse.redirect(
      new URL("/orders?payment=failed&reason=invalid_signature", url.origin)
    );
  }

  if (!result.isSuccess) {
    return NextResponse.redirect(
      new URL(
        `/orders?payment=failed&reason=${result.responseCode ?? "unknown"}`,
        url.origin
      )
    );
  }

  return NextResponse.redirect(
    new URL(`/orders?payment=success&code=${result.txnRef ?? ""}`, url.origin)
  );
}
