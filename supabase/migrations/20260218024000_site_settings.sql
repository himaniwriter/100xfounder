create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (key, value, updated_at)
values ('global', '{}'::jsonb, now())
on conflict (key) do nothing;
