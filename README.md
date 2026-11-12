# Dorm Utility App — Tiện ích Ký túc xá

PWA mobile-first cho sinh viên ký túc xá: **Đổi nước 20L** và **Đặt cơm trưa** (đặt hôm nay → nhận trưa mai), thanh toán online tự xác nhận, lấy đồ tại điểm tụ bằng mã đơn.

Stack: Next.js 15 (App Router) + TypeScript · Tailwind CSS + shadcn/ui · Framer Motion · Supabase (DB/Auth/Realtime/RPC) · Zustand + TanStack Query · PWA · Vercel.

## Tính năng

- **Đổi nước 20L** — sinh viên tạo yêu cầu (tối đa 2 bình/lần, 1 yêu cầu/ngày), huỷ được trước khi tiếp nhận; ban quản lý/sinh viên trực ca nhận và giao; thanh toán tiền mặt khi nhận nước hoặc chuyển khoản QR (tự xác nhận qua Casso).
- **Đặt cơm trưa** — nhà bếp cập nhật món theo ngày; sinh viên chọn suất → thanh toán (PayOS/VNPay/Casso/VietQR) → nhận mã 6 số để lấy đồ tại điểm tụ trưa mai.
- **Đăng ký sinh viên bằng OTP** — mã 6 số gửi qua email, kích hoạt và vào app luôn.
- **4 vai trò**: Sinh viên (tự đăng ký), Trực KTX, Nhà bếp, Quản lý KTX (tài khoản admin cấp).
- Realtime qua Supabase channel `orders-realtime`; skeleton loading, optimistic UI, page transition, success animation, dark mode.

## Chạy dự án

```bash
pnpm install
cp .env.example .env.local   # điền env Supabase
pnpm dev
```

Mở [http://localhost:3000](http://localhost:3000).

## Setup Supabase

1. Tạo project tại [supabase.com](https://supabase.com) (free tier đủ dùng).
2. Chạy [`supabase/schema.sql`](supabase/schema.sql) trong SQL Editor, rồi các migration theo thứ tự: [`migration-001-otp.sql`](supabase/migration-001-otp.sql), [`migration-002-vnpay.sql`](supabase/migration-002-vnpay.sql) (RPC `create_food_order_unpaid`), [`migration-003-water-qr.sql`](supabase/migration-003-water-qr.sql) (RPC `confirm_payment_self`), [`migration-004-payment-method.sql`](supabase/migration-004-payment-method.sql) (RPC `set_order_payment_method`), [`migration-005-water-cancel.sql`](supabase/migration-005-water-cancel.sql) (RPC `cancel_water_order_self` + chống spam).
3. Điền `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` vào Vercel (Production).

## Thanh toán PayOS (khuyến nghị)

Cổng thanh toán QR qua [PayOS](https://payos.vn) (hỗ trợ VietQR mọi ngân hàng + thẻ): sinh viên quét QR ngân hàng bất kỳ, PayOS webhook tự xác nhận realtime — không cần merchant ngân hàng riêng.

1. Đăng ký [my.payos.vn](https://my.payos.vn), tạo **Kênh thanh toán** → vào **API credentials** lấy Client ID, API Key, Checksum Key.
2. Đăng ký **Webhook** với URL `https://<domain>/api/payment/payos/webhook` trong dashboard PayOS (PayOS gửi ping xác nhận — app trả 200 sẵn sàng).
3. Thêm env vars vào `.env.local` và Vercel:

```
NEXT_PUBLIC_PAYOS_ENABLED=true
PAYOS_CLIENT_ID=xxxx
PAYOS_API_KEY=xxxx
PAYOS_CHECKSUM_KEY=xxxx
```

Luồng: bấm "Thanh toán qua PayOS" → tạo lệnh (đơn `unpaid` giữ suất, hạn 15 phút) → redirect trang PayOS → quét QR → PayOS webhook (verify chữ ký HMAC-SHA256, đối chiếu mã đơn + số tiền) → đơn `paid` + realtime cập nhật. Khi bật PayOS, nút PayOS là kênh chính trên cả đơn cơm và đơn nước; Casso/VietQR thủ công vẫn là phương án dự phòng (tắt bằng cách bỏ `NEXT_PUBLIC_CASSO_ENABLED`).

## Thanh toán VNPay QR (tuỳ chọn)

Đăng ký sandbox tại [sandbox.vnpayment.vn/devreg](https://sandbox.vnpayment.vn/devreg/):

```
NEXT_PUBLIC_VNPAY_ENABLED=true
VNPAY_TMN_CODE=xxxx
VNPAY_HASH_SECRET=xxxx
VNPAY_ENV=sandbox
```

Luồng: tạo đơn `unpaid` (giữ suất) → redirect sang VNPay → sinh viên quét QR → VNPay gọi IPN (ký HMAC-SHA512, đối chiếu số tiền) → đơn chuyển `paid` + realtime cập nhật. Đơn không thanh toán trong 15 phút có thể huỷ thủ công bởi vendor/admin.

## Tự xác nhận VietQR qua Casso (tuỳ chọn)

Không cần VNPay merchant vẫn có xác nhận **realtime**: kết nối tài khoản ngân hàng nhà bếp với [Casso](https://casso.vn) — khi sinh viên chuyển khoản đúng nội dung `KTX <phòng> <mã đơn>`, Casso gọi webhook và đơn tự chuyển `paid` (áp dụng cho cả đơn nước lẫn đơn cơm).

1. Đăng ký [app.casso.vn](https://app.casso.vn), kết nối tài khoản ngân hàng nhận tiền.
2. Tạo **Webhook** với URL `https://<domain>/api/payment/casso/webhook`, copy **Secure Token**.
3. Thêm env vars vào `.env.local` và Vercel:

```
NEXT_PUBLIC_CASSO_ENABLED=true
CASSO_SECURE_TOKEN=xxxx
```

Luồng: bấm "Tạo lệnh thanh toán" → đơn `unpaid` giữ suất + QR kèm mã đơn → sinh viên chuyển khoản → Casso webhook (verify token, đối chiếu mã đơn + số tiền) → đơn `paid` + realtime cập nhật. Chưa bật Casso/VNPay thì dùng xác nhận thủ công như cũ.

## Đăng nhập theo vai trò

Trang `/login` có 4 tab vai trò:

- **Sinh viên** — tự đăng kí (họ tên, phòng, MSSV, email, mật khẩu) → nhập **mã OTP 6 số** gửi qua email để kích hoạt và vào app luôn; role luôn cố định `resident` ở server.
- **Trực KTX / Nhà bếp / Quản lý KTX** — đăng nhập bằng tên tài khoản admin cấp (vd `nv1`, tự thêm `@ktx.vn`); quyền lấy từ bảng `users`, không thể tự nâng.

Đơn hàng cập nhật realtime qua channel `orders-realtime`; tạo đơn nước/cơm và xác nhận mã lấy đồ đi qua RPC `security definer` để chống gian lận (trừ kho nguyên tử, kiểm tra quyền ở server).

## Tạo tài khoản quản lý

Tài khoản staff/vendor/admin được cấp sẵn qua [`supabase/create-accounts.sql`](supabase/create-accounts.sql):

1. Tạo 9 user trong Supabase Dashboard (Authentication → Users → Add user, bật **Auto Confirm User**): `nv1@ktx.vn` … `nv4@ktx.vn`, `vd1@ktx.vn` … `vd4@ktx.vn`, `admin@ktx.vn`.
2. Chạy `create-accounts.sql` trong SQL Editor — script gán `full_name` + `role` tương ứng.

| Tài khoản | Email | Mật khẩu | Vai trò | Tên hiển thị |
| --- | --- | --- | --- | --- |
| `nv1`–`nv4` | `nv1@ktx.vn`… | `nvktxbc1`–`nvktxbc4` | staff | Trực KTX 1–4 |
| `vd1`–`vd4` | `vd1@ktx.vn`… | `vdnhaan1`–`vdnhaan4` | vendor | Nhà bếp 1–4 |
| `admin` | `admin@ktx.vn` | `admin123` | admin | Quản lý KTX |

Đăng nhập: nhập tên (vd `nv1`) — app tự thêm `@ktx.vn` — hoặc email đầy đủ. Mỗi tài khoản đổi mật khẩu ngay tại trang **Cá nhân** (card "Đổi mật khẩu", tối thiểu 6 ký tự) — nên đổi ngay khi nhận tài khoản.

## PWA

Manifest + meta đủ để **Add to Home Screen** trên iOS/Android; chạy qua HTTPS (Vercel) là cài đặt được.

## Cấu trúc

```
src/
├── app/
│   ├── (auth)/login/
│   ├── (resident)/        # home, water, food, orders, profile
│   ├── (staff)/dashboard/ # trực ca: nhận/giao nước
│   ├── (vendor)/kitchen/  # nhà bếp: thực đơn + đơn cơm
│   ├── (admin)/admin/     # tổng quan
│   └── api/payment/       # vnpay (create/ipn/return), casso webhook, payos (create/webhook)
├── components/            # ui/, shared/, animated/ (Framer Motion)
├── hooks/  stores/  lib/  types/
```

## Roadmap

- [x] Mobile layout + Bottom Navigation
- [x] Trang đăng nhập 4 vai trò (sinh viên tự đăng kí, staff/vendor/admin tài khoản cố định)
- [x] Home + flow Đổi nước (tiền mặt hoặc chuyển khoản QR)
- [x] Casso webhook tự xác nhận VietQR realtime cho cả đơn nước + cơm
- [x] Thanh toán PayOS (QR mọi ngân hàng, webhook tự xác nhận) cho cả đơn nước + cơm
- [x] Đổi hình thức thanh toán (tiền mặt ⇄ QR) khi đơn nước còn chờ tiếp nhận
- [x] Huỷ yêu cầu đổi nước trước khi tiếp nhận + chống spam (2 bình/lần, 1 yêu cầu/ngày)
- [x] Flow Đặt cơm + VietQR
- [x] Lịch sử đơn + chi tiết đơn với Timeline trạng thái
- [x] Staff dashboard + Vendor kitchen
- [x] Vendor chỉnh thực đơn thật (thêm món, bật/tắt, chỉnh số suất)
- [x] Đăng ký sinh viên xác nhận OTP 6 số qua email
- [x] Supabase schema + RLS + Auth + Realtime + RPC production
- [x] Thanh toán VNPay QR tự động xác nhận (sandbox/production)
- [x] Tài khoản cố định nv1–nv4 / vd1–vd4 / admin + đổi mật khẩu tự chủ
- [ ] Confetti + toast system
- [ ] Service Worker offline đầy đủ
- [ ] Admin console (thống kê)
