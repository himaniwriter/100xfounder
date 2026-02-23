import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureOutreachFunnelSchema } from "@/lib/db-bootstrap";
import { isDatabaseConfigured, toPublicDatabaseError } from "@/lib/db-config";
import { isAuthorizedN8nWebhook } from "@/lib/security/webhooks";
import { normalizeInstagramSyncPayload } from "@/lib/outreach/normalize";
import { instagramSyncSchema } from "@/lib/outreach/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  const authorized = await isAuthorizedN8nWebhook(request.headers);
  if (!authorized) {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const normalized = normalizeInstagramSyncPayload(body);
  const parsed = instagramSyncSchema.safeParse(normalized);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid instagram sync payload.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    await ensureOutreachFunnelSchema();

    const upserts = parsed.data.items.map((item) =>
      prisma.instagramPost.upsert({
        where: { externalPostId: item.external_post_id },
        create: {
          externalPostId: item.external_post_id,
          caption: item.caption?.trim() || null,
          mediaUrl: item.media_url,
          permalink: item.permalink,
          thumbnailUrl: item.thumbnail_url?.trim() || null,
          postedAt: new Date(item.posted_at),
        },
        update: {
          caption: item.caption?.trim() || null,
          mediaUrl: item.media_url,
          permalink: item.permalink,
          thumbnailUrl: item.thumbnail_url?.trim() || null,
          postedAt: new Date(item.posted_at),
          ingestedAt: new Date(),
        },
      }),
    );

    const saved = await prisma.$transaction(upserts);

    return NextResponse.json(
      {
        success: true,
        count: saved.length,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: toPublicDatabaseError(error, "Failed to sync instagram posts."),
      },
      { status: 500 },
    );
  }
}
