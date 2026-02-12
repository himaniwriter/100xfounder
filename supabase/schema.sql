-- 100Xfounder Supabase baseline schema and secure RLS policies
-- This file intentionally avoids any `USING (true)` write policies.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  bio text,
  location text,
  linkedin_url text,
  twitter_url text,
  website_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.founder_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  slug text not null unique,
  status text not null default 'PENDING',
  company_name text,
  industry text,
  stage text,
  product_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.claim_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  founder_profile_id uuid not null references public.founder_profiles (id) on delete cascade,
  message text,
  status text not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, founder_profile_id)
);

alter table public.profiles enable row level security;
alter table public.founder_profiles enable row level security;
alter table public.claim_requests enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can delete own profile" on public.profiles;

create policy "Users can read own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can delete own profile"
  on public.profiles
  for delete
  using (auth.uid() = id);

drop policy if exists "Users can read own founder profile" on public.founder_profiles;
drop policy if exists "Users can insert own founder profile" on public.founder_profiles;
drop policy if exists "Users can update own founder profile" on public.founder_profiles;
drop policy if exists "Users can delete own founder profile" on public.founder_profiles;

create policy "Users can read own founder profile"
  on public.founder_profiles
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own founder profile"
  on public.founder_profiles
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own founder profile"
  on public.founder_profiles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own founder profile"
  on public.founder_profiles
  for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read own claim requests" on public.claim_requests;
drop policy if exists "Users can insert own claim requests" on public.claim_requests;
drop policy if exists "Users can update own pending claim requests" on public.claim_requests;
drop policy if exists "Users can delete own claim requests" on public.claim_requests;

create policy "Users can read own claim requests"
  on public.claim_requests
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own claim requests"
  on public.claim_requests
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own pending claim requests"
  on public.claim_requests
  for update
  using (auth.uid() = user_id and status = 'PENDING')
  with check (auth.uid() = user_id and status = 'PENDING');

create policy "Users can delete own claim requests"
  on public.claim_requests
  for delete
  using (auth.uid() = user_id);
