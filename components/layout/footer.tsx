import Link from "next/link";

const footerColumns = [
  {
    title: "Directories by City",
    links: [
      { label: "Top Startups in Delhi", href: "/founders?city=delhi" },
      { label: "Top Startups in Bangalore", href: "/founders?city=bangalore" },
      { label: "Top Startups in Mumbai", href: "/founders?city=mumbai" },
    ],
  },
  {
    title: "Directories by Industry",
    links: [
      { label: "Fintech India", href: "/founders?industry=fintech" },
      { label: "EdTech India", href: "/founders?industry=edtech" },
      { label: "SaaS Founders", href: "/founders?industry=saas" },
    ],
  },
  {
    title: "Directories by Role",
    links: [
      { label: "Find CTOs", href: "/founders?role=cto" },
      { label: "Find Angel Investors", href: "/founders?role=angel-investor" },
      { label: "Find YC Founders", href: "/founders?network=yc" },
    ],
  },
  {
    title: "Platform",
    links: [
      { label: "Founder Directory", href: "/founders" },
      { label: "Signals", href: "/signals" },
      { label: "Membership Plans", href: "/pricing" },
      { label: "Blog", href: "/blog" },
      { label: "Sitemap", href: "/sitemap" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/95">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-10 rounded-xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md">
          <h3 className="text-base font-semibold text-white">Directory Navigation</h3>
          <p className="mt-2 max-w-3xl text-sm text-zinc-400">
            Explore founder intelligence by location, industry, and role to discover
            the highest-signal opportunities faster.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-medium text-white">{column.title}</h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-zinc-400 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-sm text-zinc-500">
          © 2026 100Xfounder. The #1 Source for Indian Startup Intelligence.
        </div>
      </div>
    </footer>
  );
}
