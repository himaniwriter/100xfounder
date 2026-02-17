const BLOG_ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "u",
  "code",
  "pre",
  "blockquote",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "a",
  "hr",
  "span",
];

const BLOG_ALLOWED_ATTR = ["href", "target", "rel", "class", "id"];

const SAFE_TARGETS = new Set(["_self", "_blank", "_parent", "_top"]);
const URL_ATTRS = new Set(["href", "src"]);
const FORBID_CONTENT_TAGS = new Set(["script", "style", "iframe", "object", "embed", "applet"]);
const JS_PROTOCOL_RE = /^\s*javascript:/i;

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function stripForbiddenTags(html: string, tags: Set<string>): string {
  if (!html) {
    return "";
  }

  const joined = Array.from(tags).join("|");
  if (!joined) {
    return html;
  }

  return html
    .replace(
      new RegExp(`<\\s*(${joined})\\b[^>]*>[\\s\\S]*?<\\s*/\\s*\\1\\s*>`, "gi"),
      "",
    )
    .replace(new RegExp(`<\\s*(${joined})\\b[^>]*\\/?>`, "gi"), "");
}

function sanitizeAttributes(
  rawAttrs: string,
  allowedAttrs: Set<string>,
  isAnchorTag: boolean,
): string {
  if (!rawAttrs.trim()) {
    return "";
  }

  const attrs: string[] = [];
  let hasRel = false;
  let targetValue = "";
  const attrPattern = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'`=<>]+))/g;
  let match: RegExpExecArray | null;

  while ((match = attrPattern.exec(rawAttrs)) !== null) {
    const name = match[1].toLowerCase();
    if (!allowedAttrs.has(name) || name.startsWith("on")) {
      continue;
    }

    const rawValue = match[3] ?? match[4] ?? match[5] ?? "";
    if (URL_ATTRS.has(name) && JS_PROTOCOL_RE.test(rawValue)) {
      continue;
    }

    if (name === "target") {
      const normalized = rawValue.toLowerCase();
      if (!SAFE_TARGETS.has(normalized)) {
        continue;
      }
      targetValue = normalized;
      attrs.push(`target="${escapeHtmlAttr(normalized)}"`);
      continue;
    }

    if (name === "rel") {
      hasRel = true;
    }

    attrs.push(`${name}="${escapeHtmlAttr(rawValue)}"`);
  }

  if (isAnchorTag && targetValue === "_blank" && !hasRel) {
    attrs.push('rel="noopener noreferrer"');
  }

  return attrs.join(" ");
}

function sanitizeByAllowList(
  html: string,
  allowedTags: string[],
  allowedAttrs: string[],
  forbiddenTagsToStrip: Set<string>,
): string {
  if (!html) {
    return "";
  }

  const withoutComments = html.replace(/<!--[\s\S]*?-->/g, "");
  const stripped = stripForbiddenTags(withoutComments, forbiddenTagsToStrip);
  const tagSet = new Set(allowedTags.map((tag) => tag.toLowerCase()));
  const attrSet = new Set(allowedAttrs.map((attr) => attr.toLowerCase()));

  return stripped.replace(
    /<\s*(\/?)\s*([a-zA-Z0-9-]+)([^>]*)>/g,
    (_full, closeFlag: string, rawTag: string, rawAttrs: string) => {
      const tag = rawTag.toLowerCase();
      if (!tagSet.has(tag)) {
        return "";
      }

      if (closeFlag) {
        return `</${tag}>`;
      }

      const isSelfClosing = /\/\s*$/.test(rawAttrs);
      const safeAttrs = sanitizeAttributes(rawAttrs, attrSet, tag === "a");
      const suffix = isSelfClosing && tag !== "br" ? " /" : "";
      return safeAttrs ? `<${tag} ${safeAttrs}${suffix}>` : `<${tag}${suffix}>`;
    },
  );
}

export function sanitizeRichHtml(html: string): string {
  return sanitizeByAllowList(
    html,
    BLOG_ALLOWED_TAGS,
    BLOG_ALLOWED_ATTR,
    FORBID_CONTENT_TAGS,
  );
}

const ADMIN_ALLOWED_TAGS = [
  "script",
  "noscript",
  "iframe",
  "style",
  "meta",
  "link",
  "div",
  "span",
  "img",
  "a",
];

const ADMIN_ALLOWED_ATTR = [
  "src",
  "href",
  "rel",
  "name",
  "content",
  "target",
  "id",
  "class",
  "type",
  "nonce",
  "integrity",
  "crossorigin",
  "referrerpolicy",
  "async",
  "defer",
  "width",
  "height",
  "style",
  "allow",
  "allowfullscreen",
  "loading",
];

export function sanitizeAdminEmbedHtml(html: string): string {
  return sanitizeByAllowList(
    html,
    ADMIN_ALLOWED_TAGS,
    ADMIN_ALLOWED_ATTR,
    new Set(["object", "embed", "applet"]),
  );
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
