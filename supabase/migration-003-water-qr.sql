-- Migration 003: thanh toán chuyển khoản QR cho đơn nước + cơm
-- RPC cho phép chủ đơn tự xác nhận đã chuyển khoản (dùng khi CHƯA nối Casso;
-- đã nối Casso thì webhook tự xác nhận, không cần RPC này).
-- Chạy lại file này an toàn (create or replace).

create or replace function public.confirm_payment_self(
  p_code text
)
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

  select * into v_order from public.orders
  where code = p_code and user_id = auth.uid() and type in ('water', 'food')
  for update;

  if v_order.id is null then
    raise exception 'Không tìm thấy đơn';
  end if;
  if v_order.payment_status <> 'unpaid' then
    raise exception 'Đơn đã được thanh toán';
  end if;

  update public.orders
  set payment_status = 'paid',
      status = case when type = 'food' then 'confirmed' else status end,
      updated_at = now()
  where id = v_order.id
  returning * into v_order;

  return v_order;
end;
$$;

drop function if exists public.confirm_water_payment_self(text);

revoke execute on function public.confirm_payment_self(text) from anon;
grant execute on function public.confirm_payment_self(text) to authenticated;
