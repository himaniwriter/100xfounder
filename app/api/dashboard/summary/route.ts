import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDashboardSession } from "@/lib/dashboard/api-auth";
import type { DashboardSummary } from "@/lib/dashboard/types";
import { ensureDashboardRetentionSchema } from "@/lib/db-bootstrap";
import {
  DATABASE_CONFIG_ERROR,
  isDatabaseConfigured,
  toPublicDatabaseError,
} from "@/lib/db-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
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

  try {
    await ensureDashboardRetentionSchema();

    const [trackedCount, unreadAlerts, savedSearchCount, claimCount, user, preference] =
      await Promise.all([
        prisma.userWatchlistItem.count({
          where: { userId: access.session.userId },
        }),
        prisma.userNotification.count({
          where: {
            userId: access.session.userId,
            isRead: false,
          },
        }),
        prisma.userSavedSearch.count({
          where: { userId: access.session.userId },
        }),
        prisma.claimRequest.count({
          where: { userId: access.session.userId },
        }),
        prisma.user.findUnique({
          where: { id: access.session.userId },
          select: {
            name: true,
            avatar: true,
          },
        }),
        prisma.userNotificationPreference.findUnique({
          where: { userId: access.session.userId },
          select: {
            dailyDigest: true,
          },
        }),
      ]);

    let profileStrength = 0;
    if (user?.name && user.name.trim().length >= 2) profileStrength += 24;
    if (user?.avatar) profileStrength += 22;
    if (claimCount > 0) profileStrength += 20;
    if (trackedCount > 0) profileStrength += 17;
    if (savedSearchCount > 0) profileStrength += 10;
    if (preference?.dailyDigest ?? true) profileStrength += 7;

    const summary: DashboardSummary = {
      trackedCount,
      unreadAlerts,
      savedSearchCount,
      profileStrength: clampScore(profileStrength),
    };

    return NextResponse.json({ success: true, summary }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: toPublicDatabaseError(error, "Unable to load dashboard summary."),
      },
      { status: 500 },
    );
  }
}
