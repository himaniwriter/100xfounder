"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Database,
  FileText,
  Gauge,
  Images,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: Gauge },
  { label: "Data (Supabase)", href: "/admin/data", icon: Database },
  { label: "Content (Blog/Pages)", href: "/admin/content", icon: FileText },
  { label: "Automations (N8N)", href: "/admin/automations", icon: Sparkles },
  { label: "Media Library", href: "/admin/media", icon: Images },
  { label: "SEO & Scripts", href: "/admin/seo", icon: Activity },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="h-full w-[280px] border-r border-white/10 bg-black/70 px-4 py-6 backdrop-blur-2xl">
      <Link href="/admin" className="mb-6 block px-2">
        <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">100Xfounder</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">Admin Control</h2>
      </Link>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors",
                active
                  ? "border-indigo-400/45 bg-indigo-500/15 text-indigo-200"
                  : "border-transparent text-zinc-400 hover:border-white/10 hover:bg-white/[0.03] hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
