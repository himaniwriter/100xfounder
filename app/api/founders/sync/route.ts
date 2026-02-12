import { NextResponse } from "next/server";
import { z } from "zod";
import { upsertFounderDirectoryFromN8N } from "@/lib/founders/store";
import { getConfiguredN8nSecret, isAuthorizedN8nWebhook } from "@/lib/security/webhooks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const founderSyncSchema = z.object({
  founderName: z.string().min(1),
  companyName: z.string().min(1),
  foundedYear: z.number().int().nullable().optional(),
  headquarters: z.string().nullable().optional(),
  industry: z.string().optional(),
  stage: z.string().optional(),
  productSummary: z.string().min(1),
  fundingInfo: z.string().nullable().optional(),
  sourceUrl: z.string().optional(),
  ycProfileUrl: z.string().url().nullable().optional(),
  websiteUrl: z.string().url().nullable().optional(),
  employeeCount: z.string().nullable().optional(),
  techStack: z.array(z.string()).optional(),
  recentNews: z.array(z.string()).optional(),
  linkedinUrl: z.string().url().nullable().optional(),
  twitterUrl: z.string().url().nullable().optional(),
  verified: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  slug: z.string().optional(),
});

const payloadSchema = z.object({
  founders: z.array(founderSyncSchema).min(1),
});

export async function POST(request: Request) {
  const configuredSecret = await getConfiguredN8nSecret();

  if (!configuredSecret) {
    return NextResponse.json(
      { success: false, error: "N8N webhook secret is not configured." },
      { status: 500 },
    );
  }

  const authorized = await isAuthorizedN8nWebhook(request.headers);
  if (!authorized) {
    return NextResponse.json(
      { success: false, error: "Unauthorized." },
      { status: 401 },
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid payload.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const result = await upsertFounderDirectoryFromN8N(parsed.data.founders);
    return NextResponse.json({ success: true, ...result }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Sync failed.",
      },
      { status: 500 },
    );
  }
}
