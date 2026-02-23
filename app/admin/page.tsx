import Link from "next/link";

const cards = [
  {
    title: "Data Manager",
    description: "Manage founders and company records synced from Supabase/Postgres.",
    href: "/admin/data",
  },
  {
    title: "Featured Requests",
    description: "Review founder applications and publish approved listings.",
    href: "/admin/featured-requests",
  },
  {
    title: "Interview Submissions",
    description: "Review interview questionnaire responses and move them to publish-ready.",
    href: "/admin/interview-submissions",
  },
  {
    title: "Guest Post Orders",
    description: "Process sponsored guest-post requests and editorial review notes.",
    href: "/admin/guest-post-orders",
  },
  {
    title: "Social Feed",
    description: "Preview ingested Instagram posts shown in public conversion pages.",
    href: "/admin/social-feed",
  },
  {
    title: "Analytics",
    description: "Monitor conversion funnel performance for search and lead capture.",
    href: "/admin/analytics",
  },
  {
    title: "Automation Hub",
    description: "Trigger n8n workflows and monitor webhook run output instantly.",
    href: "/admin/automations",
  },
  {
    title: "Content Studio",
    description: "Publish blog posts and edit homepage content blocks without code.",
    href: "/admin/content",
  },
  {
    title: "Media Library",
    description: "Upload assets to Supabase Storage and copy public URLs quickly.",
    href: "/admin/media",
  },
  {
    title: "SEO & Scripts",
    description: "Manage global scripts, metadata defaults, and marketing tags.",
    href: "/admin/seo",
  },
  {
    title: "Settings",
    description: "Review system configuration and environment-level controls.",
    href: "/admin/settings",
  },
];

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-white">Admin Dashboard</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Control data, content, automations, and platform-level settings from one place.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-xl border border-white/15 bg-white/[0.03] p-4 backdrop-blur-md transition-colors hover:border-white/30 hover:bg-white/[0.05]"
          >
            <h2 className="text-base font-medium text-white">{card.title}</h2>
            <p className="mt-2 text-sm text-zinc-400">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
