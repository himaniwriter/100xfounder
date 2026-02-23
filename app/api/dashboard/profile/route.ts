import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";
import { toPublicUserDTO } from "@/lib/auth/dto";
import {
  DATABASE_CONFIG_ERROR,
  isDatabaseConfigured,
  toPublicDatabaseError,
} from "@/lib/db-config";

const profilePatchSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    avatarUrl: z.union([z.string().trim().url().max(2048), z.literal(""), z.null()]).optional(),
  })
  .refine(
    (value) => typeof value.name !== "undefined" || typeof value.avatarUrl !== "undefined",
    "No profile fields provided.",
  );

async function requireSession(request: NextRequest) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return {
      error: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { session };
}

export async function GET(request: NextRequest) {
  const access = await requireSession(request);
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
    const user = await prisma.user.findUnique({
      where: { id: access.session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: toPublicUserDTO(user) });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: toPublicDatabaseError(error, "Could not read profile."),
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const access = await requireSession(request);
  if ("error" in access) {
    return access.error;
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { success: false, error: DATABASE_CONFIG_ERROR },
      { status: 503 },
    );
  }

  const payload = await request.json().catch(() => null);
  const parsed = profilePatchSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid profile payload.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const updateData: { name?: string; avatar?: string | null } = {};

  if (typeof parsed.data.name !== "undefined") {
    updateData.name = parsed.data.name;
  }

  if (typeof parsed.data.avatarUrl !== "undefined") {
    const avatarValue = parsed.data.avatarUrl;
    updateData.avatar = typeof avatarValue === "string" && avatarValue.trim()
      ? avatarValue.trim()
      : null;
  }

  try {
    const user = await prisma.user.update({
      where: { id: access.session.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
      },
    });

    return NextResponse.json({ success: true, user: toPublicUserDTO(user) });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: toPublicDatabaseError(error, "Could not update profile."),
      },
      { status: 500 },
    );
  }
}
