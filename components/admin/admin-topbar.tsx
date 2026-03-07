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
    <header className="sticky top-0 z-20 border-b border-white/[0.04] bg-[#050505]/80 px-8 py-5 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 text-[14px] text-zinc-500 font-medium">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.href} className="inline-flex items-center gap-1.5">
              {index > 0 ? <span className="text-zinc-700">/</span> : null}
              {index === breadcrumbs.length - 1 ? (
                <span className="text-zinc-200">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="transition-colors hover:text-zinc-300">
                  {crumb.label}
                </Link>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="group flex h-8 items-center gap-2 rounded-md bg-white/[0.02] px-3 font-medium text-xs tracking-wide text-zinc-400 transition-all hover:bg-white/[0.06] hover:text-white"
          >
            Visit Live Site
            <ExternalLink className="h-3.5 w-3.5 text-zinc-500 transition-colors group-hover:text-zinc-300" />
          </Link>

          <div className="flex items-center gap-3 pl-4 border-l border-white/[0.04]">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/10 text-xs font-semibold text-indigo-300 border border-indigo-500/20">
              {email.charAt(0).toUpperCase()}
            </div>
            <div className="hidden text-right sm:block">
              <p className="max-w-[160px] truncate text-[13px] font-medium text-zinc-200 tracking-tight">{email}</p>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-zinc-500">{role}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
