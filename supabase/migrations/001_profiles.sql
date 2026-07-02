-- Waymark profiles table + row level security.
-- Run this in the Supabase SQL editor (or via supabase db push) on a fresh project.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  year text,
  make text,
  model text,
  floor_plan text,
  length text,
  height text,
  subs text[] default '{}',
  first_time_buyer boolean default false,
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Owners can read and write only their own row
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
