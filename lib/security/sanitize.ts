import DOMPurify from "isomorphic-dompurify";

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

export function sanitizeRichHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: BLOG_ALLOWED_TAGS,
    ALLOWED_ATTR: BLOG_ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });
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
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ADMIN_ALLOWED_TAGS,
    ALLOWED_ATTR: ADMIN_ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ["object", "embed", "applet"],
  });
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
