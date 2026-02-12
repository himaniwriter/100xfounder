import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  getDummyAdminCredentials,
  isDummyAdminLogin,
} from "@/lib/auth/dummy-admin";
import { verifyPassword } from "@/lib/auth/password";
import {
  createSessionToken,
  setSessionCookie,
} from "@/lib/auth/session";
import {
  DATABASE_CONFIG_ERROR,
  isDatabaseConfigured,
  toPublicDatabaseError,
} from "@/lib/db-config";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid credentials payload." },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase().trim();
  const password = parsed.data.password;

  if (isDummyAdminLogin(email, password)) {
    const dummy = getDummyAdminCredentials();
    const token = await createSessionToken({
      userId: "dummy-admin",
      email: dummy.email,
      role: "ADMIN",
      name: dummy.name,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: "dummy-admin",
        email: dummy.email,
        name: dummy.name,
        role: "ADMIN",
      },
    });

    return setSessionCookie(response, token);
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { success: false, error: DATABASE_CONFIG_ERROR },
      { status: 503 },
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        passwordHash: true,
      },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 },
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);

    if (!valid) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 },
      );
    }

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    return setSessionCookie(response, token);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: toPublicDatabaseError(error, "Login failed."),
      },
      { status: 500 },
    );
  }
}
