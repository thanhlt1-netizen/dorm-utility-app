-- ============================================================
-- Dorm Utility App · Supabase schema
-- Chạy toàn bộ file này trong SQL Editor của Supabase project.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Enums ----------
create type public.user_role as enum ('resident', 'staff', 'vendor', 'admin');
create type public.order_type as enum ('water', 'food');
create type public.order_status as enum ('pending', 'confirmed', 'in_progress', 'ready', 'completed', 'cancelled');
create type public.payment_status as enum ('unpaid', 'paid');

-- ---------- users ----------
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  phone text not null default '',
  room_number text not null default '',
  role public.user_role not null default 'resident',
  student_id text not null default '',
  avatar_url text,
  created_at timestamptz not null default now()
);

-- ---------- orders ----------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  user_id uuid not null references public.users (id) on delete cascade,
  type public.order_type not null,
  status public.order_status not null default 'pending',
  room_number text not null,
  total_amount integer not null default 0 check (total_amount >= 0),
  payment_status public.payment_status not null default 'unpaid',
  pickup_code text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_user_idx on public.orders (user_id, created_at desc);
create index orders_type_status_idx on public.orders (type, status);
create index orders_pickup_code_idx on public.orders (pickup_code);

-- ---------- water_order_details ----------
create table public.water_order_details (
  order_id uuid primary key references public.orders (id) on delete cascade,
  bottle_count integer not null default 1 check (bottle_count between 1 and 10),
  assigned_to uuid references public.users (id),
  assigned_staff_name text,
  completed_at timestamptz
);

-- ---------- daily_menus ----------
create table public.daily_menus (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  dish_name text not null,
  description text not null default '',
  price integer not null check (price >= 0),
  image_url text not null default '',
  max_quantity integer not null default 0 check (max_quantity >= 0),
  remaining integer not null default 0 check (remaining >= 0),
  is_active boolean not null default true,
  nutrition_tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index daily_menus_date_idx on public.daily_menus (date) where is_active;

-- ---------- food_order_details ----------
create table public.food_order_details (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  menu_id uuid references public.daily_menus (id),
  dish_name text not null,
  price integer not null check (price >= 0),
  quantity integer not null default 1 check (quantity > 0),
  pickup_date date,
  pickup_time_slot text
);

create index food_order_details_order_idx on public.food_order_details (order_id);

-- ---------- Triggers ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, full_name, phone, room_number, role, student_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'room_number', ''),
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'resident'),
    coalesce(new.raw_user_meta_data ->> 'student_id', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Helper: role của user hiện tại ----------
create or replace function public.current_app_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid()
$$;

-- ---------- Row Level Security ----------
alter table public.users enable row level security;
alter table public.orders enable row level security;
alter table public.water_order_details enable row level security;
alter table public.daily_menus enable row level security;
alter table public.food_order_details enable row level security;

-- users
create policy "users_select_own_or_staff" on public.users
  for select using (
    id = auth.uid()
    or public.current_app_role() in ('staff', 'vendor', 'admin')
  );

create policy "users_insert_self" on public.users
  for insert with check (id = auth.uid());

create policy "users_update_own" on public.users
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = public.current_app_role());

create policy "users_update_admin" on public.users
  for update using (public.current_app_role() = 'admin');

-- orders
create policy "orders_select_own_or_staff" on public.orders
  for select using (
    user_id = auth.uid()
    or public.current_app_role() in ('staff', 'vendor', 'admin')
  );

create policy "orders_insert_own" on public.orders
  for insert with check (user_id = auth.uid());

create policy "orders_update_staff" on public.orders
  for update using (public.current_app_role() in ('staff', 'admin'));

create policy "orders_update_vendor_food" on public.orders
  for update using (
    public.current_app_role() = 'vendor' and type = 'food'
  );

-- water_order_details
create policy "water_details_select" on public.water_order_details
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.user_id = auth.uid() or public.current_app_role() in ('staff', 'vendor', 'admin'))
    )
  );

create policy "water_details_write_staff" on public.water_order_details
  for all using (public.current_app_role() in ('staff', 'admin'))
  with check (public.current_app_role() in ('staff', 'admin'));

-- daily_menus: mọi người đọc được (kể cả chưa đăng nhập) để hiển thị thực đơn
create policy "menus_select_all" on public.daily_menus
  for select using (true);

create policy "menus_write_vendor" on public.daily_menus
  for all using (public.current_app_role() in ('vendor', 'admin'))
  with check (public.current_app_role() in ('vendor', 'admin'));

-- food_order_details
create policy "food_details_select" on public.food_order_details
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.user_id = auth.uid() or public.current_app_role() in ('staff', 'vendor', 'admin'))
    )
  );

create policy "food_details_insert_own" on public.food_order_details
  for insert with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

create policy "food_details_update_vendor" on public.food_order_details
  for update using (public.current_app_role() in ('vendor', 'admin'));

-- ---------- Realtime ----------
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.daily_menus;

-- ---------- Seed thực đơn ngày mai ----------
insert into public.daily_menus (date, dish_name, description, price, max_quantity, remaining, is_active, nutrition_tags)
values
  (
    current_date + 1,
    'Cơm sườn nướng mật ong',
    'Sườn nướng mật ong, trứng omelette, đồ chua, cơm trắng',
    45000, 40, 40, true, array['Đạm', 'Năng lượng cao']
  ),
  (
    current_date + 1,
    'Bún chả Hà Nội',
    'Bún tươi, chả nướng, nước mắm chua ngọt, rau sống',
    35000, 30, 30, true, array['Đạm', 'Hương vị truyền thống']
  );
