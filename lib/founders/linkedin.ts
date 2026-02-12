type AvatarSourceInput = {
  linkedinUrl?: string | null;
  founderName?: string | null;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function normalizeHandle(value: string): string {
  return decodeURIComponent(value).replace(/\/+$/, "").trim();
}

export function extractLinkedInHandle(url: string | null | undefined): string | null {
  if (!url || !url.trim()) {
    return null;
  }

  const raw = url.trim();
  const fromRegex = raw.match(/linkedin\.com\/(?:in|pub)\/([^/?#]+)/i);
  if (fromRegex && fromRegex[1]) {
    return normalizeHandle(fromRegex[1]);
  }

  try {
    const parsed = new URL(raw);
    if (!/linkedin\.com$/i.test(parsed.hostname) && !/\.linkedin\.com$/i.test(parsed.hostname)) {
      return null;
    }

    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments.length >= 2 && (segments[0] === "in" || segments[0] === "pub")) {
      return normalizeHandle(segments[1]);
    }
  } catch {
    return null;
  }

  return null;
}

export function guessLinkedInHandleByName(founderName: string | null | undefined): string | null {
  if (!founderName || !founderName.trim()) {
    return null;
  }

  const guess = slugify(founderName);
  return guess || null;
}

export function buildLinkedInAvatarSources(input: AvatarSourceInput): string[] {
  const values: string[] = [];
  const explicitHandle = extractLinkedInHandle(input.linkedinUrl);

  if (explicitHandle) {
    values.push(`https://unavatar.io/linkedin/${explicitHandle}`);
  }

  const guessedHandle = guessLinkedInHandleByName(input.founderName);
  if (guessedHandle) {
    values.push(`https://unavatar.io/linkedin/${guessedHandle}`);
  }

  return Array.from(new Set(values));
}

export function buildPrimaryLinkedInAvatar(input: AvatarSourceInput): string | null {
  return buildLinkedInAvatarSources(input)[0] ?? null;
}

