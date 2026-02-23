"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

type ProfileSettingsPanelProps = {
  email: string;
  initialName: string | null;
  initialAvatarUrl: string | null;
};

export function ProfileSettingsPanel({
  email,
  initialName,
  initialAvatarUrl,
}: ProfileSettingsPanelProps) {
  const [name, setName] = useState(initialName ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const previewUrl = avatarUrl.trim() || null;
  const profileInitial = useMemo(() => {
    const source = name.trim() || email;
    return source.charAt(0).toUpperCase();
  }, [email, name]);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);
    setError(null);

    try {
      const response = await fetch("/api/dashboard/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          avatarUrl: previewUrl,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        setError(payload?.error ?? "Unable to save profile.");
        return;
      }

      setName(payload.user?.name ?? name.trim());
      setAvatarUrl(payload.user?.avatarUrl ?? "");
      setStatus("Profile updated successfully.");
    } catch {
      setError("Unable to save profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
      <h2 className="text-base font-medium text-white">Profile Settings</h2>
      <p className="mt-1 text-xs text-zinc-400">
        Update display name and profile picture shown in your dashboard menu.
      </p>

      <form className="mt-4 grid gap-4 md:grid-cols-[96px_minmax(0,1fr)]" onSubmit={saveProfile}>
        <div className="flex justify-start md:justify-center">
          <div className="relative h-20 w-20 overflow-hidden rounded-full border border-white/15 bg-black/40">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Profile"
                className="h-full w-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="grid h-full w-full place-items-center text-xl font-semibold text-zinc-300">
                {profileInitial}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="profile-name" className="text-xs uppercase tracking-[0.12em] text-zinc-400">
              Name
            </label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your full name"
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors focus:border-indigo-400/55"
              required
              minLength={2}
              maxLength={80}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="profile-avatar-url" className="text-xs uppercase tracking-[0.12em] text-zinc-400">
              Profile Picture URL
            </label>
            <input
              id="profile-avatar-url"
              type="url"
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
              placeholder="https://cdn.example.com/avatar.jpg"
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors focus:border-indigo-400/55"
            />
            <p className="text-[11px] text-zinc-500">
              Leave empty to keep initial-based avatar.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md bg-[#6366f1] px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-[#5558ea] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Profile"
              )}
            </button>
            {status ? <p className="text-xs text-emerald-300">{status}</p> : null}
            {error ? <p className="text-xs text-red-400">{error}</p> : null}
          </div>
        </div>
      </form>
    </div>
  );
}
