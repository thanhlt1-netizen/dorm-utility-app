-- ============================================================
-- Dorm Utility App · Migration 004: payment method
-- Cho phép đổi hình thức thanh toán (tiền mặt ⇄ chuyển khoản QR)
-- khi đơn còn ở trạng thái "chờ tiếp nhận" và chưa trả tiền.
-- Chạy trong SQL Editor của Supabase. Chạy lại an toàn.
-- ============================================================

do $$
begin
  create type public.payment_method as enum ('cash', 'bank_transfer');
exception
  when duplicate_object then null;
end $$;

alter table public.orders
  add column if not exists payment_method public.payment_method;

-- ---------- RPC: đổi hình thức thanh toán (chủ đơn, đơn chờ tiếp nhận) ----------
create or replace function public.set_order_payment_method(
  p_code text,
  p_method text
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

  if p_method not in ('cash', 'bank_transfer') then
    raise exception 'Hình thức thanh toán không hợp lệ';
  end if;

  update public.orders
  set payment_method = p_method::public.payment_method,
      updated_at = now()
  where code = p_code
    and user_id = auth.uid()
    and status = 'pending'
    and payment_status = 'unpaid'
  returning * into v_order;

  if v_order.id is null then
    raise exception 'Chỉ đổi được hình thức thanh toán khi đơn còn chờ tiếp nhận và chưa trả tiền';
  end if;

  return v_order;
end;
$$;

revoke execute on function public.set_order_payment_method(text, text) from anon;
grant execute on function public.set_order_payment_method(text, text) to authenticated;
