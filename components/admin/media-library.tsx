"use client";

import { useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { Copy, UploadCloud } from "lucide-react";

type MediaItem = {
  name: string;
  url: string;
  createdAt: string | null;
};

const fetcher = async (url: string): Promise<MediaItem[]> => {
  const response = await fetch(url);
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error ?? "Failed to load media");
  }
  return result.items as MediaItem[];
};

export function MediaLibrary() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [folder, setFolder] = useState("founders");
  const { data, error, isLoading, mutate } = useSWR("/api/admin/media", fetcher);

  const sortedItems = useMemo(
    () =>
      [...(data ?? [])].sort((a, b) => {
        const timeA = a.createdAt ? Date.parse(a.createdAt) : 0;
        const timeB = b.createdAt ? Date.parse(b.createdAt) : 0;
        return timeB - timeA;
      }),
    [data],
  );

  async function onUpload(file: File) {
    setUploading(true);
    setStatus("Uploading asset...");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const response = await fetch("/api/admin/media", {
      method: "POST",
      body: formData,
    });
    const result = await response.json();
    setUploading(false);

    if (!response.ok || !result.success) {
      setStatus(result.error ?? "Upload failed.");
      return;
    }

    setStatus("Upload successful.");
    await mutate();
  }

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url);
    setStatus("Copied public URL to clipboard.");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Media Library</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Upload files to the Supabase `images` bucket and copy public URLs instantly.
        </p>
      </div>

      <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4 backdrop-blur-md">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <input
            value={folder}
            onChange={(event) => setFolder(event.target.value)}
            placeholder="Folder (e.g. founders, blog, logos)"
            className="h-9 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-[#6366f1] px-3 text-sm font-medium text-white transition-colors hover:bg-[#5558ea] disabled:opacity-70"
          >
            <UploadCloud className="h-4 w-4" />
            {uploading ? "Uploading..." : "Upload Image"}
          </button>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              void onUpload(file);
              event.target.value = "";
            }}
          />
        </div>

        <div
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const file = event.dataTransfer.files?.[0];
            if (!file) return;
            void onUpload(file);
          }}
          className="rounded-lg border border-dashed border-white/20 bg-black/35 p-5 text-center"
        >
          <p className="text-sm text-zinc-300">Drag and drop an image here</p>
          <p className="mt-1 text-xs text-zinc-500">or click Upload Image</p>
        </div>
      </div>

      <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4 backdrop-blur-md">
        {isLoading ? (
          <p className="text-sm text-zinc-400">Loading media...</p>
        ) : error ? (
          <p className="text-sm text-red-300">{(error as Error).message}</p>
        ) : sortedItems.length === 0 ? (
          <p className="text-sm text-zinc-500">No media files yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedItems.map((item) => (
              <button
                key={item.url}
                type="button"
                onClick={() => copyUrl(item.url)}
                className="group overflow-hidden rounded-lg border border-white/10 bg-black/40 text-left transition-colors hover:border-white/25"
              >
                <img
                  src={item.url}
                  alt={item.name}
                  loading="lazy"
                  className="h-36 w-full object-cover"
                />
                <div className="space-y-1 p-3">
                  <p className="line-clamp-1 text-xs text-zinc-300">{item.name}</p>
                  <div className="inline-flex items-center gap-1 text-xs text-indigo-300">
                    <Copy className="h-3.5 w-3.5" />
                    Copy public URL
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {status ? (
        <p className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-xs text-zinc-300">
          {status}
        </p>
      ) : null}
    </div>
  );
}
