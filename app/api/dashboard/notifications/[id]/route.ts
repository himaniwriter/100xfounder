import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireDashboardSession } from "@/lib/dashboard/api-auth";
import { ensureDashboardRetentionSchema } from "@/lib/db-bootstrap";
import {
  DATABASE_CONFIG_ERROR,
  isDatabaseConfigured,
  toPublicDatabaseError,
} from "@/lib/db-config";

const patchNotificationSchema = z.object({
  read: z.boolean(),
});

type NotificationByIdRouteProps = {
  params: { id: string };
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: NotificationByIdRouteProps,
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
      { success: false, error: "Invalid notification id." },
      { status: 400 },
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = patchNotificationSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid notification payload." },
      { status: 400 },
    );
  }

  try {
    await ensureDashboardRetentionSchema();
    const updated = await prisma.userNotification.updateMany({
      where: {
        id,
        userId: access.session.userId,
      },
      data: {
        isRead: parsed.data.read,
      },
    });

    if (updated.count === 0) {
      return NextResponse.json(
        { success: false, error: "Notification not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: toPublicDatabaseError(error, "Unable to update notification."),
      },
      { status: 500 },
    );
  }
}
