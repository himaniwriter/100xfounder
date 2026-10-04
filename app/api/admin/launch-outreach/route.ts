import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin-guard";
import { isDatabaseConfigured, DATABASE_CONFIG_ERROR } from "@/lib/db-config";
import { ensureLaunchOutreachSchema } from "@/lib/db-bootstrap";
import {
  getOutreachConfig,
  getProductHuntToken,
  isImapConfigured,
  isSmtpConfigured,
} from "@/lib/launch/config";
import { PIPELINE_STAGES, runDailyGrowthPipeline } from "@/lib/launch/pipeline";
import { isSpotlightAutoPublishEnabled, publishSpotlight } from "@/lib/launch/spotlights";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (auth instanceof NextResponse) return auth;
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, error: DATABASE_CONFIG_ERROR }, { status: 503 });
  }
  await ensureLaunchOutreachSchema();

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [products, contacts, spotlights, instagram, statusCounts, sentLast24h] = await Promise.all([
    prisma.launchProduct.findMany({ orderBy: { launchedAt: "desc" }, take: 40 }),
    prisma.outreachContact.findMany({
      orderBy: { updatedAt: "desc" },
      take: 60,
      include: { product: { select: { name: true, slug: true } } },
    }),
    prisma.founderSpotlight.findMany({
      where: { status: { in: ["submitted", "published"] } },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { product: { select: { name: true, slug: true } } },
    }),
    prisma.instagramQueueItem.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.outreachContact.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.outreachMessage.count({ where: { status: "sent", sentAt: { gte: since } } }),
  ]);

  const outreach = getOutreachConfig();
  return NextResponse.json({
    success: true,
    config: {
      productHunt: Boolean(getProductHuntToken()),
      outreachEnabled: outreach.enabled,
      smtp: isSmtpConfigured(),
      imap: isImapConfigured(),
      postalAddress: Boolean(outreach.postalAddress),
      dailyLimit: outreach.dailyLimit,
      autoPublish: isSpotlightAutoPublishEnabled(),
    },
    stats: {
      sentLast24h,
      byStatus: Object.fromEntries(statusCounts.map((row) => [row.status, row._count._all])),
    },
    products,
    contacts,
    spotlights,
    instagram,
  });
}

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("run"), stages: z.array(z.enum(PIPELINE_STAGES)).optional() }),
  z.object({ action: z.literal("publish_spotlight"), id: z.string().uuid() }),
  z.object({ action: z.literal("reject_spotlight"), id: z.string().uuid() }),
  z.object({ action: z.literal("set_product_published"), id: z.string().uuid(), published: z.boolean() }),
  z.object({ action: z.literal("pause_contact"), id: z.string().uuid() }),
  z.object({ action: z.literal("update_contact"), id: z.string().uuid(), email: z.string().email(), name: z.string().max(120).optional() }),
  z.object({ action: z.literal("mark_instagram"), id: z.string().uuid(), status: z.enum(["ready", "posted", "skipped"]) }),
]);

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (auth instanceof NextResponse) return auth;
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, error: DATABASE_CONFIG_ERROR }, { status: 503 });
  }
  await ensureLaunchOutreachSchema();

  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  }
  const body = parsed.data;

  switch (body.action) {
    case "run":
      return NextResponse.json({ success: true, results: await runDailyGrowthPipeline(body.stages ?? PIPELINE_STAGES) });
    case "publish_spotlight":
      await publishSpotlight(body.id);
      break;
    case "reject_spotlight":
      await prisma.founderSpotlight.update({ where: { id: body.id }, data: { status: "rejected" } });
      break;
    case "set_product_published":
      await prisma.launchProduct.update({ where: { id: body.id }, data: { isPublished: body.published } });
      break;
    case "pause_contact":
      await prisma.outreachContact.update({ where: { id: body.id }, data: { status: "paused", nextSendAt: null } });
      break;
    case "update_contact":
      await prisma.outreachContact.update({
        where: { id: body.id },
        data: { email: body.email.toLowerCase(), name: body.name || null },
      });
      break;
    case "mark_instagram":
      await prisma.instagramQueueItem.update({
        where: { id: body.id },
        data: { status: body.status, postedAt: body.status === "posted" ? new Date() : null },
      });
      break;
  }

  return NextResponse.json({ success: true });
}
