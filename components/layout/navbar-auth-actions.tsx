"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";

type AuthState = "loading" | "authenticated" | "guest";
type AuthUser = {
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: "ADMIN" | "MEMBER";
};

export function NavbarAuthActions() {
  const router = useRouter();
  const pathname = usePathname();
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function resolveAuthState() {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          setAuthState("guest");
          return;
        }

        const payload = (await response.json()) as {
          success?: boolean;
          authenticated?: boolean;
          user?: AuthUser | null;
        };

        if (payload?.authenticated && payload.user) {
          setUser(payload.user);
          setAuthState("authenticated");
          return;
        }

        setAuthState("guest");
      } catch {
        if (!controller.signal.aborted) {
          setAuthState("guest");
        }
      }
    }

    resolveAuthState();

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!menuRef.current) {
        return;
      }
      if (!menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const profileInitial = useMemo(() => {
    const fallback = user?.email?.trim().charAt(0) ?? "U";
    const fromName = user?.name?.trim().charAt(0);
    return (fromName || fallback || "U").toUpperCase();
  }, [user?.email, user?.name]);
  const avatarUrl = user?.avatarUrl?.trim() || null;

  async function onLogout() {
    setOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (authState === "loading") {
    return <div className="h-9 w-9 rounded-full border border-white/10 bg-white/5" aria-hidden="true" />;
  }

  if (authState === "authenticated") {
    return (
      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Open profile menu"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.05] text-sm font-semibold text-zinc-200 transition-colors hover:border-white/30 hover:bg-white/[0.1] hover:text-white"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={user?.name ? `${user.name} avatar` : "Profile avatar"}
              className="h-full w-full rounded-full object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            profileInitial
          )}
        </button>

        {open ? (
          <div
            role="menu"
            className="absolute right-0 top-[calc(100%+0.5rem)] z-[90] w-40 rounded-xl border border-white/15 bg-[#0b0c12]/95 p-1 shadow-[0_20px_36px_rgba(0,0,0,0.45)] backdrop-blur-xl"
          >
            <Link
              href="/dashboard"
              role="menuitem"
              className="block rounded-md px-3 py-2 text-sm text-zinc-200 transition-colors hover:bg-white/[0.08] hover:text-white"
            >
              Dashboard
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={onLogout}
              className="block w-full rounded-md px-3 py-2 text-left text-sm text-zinc-200 transition-colors hover:bg-white/[0.08] hover:text-white"
            >
              Logout
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="inline-flex h-9 items-center rounded-md border border-white/10 bg-white/5 px-2.5 text-xs text-zinc-300 transition-colors hover:border-white/20 hover:text-white sm:px-3 sm:text-sm"
    >
      Login
    </Link>
  );
}
