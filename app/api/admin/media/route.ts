import { NextResponse, type NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-guard";

function getSupabaseConfig() {
  const baseUrl = process.env.SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!baseUrl || !serviceRole) {
    return null;
  }

  return {
    baseUrl: baseUrl.replace(/\/+$/, ""),
    serviceRole,
  };
}

function safePath(value: string): string {
  return value
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._/-]/g, "")
    .replace(/\/+/g, "/");
}

function toPublicUrl(baseUrl: string, filePath: string): string {
  const encodedPath = filePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${baseUrl}/storage/v1/object/public/images/${encodedPath}`;
}

export async function GET(request: NextRequest) {
  const access = await requireAdminApi(request);
  if (access instanceof NextResponse) {
    return access;
  }

  const config = getSupabaseConfig();
  if (!config) {
    return NextResponse.json(
      { success: false, error: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured." },
      { status: 400 },
    );
  }

  const response = await fetch(`${config.baseUrl}/storage/v1/object/list/images`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.serviceRole}`,
      apikey: config.serviceRole,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      limit: 500,
      offset: 0,
      sortBy: { column: "created_at", order: "desc" },
    }),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => []);
  if (!response.ok) {
    return NextResponse.json(
      {
        success: false,
        error: payload?.message ?? `Storage list failed (${response.status}).`,
      },
      { status: 502 },
    );
  }

  const items = Array.isArray(payload)
    ? payload.map((item: { name: string; created_at?: string; updated_at?: string }) => ({
      name: item.name,
      url: toPublicUrl(config.baseUrl, item.name),
      createdAt: item.created_at ?? item.updated_at ?? null,
    }))
    : [];

  return NextResponse.json({ success: true, items });
}

export async function POST(request: NextRequest) {
  const access = await requireAdminApi(request);
  if (access instanceof NextResponse) {
    return access;
  }

  const config = getSupabaseConfig();
  if (!config) {
    return NextResponse.json(
      { success: false, error: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured." },
      { status: 400 },
    );
  }

  const formData = await request.formData();
  const rawFile = formData.get("file");
  const folder = String(formData.get("folder") ?? "").trim();

  if (!(rawFile instanceof File)) {
    return NextResponse.json(
      { success: false, error: "Upload requires a file field." },
      { status: 400 },
    );
  }

  const safeName = safePath(rawFile.name);
  const prefix = folder ? `${safePath(folder)}/` : "";
  const filePath = `${prefix}${Date.now()}-${safeName}`;

  const buffer = Buffer.from(await rawFile.arrayBuffer());

  const response = await fetch(
    `${config.baseUrl}/storage/v1/object/images/${encodeURIComponent(filePath).replace(/%2F/g, "/")}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.serviceRole}`,
        apikey: config.serviceRole,
        "Content-Type": rawFile.type || "application/octet-stream",
        "x-upsert": "true",
      },
      body: buffer,
    },
  );

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    return NextResponse.json(
      {
        success: false,
        error: payload?.message ?? `Upload failed (${response.status}).`,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    success: true,
    item: {
      name: filePath,
      url: toPublicUrl(config.baseUrl, filePath),
    },
  });
}
