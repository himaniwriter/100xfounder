import { timingSafeEqual } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureSalaryEquitySchema } from "@/lib/db-bootstrap";
import { isDatabaseConfigured, toPublicDatabaseError } from "@/lib/db-config";
import { prisma } from "@/lib/prisma";
import { isAuthorizedN8nWebhook } from "@/lib/security/webhooks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const payloadSchema = z.object({
  role: z.string().trim().min(2).max(180),
  level: z.string().trim().max(120).optional(),
  location: z.string().trim().max(160).optional(),
  country: z.string().trim().max(120).optional(),
  stage: z.string().trim().max(120).optional(),
  base_min: z.coerce.number().int().min(0).max(10_000_000).optional(),
  base_max: z.coerce.number().int().min(0).max(10_000_000).optional(),
  currency: z.string().trim().max(16).optional(),
  equity_min_bps: z.coerce.number().int().min(0).max(10_000).optional(),
  equity_max_bps: z.coerce.number().int().min(0).max(10_000).optional(),
  source: z.string().trim().max(80).optional(),
  source_url: z.string().trim().url().optional(),
  external_submission_id: z.string().trim().max(160).optional(),
  status: z.enum(["draft", "published", "rejected"]).optional(),
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
  const explicitSecret = process.env.N8N_SALARY_EQUITY_SECRET?.trim() || "";
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

type SavedSalaryRow = {
  id: string;
  role: string;
  level: string | null;
  location: string | null;
  country: string | null;
  stage: string | null;
  base_min: number | null;
  base_max: number | null;
  currency: string | null;
  equity_min_bps: number | null;
  equity_max_bps: number | null;
  source: string | null;
  source_url: string | null;
  external_submission_id: string | null;
  status: string;
  created_at: Date | string;
  updated_at: Date | string;
};

function mapSavedRow(row: SavedSalaryRow) {
  return {
    id: row.id,
    role: row.role,
    level: row.level,
    location: row.location,
    country: row.country,
    stage: row.stage,
    base_min: row.base_min,
    base_max: row.base_max,
    currency: row.currency || "USD",
    equity_min_bps: row.equity_min_bps,
    equity_max_bps: row.equity_max_bps,
    source: row.source || "n8n_webhook",
    source_url: row.source_url,
    external_submission_id: row.external_submission_id,
    status: row.status,
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
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid salary-equity webhook payload.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const payload = parsed.data;

  if (
    typeof payload.base_min === "number" &&
    typeof payload.base_max === "number" &&
    payload.base_min > payload.base_max
  ) {
    return NextResponse.json(
      {
        success: false,
        error: "base_min cannot be greater than base_max.",
      },
      { status: 400 },
    );
  }

  if (
    typeof payload.equity_min_bps === "number" &&
    typeof payload.equity_max_bps === "number" &&
    payload.equity_min_bps > payload.equity_max_bps
  ) {
    return NextResponse.json(
      {
        success: false,
        error: "equity_min_bps cannot be greater than equity_max_bps.",
      },
      { status: 400 },
    );
  }

  await ensureSalaryEquitySchema();

  const source = payload.source?.trim() || "n8n_webhook";
  const status = normalizeStatus(payload.status);
  const externalSubmissionId = payload.external_submission_id?.trim() || null;

  try {
    const saved = await prisma.$transaction(async (tx) => {
      if (externalSubmissionId) {
        const existing = await tx.$queryRaw<Array<{ id: string }>>(
          Prisma.sql`
            SELECT id
            FROM public.salary_equity_entries
            WHERE external_submission_id = ${externalSubmissionId}
            LIMIT 1
          `,
        );

        const rows = await tx.$queryRaw<SavedSalaryRow[]>(
          Prisma.sql`
            INSERT INTO public.salary_equity_entries (
              role,
              level,
              location,
              country,
              stage,
              base_min,
              base_max,
              currency,
              equity_min_bps,
              equity_max_bps,
              source,
              source_url,
              external_submission_id,
              status,
              updated_at
            )
            VALUES (
              ${payload.role.trim()},
              ${payload.level?.trim() || null},
              ${payload.location?.trim() || null},
              ${payload.country?.trim() || null},
              ${payload.stage?.trim() || null},
              ${payload.base_min ?? null},
              ${payload.base_max ?? null},
              ${(payload.currency?.trim() || "USD").toUpperCase()},
              ${payload.equity_min_bps ?? null},
              ${payload.equity_max_bps ?? null},
              ${source},
              ${payload.source_url?.trim() || null},
              ${externalSubmissionId},
              ${status},
              now()
            )
            ON CONFLICT (external_submission_id)
            DO UPDATE SET
              role = EXCLUDED.role,
              level = EXCLUDED.level,
              location = EXCLUDED.location,
              country = EXCLUDED.country,
              stage = EXCLUDED.stage,
              base_min = EXCLUDED.base_min,
              base_max = EXCLUDED.base_max,
              currency = EXCLUDED.currency,
              equity_min_bps = EXCLUDED.equity_min_bps,
              equity_max_bps = EXCLUDED.equity_max_bps,
              source = EXCLUDED.source,
              source_url = EXCLUDED.source_url,
              status = EXCLUDED.status,
              updated_at = now()
            RETURNING
              id,
              role,
              level,
              location,
              country,
              stage,
              base_min,
              base_max,
              currency,
              equity_min_bps,
              equity_max_bps,
              source,
              source_url,
              external_submission_id,
              status,
              created_at,
              updated_at
          `,
        );

        return {
          action: existing[0] ? "updated" : "created",
          row: rows[0],
        };
      }

      const rows = await tx.$queryRaw<SavedSalaryRow[]>(
        Prisma.sql`
          INSERT INTO public.salary_equity_entries (
            role,
            level,
            location,
            country,
            stage,
            base_min,
            base_max,
            currency,
            equity_min_bps,
            equity_max_bps,
            source,
            source_url,
            external_submission_id,
            status
          )
          VALUES (
            ${payload.role.trim()},
            ${payload.level?.trim() || null},
            ${payload.location?.trim() || null},
            ${payload.country?.trim() || null},
            ${payload.stage?.trim() || null},
            ${payload.base_min ?? null},
            ${payload.base_max ?? null},
            ${(payload.currency?.trim() || "USD").toUpperCase()},
            ${payload.equity_min_bps ?? null},
            ${payload.equity_max_bps ?? null},
            ${source},
            ${payload.source_url?.trim() || null},
            NULL,
            ${status}
          )
          RETURNING
            id,
            role,
            level,
            location,
            country,
            stage,
            base_min,
            base_max,
            currency,
            equity_min_bps,
            equity_max_bps,
            source,
            source_url,
            external_submission_id,
            status,
            created_at,
            updated_at
        `,
      );

      return {
        action: "created" as const,
        row: rows[0],
      };
    });

    return NextResponse.json(
      {
        success: true,
        action: saved.action,
        entry: mapSavedRow(saved.row),
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: toPublicDatabaseError(error, "Failed to save salary-equity webhook payload."),
      },
      { status: 500 },
    );
  }
}
