import { prisma } from "@/lib/prisma";

declare global {
  // eslint-disable-next-line no-var
  var ensureFeaturedFounderSchemaPromise: Promise<void> | undefined;
  // eslint-disable-next-line no-var
  var ensureGrowthWaveSchemaPromise: Promise<void> | undefined;
  // eslint-disable-next-line no-var
  var ensureBlogPostsSchemaPromise: Promise<void> | undefined;
  // eslint-disable-next-line no-var
  var ensureJobPostingsSchemaPromise: Promise<void> | undefined;
  // eslint-disable-next-line no-var
  var ensureOutreachFunnelSchemaPromise: Promise<void> | undefined;
  // eslint-disable-next-line no-var
  var ensureDashboardRetentionSchemaPromise: Promise<void> | undefined;
}

const FEATURED_SCHEMA_STATEMENTS = [
  `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'featured_plan'
  ) THEN
    CREATE TYPE featured_plan AS ENUM ('starter', 'growth', 'priority');
  END IF;
END
$$;
`,
  `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'featured_request_status'
  ) THEN
    CREATE TYPE featured_request_status AS ENUM (
      'new',
      'in_review',
      'approved',
      'rejected',
      'published'
    );
  END IF;
END
$$;
`,
  `
CREATE TABLE IF NOT EXISTS public.featured_founder_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_name text NOT NULL,
  work_email text NOT NULL,
  company_name text NOT NULL,
  website_url text,
  linkedin_url text,
  country text,
  industry text,
  stage text,
  product_summary text NOT NULL,
  funding_info text,
  plan featured_plan NOT NULL,
  price_inr integer NOT NULL,
  price_usd integer NOT NULL,
  source text NOT NULL DEFAULT 'n8n_embed',
  external_submission_id text UNIQUE,
  status featured_request_status NOT NULL DEFAULT 'new',
  review_notes text,
  published_founder_entry_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
`,
  `
CREATE INDEX IF NOT EXISTS featured_founder_requests_status_created_at_idx
  ON public.featured_founder_requests(status, created_at DESC);
`,
  `
CREATE INDEX IF NOT EXISTS featured_founder_requests_work_email_idx
  ON public.featured_founder_requests(work_email);
`,
  `
CREATE INDEX IF NOT EXISTS featured_founder_requests_company_name_idx
  ON public.featured_founder_requests(company_name);
`,
];

const GROWTH_WAVE_STATEMENTS = [
  `
CREATE TABLE IF NOT EXISTS public.pricing_waitlist_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  work_email text NOT NULL,
  intent text NOT NULL,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  source text NOT NULL DEFAULT 'pricing_page',
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
`,
  `
CREATE TABLE IF NOT EXISTS public.site_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  path text NOT NULL,
  referrer text,
  session_id text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
`,
  `
CREATE INDEX IF NOT EXISTS site_events_event_name_created_at_idx
  ON public.site_events(event_name, created_at DESC);
`,
  `
CREATE INDEX IF NOT EXISTS site_events_path_idx
  ON public.site_events(path);
`,
  `
CREATE INDEX IF NOT EXISTS pricing_waitlist_requests_created_at_idx
  ON public.pricing_waitlist_requests(created_at DESC);
`,
  `
CREATE INDEX IF NOT EXISTS pricing_waitlist_requests_work_email_idx
  ON public.pricing_waitlist_requests(work_email);
`,
];

const DASHBOARD_RETENTION_STATEMENTS = [
  `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'watchlist_entity_type'
  ) THEN
    CREATE TYPE watchlist_entity_type AS ENUM ('founder', 'company', 'topic');
  END IF;
END
$$;
`,
  `
CREATE TABLE IF NOT EXISTS public.user_watchlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  entity_type watchlist_entity_type NOT NULL,
  entity_slug text NOT NULL,
  entity_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, entity_type, entity_slug)
);
`,
  `
CREATE TABLE IF NOT EXISTS public.user_saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  query text NOT NULL,
  search_type text NOT NULL,
  filters_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, query, search_type)
);
`,
  `
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  target_url text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
`,
  `
CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  instant_email boolean NOT NULL DEFAULT false,
  daily_digest boolean NOT NULL DEFAULT true,
  weekly_digest boolean NOT NULL DEFAULT false,
  premium_opt_in boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
`,
  `
CREATE INDEX IF NOT EXISTS user_watchlist_items_user_id_created_at_idx
  ON public.user_watchlist_items(user_id, created_at DESC);
`,
  `
CREATE INDEX IF NOT EXISTS user_saved_searches_user_id_created_at_idx
  ON public.user_saved_searches(user_id, created_at DESC);
`,
  `
CREATE INDEX IF NOT EXISTS user_notifications_user_id_is_read_created_at_idx
  ON public.user_notifications(user_id, is_read, created_at DESC);
`,
];

const BLOG_POSTS_STATEMENTS = [
  `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'PostStatus'
  ) THEN
    CREATE TYPE "PostStatus" AS ENUM ('draft', 'published');
  END IF;
END
$$;
`,
  `
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  content text NOT NULL,
  slug text NOT NULL UNIQUE,
  article_type text NOT NULL DEFAULT 'analysis',
  topic_slug text,
  feature_image text NOT NULL,
  image_credit text,
  author text NOT NULL DEFAULT '100Xfounder Research',
  author_id uuid,
  canonical_url text,
  source_urls_json jsonb,
  fact_check_status text NOT NULL DEFAULT 'pending_review',
  correction_note text,
  discover_ready boolean NOT NULL DEFAULT false,
  social_image_url text,
  seo_title text NOT NULL,
  seo_description text NOT NULL,
  word_count integer NOT NULL,
  status "PostStatus" NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
`,
  `
ALTER TABLE IF EXISTS public.posts
  ADD COLUMN IF NOT EXISTS author text;
`,
  `
ALTER TABLE IF EXISTS public.posts
  ADD COLUMN IF NOT EXISTS subtitle text,
  ADD COLUMN IF NOT EXISTS article_type text,
  ADD COLUMN IF NOT EXISTS topic_slug text,
  ADD COLUMN IF NOT EXISTS author_id uuid,
  ADD COLUMN IF NOT EXISTS canonical_url text,
  ADD COLUMN IF NOT EXISTS source_urls_json jsonb,
  ADD COLUMN IF NOT EXISTS fact_check_status text,
  ADD COLUMN IF NOT EXISTS correction_note text,
  ADD COLUMN IF NOT EXISTS discover_ready boolean,
  ADD COLUMN IF NOT EXISTS social_image_url text,
  ADD COLUMN IF NOT EXISTS faq_schema jsonb,
  ADD COLUMN IF NOT EXISTS howto_schema jsonb,
  ADD COLUMN IF NOT EXISTS faq_added boolean,
  ADD COLUMN IF NOT EXISTS howto_added boolean,
  ADD COLUMN IF NOT EXISTS published_at timestamptz;
`,
  `
UPDATE public.posts
SET author = '100Xfounder Research'
WHERE author IS NULL;
`,
  `
UPDATE public.posts
SET article_type = 'analysis'
WHERE article_type IS NULL;
`,
  `
UPDATE public.posts
SET fact_check_status = 'pending_review'
WHERE fact_check_status IS NULL;
`,
  `
UPDATE public.posts
SET discover_ready = false
WHERE discover_ready IS NULL;
`,
  `
UPDATE public.posts
SET faq_added = false
WHERE faq_added IS NULL;
`,
  `
UPDATE public.posts
SET howto_added = false
WHERE howto_added IS NULL;
`,
  `
UPDATE public.posts
SET published_at = created_at
WHERE published_at IS NULL AND status = 'published';
`,
  `
ALTER TABLE IF EXISTS public.posts
  ALTER COLUMN author SET DEFAULT '100Xfounder Research',
  ALTER COLUMN author SET NOT NULL,
  ALTER COLUMN article_type SET DEFAULT 'analysis',
  ALTER COLUMN article_type SET NOT NULL,
  ALTER COLUMN fact_check_status SET DEFAULT 'pending_review',
  ALTER COLUMN fact_check_status SET NOT NULL,
  ALTER COLUMN discover_ready SET DEFAULT false,
  ALTER COLUMN discover_ready SET NOT NULL,
  ALTER COLUMN faq_added SET DEFAULT false,
  ALTER COLUMN faq_added SET NOT NULL,
  ALTER COLUMN howto_added SET DEFAULT false,
  ALTER COLUMN howto_added SET NOT NULL;
`,
  `
CREATE TABLE IF NOT EXISTS public.authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  bio text,
  role text,
  avatar_url text,
  same_as_json jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
`,
  `
CREATE TABLE IF NOT EXISTS public.post_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  change_type text NOT NULL,
  note text,
  changed_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);
`,
  `
CREATE TABLE IF NOT EXISTS public.post_citations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  source_name text NOT NULL,
  source_url text NOT NULL,
  source_title text NOT NULL,
  quoted_claim text,
  created_at timestamptz NOT NULL DEFAULT now()
);
`,
  `
CREATE INDEX IF NOT EXISTS posts_status_created_at_idx
  ON public.posts(status, created_at DESC);
`,
  `
CREATE INDEX IF NOT EXISTS posts_published_at_status_idx
  ON public.posts(published_at DESC, status);
`,
  `
CREATE INDEX IF NOT EXISTS posts_topic_slug_published_at_idx
  ON public.posts(topic_slug, published_at DESC);
`,
  `
CREATE INDEX IF NOT EXISTS posts_author_id_idx
  ON public.posts(author_id);
`,
  `
CREATE INDEX IF NOT EXISTS authors_is_active_idx
  ON public.authors(is_active);
`,
  `
CREATE INDEX IF NOT EXISTS post_updates_post_id_created_at_idx
  ON public.post_updates(post_id, created_at DESC);
`,
  `
CREATE INDEX IF NOT EXISTS post_citations_post_id_idx
  ON public.post_citations(post_id);
`,
  `
CREATE INDEX IF NOT EXISTS post_citations_source_url_idx
  ON public.post_citations(source_url);
`,
];

const JOB_POSTINGS_STATEMENTS = [
  `
CREATE TABLE IF NOT EXISTS public.job_postings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  company_name text NOT NULL,
  company_website text,
  location text,
  country text,
  job_type text,
  work_mode text,
  experience_level text,
  salary_range text,
  currency text,
  description text NOT NULL,
  requirements text,
  apply_url text NOT NULL,
  application_email text,
  industry text,
  source text NOT NULL DEFAULT 'n8n_webhook',
  external_submission_id text UNIQUE,
  status text NOT NULL DEFAULT 'draft',
  posted_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT job_postings_status_check CHECK (status IN ('draft', 'published', 'rejected'))
);
`,
  `
CREATE INDEX IF NOT EXISTS job_postings_status_created_at_idx
  ON public.job_postings(status, created_at DESC);
`,
  `
CREATE INDEX IF NOT EXISTS job_postings_company_name_idx
  ON public.job_postings(company_name);
`,
  `
CREATE INDEX IF NOT EXISTS job_postings_country_idx
  ON public.job_postings(country);
`,
];

const OUTREACH_FUNNEL_STATEMENTS = [
  `
CREATE TABLE IF NOT EXISTS public.interview_questionnaire_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  featured_request_id uuid REFERENCES public.featured_founder_requests(id) ON DELETE SET NULL,
  founder_name text NOT NULL,
  work_email text NOT NULL,
  company_name text NOT NULL,
  responses_json jsonb NOT NULL,
  asset_links_json jsonb,
  external_submission_id text UNIQUE,
  status text NOT NULL DEFAULT 'new',
  source text NOT NULL DEFAULT 'site_form',
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
`,
  `
ALTER TABLE IF EXISTS public.interview_questionnaire_submissions
  ADD COLUMN IF NOT EXISTS external_submission_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS review_notes text;
`,
  `
CREATE INDEX IF NOT EXISTS interview_questionnaire_submissions_status_created_at_idx
  ON public.interview_questionnaire_submissions(status, created_at DESC);
`,
  `
CREATE INDEX IF NOT EXISTS interview_questionnaire_submissions_work_email_idx
  ON public.interview_questionnaire_submissions(work_email);
`,
  `
CREATE INDEX IF NOT EXISTS interview_questionnaire_submissions_company_name_idx
  ON public.interview_questionnaire_submissions(company_name);
`,
  `
CREATE INDEX IF NOT EXISTS interview_questionnaire_submissions_featured_request_id_idx
  ON public.interview_questionnaire_submissions(featured_request_id);
`,
  `
CREATE TABLE IF NOT EXISTS public.guest_post_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  work_email text NOT NULL,
  company_name text NOT NULL,
  website_url text,
  target_url text,
  topic text NOT NULL,
  brief text NOT NULL,
  budget_inr integer,
  package_key text,
  source text NOT NULL DEFAULT 'site_form',
  external_submission_id text UNIQUE,
  status text NOT NULL DEFAULT 'new',
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
`,
  `
ALTER TABLE IF EXISTS public.guest_post_orders
  ADD COLUMN IF NOT EXISTS review_notes text;
`,
  `
CREATE INDEX IF NOT EXISTS guest_post_orders_status_created_at_idx
  ON public.guest_post_orders(status, created_at DESC);
`,
  `
CREATE INDEX IF NOT EXISTS guest_post_orders_work_email_idx
  ON public.guest_post_orders(work_email);
`,
  `
CREATE INDEX IF NOT EXISTS guest_post_orders_company_name_idx
  ON public.guest_post_orders(company_name);
`,
  `
CREATE TABLE IF NOT EXISTS public.instagram_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_post_id text NOT NULL UNIQUE,
  caption text,
  media_url text NOT NULL,
  permalink text NOT NULL,
  thumbnail_url text,
  posted_at timestamptz NOT NULL,
  ingested_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
`,
  `
CREATE INDEX IF NOT EXISTS instagram_posts_posted_at_idx
  ON public.instagram_posts(posted_at DESC);
`,
];

const LOCK_KEYS = {
  featured: "db_bootstrap_featured_v1",
  growth: "db_bootstrap_growth_v1",
  dashboardRetention: "db_bootstrap_dashboard_retention_v1",
  blog: "db_bootstrap_blog_v1",
  jobs: "db_bootstrap_jobs_v1",
  outreach: "db_bootstrap_outreach_v1",
} as const;

async function runStatements(lockKey: string, statements: string[]) {
  await prisma.$transaction(
    async (tx) => {
      await tx.$executeRawUnsafe(
        `SELECT pg_advisory_xact_lock(hashtext('${lockKey}'));`,
      );

      for (const statement of statements) {
        await tx.$executeRawUnsafe(statement);
      }
    },
    {
      // DDL bootstrap can wait on advisory lock under concurrent ISR/static generation.
      maxWait: 120_000,
      timeout: 120_000,
    },
  );
}

function cacheBootstrapPromise(
  key:
    | "ensureFeaturedFounderSchemaPromise"
    | "ensureGrowthWaveSchemaPromise"
    | "ensureBlogPostsSchemaPromise"
    | "ensureJobPostingsSchemaPromise"
    | "ensureOutreachFunnelSchemaPromise"
    | "ensureDashboardRetentionSchemaPromise",
  loader: () => Promise<void>,
) {
  if (!globalThis[key]) {
    globalThis[key] = loader().catch((error) => {
      globalThis[key] = undefined;
      throw error;
    });
  }

  return globalThis[key]!;
}

export function ensureFeaturedFounderSchema() {
  return cacheBootstrapPromise(
    "ensureFeaturedFounderSchemaPromise",
    () => runStatements(LOCK_KEYS.featured, FEATURED_SCHEMA_STATEMENTS),
  );
}

export function ensureGrowthWaveSchema() {
  return cacheBootstrapPromise(
    "ensureGrowthWaveSchemaPromise",
    () => runStatements(LOCK_KEYS.growth, GROWTH_WAVE_STATEMENTS),
  );
}

export function ensureBlogPostsSchema() {
  return cacheBootstrapPromise(
    "ensureBlogPostsSchemaPromise",
    () => runStatements(LOCK_KEYS.blog, BLOG_POSTS_STATEMENTS),
  );
}

export function ensureJobPostingsSchema() {
  return cacheBootstrapPromise(
    "ensureJobPostingsSchemaPromise",
    () => runStatements(LOCK_KEYS.jobs, JOB_POSTINGS_STATEMENTS),
  );
}

export function ensureOutreachFunnelSchema() {
  return cacheBootstrapPromise(
    "ensureOutreachFunnelSchemaPromise",
    () => runStatements(LOCK_KEYS.outreach, OUTREACH_FUNNEL_STATEMENTS),
  );
}

export function ensureDashboardRetentionSchema() {
  return cacheBootstrapPromise(
    "ensureDashboardRetentionSchemaPromise",
    () => runStatements(LOCK_KEYS.dashboardRetention, DASHBOARD_RETENTION_STATEMENTS),
  );
}
