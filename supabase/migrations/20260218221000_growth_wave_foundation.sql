create table if not exists public.pricing_waitlist_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  work_email text not null,
  intent text not null,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  source text not null default 'pricing_page',
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  path text not null,
  referrer text,
  session_id text,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists site_events_event_name_created_at_idx
  on public.site_events(event_name, created_at desc);

create index if not exists site_events_path_idx
  on public.site_events(path);

create index if not exists pricing_waitlist_requests_created_at_idx
  on public.pricing_waitlist_requests(created_at desc);

create index if not exists pricing_waitlist_requests_work_email_idx
  on public.pricing_waitlist_requests(work_email);
