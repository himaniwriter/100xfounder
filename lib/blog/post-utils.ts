export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function toPlainText(content: string): string {
  return content
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[`*_>#~\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function countWords(content: string): number {
  const plainText = toPlainText(content);
  if (!plainText) {
    return 0;
  }

  return plainText.split(" ").filter(Boolean).length;
}

export function toReadingTime(wordCount: number): string {
  const minutes = Math.max(1, Math.round(wordCount / 220));
  return `${minutes} min read`;
}

export function buildExcerpt(content: string, fallback?: string | null): string {
  const preferred = fallback?.trim();
  if (preferred) {
    return preferred;
  }

  const plainText = toPlainText(content);
  if (!plainText) {
    return "";
  }

  if (plainText.length <= 180) {
    return plainText;
  }

  return `${plainText.slice(0, 177).trimEnd()}...`;
}
