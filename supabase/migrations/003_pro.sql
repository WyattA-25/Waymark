-- Waymark Pro: subscriptions (entitlement) + maintenance log.
-- Run in the Supabase SQL editor after 001 and 002.

-- Entitlement. Users can READ their own plan but never write it: there are
-- deliberately no insert/update/delete policies for authenticated users, so
-- only the service role (Stripe webhook later, SQL editor for now) can
-- change a plan.
create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  status text not null default 'active' check (status in ('active', 'canceled', 'past_due')),
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);

-- Maintenance log (Pro feature). Full CRUD on your own rows.
create table if not exists public.maintenance_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  category text not null default 'General',
  notes text,
  due_date date,
  repeat_months int check (repeat_months is null or repeat_months between 1 and 60),
  last_done date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists maintenance_items_user_due
  on public.maintenance_items (user_id, due_date);

alter table public.maintenance_items enable row level security;

create policy "maintenance_select_own" on public.maintenance_items
  for select using (auth.uid() = user_id);
create policy "maintenance_insert_own" on public.maintenance_items
  for insert with check (auth.uid() = user_id);
create policy "maintenance_update_own" on public.maintenance_items
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "maintenance_delete_own" on public.maintenance_items
  for delete using (auth.uid() = user_id);

-- To grant an account Pro manually until Stripe exists, run:
-- insert into public.subscriptions (user_id, plan, status)
--   values ('<auth user id>', 'pro', 'active')
--   on conflict (user_id) do update set plan = 'pro', status = 'active', updated_at = now();
