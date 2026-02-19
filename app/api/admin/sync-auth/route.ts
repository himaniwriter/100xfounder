import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDatabaseConfigured } from "@/lib/db-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SupabaseAdminUser = {
  id: string;
  email: string | null;
};

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function safeCompareSecret(provided: string, expected: string): boolean {
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

function isAuthorized(request: NextRequest): boolean {
  const provided = request.nextUrl.searchParams.get("key")?.trim() || "";
  const expected = process.env.SETUP_KEY?.trim() || "";

  if (!provided || !expected) {
    return false;
  }

  return safeCompareSecret(provided, expected);
}

async function getSupabaseUserByEmail(
  baseUrl: string,
  serviceRoleKey: string,
  email: string,
): Promise<SupabaseAdminUser | null> {
  const response = await fetch(
    `${baseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
    {
      method: "GET",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase admin user lookup failed: ${response.status} ${body}`);
  }

  const data = (await response.json()) as { users?: Array<SupabaseAdminUser> };
  const target = normalizeEmail(email);
  const user =
    data.users?.find((item) => normalizeEmail(item.email ?? "") === target) ?? null;

  return user;
}

async function createSupabaseAdminUser(
  baseUrl: string,
  serviceRoleKey: string,
  email: string,
  password: string,
): Promise<SupabaseAdminUser> {
  const response = await fetch(`${baseUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase admin user creation failed: ${response.status} ${body}`);
  }

  const data = (await response.json()) as SupabaseAdminUser;
  if (!data?.id) {
    throw new Error("Supabase admin user creation returned no user id.");
  }

  return data;
}

async function ensureAdminProfileRow(userId: string, email: string) {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is not configured.");
  }

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.profiles (
      id uuid PRIMARY KEY,
      email text,
      is_admin boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS email text;
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
  `);

  await prisma.$executeRawUnsafe(
    `
      INSERT INTO public.profiles (id, email, is_admin, updated_at)
      VALUES ($1, $2, true, now())
      ON CONFLICT (id)
      DO UPDATE
      SET email = EXCLUDED.email,
          is_admin = true,
          updated_at = now();
    `,
    userId,
    email,
  );
}

async function handleSync(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized." },
      { status: 401 },
    );
  }

  const adminEmailRaw = process.env.ADMIN_EMAIL?.trim() || "";
  const adminPassword = process.env.ADMIN_PASSWORD?.trim() || "";
  const supabaseUrlRaw = process.env.SUPABASE_URL?.trim() || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";

  if (!adminEmailRaw || !adminPassword) {
    return NextResponse.json(
      { success: false, error: "ADMIN_EMAIL or ADMIN_PASSWORD is not configured." },
      { status: 500 },
    );
  }

  if (!supabaseUrlRaw || !serviceRoleKey) {
    return NextResponse.json(
      { success: false, error: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured." },
      { status: 500 },
    );
  }

  const adminEmail = normalizeEmail(adminEmailRaw);
  const supabaseUrl = supabaseUrlRaw.replace(/\/+$/, "");

  try {
    const existing = await getSupabaseUserByEmail(
      supabaseUrl,
      serviceRoleKey,
      adminEmail,
    );

    const user =
      existing ??
      (await createSupabaseAdminUser(
        supabaseUrl,
        serviceRoleKey,
        adminEmail,
        adminPassword,
      ));

    await ensureAdminProfileRow(user.id, adminEmail);

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email ?? adminEmail,
        },
        created: !existing,
        profileSynced: true,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Admin auth sync failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Sync failed.",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return handleSync(request);
}

export async function POST(request: NextRequest) {
  return handleSync(request);
}
