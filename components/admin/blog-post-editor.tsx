"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { countWords, slugify, toReadingTime } from "@/lib/blog/post-utils";
import type { BlogPost } from "@/lib/blog/types";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

type BlogPostEditorProps = {
  slug?: string;
};

type EditorForm = {
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  category: string;
  thumbnail: string;
  imageCredit: string;
  author: string;
  content: string;
  status: "DRAFT" | "PUBLISHED";
  articleType: string;
  topicSlug: string;
  canonicalUrl: string;
  sourceUrlsText: string;
  factCheckStatus: string;
  correctionNote: string;
  discoverReady: boolean;
  socialImageUrl: string;
  citationsText: string;
  seoTitle: string;
  seoDescription: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
};

const DEFAULT_FORM: EditorForm = {
  slug: "",
  title: "",
  subtitle: "",
  excerpt: "",
  category: "Founder Intelligence",
  thumbnail: "/images/covers/startup-brief.svg",
  imageCredit: "",
  author: "100Xfounder Research",
  content: "",
  status: "DRAFT",
  articleType: "analysis",
  topicSlug: "",
  canonicalUrl: "",
  sourceUrlsText: "",
  factCheckStatus: "pending_review",
  correctionNote: "",
  discoverReady: false,
  socialImageUrl: "",
  citationsText: "",
  seoTitle: "",
  seoDescription: "",
  createdAt: undefined,
  updatedAt: undefined,
  publishedAt: undefined,
};

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url);
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error ?? "Request failed");
  }

  return result;
};

function toEditorForm(post: BlogPost): EditorForm {
  return {
    slug: post.slug,
    title: post.title,
    subtitle: post.subtitle ?? "",
    excerpt: post.excerpt,
    category: post.category,
    thumbnail: post.thumbnail,
    imageCredit: post.imageCredit ?? "",
    author: post.author,
    content: post.content,
    status: post.status ?? "DRAFT",
    articleType: post.articleType ?? "analysis",
    topicSlug: post.topicSlug ?? "",
    canonicalUrl: post.canonicalUrl ?? "",
    sourceUrlsText: (post.sourceUrls ?? []).join("\n"),
    factCheckStatus: post.factCheckStatus ?? "pending_review",
    correctionNote: post.correctionNote ?? "",
    discoverReady: post.discoverReady ?? false,
    socialImageUrl: post.socialImageUrl ?? "",
    citationsText:
      post.citations && post.citations.length > 0
        ? JSON.stringify(
            post.citations.map((item) => ({
              sourceName: item.sourceName,
              sourceUrl: item.sourceUrl,
              sourceTitle: item.sourceTitle,
              quotedClaim: item.quotedClaim ?? undefined,
            })),
            null,
            2,
          )
        : "",
    seoTitle: post.seoTitle ?? post.title,
    seoDescription: post.seoDescription ?? post.excerpt,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    publishedAt: post.publishedAt,
  };
}

function formatDate(value?: string): string {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function extractPlainText(content: string): string {
  return content
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toDateTimeInputValue(value?: string): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function toIsoOrUndefined(value: string): string | undefined {
  if (!value.trim()) {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
}

function parseSourceUrlsInput(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(/\n|,/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function parseCitationsInput(value: string) {
  const raw = value.trim();
  if (!raw) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return undefined;
    }

    const normalized = parsed
      .map((item) => {
        if (!item || typeof item !== "object") {
          return null;
        }

        const sourceName = String((item as Record<string, unknown>).sourceName ?? "").trim();
        const sourceUrl = String((item as Record<string, unknown>).sourceUrl ?? "").trim();
        const sourceTitle = String((item as Record<string, unknown>).sourceTitle ?? "").trim();
        const quotedClaim = String((item as Record<string, unknown>).quotedClaim ?? "").trim();
        if (!sourceName || !sourceUrl || !sourceTitle) {
          return null;
        }

        const normalizedItem: {
          sourceName: string;
          sourceUrl: string;
          sourceTitle: string;
          quotedClaim?: string;
        } = {
          sourceName,
          sourceUrl,
          sourceTitle,
        };
        if (quotedClaim) {
          normalizedItem.quotedClaim = quotedClaim;
        }
        return normalizedItem;
      })
      .filter(
        (
          item,
        ): item is {
          sourceName: string;
          sourceUrl: string;
          sourceTitle: string;
          quotedClaim?: string;
        } => Boolean(item),
      );

    return normalized.length > 0 ? normalized : undefined;
  } catch {
    return undefined;
  }
}

export function BlogPostEditor({ slug }: BlogPostEditorProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState<EditorForm>(DEFAULT_FORM);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");

  const isNew = !slug;

  const postState = useSWR<{ post: BlogPost }>(
    isNew ? null : `/api/admin/content/blog/${slug}`,
    (url: string) => fetcher<{ success: true; post: BlogPost }>(url),
  );

  useEffect(() => {
    if (!postState.data?.post) return;
    setForm(toEditorForm(postState.data.post));
  }, [postState.data]);

  const wordCount = useMemo(() => countWords(form.content), [form.content]);
  const readingTime = useMemo(() => toReadingTime(wordCount), [wordCount]);

  const seoChecks = useMemo(() => {
    const checks = [
      {
        label: "SEO title length",
        ok: form.seoTitle.trim().length >= 35 && form.seoTitle.trim().length <= 65,
      },
      {
        label: "SEO description length",
        ok:
          form.seoDescription.trim().length >= 120 &&
          form.seoDescription.trim().length <= 160,
      },
      {
        label: "Content length",
        ok: wordCount >= 400,
      },
      {
        label: "Featured image",
        ok: Boolean(form.thumbnail.trim()),
      },
      {
        label: "Author name",
        ok: form.author.trim().length >= 2,
      },
      {
        label: "Discover ready toggle",
        ok: form.discoverReady,
      },
      {
        label: "Fact-check status",
        ok: ["reviewed", "verified", "approved"].includes(
          form.factCheckStatus.trim().toLowerCase(),
        ),
      },
      {
        label: "Citations JSON",
        ok: Boolean(parseCitationsInput(form.citationsText)),
      },
    ];

    return checks;
  }, [
    form.author,
    form.citationsText,
    form.discoverReady,
    form.factCheckStatus,
    form.seoDescription,
    form.seoTitle,
    form.thumbnail,
    wordCount,
  ]);

  function onTitleChange(value: string) {
    setForm((current) => {
      const nextSlug = isNew && !current.slug ? slugify(value) : current.slug;
      return {
        ...current,
        title: value,
        slug: nextSlug,
        seoTitle: current.seoTitle || value,
      };
    });
  }

  function autoGenerateExcerpt() {
    const plain = extractPlainText(form.content);
    const nextExcerpt = plain.length <= 180 ? plain : `${plain.slice(0, 177).trimEnd()}...`;
    setForm((current) => ({
      ...current,
      excerpt: nextExcerpt,
      seoDescription: current.seoDescription || nextExcerpt,
    }));
  }

  async function savePost(nextStatus?: "DRAFT" | "PUBLISHED") {
    setSaving(true);
    setStatusMessage(null);

    const citations = parseCitationsInput(form.citationsText);
    if (form.citationsText.trim() && !citations) {
      setSaving(false);
      setStatusMessage("Invalid citations JSON. Provide an array of sourceName/sourceUrl/sourceTitle objects.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || undefined,
      content: form.content,
      status: nextStatus ?? form.status,
      category: form.category.trim() || undefined,
      thumbnail: form.thumbnail.trim() || undefined,
      imageCredit: form.imageCredit.trim() || undefined,
      author: form.author.trim() || undefined,
      slug: form.slug.trim() || undefined,
      excerpt: form.excerpt.trim() || undefined,
      articleType: form.articleType.trim() || undefined,
      topicSlug: form.topicSlug.trim() || undefined,
      canonicalUrl: form.canonicalUrl.trim() || undefined,
      sourceUrls: parseSourceUrlsInput(form.sourceUrlsText),
      factCheckStatus: form.factCheckStatus.trim() || undefined,
      correctionNote: form.correctionNote.trim() || undefined,
      discoverReady: form.discoverReady,
      socialImageUrl: form.socialImageUrl.trim() || undefined,
      citations,
      publishedAt: toIsoOrUndefined(form.publishedAt || ""),
      seoTitle: form.seoTitle.trim() || undefined,
      seoDescription: form.seoDescription.trim() || undefined,
    };

    const endpoint = isNew ? "/api/admin/content/blog" : `/api/admin/content/blog/${slug}`;
    const method = isNew ? "POST" : "PATCH";

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => null);
    setSaving(false);

    if (!response.ok || !result?.success) {
      setStatusMessage(result?.error ?? "Failed to save post.");
      return;
    }

    const savedPost = result.post as BlogPost;
    setForm(toEditorForm(savedPost));
    setStatusMessage((nextStatus ?? form.status) === "PUBLISHED" ? "Post published." : "Draft saved.");

    if (isNew && savedPost.slug) {
      router.replace(`/admin/content/blog/${savedPost.slug}`);
      return;
    }

    await postState.mutate();
  }

  async function deletePost() {
    if (isNew || !slug) return;

    const ok = window.confirm("Delete this post?");
    if (!ok) return;

    const response = await fetch(`/api/admin/content/blog/${slug}`, { method: "DELETE" });
    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.success) {
      setStatusMessage(result?.error ?? "Failed to delete post.");
      return;
    }

    router.push("/admin/content");
    router.refresh();
  }

  async function uploadImage(file: File) {
    setUploading(true);
    setStatusMessage("Uploading image...");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "blog");

    const response = await fetch("/api/admin/media", {
      method: "POST",
      body: formData,
    });

    const result = await response.json().catch(() => null);
    setUploading(false);

    if (!response.ok || !result?.success) {
      setStatusMessage(result?.error ?? "Image upload failed.");
      return;
    }

    const imageUrl = String(result.item?.url ?? "");
    setUploadedImageUrl(imageUrl);
    setStatusMessage("Image uploaded. You can insert it in content or set as featured image.");
  }

  function insertImageIntoEditor(url: string) {
    if (!url) return;
    setForm((current) => ({
      ...current,
      content: `${current.content}<p><img src=\"${url}\" alt=\"${current.title || "Blog image"}\" /></p>`,
    }));
  }

  async function copyText(value: string) {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setStatusMessage("Copied to clipboard.");
  }

  if (!isNew && postState.isLoading) {
    return <p className="text-sm text-zinc-400">Loading post editor...</p>;
  }

  if (!isNew && postState.error) {
    return <p className="text-sm text-red-300">{(postState.error as Error).message}</p>;
  }

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "blockquote"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "image"],
      ["clean"],
    ],
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            {isNew ? "Create Article" : "Edit Article"}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            WordPress-style full post editor with SEO controls and image management.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/content"
            className="rounded-md border border-white/15 px-3 py-1.5 text-xs text-zinc-200 hover:border-white/30"
          >
            Back to List
          </Link>
          {!isNew ? (
            <Link
              href={`/blog/${form.slug}`}
              target="_blank"
              className="rounded-md border border-white/15 px-3 py-1.5 text-xs text-zinc-200 hover:border-white/30"
            >
              View Live
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4 rounded-xl border border-white/15 bg-white/[0.03] p-4 backdrop-blur-md">
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={form.title}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="Post title"
              className="h-10 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100 md:col-span-2"
            />
            <input
              value={form.subtitle}
              onChange={(event) => setForm((current) => ({ ...current, subtitle: event.target.value }))}
              placeholder="Subtitle (optional)"
              className="h-10 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100 md:col-span-2"
            />
            <input
              value={form.slug}
              onChange={(event) => setForm((current) => ({ ...current, slug: slugify(event.target.value) }))}
              placeholder="post-url-slug"
              className="h-10 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100"
            />
            <input
              value={form.author}
              onChange={(event) => setForm((current) => ({ ...current, author: event.target.value }))}
              placeholder="Author"
              className="h-10 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100"
            />
            <input
              value={form.category}
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              placeholder="Category"
              className="h-10 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100"
            />
            <select
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
                }))
              }
              className="h-10 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100"
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>
            <input
              value={form.articleType}
              onChange={(event) => setForm((current) => ({ ...current, articleType: event.target.value }))}
              placeholder="Article type (analysis, brief, explainers)"
              className="h-10 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100"
            />
            <input
              value={form.topicSlug}
              onChange={(event) =>
                setForm((current) => ({ ...current, topicSlug: slugify(event.target.value) }))
              }
              placeholder="topic-slug"
              className="h-10 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100"
            />
            <input
              value={form.canonicalUrl}
              onChange={(event) => setForm((current) => ({ ...current, canonicalUrl: event.target.value }))}
              placeholder="Canonical URL (optional)"
              className="h-10 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100 md:col-span-2"
            />

            <div className="rounded-md border border-white/10 bg-black/35 px-3 py-2 text-xs text-zinc-300 md:col-span-2">
              <p>URL Preview: {`/blog/${form.slug || "your-slug"}`}</p>
            </div>

            <textarea
              rows={3}
              value={form.excerpt}
              onChange={(event) => setForm((current) => ({ ...current, excerpt: event.target.value }))}
              placeholder="Excerpt"
              className="rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-zinc-100 md:col-span-2"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={autoGenerateExcerpt}
              className="rounded-md border border-white/15 px-3 py-1.5 text-xs text-zinc-200 hover:border-white/30"
            >
              Generate Excerpt from Content
            </button>
            <span className="text-xs text-zinc-400">{wordCount} words</span>
            <span className="text-xs text-zinc-500">{readingTime}</span>
          </div>

          <div className="rounded-md border border-white/15 bg-black/40 p-2">
            <ReactQuill
              theme="snow"
              value={form.content}
              onChange={(value) => setForm((current) => ({ ...current, content: value }))}
              modules={quillModules}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => savePost("DRAFT")}
              disabled={saving}
              className="inline-flex h-10 items-center rounded-md border border-white/15 bg-white/[0.05] px-4 text-sm font-medium text-zinc-100 transition-colors hover:border-white/30 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Draft"}
            </button>
            <button
              type="button"
              onClick={() => savePost("PUBLISHED")}
              disabled={saving}
              className="inline-flex h-10 items-center rounded-md bg-[#6366f1] px-4 text-sm font-medium text-white transition-colors hover:bg-[#5558ea] disabled:opacity-60"
            >
              {saving ? "Saving..." : "Publish"}
            </button>
            {!isNew ? (
              <button
                type="button"
                onClick={deletePost}
                className="inline-flex h-10 items-center rounded-md border border-red-400/35 bg-red-500/10 px-4 text-sm font-medium text-red-200 transition-colors hover:bg-red-500/20"
              >
                Delete Post
              </button>
            ) : null}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4 backdrop-blur-md">
            <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-300">Post Timing</h2>
            <div className="mt-3 space-y-2 text-sm text-zinc-300">
              <p>
                <span className="text-zinc-500">Created:</span> {formatDate(form.createdAt)}
              </p>
              <p>
                <span className="text-zinc-500">Updated:</span> {formatDate(form.updatedAt)}
              </p>
              <p>
                <span className="text-zinc-500">Published:</span> {formatDate(form.publishedAt)}
              </p>
            </div>
            <div className="mt-3 space-y-2">
              <label className="block text-xs text-zinc-500">Schedule / Published At</label>
              <input
                type="datetime-local"
                value={toDateTimeInputValue(form.publishedAt)}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    publishedAt: event.target.value
                      ? toIsoOrUndefined(event.target.value) ?? current.publishedAt
                      : undefined,
                  }))
                }
                className="h-10 w-full rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100"
              />
            </div>
          </div>

          <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4 backdrop-blur-md">
            <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-300">On-Page SEO</h2>
            <div className="mt-3 space-y-3">
              <input
                value={form.seoTitle}
                onChange={(event) =>
                  setForm((current) => ({ ...current, seoTitle: event.target.value }))
                }
                placeholder="SEO Title"
                className="h-10 w-full rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100"
              />
              <p className="text-xs text-zinc-500">{form.seoTitle.trim().length}/65 chars</p>

              <textarea
                rows={3}
                value={form.seoDescription}
                onChange={(event) =>
                  setForm((current) => ({ ...current, seoDescription: event.target.value }))
                }
                placeholder="SEO Description"
                className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-zinc-100"
              />
              <p className="text-xs text-zinc-500">{form.seoDescription.trim().length}/160 chars</p>

              <div className="space-y-1 rounded-md border border-white/10 bg-black/30 p-3">
                {seoChecks.map((check) => (
                  <p
                    key={check.label}
                    className={check.ok ? "text-xs text-emerald-300" : "text-xs text-amber-200"}
                  >
                    {check.ok ? "✓" : "•"} {check.label}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4 backdrop-blur-md">
            <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-300">Newsroom Compliance</h2>
            <div className="mt-3 space-y-3">
              <label className="block text-xs text-zinc-500">
                Source URLs (one per line)
              </label>
              <textarea
                rows={4}
                value={form.sourceUrlsText}
                onChange={(event) =>
                  setForm((current) => ({ ...current, sourceUrlsText: event.target.value }))
                }
                placeholder="https://..."
                className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-zinc-100"
              />

              <label className="block text-xs text-zinc-500">Fact-check status</label>
              <select
                value={form.factCheckStatus}
                onChange={(event) =>
                  setForm((current) => ({ ...current, factCheckStatus: event.target.value }))
                }
                className="h-10 w-full rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100"
              >
                <option value="pending_review">Pending review</option>
                <option value="reviewed">Reviewed</option>
                <option value="verified">Verified</option>
                <option value="approved">Approved</option>
              </select>

              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={form.discoverReady}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, discoverReady: event.target.checked }))
                  }
                  className="h-4 w-4 rounded border-white/25 bg-black/40"
                />
                Mark as discover ready
              </label>

              <input
                value={form.socialImageUrl}
                onChange={(event) =>
                  setForm((current) => ({ ...current, socialImageUrl: event.target.value }))
                }
                placeholder="Social image URL (optional)"
                className="h-10 w-full rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100"
              />

              <textarea
                rows={3}
                value={form.correctionNote}
                onChange={(event) =>
                  setForm((current) => ({ ...current, correctionNote: event.target.value }))
                }
                placeholder="Correction note (optional)"
                className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-zinc-100"
              />

              <label className="block text-xs text-zinc-500">
                Citations JSON (array of sourceName/sourceUrl/sourceTitle)
              </label>
              <textarea
                rows={8}
                value={form.citationsText}
                onChange={(event) =>
                  setForm((current) => ({ ...current, citationsText: event.target.value }))
                }
                placeholder='[{"sourceName":"Entrackr","sourceUrl":"https://...","sourceTitle":"..."}]'
                className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 font-mono text-xs text-zinc-100"
              />
            </div>
          </div>

          <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4 backdrop-blur-md">
            <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-300">Images</h2>
            <div className="mt-3 space-y-3">
              <input
                value={form.thumbnail}
                onChange={(event) =>
                  setForm((current) => ({ ...current, thumbnail: event.target.value }))
                }
                placeholder="Featured image URL"
                className="h-10 w-full rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100"
              />
              <input
                value={form.imageCredit}
                onChange={(event) =>
                  setForm((current) => ({ ...current, imageCredit: event.target.value }))
                }
                placeholder="Image credit"
                className="h-10 w-full rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="rounded-md border border-white/15 px-3 py-1.5 text-xs text-zinc-200 hover:border-white/30 disabled:opacity-60"
              >
                {uploading ? "Uploading..." : "Upload Image"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  void uploadImage(file);
                  event.target.value = "";
                }}
              />

              {uploadedImageUrl ? (
                <div className="space-y-2 rounded-md border border-white/10 bg-black/30 p-3">
                  <p className="line-clamp-2 text-xs text-zinc-400">{uploadedImageUrl}</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, thumbnail: uploadedImageUrl }))}
                      className="rounded-md border border-white/15 px-2.5 py-1 text-xs text-zinc-200 hover:border-white/30"
                    >
                      Use as Featured
                    </button>
                    <button
                      type="button"
                      onClick={() => insertImageIntoEditor(uploadedImageUrl)}
                      className="rounded-md border border-white/15 px-2.5 py-1 text-xs text-zinc-200 hover:border-white/30"
                    >
                      Insert in Content
                    </button>
                    <button
                      type="button"
                      onClick={() => copyText(uploadedImageUrl)}
                      className="rounded-md border border-white/15 px-2.5 py-1 text-xs text-zinc-200 hover:border-white/30"
                    >
                      Copy URL
                    </button>
                  </div>
                </div>
              ) : null}

              {form.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.thumbnail}
                  alt={form.title || "Featured image preview"}
                  className="h-40 w-full rounded-lg border border-white/10 object-cover"
                />
              ) : null}
            </div>
          </div>
        </aside>
      </div>

      {statusMessage ? (
        <p className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-xs text-zinc-300">
          {statusMessage}
        </p>
      ) : null}
    </div>
  );
}
