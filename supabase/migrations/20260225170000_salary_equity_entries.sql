CREATE TABLE IF NOT EXISTS public.salary_equity_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  level text,
  location text,
  country text,
  stage text,
  base_min integer,
  base_max integer,
  currency text NOT NULL DEFAULT 'USD',
  equity_min_bps integer,
  equity_max_bps integer,
  source text NOT NULL DEFAULT 'n8n_webhook',
  source_url text,
  external_submission_id text UNIQUE,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT salary_equity_status_check CHECK (status IN ('draft', 'published', 'rejected'))
);

CREATE INDEX IF NOT EXISTS salary_equity_entries_status_created_at_idx
  ON public.salary_equity_entries(status, created_at DESC);

CREATE INDEX IF NOT EXISTS salary_equity_entries_location_idx
  ON public.salary_equity_entries(location);

CREATE INDEX IF NOT EXISTS salary_equity_entries_role_idx
  ON public.salary_equity_entries(role);

CREATE INDEX IF NOT EXISTS salary_equity_entries_stage_idx
  ON public.salary_equity_entries(stage);
