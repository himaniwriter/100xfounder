do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'PostStatus'
  ) then
    create type "PostStatus" as enum ('draft', 'published');
  end if;
end
$$;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  slug text not null unique,
  feature_image text not null,
  image_credit text,
  seo_title text not null,
  seo_description text not null,
  word_count integer not null,
  status "PostStatus" not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_status_created_at_idx
  on public.posts(status, created_at desc);
