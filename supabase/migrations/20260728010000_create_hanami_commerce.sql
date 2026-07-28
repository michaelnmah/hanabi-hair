create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  texture text not null,
  price_gbp integer not null check (price_gbp > 0),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text unique,
  customer_email text,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'fulfilled', 'cancelled', 'refunded')),
  currency text not null default 'gbp'
    check (currency = 'gbp'),
  total_gbp integer not null check (total_gbp >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_slug text not null,
  product_name text not null,
  unit_price_gbp integer not null check (unit_price_gbp > 0),
  quantity integer not null check (quantity between 1 and 10),
  created_at timestamptz not null default now()
);

create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text not null default 'website',
  created_at timestamptz not null default now()
);

create index if not exists orders_stripe_session_id_idx
  on public.orders (stripe_session_id);

create index if not exists order_items_order_id_idx
  on public.order_items (order_id);

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.subscribers enable row level security;

revoke all on table public.products from anon, authenticated;
revoke all on table public.orders from anon, authenticated;
revoke all on table public.order_items from anon, authenticated;
revoke all on table public.subscribers from anon, authenticated;

grant select on table public.products to anon, authenticated;
grant select, insert, update, delete on table public.products to service_role;
grant select, insert, update, delete on table public.orders to service_role;
grant select, insert, update, delete on table public.order_items to service_role;
grant select, insert, update, delete on table public.subscribers to service_role;

drop policy if exists "Public can view active products" on public.products;
create policy "Public can view active products"
  on public.products
  for select
  to anon, authenticated
  using (active = true);

insert into public.products
  (slug, name, description, texture, price_gbp, active, sort_order)
values
  (
    'silk-straight',
    'Silk Straight',
    'Polished, fluid strands with an effortless natural fall.',
    'Straight',
    95,
    true,
    1
  ),
  (
    'body-wave',
    'Body Wave',
    'Soft, sculpted movement with luminous, touchable body.',
    'Body wave',
    110,
    true,
    2
  ),
  (
    'deep-wave',
    'Deep Wave',
    'Defined, romantic waves designed to hold their character.',
    'Deep wave',
    125,
    true,
    3
  )
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  texture = excluded.texture,
  price_gbp = excluded.price_gbp,
  active = excluded.active,
  sort_order = excluded.sort_order,
  updated_at = now();

