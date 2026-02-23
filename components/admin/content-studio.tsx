"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import type { BlogPost } from "@/lib/blog/types";
import { countWords } from "@/lib/blog/post-utils";
import type { HomepageContent } from "@/lib/content/homepage-content";

type StudioTab = "blog" | "pages";
type BlogListFilter = "ALL" | "DRAFT" | "REVIEW_READY" | "PUBLISHED";

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url);
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error ?? "Request failed");
  }
  return result;
};

function resolveWordCount(post: BlogPost): number {
  if (typeof post.wordCount === "number" && post.wordCount > 0) {
    return post.wordCount;
  }

  return countWords(post.content || post.excerpt || "");
}

function isReviewReady(post: BlogPost): boolean {
  const wordCount = resolveWordCount(post);
  const citations = post.citations ?? [];
  const hasDiscoverImage =
    Boolean(post.thumbnail) &&
    !post.thumbnail.includes("/images/covers/") &&
    !post.thumbnail.endsWith(".svg");
  const factChecked = ["reviewed", "verified", "approved"].includes(
    (post.factCheckStatus || "").toLowerCase(),
  );

  return Boolean(post.discoverReady) && hasDiscoverImage && factChecked && citations.length > 0 && wordCount >= 400;
}

export function ContentStudio() {
  const [activeTab, setActiveTab] = useState<StudioTab>("blog");
  const [blogFilter, setBlogFilter] = useState<BlogListFilter>("ALL");
  const [homepageForm, setHomepageForm] = useState<HomepageContent | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const blogState = useSWR<{ posts: BlogPost[] }>(
    "/api/admin/content/blog",
    (url: string) => fetcher<{ success: true; posts: BlogPost[] }>(url),
  );
  const homepageState = useSWR<{ content: HomepageContent }>(
    "/api/admin/content/pages/home",
    (url: string) => fetcher<{ success: true; content: HomepageContent }>(url),
  );

  const posts = useMemo(() => blogState.data?.posts ?? [], [blogState.data]);
  const visiblePosts = useMemo(() => {
    if (blogFilter === "DRAFT") {
      return posts.filter((post) => post.status === "DRAFT");
    }
    if (blogFilter === "REVIEW_READY") {
      return posts.filter((post) => post.status === "DRAFT" && isReviewReady(post));
    }
    if (blogFilter === "PUBLISHED") {
      return posts.filter((post) => post.status === "PUBLISHED");
    }
    return posts;
  }, [posts, blogFilter]);

  useEffect(() => {
    if (homepageState.data?.content) {
      setHomepageForm(homepageState.data.content);
    }
  }, [homepageState.data]);

  async function deleteBlogPost(slug: string) {
    const confirmDelete = window.confirm("Delete this blog post?");
    if (!confirmDelete) return;

    const response = await fetch(`/api/admin/content/blog/${slug}`, {
      method: "DELETE",
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      setStatus(result.error ?? "Failed to delete post.");
      return;
    }

    setStatus("Blog post deleted.");
    await blogState.mutate();
  }

  async function togglePostStatus(post: BlogPost) {
    const nextStatus = (post.status ?? "PUBLISHED") === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    const response = await fetch(`/api/admin/content/blog/${post.slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      setStatus(result.error ?? "Failed to update post status.");
      return;
    }

    setStatus(`Post set to ${nextStatus}.`);
    await blogState.mutate();
  }

  async function publishPost(slug: string) {
    const response = await fetch("/api/admin/news/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    const result = await response.json().catch(() => null);

    if (!response.ok || !result.success) {
      const checks = result?.readiness?.checks
        ? Object.entries(result.readiness.checks)
            .filter(([, value]) => !value)
            .map(([key]) => key)
            .join(", ")
        : "";
      setStatus(
        checks
          ? `${result?.error ?? "Failed to publish post."} Missing: ${checks}`
          : (result?.error ?? "Failed to publish post."),
      );
      return;
    }

    setStatus("Post published.");
    await blogState.mutate();
  }

  async function saveHomepageBlocks() {
    if (!homepageForm) return;
    setSaving(true);
    setStatus(null);

    const response = await fetch("/api/admin/content/pages/home", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(homepageForm),
    });
    const result = await response.json();
    setSaving(false);

    if (!response.ok || !result.success) {
      setStatus(result.error ?? "Failed to update homepage blocks.");
      return;
    }

    setStatus("Homepage content blocks updated.");
    await homepageState.mutate();
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Content Studio</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Manage newsroom articles and edit homepage hero copy from the admin panel.
        </p>
      </div>

      <div className="inline-flex rounded-md border border-white/15 bg-white/[0.03] p-1">
        <button
          type="button"
          onClick={() => setActiveTab("blog")}
          className={
            activeTab === "blog"
              ? "rounded-md bg-indigo-500/20 px-3 py-1.5 text-sm text-indigo-200"
              : "rounded-md px-3 py-1.5 text-sm text-zinc-400 hover:text-white"
          }
        >
          Newsroom Manager
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("pages")}
          className={
            activeTab === "pages"
              ? "rounded-md bg-indigo-500/20 px-3 py-1.5 text-sm text-indigo-200"
              : "rounded-md px-3 py-1.5 text-sm text-zinc-400 hover:text-white"
          }
        >
          Page Builder
        </button>
      </div>

      {activeTab === "blog" ? (
        <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4 backdrop-blur-md">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-400">Newsroom Stories</h2>
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-md border border-white/10 bg-black/20 p-1">
                {(["ALL", "DRAFT", "REVIEW_READY", "PUBLISHED"] as BlogListFilter[]).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setBlogFilter(value)}
                    className={
                      blogFilter === value
                        ? "rounded-md bg-indigo-500/20 px-2 py-1 text-xs text-indigo-200"
                        : "rounded-md px-2 py-1 text-xs text-zinc-400 hover:text-white"
                    }
                  >
                    {value}
                  </button>
                ))}
              </div>
              <Link
                href="/admin/content/blog/new"
                className="rounded-md border border-white/15 px-3 py-1.5 text-xs text-zinc-100 transition-colors hover:border-white/30"
              >
                New Post
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            {blogState.isLoading ? (
              <p className="text-sm text-zinc-400">Loading posts...</p>
            ) : blogState.error ? (
              <p className="text-sm text-red-300">{(blogState.error as Error).message}</p>
            ) : visiblePosts.length === 0 ? (
              <p className="text-sm text-zinc-500">No posts found for this filter.</p>
            ) : (
              visiblePosts.map((post) => (
                <div
                  key={post.slug}
                  className="rounded-lg border border-white/10 bg-black/30 p-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-base font-medium text-white">{post.title}</p>
                    <p className="mt-2 line-clamp-2 text-sm text-zinc-400">{post.excerpt}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                      <span>{resolveWordCount(post)} words</span>
                      <span>• {post.status ?? "DRAFT"}</span>
                      <span>• {post.citations?.length ?? 0} citations</span>
                      <span>
                        • {post.factCheckStatus ? post.factCheckStatus.replace(/[_-]+/g, " ") : "pending review"}
                      </span>
                      {isReviewReady(post) ? (
                        <span className="rounded-full border border-emerald-400/35 bg-emerald-500/10 px-2 py-0.5 text-emerald-300">
                          review ready
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Link
                      href={
                        post.status === "PUBLISHED"
                          ? `/blog/${post.slug}`
                          : `/blog/${post.slug}?preview=1`
                      }
                      target="_blank"
                      className="rounded-md border border-blue-400/35 bg-blue-500/10 px-2.5 py-1 text-xs text-blue-200 hover:bg-blue-500/20"
                    >
                      Preview
                    </Link>
                    <Link
                      href={`/admin/content/blog/${post.slug}`}
                      className="rounded-md border border-indigo-400/35 bg-indigo-500/10 px-2.5 py-1 text-xs text-indigo-200 hover:bg-indigo-500/20"
                    >
                      Edit Post
                    </Link>
                    {post.status === "DRAFT" ? (
                      <button
                        type="button"
                        onClick={() => publishPost(post.slug)}
                        className="rounded-md border border-emerald-400/35 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-200 hover:bg-emerald-500/20"
                      >
                        Publish
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => togglePostStatus(post)}
                      className="rounded-md border border-white/20 px-2.5 py-1 text-xs text-zinc-300 hover:border-white/35"
                    >
                      Toggle Status
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteBlogPost(post.slug)}
                      className="rounded-md border border-red-400/35 bg-red-500/10 px-2.5 py-1 text-xs text-red-200 hover:bg-red-500/20"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4 backdrop-blur-md">
          {homepageState.isLoading || !homepageForm ? (
            <p className="text-sm text-zinc-400">Loading homepage blocks...</p>
          ) : homepageState.error ? (
            <p className="text-sm text-red-300">{(homepageState.error as Error).message}</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              <input
                value={homepageForm.heroTitle}
                onChange={(event) =>
                  setHomepageForm((current) =>
                    current ? { ...current, heroTitle: event.target.value } : current,
                  )
                }
                placeholder="Hero Title"
                className="h-10 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100 md:col-span-2"
              />
              <textarea
                rows={3}
                value={homepageForm.heroSubtitle}
                onChange={(event) =>
                  setHomepageForm((current) =>
                    current ? { ...current, heroSubtitle: event.target.value } : current,
                  )
                }
                placeholder="Hero Subtitle"
                className="rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-zinc-100 md:col-span-2"
              />
              <input
                value={homepageForm.primaryCtaLabel}
                onChange={(event) =>
                  setHomepageForm((current) =>
                    current ? { ...current, primaryCtaLabel: event.target.value } : current,
                  )
                }
                placeholder="Primary CTA Label"
                className="h-10 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100"
              />
              <input
                value={homepageForm.primaryCtaHref}
                onChange={(event) =>
                  setHomepageForm((current) =>
                    current ? { ...current, primaryCtaHref: event.target.value } : current,
                  )
                }
                placeholder="Primary CTA Link"
                className="h-10 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100"
              />
              <input
                value={homepageForm.secondaryCtaLabel}
                onChange={(event) =>
                  setHomepageForm((current) =>
                    current ? { ...current, secondaryCtaLabel: event.target.value } : current,
                  )
                }
                placeholder="Secondary CTA Label"
                className="h-10 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100"
              />
              <input
                value={homepageForm.secondaryCtaHref}
                onChange={(event) =>
                  setHomepageForm((current) =>
                    current ? { ...current, secondaryCtaHref: event.target.value } : current,
                  )
                }
                placeholder="Secondary CTA Link"
                className="h-10 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100"
              />
              <button
                type="button"
                onClick={saveHomepageBlocks}
                disabled={saving}
                className="inline-flex h-10 items-center rounded-md bg-[#6366f1] px-4 text-sm font-medium text-white transition-colors hover:bg-[#5558ea] disabled:opacity-70"
              >
                {saving ? "Saving..." : "Save Homepage Blocks"}
              </button>
            </div>
          )}
        </div>
      )}

      {status ? (
        <p className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-xs text-zinc-300">
          {status}
        </p>
      ) : null}
    </div>
  );
}
