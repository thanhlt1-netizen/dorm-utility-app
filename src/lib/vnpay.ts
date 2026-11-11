import { createHmac } from "node:crypto";

export const VNPAY_SANDBOX_URL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
export const VNPAY_PRODUCTION_URL = "https://www.vnpayment.vn/paymentv2/vpcpay.html";

export const VNPAY_RESPONSE_MESSAGES: Record<string, string> = {
  "00": "Giao dịch thành công",
  "07": "Giao dịch bị nghi ngờ gian lận",
  "09": "Thẻ/tài khoản chưa đăng ký dịch vụ",
  "10": "Xác thực thông tin không đúng quá 3 lần",
  "11": "Đã hết hạn chờ thanh toán",
  "12": "Thẻ/tài khoản bị khoá",
  "13": "Sai mật khẩu OTP",
  "24": "Khách hàng huỷ giao dịch",
  "51": "Tài khoản không đủ số dư",
  "65": "Tài khoản vượt hạn mức giao dịch trong ngày",
  "75": "Ngân hàng thanh toán đang bảo trì",
  "79": "Nhập sai mật khẩu thanh toán quá số lần quy định",
  "99": "Lỗi khác",
};

export function isVnpayConfigured(): boolean {
  return Boolean(
    process.env.VNPAY_TMN_CODE &&
      process.env.VNPAY_HASH_SECRET &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function getVnpayBaseUrl(): string {
  return process.env.VNPAY_ENV === "production"
    ? VNPAY_PRODUCTION_URL
    : VNPAY_SANDBOX_URL;
}

function hmacSha512(secret: string, data: string): string {
  return createHmac("sha512", secret).update(data).digest("hex");
}

function encodeVnpValue(value: string): string {
  return encodeURIComponent(value).replace(/%20/g, "+");
}

export function formatVnpDate(date: Date): string {
  const gmt7 = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${gmt7.getUTCFullYear()}${pad(gmt7.getUTCMonth() + 1)}${pad(gmt7.getUTCDate())}` +
    `${pad(gmt7.getUTCHours())}${pad(gmt7.getUTCMinutes())}${pad(gmt7.getUTCSeconds())}`
  );
}

export interface BuildPaymentUrlInput {
  amountVnd: number;
  txnRef: string;
  orderInfo: string;
  returnUrl: string;
  ipAddr: string;
  locale?: "vn" | "en";
  expireMinutes?: number;
}

export function buildVnpayPaymentUrl(input: BuildPaymentUrlInput): string {
  const tmnCode = process.env.VNPAY_TMN_CODE!;
  const hashSecret = process.env.VNPAY_HASH_SECRET!;
  const now = new Date();
  const expireMinutes = input.expireMinutes ?? 15;

  const params: Record<string, string> = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: tmnCode,
    vnp_Locale: input.locale ?? "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: input.txnRef,
    vnp_OrderInfo: input.orderInfo,
    vnp_OrderType: "other",
    vnp_Amount: String(input.amountVnd * 100),
    vnp_ReturnUrl: input.returnUrl,
    vnp_IpAddr: input.ipAddr,
    vnp_CreateDate: formatVnpDate(now),
    vnp_ExpireDate: formatVnpDate(
      new Date(now.getTime() + expireMinutes * 60 * 1000)
    ),
  };

  const sortedKeys = Object.keys(params).sort();
  const signData = sortedKeys
    .map((key) => `${key}=${encodeVnpValue(params[key])}`)
    .join("&");
  const secureHash = hmacSha512(hashSecret, signData);

  const query = sortedKeys
    .map((key) => `${key}=${encodeURIComponent(params[key]).replace(/%20/g, "+")}`)
    .join("&");

  return `${getVnpayBaseUrl()}?${query}&vnp_SecureHash=${secureHash}`;
}

export interface VnpayCallbackResult {
  isValid: boolean;
  isSuccess: boolean;
  txnRef: string | null;
  amount: number | null;
  responseCode: string | null;
  message: string;
}

export function verifyVnpayCallback(
  searchParams: URLSearchParams
): VnpayCallbackResult {
  const hashSecret = process.env.VNPAY_HASH_SECRET!;
  const secureHash = searchParams.get("vnp_SecureHash");

  if (!secureHash) {
    return {
      isValid: false,
      isSuccess: false,
      txnRef: null,
      amount: null,
      responseCode: null,
      message: "Thiếu chữ ký",
    };
  }

  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    if (
      key.startsWith("vnp_") &&
      key !== "vnp_SecureHash" &&
      key !== "vnp_SecureHashType"
    ) {
      params[key] = value;
    }
  });

  const sortedKeys = Object.keys(params).sort();
  const signData = sortedKeys
    .map((key) => `${key}=${encodeVnpValue(params[key])}`)
    .join("&");
  const expected = hmacSha512(hashSecret, signData);

  const isValid = expected.toLowerCase() === secureHash.toLowerCase();
  const responseCode = params.vnp_ResponseCode ?? null;

  return {
    isValid,
    isSuccess: isValid && responseCode === "00",
    txnRef: params.vnp_TxnRef ?? null,
    amount: params.vnp_Amount ? Number(params.vnp_Amount) / 100 : null,
    responseCode,
    message: VNPAY_RESPONSE_MESSAGES[responseCode ?? ""] ?? "Không xác định",
  };
}
