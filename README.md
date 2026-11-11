# Dorm Utility App (Tiện ích Ký túc xá)

Web app mobile-first (PWA) cho sinh viên ký túc xá với 2 dịch vụ chính:

- **Đổi nước 20L**: tạo yêu cầu, ban quản lý/trực ca nhận và giao tận phòng.
- **Đặt cơm trưa**: đặt trước 1 ngày, thanh toán VietQR giả lập, nhận mã lấy đồ 6 số tại điểm tụ.

## Tech Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui-style components
- Framer Motion (spring physics, morphing button, AnimatePresence)
- Supabase (client sẵn sàng, fallback mock data khi chưa cấu hình)
- Zustand + TanStack Query
- PWA manifest + Add to Home Screen

## Chạy dự án

```bash
pnpm install
pnpm dev
```

## Biến môi trường

Tạo `.env.local` từ mẫu `.env.example`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Khi chưa cấu hình Supabase, app chạy với dữ liệu mẫu (seed) tích hợp sẵn để demo đầy đủ 4 vai trò: Resident, Staff, Vendor, Admin (chuyển vai bằng thanh nổi phía trên màn hình).

## Cấu trúc

```
src/
├── app/
│   ├── (resident)/      # Home, Đổi nước, Đặt cơm, Đơn hàng, Cá nhân
│   ├── (staff)/dashboard
│   ├── (vendor)/kitchen
│   ├── api/webhook/payment
│   └── layout.tsx
├── components/
│   ├── ui/              # shadcn-style primitives
│   ├── shared/          # AppShell, BottomNav, RoleSwitcher...
│   └── animated/        # Framer Motion wrappers
├── lib/                 # supabase client, payment, utils, seed data
├── hooks/
├── stores/              # Zustand stores
└── types/
```

## Roadmap

- [x] Setup + App Shell + Bottom Navigation + Home
- [x] Flow Đổi nước hoàn chỉnh
- [x] Trang Đơn hàng + filter
- [ ] Flow Đặt cơm + VietQR payment sheet
- [ ] Chi tiết đơn + Timeline trạng thái
- [ ] Staff dashboard (nhận việc / hoàn thành, realtime)
- [ ] Vendor hub (thực đơn, xác nhận mã lấy đồ)
- [ ] Kết nối Supabase thật + Auth
- [ ] Confetti + Toast system
