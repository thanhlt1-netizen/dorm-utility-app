-- Migration 003: đổi nước thanh toán chuyển khoản QR
-- RPC cho phép sinh viên tự xác nhận đã chuyển khoản đơn nước của chính mình
-- (dùng khi CHƯA nối Casso; khi đã nối Casso thì webhook tự xác nhận, không cần RPC này).

create or replace function public.confirm_water_payment_self(
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
  where code = p_code and user_id = auth.uid() and type = 'water'
  for update;

  if v_order.id is null then
    raise exception 'Không tìm thấy đơn nước';
  end if;
  if v_order.payment_status <> 'unpaid' then
    raise exception 'Đơn đã được thanh toán';
  end if;

  update public.orders
  set payment_status = 'paid', updated_at = now()
  where id = v_order.id
  returning * into v_order;

  return v_order;
end;
$$;

revoke execute on function public.confirm_water_payment_self(text) from anon;
grant execute on function public.confirm_water_payment_self(text) to authenticated;
