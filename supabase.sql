-- Jalankan seluruh SQL ini di Supabase SQL Editor.
-- Database ini menggunakan user_id + RLS sehingga setiap akun hanya melihat datanya sendiri.

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  code text not null,
  stock integer not null default 0 check (stock >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete restrict,
  item_name text not null,
  type text not null check (type in ('in','out')),
  qty integer not null check (qty > 0),
  note text,
  date_key date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.closings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  closing_date date not null,
  item_count integer not null,
  total_stock integer not null,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.items enable row level security;
alter table public.transactions enable row level security;
alter table public.closings enable row level security;

drop policy if exists "items_select_own" on public.items;
drop policy if exists "items_insert_own" on public.items;
drop policy if exists "items_update_own" on public.items;
drop policy if exists "items_delete_own" on public.items;

create policy "items_select_own" on public.items for select to authenticated using ((select auth.uid()) = user_id);
create policy "items_insert_own" on public.items for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "items_update_own" on public.items for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "items_delete_own" on public.items for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "tx_select_own" on public.transactions;
drop policy if exists "tx_insert_own" on public.transactions;

create policy "tx_select_own" on public.transactions for select to authenticated using ((select auth.uid()) = user_id);
create policy "tx_insert_own" on public.transactions for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "closing_select_own" on public.closings;
drop policy if exists "closing_insert_own" on public.closings;

create policy "closing_select_own" on public.closings for select to authenticated using ((select auth.uid()) = user_id);
create policy "closing_insert_own" on public.closings for insert to authenticated with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.items to authenticated;
grant select, insert on public.transactions to authenticated;
grant select, insert on public.closings to authenticated;

create index if not exists items_user_id_idx on public.items(user_id);
create index if not exists transactions_user_id_idx on public.transactions(user_id);
create index if not exists closings_user_id_idx on public.closings(user_id);