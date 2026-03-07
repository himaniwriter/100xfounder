import Link from "next/link";
import {
  Database, Star, PenSquare, ShoppingCart, Images,
  BarChart3, ScrollText, Sparkles, FileText, Settings, Activity, CheckSquare
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const cards = [
  {
    title: "Data Manager",
    description: "Manage founders and company records synced from Postgres.",
    href: "/admin/data",
    icon: Database,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    title: "Featured Requests",
    description: "Review founder applications and publish approved listings.",
    href: "/admin/featured-requests",
    icon: Star,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    title: "Interview Submissions",
    description: "Review interview questionnaire responses and move them to publish-ready.",
    href: "/admin/interview-submissions",
    icon: PenSquare,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
  },
  {
    title: "Social Feed",
    description: "Preview ingested Instagram posts shown in public conversion pages.",
    href: "/admin/social-feed",
    icon: Images,
    color: "text-pink-400",
    bg: "bg-pink-500/10",
  },
  {
    title: "Analytics",
    description: "Monitor conversion funnel performance for search and lead capture.",
    href: "/admin/analytics",
    icon: BarChart3,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    title: "Log Manager",
    description: "Track 404 errors and view site-level event logs with filters.",
    href: "/admin/logs",
    icon: ScrollText,
    color: "text-zinc-400",
    bg: "bg-zinc-500/10",
  },
  {
    title: "Automation Hub",
    description: "Trigger n8n workflows and monitor webhook run output instantly.",
    href: "/admin/automations",
    icon: Sparkles,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  {
    title: "Content Studio",
    description: "Publish blog posts and edit homepage content blocks without code.",
    href: "/admin/content",
    icon: FileText,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
  },
  {
    title: "Newsroom Checklist",
    description: "Standard operating procedures for publishing and editorial review.",
    href: "/admin/newsroom-checklist",
    icon: CheckSquare,
    color: "text-rose-400",
    bg: "bg-rose-500/10",
  },
  {
    title: "Media Library",
    description: "Upload assets to Supabase Storage and copy public URLs quickly.",
    href: "/admin/media",
    icon: Images,
    color: "text-teal-400",
    bg: "bg-teal-500/10",
  },
  {
    title: "SEO & Scripts",
    description: "Manage global scripts, metadata defaults, and marketing tags.",
    href: "/admin/seo",
    icon: Activity,
    color: "text-fuchsia-400",
    bg: "bg-fuchsia-500/10",
  },
  {
    title: "Settings",
    description: "Review system configuration and environment-level controls.",
    href: "/admin/settings",
    icon: Settings,
    color: "text-zinc-400",
    bg: "bg-zinc-500/10",
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between py-2 border-b border-white/[0.04] pb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Admin Console</h1>
          <p className="mt-1.5 text-[15px] text-zinc-400 max-w-2xl">
            Control data integration, editorial content publishing, active automations, and global
            platform settings from a unified command center.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Badge variant="ghost" className="bg-emerald-500/10 text-emerald-300 border-emerald-500/20">
            System Operational
          </Badge>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.01] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.12] hover:bg-white/[0.03] hover:shadow-2xl hover:shadow-black/50"
            >
              <div className="absolute right-0 top-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-white/[0.02] blur-2xl transition-all duration-500 group-hover:bg-white/[0.05]" />

              <div className="relative z-10">
                <div className={`mb-4 inline-flex h-9 w-9 items-center justify-center rounded-lg ${card.bg}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} strokeWidth={2.5} />
                </div>
                <h2 className="text-[16px] font-semibold text-zinc-100 group-hover:text-white transition-colors">{card.title}</h2>
                <p className="mt-2 text-[13px] leading-relaxed text-zinc-400 line-clamp-2">
                  {card.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
