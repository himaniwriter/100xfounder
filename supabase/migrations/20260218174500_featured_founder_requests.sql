do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'featured_plan'
  ) then
    create type featured_plan as enum ('starter', 'growth', 'priority');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'featured_request_status'
  ) then
    create type featured_request_status as enum (
      'new',
      'in_review',
      'approved',
      'rejected',
      'published'
    );
  end if;
end
$$;

create table if not exists public.featured_founder_requests (
  id uuid primary key default gen_random_uuid(),
  founder_name text not null,
  work_email text not null,
  company_name text not null,
  website_url text,
  linkedin_url text,
  country text,
  industry text,
  stage text,
  product_summary text not null,
  funding_info text,
  plan featured_plan not null,
  price_inr integer not null,
  price_usd integer not null,
  source text not null default 'n8n_embed',
  external_submission_id text unique,
  status featured_request_status not null default 'new',
  review_notes text,
  published_founder_entry_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists featured_founder_requests_status_created_at_idx
  on public.featured_founder_requests(status, created_at desc);

create index if not exists featured_founder_requests_work_email_idx
  on public.featured_founder_requests(work_email);

create index if not exists featured_founder_requests_company_name_idx
  on public.featured_founder_requests(company_name);
