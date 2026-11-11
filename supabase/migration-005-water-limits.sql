-- ============================================================
-- Dorm Utility App · Migration 005: water limits + cancel
-- 1. Huỷ yêu cầu đổi nước trước khi ban quản lý tiếp nhận.
-- 2. Chống spam: tối đa 2 bình/lần, mỗi sinh viên 1 yêu cầu/ngày
--    (kiểm tra ở server, tính theo giờ Việt Nam).
-- Chạy trong SQL Editor của Supabase. Chạy lại an toàn.
-- ============================================================

-- ---------- RPC: huỷ đơn nước (chủ đơn, chưa bị tiếp nhận) ----------
create or replace function public.cancel_water_order_self(p_code text)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
begin
  if auth.uid() is null then
    raise exception 'Chưa đăng nhập';
  end if;

  update public.orders
  set status = 'cancelled',
      updated_at = now()
  where code = p_code
    and user_id = auth.uid()
    and type = 'water'
    and status = 'pending'
    and payment_status = 'unpaid'
  returning * into v_order;

  if v_order.id is null then
    raise exception 'Chỉ huỷ được yêu cầu chưa thanh toán và chưa được tiếp nhận';
  end if;

  return v_order;
end;
$$;

revoke execute on function public.cancel_water_order_self(text) from anon;
grant execute on function public.cancel_water_order_self(text) to authenticated;

-- ---------- RPC: tạo đơn nước (giới hạn 2 bình + 1 yêu cầu/ngày) ----------
create or replace function public.create_water_order(
  p_bottle_count integer,
  p_note text,
  p_total_amount integer
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.users;
  v_order public.orders;
begin
  if auth.uid() is null then
    raise exception 'Chưa đăng nhập';
  end if;

  if p_bottle_count < 1 or p_bottle_count > 2 then
    raise exception 'Mỗi lần chỉ đổi được từ 1 đến 2 bình';
  end if;

  select * into v_user from public.users where id = auth.uid();
  if v_user.id is null then
    raise exception 'Không tìm thấy hồ sơ người dùng';
  end if;

  if exists (
    select 1 from public.orders
    where user_id = v_user.id
      and type = 'water'
      and status <> 'cancelled'
      and created_at::date = (now() at time zone 'asia/ho_chi_minh')::date
  ) then
    raise exception 'Mỗi ngày bạn chỉ gửi được 1 yêu cầu đổi nước';
  end if;

  insert into public.orders (
    code, user_id, user_name, type, status, room_number,
    total_amount, payment_status, note
  )
  values (
    'KTX-W' || floor(random() * 900 + 100)::int || (extract(epoch from now())::bigint % 100),
    v_user.id, v_user.full_name, 'water', 'pending', v_user.room_number,
    p_total_amount, 'unpaid', nullif(trim(p_note), '')
  )
  returning * into v_order;

  insert into public.water_order_details (order_id, bottle_count)
  values (v_order.id, p_bottle_count);

  return v_order;
end;
$$;
