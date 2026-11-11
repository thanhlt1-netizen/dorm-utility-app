-- ============================================================
-- Migration 002 · Thanh toán VNPay QR
-- Chạy file này trong SQL Editor SAU khi đã chạy schema.sql.
-- ============================================================

-- Tạo đơn cơm ở trạng thái CHƯA THANH TOÁN (khi chọn VNPay).
-- Suất được trừ ngay để giữ chỗ; nếu không thanh toán,
-- admin/vendor có thể huỷ đơn và hoàn suất thủ công.
create or replace function public.create_food_order_unpaid(
  p_items jsonb,
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
  v_item jsonb;
  v_menu_id uuid;
  v_qty integer;
begin
  if auth.uid() is null then
    raise exception 'Chưa đăng nhập';
  end if;

  select * into v_user from public.users where id = auth.uid();
  if v_user.id is null then
    raise exception 'Không tìm thấy hồ sơ người dùng';
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'Giỏ hàng trống';
  end if;

  if p_total_amount is null or p_total_amount <= 0 then
    raise exception 'Số tiền không hợp lệ';
  end if;

  insert into public.orders (
    code, user_id, user_name, type, status, room_number,
    total_amount, payment_status, pickup_code
  )
  values (
    'KTX-F' || floor(random() * 900 + 100)::int || (extract(epoch from now())::bigint % 100),
    v_user.id, v_user.full_name, 'food', 'pending', v_user.room_number,
    p_total_amount, 'unpaid',
    lpad((floor(random() * 900000) + 100000)::text, 6, '0')
  )
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_menu_id := (v_item ->> 'menuId')::uuid;
    v_qty := (v_item ->> 'quantity')::int;

    update public.daily_menus
    set remaining = remaining - v_qty
    where id = v_menu_id and is_active and remaining >= v_qty;

    if not found then
      raise exception 'Món % vừa hết suất', v_item ->> 'dishName';
    end if;

    insert into public.food_order_details (
      order_id, menu_id, dish_name, price, quantity, pickup_date, pickup_time_slot
    )
    values (
      v_order.id, v_menu_id,
      v_item ->> 'dishName',
      (v_item ->> 'price')::int,
      v_qty,
      current_date + 1,
      '11:30 - 12:30'
    );
  end loop;

  return v_order;
end;
$$;

revoke execute on function public.create_food_order_unpaid(jsonb, integer) from anon;
grant execute on function public.create_food_order_unpaid(jsonb, integer) to authenticated;
