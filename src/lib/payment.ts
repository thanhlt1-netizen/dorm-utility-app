import { formatVND } from "@/lib/utils";

export const BANK_INFO = {
  bankName: "Vietcombank",
  accountName: "KTX DORM UTILITY",
  accountNumber: "0071000891234",
};

export function buildTransferContent(roomNumber: string, orderCode: string) {
  return `KTX ${roomNumber} ${orderCode}`.toUpperCase().replace(/\s+/g, " ");
}

export function buildVietQRUrl(orderCode: string, amount: number) {
  const info = `${BANK_INFO.accountNumber}-${BANK_INFO.bankName}`;
  const params = new URLSearchParams({
    amount: String(amount),
    addInfo: buildTransferContent("KTX", orderCode),
    accountName: BANK_INFO.accountName,
  });
  return `https://img.vietqr.io/image/${info}-qr_only.png?${params.toString()}`;
}

export function describeAmount(amount: number) {
  return `Số tiền ${formatVND(amount)} đã được tạo lệnh thanh toán`;
}
