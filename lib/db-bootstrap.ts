import { prisma } from "@/lib/prisma";

declare global {
  // eslint-disable-next-line no-var
  var ensureFeaturedFounderSchemaPromise: Promise<void> | undefined;
  // eslint-disable-next-line no-var
  var ensureGrowthWaveSchemaPromise: Promise<void> | undefined;
  // eslint-disable-next-line no-var
  var ensureBlogPostsSchemaPromise: Promise<void> | undefined;
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
  content text NOT NULL,
  slug text NOT NULL UNIQUE,
  feature_image text NOT NULL,
  image_credit text,
  seo_title text NOT NULL,
  seo_description text NOT NULL,
  word_count integer NOT NULL,
  status "PostStatus" NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
`,
  `
CREATE INDEX IF NOT EXISTS posts_status_created_at_idx
  ON public.posts(status, created_at DESC);
`,
];

const LOCK_KEYS = {
  featured: "db_bootstrap_featured_v1",
  growth: "db_bootstrap_growth_v1",
  blog: "db_bootstrap_blog_v1",
} as const;

async function runStatements(lockKey: string, statements: string[]) {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      `SELECT pg_advisory_xact_lock(hashtext('${lockKey}'));`,
    );

    for (const statement of statements) {
      await tx.$executeRawUnsafe(statement);
    }
  });
}

function cacheBootstrapPromise(
  key:
    | "ensureFeaturedFounderSchemaPromise"
    | "ensureGrowthWaveSchemaPromise"
    | "ensureBlogPostsSchemaPromise",
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
