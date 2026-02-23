do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'watchlist_entity_type'
  ) then
    create type watchlist_entity_type as enum ('founder', 'company', 'topic');
  end if;
end
$$;

create table if not exists public.user_watchlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  entity_type watchlist_entity_type not null,
  entity_slug text not null,
  entity_name text not null,
  created_at timestamptz not null default now(),
  unique(user_id, entity_type, entity_slug)
);

create table if not exists public.user_saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  query text not null,
  search_type text not null,
  filters_json jsonb,
  created_at timestamptz not null default now(),
  unique(user_id, query, search_type)
);

create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null,
  target_url text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.user_notification_preferences (
  user_id uuid primary key references public.users(id) on delete cascade,
  instant_email boolean not null default false,
  daily_digest boolean not null default true,
  weekly_digest boolean not null default false,
  premium_opt_in boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists user_watchlist_items_user_id_created_at_idx
  on public.user_watchlist_items(user_id, created_at desc);

create index if not exists user_saved_searches_user_id_created_at_idx
  on public.user_saved_searches(user_id, created_at desc);

create index if not exists user_notifications_user_id_is_read_created_at_idx
  on public.user_notifications(user_id, is_read, created_at desc);
