import { timingSafeEqual } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureJobPostingsSchema } from "@/lib/db-bootstrap";
import { isDatabaseConfigured, toPublicDatabaseError } from "@/lib/db-config";
import { slugify } from "@/lib/blog/post-utils";
import { prisma } from "@/lib/prisma";
import { isAuthorizedN8nWebhook } from "@/lib/security/webhooks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const jobsPayloadSchema = z.object({
  title: z.string().trim().min(4).max(220),
  company_name: z.string().trim().min(2).max(160),
  company_website: z.string().trim().url().optional(),
  location: z.string().trim().max(160).optional(),
  country: z.string().trim().max(120).optional(),
  job_type: z.string().trim().max(80).optional(),
  work_mode: z.string().trim().max(80).optional(),
  experience_level: z.string().trim().max(120).optional(),
  salary_range: z.string().trim().max(120).optional(),
  currency: z.string().trim().max(16).optional(),
  description: z.string().trim().min(40).max(25000),
  requirements: z.string().trim().max(25000).optional(),
  apply_url: z.string().trim().url(),
  application_email: z.string().trim().email().optional(),
  industry: z.string().trim().max(120).optional(),
  external_submission_id: z.string().trim().max(160).optional(),
  source: z.string().trim().max(80).optional(),
  status: z.enum(["draft", "published", "rejected"]).optional(),
  posted_at: z.string().datetime().optional(),
  expires_at: z.string().datetime().optional(),
});

function safeCompareSecret(provided: string, expected: string): boolean {
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

async function isAuthorizedRequest(request: Request): Promise<boolean> {
  const explicitSecret = process.env.N8N_JOBS_SECRET?.trim() || "";
  const headerSecret =
    request.headers.get("x-secret-key")?.trim() ||
    request.headers.get("x-n8n-secret")?.trim() ||
    "";

  if (explicitSecret) {
    return Boolean(headerSecret) && safeCompareSecret(headerSecret, explicitSecret);
  }

  return isAuthorizedN8nWebhook(request.headers);
}

function normalizeStatus(value: string | undefined): "draft" | "published" | "rejected" {
  if (value === "published" || value === "rejected") {
    return value;
  }
  return "draft";
}

async function buildUniqueJobSlug(baseValue: string): Promise<string> {
  const baseSlug = slugify(baseValue) || "job-posting";
  let candidate = baseSlug;
  let suffix = 1;

  while (true) {
    const rows = await prisma.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`SELECT id FROM public.job_postings WHERE slug = ${candidate} LIMIT 1`,
    );
    if (rows.length === 0) {
      return candidate;
    }
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

type SavedJobRow = {
  id: string;
  title: string;
  slug: string;
  company_name: string;
  apply_url: string;
  status: string;
  external_submission_id: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

function mapSavedJob(row: SavedJobRow) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    company_name: row.company_name,
    apply_url: row.apply_url,
    status: row.status,
    external_submission_id: row.external_submission_id,
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString(),
  };
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: "Database is not configured. Add DATABASE_URL in .env.local, then restart the server.",
      },
      { status: 500 },
    );
  }

  if (!(await isAuthorizedRequest(request))) {
    return NextResponse.json(
      { success: false, error: "Unauthorized." },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = jobsPayloadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid jobs webhook payload.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  await ensureJobPostingsSchema();

  const payload = parsed.data;
  const title = payload.title.trim();
  const companyName = payload.company_name.trim();
  const externalSubmissionId = payload.external_submission_id?.trim() || null;
  const status = normalizeStatus(payload.status);
  const source = payload.source?.trim() || "n8n_webhook";

  try {
    const saved = await prisma.$transaction(async (tx) => {
      let slug: string;

      if (externalSubmissionId) {
        const existing = await tx.$queryRaw<Array<{ id: string; slug: string }>>(
          Prisma.sql`
            SELECT id, slug
            FROM public.job_postings
            WHERE external_submission_id = ${externalSubmissionId}
            LIMIT 1
          `,
        );

        slug =
          existing[0]?.slug ||
          (await buildUniqueJobSlug(`${title}-${companyName}`));

        const rows = await tx.$queryRaw<Array<SavedJobRow>>(
          Prisma.sql`
            INSERT INTO public.job_postings (
              title,
              slug,
              company_name,
              company_website,
              location,
              country,
              job_type,
              work_mode,
              experience_level,
              salary_range,
              currency,
              description,
              requirements,
              apply_url,
              application_email,
              industry,
              source,
              external_submission_id,
              status,
              posted_at,
              expires_at,
              updated_at
            )
            VALUES (
              ${title},
              ${slug},
              ${companyName},
              ${payload.company_website?.trim() || null},
              ${payload.location?.trim() || null},
              ${payload.country?.trim() || null},
              ${payload.job_type?.trim() || null},
              ${payload.work_mode?.trim() || null},
              ${payload.experience_level?.trim() || null},
              ${payload.salary_range?.trim() || null},
              ${payload.currency?.trim() || null},
              ${payload.description.trim()},
              ${payload.requirements?.trim() || null},
              ${payload.apply_url.trim()},
              ${payload.application_email?.trim() || null},
              ${payload.industry?.trim() || null},
              ${source},
              ${externalSubmissionId},
              ${status},
              ${payload.posted_at ? new Date(payload.posted_at) : null},
              ${payload.expires_at ? new Date(payload.expires_at) : null},
              now()
            )
            ON CONFLICT (external_submission_id)
            DO UPDATE SET
              title = EXCLUDED.title,
              company_name = EXCLUDED.company_name,
              company_website = EXCLUDED.company_website,
              location = EXCLUDED.location,
              country = EXCLUDED.country,
              job_type = EXCLUDED.job_type,
              work_mode = EXCLUDED.work_mode,
              experience_level = EXCLUDED.experience_level,
              salary_range = EXCLUDED.salary_range,
              currency = EXCLUDED.currency,
              description = EXCLUDED.description,
              requirements = EXCLUDED.requirements,
              apply_url = EXCLUDED.apply_url,
              application_email = EXCLUDED.application_email,
              industry = EXCLUDED.industry,
              source = EXCLUDED.source,
              status = EXCLUDED.status,
              posted_at = EXCLUDED.posted_at,
              expires_at = EXCLUDED.expires_at,
              updated_at = now()
            RETURNING
              id,
              title,
              slug,
              company_name,
              apply_url,
              status,
              external_submission_id,
              created_at,
              updated_at
          `,
        );
        return { row: rows[0], action: existing[0] ? "updated" : "created" };
      }

      slug = await buildUniqueJobSlug(`${title}-${companyName}`);

      const rows = await tx.$queryRaw<Array<SavedJobRow>>(
        Prisma.sql`
          INSERT INTO public.job_postings (
            title,
            slug,
            company_name,
            company_website,
            location,
            country,
            job_type,
            work_mode,
            experience_level,
            salary_range,
            currency,
            description,
            requirements,
            apply_url,
            application_email,
            industry,
            source,
            external_submission_id,
            status,
            posted_at,
            expires_at
          )
          VALUES (
            ${title},
            ${slug},
            ${companyName},
            ${payload.company_website?.trim() || null},
            ${payload.location?.trim() || null},
            ${payload.country?.trim() || null},
            ${payload.job_type?.trim() || null},
            ${payload.work_mode?.trim() || null},
            ${payload.experience_level?.trim() || null},
            ${payload.salary_range?.trim() || null},
            ${payload.currency?.trim() || null},
            ${payload.description.trim()},
            ${payload.requirements?.trim() || null},
            ${payload.apply_url.trim()},
            ${payload.application_email?.trim() || null},
            ${payload.industry?.trim() || null},
            ${source},
            NULL,
            ${status},
            ${payload.posted_at ? new Date(payload.posted_at) : null},
            ${payload.expires_at ? new Date(payload.expires_at) : null}
          )
          RETURNING
            id,
            title,
            slug,
            company_name,
            apply_url,
            status,
            external_submission_id,
            created_at,
            updated_at
        `,
      );
      return { row: rows[0], action: "created" as const };
    });

    return NextResponse.json(
      {
        success: true,
        action: saved.action,
        job: mapSavedJob(saved.row),
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: toPublicDatabaseError(error, "Failed to save job webhook payload."),
      },
      { status: 500 },
    );
  }
}
