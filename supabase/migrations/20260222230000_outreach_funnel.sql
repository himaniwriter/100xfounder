create table if not exists public.interview_questionnaire_submissions (
  id uuid primary key default gen_random_uuid(),
  featured_request_id uuid references public.featured_founder_requests(id) on delete set null,
  founder_name text not null,
  work_email text not null,
  company_name text not null,
  responses_json jsonb not null,
  asset_links_json jsonb,
  external_submission_id text unique,
  status text not null default 'new',
  source text not null default 'site_form',
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists interview_questionnaire_submissions_status_created_at_idx
  on public.interview_questionnaire_submissions(status, created_at desc);

create index if not exists interview_questionnaire_submissions_work_email_idx
  on public.interview_questionnaire_submissions(work_email);

create index if not exists interview_questionnaire_submissions_company_name_idx
  on public.interview_questionnaire_submissions(company_name);

create index if not exists interview_questionnaire_submissions_featured_request_id_idx
  on public.interview_questionnaire_submissions(featured_request_id);

create table if not exists public.guest_post_orders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  work_email text not null,
  company_name text not null,
  website_url text,
  target_url text,
  topic text not null,
  brief text not null,
  budget_inr integer,
  package_key text,
  source text not null default 'site_form',
  external_submission_id text unique,
  status text not null default 'new',
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists guest_post_orders_status_created_at_idx
  on public.guest_post_orders(status, created_at desc);

create index if not exists guest_post_orders_work_email_idx
  on public.guest_post_orders(work_email);

create index if not exists guest_post_orders_company_name_idx
  on public.guest_post_orders(company_name);

create table if not exists public.instagram_posts (
  id uuid primary key default gen_random_uuid(),
  external_post_id text not null unique,
  caption text,
  media_url text not null,
  permalink text not null,
  thumbnail_url text,
  posted_at timestamptz not null,
  ingested_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists instagram_posts_posted_at_idx
  on public.instagram_posts(posted_at desc);
