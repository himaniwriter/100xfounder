import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDashboardSession } from "@/lib/dashboard/api-auth";
import { ensureDashboardRetentionSchema } from "@/lib/db-bootstrap";
import {
  DATABASE_CONFIG_ERROR,
  isDatabaseConfigured,
  toPublicDatabaseError,
} from "@/lib/db-config";

type WatchlistByIdRouteProps = {
  params: { id: string };
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  request: NextRequest,
  { params }: WatchlistByIdRouteProps,
) {
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

  const id = params.id?.trim();
  if (!id) {
    return NextResponse.json(
      { success: false, error: "Invalid watchlist id." },
      { status: 400 },
    );
  }

  try {
    await ensureDashboardRetentionSchema();
    const deleted = await prisma.userWatchlistItem.deleteMany({
      where: {
        id,
        userId: access.session.userId,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { success: false, error: "Watchlist item not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: true, deletedCount: deleted.count },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: toPublicDatabaseError(error, "Unable to delete watchlist item."),
      },
      { status: 500 },
    );
  }
}
