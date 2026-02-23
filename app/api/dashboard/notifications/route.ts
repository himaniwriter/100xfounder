import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireDashboardSession } from "@/lib/dashboard/api-auth";
import type { DashboardNotification } from "@/lib/dashboard/types";
import { ensureDashboardRetentionSchema } from "@/lib/db-bootstrap";
import {
  DATABASE_CONFIG_ERROR,
  isDatabaseConfigured,
  toPublicDatabaseError,
} from "@/lib/db-config";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toNotificationResponse(item: {
  id: string;
  kind: string;
  title: string;
  body: string;
  targetUrl: string | null;
  isRead: boolean;
  createdAt: Date;
}): DashboardNotification {
  return {
    id: item.id,
    kind: item.kind,
    title: item.title,
    body: item.body,
    targetUrl: item.targetUrl,
    isRead: item.isRead,
    createdAt: item.createdAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const access = await requireDashboardSession(request);
  if ("error" in access) {
    return access.error;
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { success: false, error: DATABASE_CONFIG_ERROR },
      { status: 503 },
    );
  }

  const parsed = querySchema.safeParse({
    limit: request.nextUrl.searchParams.get("limit") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid query params." },
      { status: 400 },
    );
  }

  const limit = parsed.data.limit ?? 30;

  try {
    await ensureDashboardRetentionSchema();
    const items = await prisma.userNotification.findMany({
      where: {
        userId: access.session.userId,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        kind: true,
        title: true,
        body: true,
        targetUrl: true,
        isRead: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { success: true, items: items.map(toNotificationResponse) },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: toPublicDatabaseError(error, "Unable to load notifications."),
      },
      { status: 500 },
    );
  }
}
