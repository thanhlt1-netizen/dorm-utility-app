import { createHmac, timingSafeEqual } from "node:crypto";

const PAYOS_BASE_URL = "https://api-merchant.payos.vn";

export function isPayosConfigured(): boolean {
  return Boolean(
    process.env.PAYOS_CLIENT_ID &&
      process.env.PAYOS_API_KEY &&
      process.env.PAYOS_CHECKSUM_KEY
  );
}

function hmacHex(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("hex");
}

function sortedSignature(
  data: Record<string, unknown>,
  key: string
): string {
  const payload = Object.keys(data)
    .sort()
    .map((k) => `${k}=${String(data[k])}`)
    .join("&");
  return hmacHex(payload, key);
}

export function createPaymentRequestSignature(params: {
  orderCode: number;
  amount: number;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  expiredAt?: number;
}): string {
  const data: Record<string, unknown> = {
    amount: params.amount,
    cancelUrl: params.cancelUrl,
    description: params.description,
    orderCode: params.orderCode,
    returnUrl: params.returnUrl,
  };
  if (params.expiredAt) data.expiredAt = params.expiredAt;
  return sortedSignature(data, process.env.PAYOS_CHECKSUM_KEY!);
}

export function verifyWebhookSignature(
  data: Record<string, unknown>,
  signature: string
): boolean {
  const expected = sortedSignature(data, process.env.PAYOS_CHECKSUM_KEY!);
  try {
    return timingSafeEqual(
      Buffer.from(expected, "utf8"),
      Buffer.from(signature, "utf8")
    );
  } catch {
    return false;
  }
}

export interface PayosPaymentLink {
  checkoutUrl: string;
  qrCode: string | null;
  paymentLinkId: string;
  orderCode: number;
}

export async function createPayosPaymentLink(params: {
  orderCode: number;
  amount: number;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  expiredAt?: number;
}): Promise<PayosPaymentLink> {
  const body: Record<string, unknown> = {
    orderCode: params.orderCode,
    amount: params.amount,
    description: params.description,
    returnUrl: params.returnUrl,
    cancelUrl: params.cancelUrl,
    signature: createPaymentRequestSignature(params),
  };
  if (params.expiredAt) body.expiredAt = params.expiredAt;

  const res = await fetch(`${PAYOS_BASE_URL}/v2/payment-requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": process.env.PAYOS_CLIENT_ID!,
      "x-api-key": process.env.PAYOS_API_KEY!,
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json().catch(() => null)) as
    | {
        code?: string;
        desc?: string;
        error?: number;
        data?: {
          checkoutUrl?: string;
          qrCode?: string;
          paymentLinkId?: string;
          orderCode?: number;
        };
      }
    | null;

  if (!json || json.code !== "00" || !json.data?.checkoutUrl) {
    throw new Error(json?.desc ?? "PayOS: không tạo được lệnh thanh toán");
  }

  return {
    checkoutUrl: json.data.checkoutUrl,
    qrCode: json.data.qrCode ?? null,
    paymentLinkId: json.data.paymentLinkId ?? "",
    orderCode: json.data.orderCode ?? params.orderCode,
  };
}
