type ExtractedHeading = {
  id: string;
  text: string;
  level: 1 | 2 | 3 | 4;
};

const HEADING_RE = /<h([1-4])([^>]*)>([\s\S]*?)<\/h\1>/gi;
const TAG_RE = /<[^>]+>/g;
const ID_ATTR_RE = /\sid\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i;

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x27;/g, "'");
}

function stripHtmlTags(text: string): string {
  return text.replace(TAG_RE, "");
}

function headingToId(text: string): string {
  const normalized = decodeHtmlEntities(stripHtmlTags(text))
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)+/g, "");
  return normalized || "section";
}

function nextUniqueId(base: string, seen: Map<string, number>): string {
  const count = seen.get(base) ?? 0;
  const next = count + 1;
  seen.set(base, next);
  return next === 1 ? base : `${base}-${next}`;
}

export function addHeadingIds(htmlContent: string): string {
  if (!htmlContent || !HEADING_RE.test(htmlContent)) {
    HEADING_RE.lastIndex = 0;
    return htmlContent;
  }

  HEADING_RE.lastIndex = 0;
  const seen = new Map<string, number>();

  return htmlContent.replace(
    HEADING_RE,
    (fullMatch, level, rawAttrs: string, innerHtml: string) => {
      const text = decodeHtmlEntities(stripHtmlTags(innerHtml)).trim();
      if (!text) {
        return fullMatch;
      }

      const computedId = nextUniqueId(headingToId(text), seen);
      const attrsWithoutId = rawAttrs.replace(ID_ATTR_RE, "");
      const normalizedAttrs = attrsWithoutId.trim();
      const attrsPrefix = normalizedAttrs ? ` ${normalizedAttrs}` : "";

      return `<h${level}${attrsPrefix} id="${computedId}">${innerHtml}</h${level}>`;
    },
  );
}

function extractHtmlHeadings(htmlContent: string): ExtractedHeading[] {
  const headings: ExtractedHeading[] = [];
  const seen = new Map<string, number>();
  let match: RegExpExecArray | null;

  HEADING_RE.lastIndex = 0;
  while ((match = HEADING_RE.exec(htmlContent)) !== null) {
    const level = Number(match[1]) as 1 | 2 | 3 | 4;
    const attrs = match[2] ?? "";
    const innerHtml = match[3] ?? "";
    const text = decodeHtmlEntities(stripHtmlTags(innerHtml)).trim();
    if (!text) {
      continue;
    }

    const attrIdMatch = attrs.match(ID_ATTR_RE);
    const explicitAttrId =
      attrIdMatch?.[2] ?? attrIdMatch?.[3] ?? attrIdMatch?.[4] ?? "";
    const baseId = headingToId(explicitAttrId || text);
    const id = nextUniqueId(baseId, seen);

    headings.push({
      id,
      text,
      level,
    });
  }

  return headings;
}

function extractMarkdownHeadings(markdown: string): ExtractedHeading[] {
  const seen = new Map<string, number>();
  return markdown
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^#{1,4}\s+/.test(line))
    .map((line) => {
      const hashes = line.match(/^#{1,4}/)?.[0].length ?? 2;
      const text = decodeHtmlEntities(line.replace(/^#{1,4}\s+/, "").trim());
      return {
        id: nextUniqueId(headingToId(text), seen),
        text,
        level: hashes as 1 | 2 | 3 | 4,
      };
    })
    .filter((item) => item.text.length > 0);
}

export function extractHeadings(htmlContent: string): ExtractedHeading[] {
  if (!htmlContent) {
    return [];
  }

  if (/<h[1-4][^>]*>[\s\S]*?<\/h[1-4]>/i.test(htmlContent)) {
    return extractHtmlHeadings(htmlContent);
  }

  return extractMarkdownHeadings(htmlContent);
}

