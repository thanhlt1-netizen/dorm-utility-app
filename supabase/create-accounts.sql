-- ============================================================================
-- TẠO 9 TÀI KHOẢN CỐ ĐỊNH (staff / vendor / admin) — Dorm Utility App
-- ============================================================================
-- CÁCH DÙNG (làm theo đúng thứ tự):
--
-- BƯỚC 1 — Tạo user đăng nhập trong Supabase Dashboard:
--   Mở project Supabase → Authentication → Users → "Add user" → "Create new user"
--   Nhập Email + Mật khẩu, BẬT "Auto Confirm User", bấm Create user.
--   Làm lần lượt cho 9 tài khoản dưới đây:
--
--     Email             Mật khẩu      Vai trò      Tên hiển thị
--     nv1@ktx.vn        nvktxbc1      Trực KTX     Trực KTX 1
--     nv2@ktx.vn        nvktxbc2      Trực KTX     Trực KTX 2
--     nv3@ktx.vn        nvktxbc3      Trực KTX     Trực KTX 3
--     nv4@ktx.vn        nvktxbc4      Trực KTX     Trực KTX 4
--     vd1@ktx.vn        vdnhaan1      Nhà bếp      Nhà bếp 1
--     vd2@ktx.vn        vdnhaan2      Nhà bếp      Nhà bếp 2
--     vd3@ktx.vn        vdnhaan3      Nhà bếp      Nhà bếp 3
--     vd4@ktx.vn        vdnhaan4      Nhà bếp      Nhà bếp 4
--     admin@ktx.vn      admin123      Quản lý KTX  Quản lý KTX
--
--   Lưu ý: mật khẩu tối thiểu 6 ký tự nên admin không thể dùng "admin"
--   (5 ký tự). Đã đề xuất "admin123" — sau khi đăng nhập có thể tự đổi
--   trong màn Cá nhân → Đổi mật khẩu.
--
-- BƯỚC 2 — Chạy toàn bộ script này trong SQL Editor.
--   Script chỉ CẬP NHẬT bảng public.users (full_name + role) theo email,
--   KHÔNG tạo user auth. Chạy lại nhiều lần cũng không sao (idempotent).
--
-- ĐĂNG NHẬP TRONG APP:
--   - Chọn tab vai trò tương ứng (Trực KTX / Nhà bếp / Quản lý KTX).
--   - Nhập tên tài khoản không cần @, ví dụ "nv1" — app tự hiểu là
--     nv1@ktx.vn. Nhập email đầy đủ cũng được.
--   - Đổi mật khẩu: góc phải màn hình chính → icon người → Cá nhân →
--     "Đổi mật khẩu".
-- ============================================================================

do $$
declare
  rec record;
  v_count int;
begin
  for rec in
    select * from (values
      ('nv1@ktx.vn',   'Trực KTX 1',  'staff'::public.user_role),
      ('nv2@ktx.vn',   'Trực KTX 2',  'staff'::public.user_role),
      ('nv3@ktx.vn',   'Trực KTX 3',  'staff'::public.user_role),
      ('nv4@ktx.vn',   'Trực KTX 4',  'staff'::public.user_role),
      ('vd1@ktx.vn',   'Nhà bếp 1',   'vendor'::public.user_role),
      ('vd2@ktx.vn',   'Nhà bếp 2',   'vendor'::public.user_role),
      ('vd3@ktx.vn',   'Nhà bếp 3',   'vendor'::public.user_role),
      ('vd4@ktx.vn',   'Nhà bếp 4',   'vendor'::public.user_role),
      ('admin@ktx.vn', 'Quản lý KTX', 'admin'::public.user_role)
    ) as t(email, full_name, role)
  loop
    update public.users u
    set full_name = rec.full_name,
        role = rec.role
    where u.id = (select id from auth.users where email = rec.email);

    get diagnostics v_count = row_count;

    if v_count = 0 then
      raise notice 'CHƯA CÓ % — hãy tạo user này trong Dashboard (Bước 1) rồi chạy lại script', rec.email;
    else
      raise notice 'OK: % → % (%)', rec.email, rec.full_name, rec.role;
    end if;
  end loop;
end $$;
