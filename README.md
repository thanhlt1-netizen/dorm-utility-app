# Dorm Utility App · Tiện ích Ký túc xá

Web app mobile-first (PWA) cho sinh viên ký túc xá với 2 dịch vụ:

- **Đổi nước 20L** — sinh viên tạo yêu cầu, ban quản lý/sinh viên trực ca nhận và giao.
- **Đặt cơm trưa** — đặt chiều nay, nhận trưa mai; thanh toán VietQR giả lập, lấy đồ tại điểm tụ bằng mã 6 số.

## Tech stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui-style components
- Framer Motion (spring physics, `layoutId`, `AnimatePresence`)
- Supabase (DB + Auth + Realtime — bật khi cấu hình env, không có env thì chạy dữ liệu mẫu)
- Zustand + TanStack Query
- PWA (manifest, Add to Home Screen)

## Chạy dự án

```bash
pnpm install
pnpm dev
```

Mở `http://localhost:3000`, bật Device Toolbar (F12 → mobile) để xem đúng khung 430px.

Build production: `pnpm build && pnpm start`.

## Kết nối Supabase (tuỳ chọn)

App chạy đầy đủ với dữ liệu mẫu khi chưa cấu hình. Để chuyển sang production:

1. Tạo project tại [supabase.com](https://supabase.com).
2. Mở **SQL Editor**, dán và chạy toàn bộ [`supabase/schema.sql`](supabase/schema.sql) — tạo 5 bảng (`users`, `orders`, `water_order_details`, `daily_menus`, `food_order_details`), enums, trigger `updated_at`, trigger tự tạo profile khi signup, RLS policies, realtime publication và seed thực đơn ngày mai.
3. **Authentication → Providers**: bật Email. Tạo user thử nghiệm trong **Authentication → Users** (app tự tạo row `users` qua trigger; role mặc định `resident` — sửa trực tiếp trong bảng `users` để nâng quyền staff/vendor/admin).
4. Copy `.env.example` → `.env.local` và điền:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

5. Trên Vercel: thêm cùng 2 biến vào **Settings → Environment Variables** rồi redeploy.

Sau khi cấu hình: đăng nhập bằng email/password tại trang **Cá nhân**, đơn hàng cập nhật realtime qua channel `orders-realtime`.

## Cấu trúc

```
src/
├── app/
│   ├── (resident)/        # Home, water, food, orders (+ orders/[id] chi tiết), profile
│   ├── (staff)/dashboard  # Trực ca đổi nước
│   ├── (vendor)/kitchen   # Nhà bếp: đơn hàng + thực đơn
│   └── api/webhook/payment
├── components/{ui,shared,animated}
├── lib/{supabase,payment.ts,utils.ts,orders.ts,mock-data.ts}
├── hooks/                 # use-theme, use-realtime-orders
├── stores/                # auth, orders, menus (Zustand)
└── types/
```

## Roadmap

- [x] Mobile layout + Bottom Navigation
- [x] Mock auth + floating Role switcher
- [x] Home + flow Đổi nước
- [x] Flow Đặt cơm + VietQR giả lập
- [x] Lịch sử đơn + chi tiết đơn với Timeline trạng thái
- [x] Staff dashboard + Vendor kitchen
- [x] Vendor chỉnh thực đơn thật (thêm món, bật/tắt, chỉnh số suất)
- [x] Supabase schema + RLS + Auth + Realtime
- [ ] Confetti + toast system
- [ ] Service Worker offline đầy đủ
- [ ] Admin console (thống kê)
