-- Waymark metrics table + row level security.
-- Lightweight product metrics (session starts, offline model loads).
-- Run this in the Supabase SQL editor (or via supabase db push).

create table if not exists public.metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  event text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.metrics enable row level security;

-- Write-only from the client: authenticated users can insert their own rows.
-- No select, update, or delete policies on purpose.
create policy "metrics_insert_own" on public.metrics
  for insert to authenticated with check (auth.uid() = user_id);
