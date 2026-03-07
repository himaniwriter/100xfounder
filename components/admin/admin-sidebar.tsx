"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  CheckSquare,
  Database,
  FileText,
  Star,
  Gauge,
  Images,
  Settings,
  Sparkles,
  PenSquare,
  ShoppingCart,
  ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: Gauge },
  { label: "Data (Supabase)", href: "/admin/data", icon: Database },
  { label: "Featured Requests", href: "/admin/featured-requests", icon: Star },
  { label: "Interview Submissions", href: "/admin/interview-submissions", icon: PenSquare },
  { label: "Social Feed", href: "/admin/social-feed", icon: Images },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Log Manager", href: "/admin/logs", icon: ScrollText },
  { label: "Content (Blog/Pages)", href: "/admin/content", icon: FileText },
  { label: "Newsroom Checklist", href: "/admin/newsroom-checklist", icon: CheckSquare },
  { label: "Automations (N8N)", href: "/admin/automations", icon: Sparkles },
  { label: "Media Library", href: "/admin/media", icon: Images },
  { label: "SEO & Scripts", href: "/admin/seo", icon: Activity },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[260px] flex-col border-r border-white/[0.04] bg-[#050505]">
      {/* Brand Header */}
      <div className="px-6 py-6 border-b border-white/[0.02]">
        <Link href="/admin" className="block focus:outline-none">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">100Xfounder</p>
          <h2 className="mt-1 flex items-center gap-2 text-[17px] font-semibold tracking-tight text-white">
            Admin Console
          </h2>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-5">
        <nav className="space-y-0.5">
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
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-medium transition-all duration-200",
                  active
                    ? "bg-white/[0.06] text-white"
                    : "text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200"
                )}
              >
                <Icon className={cn(
                  "h-4 w-4 transition-colors",
                  active ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300"
                )} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
