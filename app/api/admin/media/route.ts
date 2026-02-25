import { NextResponse, type NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-guard";
import {
  getSupabaseMediaConfig,
  importRemoteImageToSupabase,
  uploadImageFileToSupabase,
  toPublicMediaUrl,
} from "@/lib/media/storage";

export async function GET(request: NextRequest) {
  const access = await requireAdminApi(request);
  if (access instanceof NextResponse) {
    return access;
  }

  const config = await getSupabaseMediaConfig();
  if (!config) {
    return NextResponse.json(
      { success: false, error: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured." },
      { status: 400 },
    );
  }

  const response = await fetch(`${config.baseUrl}/storage/v1/object/list/${config.bucket}`, {
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
      url: toPublicMediaUrl(config.baseUrl, item.name, config.bucket),
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

  const config = await getSupabaseMediaConfig();
  if (!config) {
    return NextResponse.json(
      { success: false, error: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured." },
      { status: 400 },
    );
  }

  const formData = await request.formData();
  const rawFile = formData.get("file");
  const remoteUrl = String(formData.get("url") ?? "").trim();
  const folder = String(formData.get("folder") ?? "").trim();

  if (rawFile instanceof File) {
    try {
      const uploaded = await uploadImageFileToSupabase(rawFile, {
        config,
        folder: folder || "blog",
      });
      return NextResponse.json({ success: true, item: uploaded });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Upload failed.",
        },
        { status: 502 },
      );
    }
  }

  if (remoteUrl) {
    try {
      const imported = await importRemoteImageToSupabase(remoteUrl, {
        config,
        folder: folder || "blog/imported",
      });
      if (!imported) {
        return NextResponse.json(
          {
            success: false,
            error: "Unable to import this image URL. Make sure it is a public direct image URL.",
          },
          { status: 400 },
        );
      }
      return NextResponse.json({ success: true, item: imported });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Image import failed.",
        },
        { status: 502 },
      );
    }
  }

  return NextResponse.json(
    { success: false, error: "Upload requires a file field or url field." },
    { status: 400 },
  );
}
