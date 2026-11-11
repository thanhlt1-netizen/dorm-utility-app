# Dorm Utility App · Tiện ích Ký túc xá

Web app mobile-first (PWA) cho sinh viên ký túc xá với 2 dịch vụ:

- **Đổi nước 20L** — sinh viên tạo yêu cầu, ban quản lý/sinh viên trực ca nhận và giao; thanh toán tiền mặt khi nhận nước hoặc chuyển khoản QR (tự xác nhận qua Casso).
- **Đặt cơm trưa** — đặt chiều nay, nhận trưa mai; thanh toán VietQR, lấy đồ tại điểm tụ bằng mã 6 số.

App chạy **production thật**: mọi dữ liệu ghi/đọc trực tiếp Supabase (PostgreSQL + RLS + RPC), không còn dữ liệu mẫu.

## Tech stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui-style components
- Framer Motion (spring physics, `layoutId`, `AnimatePresence`)
- Supabase (DB + Auth + Realtime + RPC) — **bắt buộc**
- Zustand + TanStack Query
- PWA (manifest, Add to Home Screen)
- Deploy: Vercel

## Chạy dự án

```bash
pnpm install
pnpm dev
```

Mở `http://localhost:3000`, bật Device Toolbar (F12 → mobile) để xem đúng khung 430px.

Build production: `pnpm build && pnpm start`.

## Thiết lập Supabase (bắt buộc)

1. Tạo project tại [supabase.com](https://supabase.com).
2. Mở **SQL Editor**, dán và chạy toàn bộ [`supabase/schema.sql`](supabase/schema.sql) — tạo 5 bảng (`users`, `orders`, `water_order_details`, `daily_menus`, `food_order_details`), enums, trigger `updated_at`, trigger tự tạo profile khi signup, 3 RPC (`create_water_order`, `create_food_order`, `complete_pickup`), RLS policies, realtime publication và seed thực đơn ngày mai.
3. **Authentication → Providers**: bật Email. Giữ "Confirm email" và đổi template **Confirm Signup** (Authentication → Emails) dùng `{{ .Token }}` thay cho `{{ .ConfirmationURL }}` — sinh viên sẽ nhận **mã OTP 6 số** và nhập trực tiếp trong app (hoặc tắt "Confirm email" để vào dùng luôn).
4. Tạo tài khoản **staff / vendor / admin** trong **Authentication → Users** (app tự tạo row `users` qua trigger với role mặc định `resident`), rồi nâng quyền trong SQL Editor:

```sql
update public.users set role = 'staff'  where id = '<uuid>';
update public.users set role = 'vendor' where id = '<uuid>';
update public.users set role = 'admin'  where id = '<uuid>';
```

5. Copy `.env.example` → `.env.local` và điền:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

6. Trên Vercel: thêm cùng 2 biến vào **Settings → Environment Variables** rồi redeploy.

Chưa cấu hình env? App hiển thị màn hình **Setup** kèm hướng dẫn từng bước thay vì chạy demo.

## Thanh toán VNPay QR (tuỳ chọn)

Mặc định trang đặt cơm dùng VietQR + xác nhận thủ công. Khi cấu hình VNPay, sinh viên sẽ thanh toán qua cổng VNPay bằng QR ngân hàng bất kỳ và hệ thống **tự động xác nhận** qua IPN.

1. Đăng ký merchant sandbox tại [sandbox.vnpayment.vn/devreg](https://sandbox.vnpayment.vn/devreg/) để nhận `vnp_TmnCode` + `vnp_HashSecret` (miễn phí, production cần hợp đồng với VNPay).
2. Chạy thêm [`supabase/migration-002-vnpay.sql`](supabase/migration-002-vnpay.sql) (RPC `create_food_order_unpaid`) và [`supabase/migration-003-water-qr.sql`](supabase/migration-003-water-qr.sql) (RPC `confirm_payment_self` — xác nhận chuyển khoản đơn nước/cơm khi chưa nối Casso) trong SQL Editor.
3. Lấy `service_role` key ở Supabase → **Settings → API**.
4. Thêm env vars vào `.env.local` và Vercel:

```
NEXT_PUBLIC_VNPAY_ENABLED=true
VNPAY_TMN_CODE=xxxx
VNPAY_HASH_SECRET=xxxx
SUPABASE_SERVICE_ROLE_KEY=eyJ...
# VNPAY_ENV=production   # chỉ bật khi có thông số merchant thật
```

5. Trong dashboard VNPay, khai báo:
   - **Return URL**: `https://<domain>/api/payment/vnpay/return`
   - **IPN URL**: `https://<domain>/api/payment/vnpay/ipn`

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
- **Ban quản lý / Nhà bếp / Quản lý KTX** — đăng nhập bằng tài khoản admin cấp sẵn; quyền lấy từ bảng `users`, không thể tự nâng.

Đơn hàng cập nhật realtime qua channel `orders-realtime`; tạo đơn nước/cơm và xác nhận mã lấy đồ đi qua RPC `security definer` để chống gian lận (trừ kho nguyên tử, kiểm tra quyền ở server).

## Cấu trúc

```
src/
├── app/
│   ├── (auth)/login        # Đăng nhập / đăng kí 4 vai trò + màn hình setup
│   ├── (resident)/         # Home, water, food, orders (+ orders/[id] chi tiết), profile
│   ├── (staff)/dashboard   # Trực ca đổi nước
│   ├── (vendor)/kitchen    # Nhà bếp: đơn hàng + thực đơn
│   ├── api/payment/vnpay   # create / return / ipn (thanh toán VNPay QR)
│   └── api/webhook/payment
├── components/{ui,shared,animated}
├── lib/{supabase,payment.ts,utils.ts,orders.ts,menus.ts,vnpay.ts}
├── hooks/                  # use-theme, use-auth-session, use-orders, use-menus, use-realtime-orders
├── stores/                 # auth, orders, menus (Zustand)
└── types/
```

## Roadmap

- [x] Mobile layout + Bottom Navigation
- [x] Trang đăng nhập 4 vai trò (sinh viên tự đăng kí, staff/vendor/admin tài khoản cố định)
- [x] Home + flow Đổi nước (tiền mặt hoặc chuyển khoản QR)
- [x] Casso webhook tự xác nhận VietQR realtime cho cả đơn nước + cơm
- [x] Flow Đặt cơm + VietQR
- [x] Lịch sử đơn + chi tiết đơn với Timeline trạng thái
- [x] Staff dashboard + Vendor kitchen
- [x] Vendor chỉnh thực đơn thật (thêm món, bật/tắt, chỉnh số suất)
- [x] Supabase schema + RLS + Auth + Realtime + RPC production
- [x] Thanh toán VNPay QR tự động xác nhận (sandbox/production)
- [x] Xác thực đăng kí bằng mã OTP 6 số qua email
- [ ] Confetti + toast system
- [ ] Service Worker offline đầy đủ
- [ ] Admin console (thống kê)
