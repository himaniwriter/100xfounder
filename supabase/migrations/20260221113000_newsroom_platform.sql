alter table if exists public.posts
  add column if not exists subtitle text,
  add column if not exists article_type text,
  add column if not exists topic_slug text,
  add column if not exists author_id uuid,
  add column if not exists canonical_url text,
  add column if not exists source_urls_json jsonb,
  add column if not exists fact_check_status text,
  add column if not exists correction_note text,
  add column if not exists discover_ready boolean,
  add column if not exists social_image_url text,
  add column if not exists published_at timestamptz;

update public.posts
set article_type = 'analysis'
where article_type is null;

update public.posts
set fact_check_status = 'pending_review'
where fact_check_status is null;

update public.posts
set discover_ready = false
where discover_ready is null;

update public.posts
set published_at = created_at
where published_at is null and status = 'published';

alter table if exists public.posts
  alter column article_type set default 'analysis',
  alter column article_type set not null,
  alter column fact_check_status set default 'pending_review',
  alter column fact_check_status set not null,
  alter column discover_ready set default false,
  alter column discover_ready set not null;

create table if not exists public.authors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  bio text,
  role text,
  avatar_url text,
  same_as_json jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.post_updates (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  change_type text not null,
  note text,
  changed_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.post_citations (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  source_name text not null,
  source_url text not null,
  source_title text not null,
  quoted_claim text,
  created_at timestamptz not null default now()
);

create index if not exists posts_published_at_status_idx
  on public.posts(published_at desc, status);

create index if not exists posts_topic_slug_published_at_idx
  on public.posts(topic_slug, published_at desc);

create index if not exists posts_author_id_idx
  on public.posts(author_id);

create index if not exists authors_is_active_idx
  on public.authors(is_active);

create index if not exists post_updates_post_id_created_at_idx
  on public.post_updates(post_id, created_at desc);

create index if not exists post_citations_post_id_idx
  on public.post_citations(post_id);

create index if not exists post_citations_source_url_idx
  on public.post_citations(source_url);
