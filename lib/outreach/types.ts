export type LeadSource = "instagram" | "whatsapp" | "site_form" | "n8n_embed";

export type InterviewSubmissionPayload = {
  featured_request_id?: string;
  founder_name: string;
  work_email: string;
  company_name: string;
  responses: Record<string, string>;
  asset_links?: string[];
  source?: LeadSource | string;
  external_submission_id?: string;
};

export type GuestPostOrderPayload = {
  name: string;
  work_email: string;
  company_name: string;
  website_url?: string;
  target_url?: string;
  topic: string;
  brief: string;
  budget_inr?: number;
  package_key?: string;
  source?: LeadSource | string;
  external_submission_id?: string;
};

export type InstagramFeedItem = {
  id: string;
  external_post_id: string;
  caption: string | null;
  media_url: string;
  permalink: string;
  thumbnail_url: string | null;
  posted_at: string;
  ingested_at: string;
};
