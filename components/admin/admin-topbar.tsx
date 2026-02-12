"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { ExternalLink } from "lucide-react";

type AdminTopbarProps = {
  email: string;
  role: string;
};

function toTitle(value: string): string {
  return value
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function AdminTopbar({ email, role }: AdminTopbarProps) {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const paths: Array<{ href: string; label: string }> = [];
    let cumulative = "";

    segments.forEach((segment) => {
      cumulative += `/${segment}`;
      paths.push({
        href: cumulative,
        label: segment === "admin" ? "Dashboard" : toTitle(segment),
      });
    });

    return paths;
  }, [pathname]);

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-black/65 px-6 py-4 backdrop-blur-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-400">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.href} className="inline-flex items-center gap-2">
              {index > 0 ? <span className="text-zinc-600">/</span> : null}
              {index === breadcrumbs.length - 1 ? (
                <span className="text-zinc-200">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="transition-colors hover:text-white">
                  {crumb.label}
                </Link>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-white/15 bg-white/[0.03] px-3 text-xs text-zinc-200 transition-colors hover:border-white/30 hover:text-white"
          >
            Visit Live Site
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>

          <div className="rounded-md border border-white/15 bg-white/[0.03] px-3 py-1.5 text-right">
            <p className="max-w-[200px] truncate text-xs text-zinc-300">{email}</p>
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">{role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
