import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import {
  createSessionToken,
  setSessionCookie,
} from "@/lib/auth/session";
import { toPublicUserDTO } from "@/lib/auth/dto";
import {
  DATABASE_CONFIG_ERROR,
  isDatabaseConfigured,
  toPublicDatabaseError,
} from "@/lib/db-config";

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { success: false, error: DATABASE_CONFIG_ERROR },
      { status: 503 },
    );
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Email already registered." },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
    const role = adminEmail && adminEmail === normalizedEmail ? "ADMIN" : "MEMBER";

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name,
        passwordHash,
        role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      user: toPublicUserDTO(user),
    });

    return setSessionCookie(response, token);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: toPublicDatabaseError(error, "Registration failed."),
      },
      { status: 500 },
    );
  }
}
