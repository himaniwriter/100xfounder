"use client";

import Link from "next/link";
import { Search } from "lucide-react";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Directory", href: "/founders" },
  { label: "Startups", href: "/startups" },
  { label: "Signals", href: "/signals" },
  { label: "Blog", href: "/blog" },
  { label: "Pricing", href: "/pricing" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tighter text-white sm:text-xl">
            100Xfounder
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-zinc-400 transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              href="/dashboard"
              className="hidden h-9 items-center rounded-md border border-transparent bg-[#6366f1] px-3 text-sm font-medium text-white transition-colors hover:bg-[#5558ea] sm:inline-flex"
            >
              Dashboard
            </Link>
            <Link
              href="/login"
              className="inline-flex h-9 items-center rounded-md border border-white/10 bg-white/5 px-2.5 text-xs text-zinc-300 transition-colors hover:border-white/20 hover:text-white sm:px-3 sm:text-sm"
            >
              Login
            </Link>
            <button
              type="button"
              aria-label="Search"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/5 text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>

        <nav className="flex gap-2 overflow-x-auto pb-3 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={`mobile-${link.label}`}
              href={link.href}
              className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
