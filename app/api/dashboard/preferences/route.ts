import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireDashboardSession } from "@/lib/dashboard/api-auth";
import type { DashboardPreference } from "@/lib/dashboard/types";
import { ensureDashboardRetentionSchema } from "@/lib/db-bootstrap";
import {
  DATABASE_CONFIG_ERROR,
  isDatabaseConfigured,
  toPublicDatabaseError,
} from "@/lib/db-config";

const patchPreferencesSchema = z
  .object({
    instantEmail: z.boolean().optional(),
    dailyDigest: z.boolean().optional(),
    weeklyDigest: z.boolean().optional(),
    premiumOptIn: z.boolean().optional(),
  })
  .refine(
    (value) =>
      typeof value.instantEmail !== "undefined" ||
      typeof value.dailyDigest !== "undefined" ||
      typeof value.weeklyDigest !== "undefined" ||
      typeof value.premiumOptIn !== "undefined",
    "No preference fields provided.",
  );

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function withDefaults(record: {
  instantEmail: boolean;
  dailyDigest: boolean;
  weeklyDigest: boolean;
  premiumOptIn: boolean;
  updatedAt: Date;
} | null): DashboardPreference {
  if (!record) {
    return {
      instantEmail: false,
      dailyDigest: true,
      weeklyDigest: false,
      premiumOptIn: false,
      updatedAt: null,
    };
  }

  return {
    instantEmail: record.instantEmail,
    dailyDigest: record.dailyDigest,
    weeklyDigest: record.weeklyDigest,
    premiumOptIn: record.premiumOptIn,
    updatedAt: record.updatedAt.toISOString(),
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

  try {
    await ensureDashboardRetentionSchema();
    const preference = await prisma.userNotificationPreference.findUnique({
      where: { userId: access.session.userId },
      select: {
        instantEmail: true,
        dailyDigest: true,
        weeklyDigest: true,
        premiumOptIn: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      { success: true, preference: withDefaults(preference) },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: toPublicDatabaseError(error, "Unable to load preferences."),
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
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

  const json = await request.json().catch(() => null);
  const parsed = patchPreferencesSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid preferences payload." },
      { status: 400 },
    );
  }

  try {
    await ensureDashboardRetentionSchema();
    const updated = await prisma.userNotificationPreference.upsert({
      where: { userId: access.session.userId },
      create: {
        userId: access.session.userId,
        instantEmail: parsed.data.instantEmail ?? false,
        dailyDigest: parsed.data.dailyDigest ?? true,
        weeklyDigest: parsed.data.weeklyDigest ?? false,
        premiumOptIn: parsed.data.premiumOptIn ?? false,
      },
      update: {
        ...(typeof parsed.data.instantEmail !== "undefined"
          ? { instantEmail: parsed.data.instantEmail }
          : {}),
        ...(typeof parsed.data.dailyDigest !== "undefined"
          ? { dailyDigest: parsed.data.dailyDigest }
          : {}),
        ...(typeof parsed.data.weeklyDigest !== "undefined"
          ? { weeklyDigest: parsed.data.weeklyDigest }
          : {}),
        ...(typeof parsed.data.premiumOptIn !== "undefined"
          ? { premiumOptIn: parsed.data.premiumOptIn }
          : {}),
      },
      select: {
        instantEmail: true,
        dailyDigest: true,
        weeklyDigest: true,
        premiumOptIn: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      { success: true, preference: withDefaults(updated) },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: toPublicDatabaseError(error, "Unable to save preferences."),
      },
      { status: 500 },
    );
  }
}
