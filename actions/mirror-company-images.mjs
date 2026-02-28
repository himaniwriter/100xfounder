import { PrismaClient } from "@prisma/client";

const MAX_REMOTE_IMAGE_BYTES = 12 * 1024 * 1024;
const DEFAULT_BUCKET = "images";

const EXT_BY_CONTENT_TYPE = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/svg+xml": "svg",
};

function normalizeContentType(value) {
  if (!value) return "application/octet-stream";
  return String(value).split(";")[0].trim().toLowerCase();
}

function inferExtensionFromUrl(value) {
  try {
    const pathname = new URL(value).pathname;
    const ext = pathname.split(".").pop()?.toLowerCase() ?? "";
    if (/^[a-z0-9]{2,5}$/.test(ext)) {
      return ext;
    }
  } catch {
    return "";
  }
  return "";
}

function inferExtension(contentType, fallbackUrl) {
  return (
    EXT_BY_CONTENT_TYPE[contentType] ||
    inferExtensionFromUrl(fallbackUrl || "") ||
    "jpg"
  );
}

function toPublicMediaUrl(baseUrl, filePath, bucket = DEFAULT_BUCKET) {
  const encodedPath = filePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${baseUrl}/storage/v1/object/public/${bucket}/${encodedPath}`;
}

function isHttpUrl(value) {
  return /^https?:\/\//i.test(value);
}

function isAlreadySupabaseHosted(remoteUrl, baseUrl, bucket) {
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const prefix = `${normalizedBase}/storage/v1/object/public/${bucket}/`;
  return remoteUrl.startsWith(prefix);
}

function safePath(value) {
  return value
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._/-]/g, "")
    .replace(/\/+/g, "/")
    .replace(/^\/+/, "")
    .replace(/\.\.+/g, ".")
    .trim();
}

function buildStoragePath(folder, extension) {
  const timestamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  const cleanFolder = safePath(folder || "companies/logos");
  return `${cleanFolder}/${timestamp}-${rand}.${extension}`;
}

async function importRemoteImageToSupabase(remoteUrl, config) {
  const normalizedRemoteUrl = remoteUrl.trim();
  if (!isHttpUrl(normalizedRemoteUrl)) {
    return null;
  }

  if (
    isAlreadySupabaseHosted(normalizedRemoteUrl, config.baseUrl, config.bucket)
  ) {
    return normalizedRemoteUrl;
  }

  const response = await fetch(normalizedRemoteUrl, {
    method: "GET",
    redirect: "follow",
    headers: {
      "user-agent": "100Xfounder-CompanyLogoMirror/1.0",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const contentType = normalizeContentType(response.headers.get("content-type"));
  if (!contentType.startsWith("image/")) {
    return null;
  }

  const contentLength = Number(response.headers.get("content-length") || "0");
  if (contentLength > MAX_REMOTE_IMAGE_BYTES) {
    return null;
  }

  const arrayBuffer = await response.arrayBuffer();
  if (!arrayBuffer.byteLength || arrayBuffer.byteLength > MAX_REMOTE_IMAGE_BYTES) {
    return null;
  }

  const extension = inferExtension(contentType, normalizedRemoteUrl);
  const filePath = buildStoragePath("companies/logos", extension);
  const safeFilePath = safePath(filePath);
  const body = new Blob([arrayBuffer], { type: contentType });

  const uploadResponse = await fetch(
    `${config.baseUrl}/storage/v1/object/${config.bucket}/${encodeURIComponent(safeFilePath).replace(/%2F/g, "/")}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.serviceRole}`,
        apikey: config.serviceRole,
        "Content-Type": contentType,
        "x-upsert": "true",
      },
      body,
    },
  );

  if (!uploadResponse.ok) {
    return null;
  }

  return toPublicMediaUrl(config.baseUrl, safeFilePath, config.bucket);
}

async function main() {
  const prisma = new PrismaClient();
  const requestedLimit = Number(process.argv[2] || "2000");
  const limit =
    Number.isFinite(requestedLimit) && requestedLimit > 0
      ? Math.min(Math.floor(requestedLimit), 10000)
      : 2000;

  try {
    const rows = await prisma.$queryRawUnsafe(
      "SELECT value FROM site_settings WHERE key = 'global' LIMIT 1",
    );
    const settings = rows?.[0]?.value || {};
    const baseUrl = String(
      settings.supabaseUrl || process.env.SUPABASE_URL || "",
    ).replace(/\/+$/, "");
    const serviceRole = String(
      settings.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    );
    const bucket = String(settings.supabaseStorageBucket || DEFAULT_BUCKET);

    if (!baseUrl || !serviceRole) {
      throw new Error(
        "Supabase media config missing. Set in site settings or env (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).",
      );
    }

    const config = { baseUrl, serviceRole, bucket };

    const entries = await prisma.founderDirectoryEntry.findMany({
      where: {
        avatarUrl: {
          not: null,
        },
      },
      select: {
        id: true,
        avatarUrl: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: limit,
    });

    const uniqueUrls = new Map();
    for (const entry of entries) {
      const url = String(entry.avatarUrl || "").trim();
      if (!url) continue;
      if (!uniqueUrls.has(url)) uniqueUrls.set(url, []);
      uniqueUrls.get(url).push(entry.id);
    }

    let processed = 0;
    let updated = 0;
    let failed = 0;
    let skipped = 0;

    for (const [url, ids] of uniqueUrls.entries()) {
      processed += 1;

      if (!isHttpUrl(url)) {
        skipped += ids.length;
        continue;
      }

      let mirrored = null;
      try {
        mirrored = await importRemoteImageToSupabase(url, config);
      } catch {
        mirrored = null;
      }

      if (!mirrored || mirrored === url) {
        if (!mirrored) {
          failed += ids.length;
        } else {
          skipped += ids.length;
        }
        continue;
      }

      const result = await prisma.founderDirectoryEntry.updateMany({
        where: {
          id: {
            in: ids,
          },
        },
        data: {
          avatarUrl: mirrored,
        },
      });

      updated += result.count;
      process.stdout.write(
        `\rprocessed ${processed}/${uniqueUrls.size} | updated ${updated} | failed ${failed} | skipped ${skipped}`,
      );
    }

    process.stdout.write("\n");
    console.log(
      JSON.stringify(
        {
          success: true,
          uniqueUrls: uniqueUrls.size,
          processed,
          updated,
          failed,
          skipped,
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      null,
      2,
    ),
  );
  process.exit(1);
});
