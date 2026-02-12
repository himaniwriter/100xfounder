"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import type { BlogPost } from "@/lib/blog/types";
import type { HomepageContent } from "@/lib/content/homepage-content";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

type StudioTab = "blog" | "pages";

type BlogForm = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readingTime: string;
  thumbnail: string;
  author: string;
  content: string;
  status: "DRAFT" | "PUBLISHED";
  seoTitle: string;
  seoDescription: string;
  isFeatured: boolean;
  isTrending: boolean;
};

const EMPTY_BLOG_FORM: BlogForm = {
  slug: "",
  title: "",
  excerpt: "",
  category: "Guide",
  readingTime: "5 min read",
  thumbnail: "/images/covers/startup-brief.svg",
  author: "100Xfounder Research",
  content: "",
  status: "DRAFT",
  seoTitle: "",
  seoDescription: "",
  isFeatured: false,
  isTrending: false,
};

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url);
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error ?? "Request failed");
  }
  return result;
};

function toBlogForm(post: BlogPost): BlogForm {
  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    category: post.category,
    readingTime: post.readingTime,
    thumbnail: post.thumbnail,
    author: post.author,
    content: post.content,
    status: post.status ?? "PUBLISHED",
    seoTitle: post.seoTitle ?? post.title,
    seoDescription: post.seoDescription ?? post.excerpt,
    isFeatured: post.isFeatured,
    isTrending: post.isTrending,
  };
}

export function ContentStudio() {
  const [activeTab, setActiveTab] = useState<StudioTab>("blog");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [blogForm, setBlogForm] = useState<BlogForm>(EMPTY_BLOG_FORM);
  const [homepageForm, setHomepageForm] = useState<HomepageContent | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isNewPost, setIsNewPost] = useState(false);

  const blogState = useSWR<{ posts: BlogPost[] }>(
    "/api/admin/content/blog",
    (url: string) => fetcher<{ success: true; posts: BlogPost[] }>(url),
  );
  const homepageState = useSWR<{ content: HomepageContent }>(
    "/api/admin/content/pages/home",
    (url: string) => fetcher<{ success: true; content: HomepageContent }>(url),
  );

  const posts = useMemo(() => blogState.data?.posts ?? [], [blogState.data]);

  useEffect(() => {
    if (!posts.length) {
      setSelectedSlug(null);
      return;
    }

    if (isNewPost) return;

    if (!selectedSlug || !posts.some((post) => post.slug === selectedSlug)) {
      const first = posts[0];
      setSelectedSlug(first.slug);
      setBlogForm(toBlogForm(first));
    }
  }, [posts, selectedSlug, isNewPost]);

  useEffect(() => {
    if (homepageState.data?.content) {
      setHomepageForm(homepageState.data.content);
    }
  }, [homepageState.data]);

  function selectPost(post: BlogPost) {
    setIsNewPost(false);
    setSelectedSlug(post.slug);
    setBlogForm(toBlogForm(post));
    setStatus(null);
  }

  async function saveBlogPost() {
    setSaving(true);
    setStatus(null);

    const payload = {
      ...blogForm,
      seoTitle: blogForm.seoTitle || blogForm.title,
      seoDescription: blogForm.seoDescription || blogForm.excerpt,
    };

    const endpoint = isNewPost ? "/api/admin/content/blog" : `/api/admin/content/blog/${selectedSlug}`;
    const method = isNewPost ? "POST" : "PATCH";

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    setSaving(false);

    if (!response.ok || !result.success) {
      setStatus(result.error ?? "Failed to save blog post.");
      return;
    }

    setStatus(isNewPost ? "Blog post created." : "Blog post updated.");
    setIsNewPost(false);
    await blogState.mutate();
  }

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
    setSelectedSlug(null);
    setBlogForm(EMPTY_BLOG_FORM);
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
          Manage blog articles and edit homepage hero copy from the admin panel.
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
          Blog Manager
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
        <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="rounded-xl border border-white/15 bg-white/[0.03] p-3 backdrop-blur-md">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-400">Articles</h2>
              <button
                type="button"
                onClick={() => {
                  setIsNewPost(true);
                  setSelectedSlug(null);
                  setBlogForm(EMPTY_BLOG_FORM);
                  setStatus(null);
                }}
                className="rounded-md border border-white/15 px-2 py-1 text-xs text-zinc-200 transition-colors hover:border-white/30"
              >
                New
              </button>
            </div>

            <div className="space-y-2">
              {blogState.isLoading ? (
                <p className="text-sm text-zinc-400">Loading posts...</p>
              ) : blogState.error ? (
                <p className="text-sm text-red-300">{(blogState.error as Error).message}</p>
              ) : posts.length === 0 ? (
                <p className="text-sm text-zinc-500">No posts available.</p>
              ) : (
                posts.map((post) => (
                  <div
                    key={post.slug}
                    className={
                      selectedSlug === post.slug && !isNewPost
                        ? "rounded-lg border border-indigo-400/35 bg-indigo-500/10 p-3"
                        : "rounded-lg border border-white/10 bg-black/30 p-3"
                    }
                  >
                    <button
                      type="button"
                      onClick={() => selectPost(post)}
                      className="w-full text-left"
                    >
                      <p className="line-clamp-1 text-sm font-medium text-white">{post.title}</p>
                      <p className="mt-1 text-xs text-zinc-500">{post.slug}</p>
                    </button>
                    <div className="mt-2 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => togglePostStatus(post)}
                        className={
                          (post.status ?? "PUBLISHED") === "PUBLISHED"
                            ? "rounded-full border border-emerald-400/35 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300"
                            : "rounded-full border border-amber-400/35 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-200"
                        }
                      >
                        {post.status ?? "PUBLISHED"}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteBlogPost(post.slug)}
                        className="text-xs text-red-300 hover:text-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-white/15 bg-white/[0.03] p-4 backdrop-blur-md">
            <div className="grid gap-3 md:grid-cols-2">
              <input
                value={blogForm.title}
                onChange={(event) =>
                  setBlogForm((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="Title"
                className="h-10 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100 md:col-span-2"
              />
              <input
                value={blogForm.slug}
                onChange={(event) =>
                  setBlogForm((current) => ({ ...current, slug: event.target.value }))
                }
                placeholder="Slug"
                disabled={!isNewPost}
                className="h-10 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100 disabled:opacity-60"
              />
              <input
                value={blogForm.category}
                onChange={(event) =>
                  setBlogForm((current) => ({ ...current, category: event.target.value }))
                }
                placeholder="Category"
                className="h-10 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100"
              />
              <input
                value={blogForm.author}
                onChange={(event) =>
                  setBlogForm((current) => ({ ...current, author: event.target.value }))
                }
                placeholder="Author"
                className="h-10 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100"
              />
              <input
                value={blogForm.readingTime}
                onChange={(event) =>
                  setBlogForm((current) => ({ ...current, readingTime: event.target.value }))
                }
                placeholder="Reading Time"
                className="h-10 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100"
              />
              <input
                value={blogForm.thumbnail}
                onChange={(event) =>
                  setBlogForm((current) => ({ ...current, thumbnail: event.target.value }))
                }
                placeholder="Featured Image URL"
                className="h-10 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100 md:col-span-2"
              />
              <input
                value={blogForm.seoTitle}
                onChange={(event) =>
                  setBlogForm((current) => ({ ...current, seoTitle: event.target.value }))
                }
                placeholder="SEO Title"
                className="h-10 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100 md:col-span-2"
              />
              <textarea
                rows={2}
                value={blogForm.seoDescription}
                onChange={(event) =>
                  setBlogForm((current) => ({ ...current, seoDescription: event.target.value }))
                }
                placeholder="SEO Description"
                className="rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-zinc-100 md:col-span-2"
              />
              <textarea
                rows={3}
                value={blogForm.excerpt}
                onChange={(event) =>
                  setBlogForm((current) => ({ ...current, excerpt: event.target.value }))
                }
                placeholder="Excerpt"
                className="rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-zinc-100 md:col-span-2"
              />
            </div>

            <div className="rounded-md border border-white/15 bg-black/40 p-2">
              <ReactQuill
                theme="snow"
                value={blogForm.content}
                onChange={(value) =>
                  setBlogForm((current) => ({ ...current, content: value }))
                }
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={blogForm.status === "PUBLISHED"}
                  onChange={(event) =>
                    setBlogForm((current) => ({
                      ...current,
                      status: event.target.checked ? "PUBLISHED" : "DRAFT",
                    }))
                  }
                />
                Published
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={blogForm.isFeatured}
                  onChange={(event) =>
                    setBlogForm((current) => ({ ...current, isFeatured: event.target.checked }))
                  }
                />
                Featured
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={blogForm.isTrending}
                  onChange={(event) =>
                    setBlogForm((current) => ({ ...current, isTrending: event.target.checked }))
                  }
                />
                Trending
              </label>
            </div>

            <button
              type="button"
              onClick={saveBlogPost}
              disabled={saving}
              className="inline-flex h-10 items-center rounded-md bg-[#6366f1] px-4 text-sm font-medium text-white transition-colors hover:bg-[#5558ea] disabled:opacity-70"
            >
              {saving ? "Saving..." : "Save Article"}
            </button>
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
                placeholder="Primary CTA URL"
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
                placeholder="Secondary CTA URL"
                className="h-10 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100"
              />

              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={saveHomepageBlocks}
                  disabled={saving}
                  className="inline-flex h-10 items-center rounded-md bg-[#6366f1] px-4 text-sm font-medium text-white transition-colors hover:bg-[#5558ea] disabled:opacity-70"
                >
                  {saving ? "Saving..." : "Save Homepage Blocks"}
                </button>
              </div>
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
