import { readGlobalSiteSettings } from "@/lib/site-settings";

export type SupabaseMediaConfig = {
  baseUrl: string;
  serviceRole: string;
  bucket: string;
};

export type UploadedMediaAsset = {
  name: string;
  url: string;
  contentType: string;
  size: number;
};

const DEFAULT_BUCKET = "images";
const MAX_REMOTE_IMAGE_BYTES = 12 * 1024 * 1024;

const EXT_BY_CONTENT_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/svg+xml": "svg",
};

function normalizeContentType(value: string | null): string {
  if (!value) {
    return "application/octet-stream";
  }
  return value.split(";")[0].trim().toLowerCase();
}

function inferExtensionFromUrl(value: string): string {
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

function inferExtension(contentType: string, fallbackUrl?: string): string {
  const direct = EXT_BY_CONTENT_TYPE[contentType];
  if (direct) {
    return direct;
  }
  const fromUrl = fallbackUrl ? inferExtensionFromUrl(fallbackUrl) : "";
  return fromUrl || "jpg";
}

function safePath(value: string): string {
  return value
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._/-]/g, "")
    .replace(/\/+/g, "/")
    .replace(/^\/+/, "")
    .replace(/\.\.+/g, ".")
    .trim();
}

function buildStoragePath(folder: string, extension: string): string {
  const timestamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  const cleanFolder = safePath(folder || "blog");
  return `${cleanFolder}/${timestamp}-${rand}.${extension}`;
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function isAlreadySupabaseHosted(remoteUrl: string, baseUrl: string, bucket: string): boolean {
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const prefix = `${normalizedBase}/storage/v1/object/public/${bucket}/`;
  return remoteUrl.startsWith(prefix);
}

export function toPublicMediaUrl(baseUrl: string, filePath: string, bucket = DEFAULT_BUCKET): string {
  const encodedPath = filePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${baseUrl}/storage/v1/object/public/${bucket}/${encodedPath}`;
}

export async function getSupabaseMediaConfig(): Promise<SupabaseMediaConfig | null> {
  const settings = await readGlobalSiteSettings();
  const baseUrl = settings.supabaseUrl || process.env.SUPABASE_URL || "";
  const serviceRole =
    settings.supabaseServiceRoleKey ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "";
  if (!baseUrl || !serviceRole) {
    return null;
  }

  return {
    baseUrl: baseUrl.replace(/\/+$/, ""),
    serviceRole,
    bucket: DEFAULT_BUCKET,
  };
}

async function uploadBuffer(
  config: SupabaseMediaConfig,
  buffer: ArrayBuffer,
  contentType: string,
  filePath: string,
): Promise<UploadedMediaAsset> {
  const safeFilePath = safePath(filePath);
  const blobBody = new Blob([buffer], {
    type: contentType || "application/octet-stream",
  });
  const response = await fetch(
    `${config.baseUrl}/storage/v1/object/${config.bucket}/${encodeURIComponent(safeFilePath).replace(/%2F/g, "/")}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.serviceRole}`,
        apikey: config.serviceRole,
        "Content-Type": contentType || "application/octet-stream",
        "x-upsert": "true",
      },
      body: blobBody,
    },
  );

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message =
      (payload && typeof payload.message === "string" && payload.message) ||
      `Image upload failed (${response.status}).`;
    throw new Error(message);
  }

  return {
    name: safeFilePath,
    url: toPublicMediaUrl(config.baseUrl, safeFilePath, config.bucket),
    contentType,
    size: buffer.byteLength,
  };
}

export async function uploadImageFileToSupabase(
  file: File,
  options: { folder?: string; config?: SupabaseMediaConfig | null } = {},
): Promise<UploadedMediaAsset> {
  const config = options.config ?? (await getSupabaseMediaConfig());
  if (!config) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }

  const contentType = normalizeContentType(file.type || null);
  const extension = inferExtension(contentType, file.name);
  const filePath = buildStoragePath(options.folder || "blog", extension);
  const buffer = await file.arrayBuffer();
  return uploadBuffer(config, buffer, contentType, filePath);
}

export async function importRemoteImageToSupabase(
  remoteUrl: string,
  options: { folder?: string; config?: SupabaseMediaConfig | null } = {},
): Promise<UploadedMediaAsset | null> {
  const normalizedRemoteUrl = remoteUrl.trim();
  if (!isHttpUrl(normalizedRemoteUrl)) {
    return null;
  }

  const config = options.config ?? (await getSupabaseMediaConfig());
  if (!config) {
    return null;
  }

  if (isAlreadySupabaseHosted(normalizedRemoteUrl, config.baseUrl, config.bucket)) {
    return {
      name: normalizedRemoteUrl.split(`/${config.bucket}/`)[1] || normalizedRemoteUrl,
      url: normalizedRemoteUrl,
      contentType: "image/*",
      size: 0,
    };
  }

  const response = await fetch(normalizedRemoteUrl, {
    method: "GET",
    redirect: "follow",
    headers: {
      "user-agent": "100Xfounder-MediaImporter/1.0",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const rawContentType = normalizeContentType(response.headers.get("content-type"));
  if (!rawContentType.startsWith("image/")) {
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

  const extension = inferExtension(rawContentType, normalizedRemoteUrl);
  const filePath = buildStoragePath(options.folder || "blog/imported", extension);
  return uploadBuffer(config, arrayBuffer, rawContentType, filePath);
}

export async function mirrorRemoteImageUrlToSupabase(
  remoteUrl: string,
  options: { folder?: string; config?: SupabaseMediaConfig | null } = {},
): Promise<string> {
  const normalizedRemoteUrl = remoteUrl.trim();
  if (!isHttpUrl(normalizedRemoteUrl)) {
    return normalizedRemoteUrl;
  }
  const imported = await importRemoteImageToSupabase(normalizedRemoteUrl, options);
  return imported?.url || normalizedRemoteUrl;
}

export async function mirrorExternalImagesInHtmlToSupabase(
  html: string,
  options: { folder?: string; config?: SupabaseMediaConfig | null; maxImages?: number } = {},
): Promise<string> {
  if (!html || !/<img\b/i.test(html)) {
    return html;
  }

  const matches = Array.from(
    html.matchAll(/<img\b[^>]*\bsrc\s*=\s*("([^"]+)"|'([^']+)'|([^\s>]+))/gi),
  );
  if (matches.length === 0) {
    return html;
  }

  const maxImages = options.maxImages ?? 8;
  const candidates = Array.from(
    new Set(
      matches
        .map((match) => (match[2] || match[3] || match[4] || "").trim())
        .filter((value) => isHttpUrl(value)),
    ),
  ).slice(0, maxImages);

  if (candidates.length === 0) {
    return html;
  }

  const config = options.config ?? (await getSupabaseMediaConfig());
  if (!config) {
    return html;
  }

  const replacementMap = new Map<string, string>();
  for (const candidate of candidates) {
    try {
      const mirrored = await mirrorRemoteImageUrlToSupabase(candidate, {
        folder: options.folder || "blog/inline-imported",
        config,
      });
      if (mirrored && mirrored !== candidate) {
        replacementMap.set(candidate, mirrored);
      }
    } catch {
      // Keep original URL if import fails.
    }
  }

  if (replacementMap.size === 0) {
    return html;
  }

  return html.replace(
    /(<img\b[^>]*\bsrc\s*=\s*)("([^"]+)"|'([^']+)'|([^\s>]+))/gi,
    (full, prefix: string, quoted: string, dquoted: string, squoted: string, bare: string) => {
      const source = (dquoted || squoted || bare || "").trim();
      const next = replacementMap.get(source);
      if (!next) {
        return full;
      }

      const quote = quoted.startsWith("'") ? "'" : '"';
      return `${prefix}${quote}${next}${quote}`;
    },
  );
}
