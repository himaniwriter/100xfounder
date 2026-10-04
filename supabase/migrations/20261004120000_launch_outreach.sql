-- Product Hunt launch discovery, founder outreach, spotlights and Instagram queue.

CREATE TABLE IF NOT EXISTS public.launch_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL DEFAULT 'producthunt',
  external_id text NOT NULL,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  tagline text NOT NULL,
  description text,
  website_url text,
  source_url text NOT NULL,
  thumbnail_url text,
  votes_count integer NOT NULL DEFAULT 0,
  comments_count integer NOT NULL DEFAULT 0,
  topics text[] NOT NULL DEFAULT '{}',
  launched_at timestamptz NOT NULL,
  featured_at timestamptz,
  daily_rank integer,
  selection_reasons text[] NOT NULL DEFAULT '{}',
  is_published boolean NOT NULL DEFAULT true,
  contacts_checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, external_id)
);

CREATE INDEX IF NOT EXISTS launch_products_launched_at_idx
  ON public.launch_products(launched_at DESC);
CREATE INDEX IF NOT EXISTS launch_products_published_idx
  ON public.launch_products(is_published, launched_at DESC);

CREATE TABLE IF NOT EXISTS public.outreach_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.launch_products(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  role text,
  twitter_url text,
  linkedin_url text,
  discovered_from text,
  status text NOT NULL DEFAULT 'new',
  step integer NOT NULL DEFAULT 0,
  next_send_at timestamptz,
  last_sent_at timestamptz,
  replied_at timestamptz,
  token text NOT NULL UNIQUE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, email)
);

CREATE INDEX IF NOT EXISTS outreach_contacts_status_next_idx
  ON public.outreach_contacts(status, next_send_at);
CREATE INDEX IF NOT EXISTS outreach_contacts_email_idx
  ON public.outreach_contacts(email);

CREATE TABLE IF NOT EXISTS public.outreach_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.outreach_contacts(id) ON DELETE CASCADE,
  step integer NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  provider_message_id text,
  status text NOT NULL DEFAULT 'sent',
  error text,
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS outreach_messages_contact_idx
  ON public.outreach_messages(contact_id);
CREATE INDEX IF NOT EXISTS outreach_messages_sent_at_idx
  ON public.outreach_messages(sent_at DESC);

CREATE TABLE IF NOT EXISTS public.outreach_suppressions (
  email text PRIMARY KEY,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.founder_spotlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.launch_products(id) ON DELETE CASCADE,
  contact_id uuid UNIQUE REFERENCES public.outreach_contacts(id) ON DELETE SET NULL,
  slug text NOT NULL UNIQUE,
  founder_name text NOT NULL,
  role text,
  email text NOT NULL,
  photo_url text,
  location text,
  story_origin text NOT NULL,
  story_problem text NOT NULL,
  story_traction text,
  story_advice text,
  story_next text,
  twitter_url text,
  linkedin_url text,
  instagram_handle text,
  consent_website boolean NOT NULL DEFAULT false,
  consent_instagram boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'submitted',
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS founder_spotlights_status_idx
  ON public.founder_spotlights(status, published_at DESC);

CREATE TABLE IF NOT EXISTS public.instagram_queue_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  ref_key text NOT NULL UNIQUE,
  title text NOT NULL,
  caption text NOT NULL,
  slide_count integer NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'ready',
  posted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS instagram_queue_items_status_idx
  ON public.instagram_queue_items(status, created_at DESC);
