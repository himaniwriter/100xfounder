const CODE_GARBAGE_RE = /\b[a-z]*\d+[a-z\d-]*\b/gi;
const NON_TEXT_RE = /[^a-zA-Z\s&/.-]/g;

export function cleanLabel(text: string): string {
  const cleaned = text
    .replace(CODE_GARBAGE_RE, " ")
    .replace(NON_TEXT_RE, " ")
    .replace(/\s+/g, " ")
    .trim();

  const normalized = cleaned || "Other";

  if (normalized.length <= 20) {
    return normalized;
  }

  return `${normalized.slice(0, 20)}...`;
}
