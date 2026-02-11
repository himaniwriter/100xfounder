import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { FounderCard, type Founder } from "@/components/founder-card";

const founders: Founder[] = [
  {
    id: "f_1",
    name: "Ava Chen",
    startup: "Founder, FluxOS",
    industry: "AI",
    location: "SF",
    stage: "Series A",
    verified: true,
  },
  {
    id: "f_2",
    name: "Noah Patel",
    startup: "Co-Founder, Orbit Health",
    industry: "SaaS",
    location: "NYC",
    stage: "Seed",
    verified: true,
  },
  {
    id: "f_3",
    name: "Mila Romero",
    startup: "Founder, Quintic Labs",
    industry: "Crypto",
    location: "London",
    stage: "Seed",
    verified: true,
  },
  {
    id: "f_4",
    name: "Ethan Brooks",
    startup: "Founder, Nova Ledger",
    industry: "Crypto",
    location: "NYC",
    stage: "Series A",
    verified: true,
  },
  {
    id: "f_5",
    name: "Sofia Kim",
    startup: "Founder, SignalStack",
    industry: "SaaS",
    location: "SF",
    stage: "Seed",
    verified: true,
  },
  {
    id: "f_6",
    name: "Luca Marino",
    startup: "Co-Founder, Atlas Neural",
    industry: "AI",
    location: "London",
    stage: "Series A",
    verified: true,
  },
  {
    id: "f_7",
    name: "Priya Nair",
    startup: "Founder, Delta Ops",
    industry: "SaaS",
    location: "SF",
    stage: "Series A",
    verified: true,
  },
  {
    id: "f_8",
    name: "Zane Okafor",
    startup: "Founder, Helio Compute",
    industry: "AI",
    location: "NYC",
    stage: "Seed",
    verified: true,
  },
  {
    id: "f_9",
    name: "Ivy Laurent",
    startup: "Founder, Radius Chain",
    industry: "Crypto",
    location: "London",
    stage: "Series A",
    verified: true,
  },
  {
    id: "f_10",
    name: "Daniel Park",
    startup: "Founder, Framebase",
    industry: "SaaS",
    location: "SF",
    stage: "Seed",
    verified: true,
  },
];

export default async function FoundersPage() {
  // Later replace this with Prisma, e.g.:
  // const founders = await prisma.founderProfile.findMany({ ... })

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />

      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">Founder Directory</h1>
            <p className="mt-2 text-sm text-zinc-400">Browse verified builders across top startup hubs.</p>
          </div>
          <p className="text-sm text-zinc-500">{founders.length} founders</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="hidden h-fit rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md lg:block lg:sticky lg:top-24">
            <h2 className="text-sm font-medium uppercase tracking-[0.12em] text-zinc-300">Filters</h2>

            <div className="mt-6 space-y-6">
              <div>
                <h3 className="mb-3 text-sm font-medium text-white">Industry</h3>
                <div className="space-y-2">
                  {[
                    { id: "industry-saas", label: "SaaS" },
                    { id: "industry-ai", label: "AI" },
                    { id: "industry-crypto", label: "Crypto" },
                  ].map((item) => (
                    <label key={item.id} htmlFor={item.id} className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
                      <input
                        id={item.id}
                        type="checkbox"
                        className="h-4 w-4 rounded border-white/20 bg-transparent text-[#6366f1] focus:ring-[#6366f1]/50"
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-medium text-white">Location</h3>
                <div className="space-y-2">
                  {[
                    { id: "location-sf", label: "SF" },
                    { id: "location-nyc", label: "NYC" },
                    { id: "location-london", label: "London" },
                  ].map((item) => (
                    <label key={item.id} htmlFor={item.id} className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
                      <input
                        id={item.id}
                        type="checkbox"
                        className="h-4 w-4 rounded border-white/20 bg-transparent text-[#6366f1] focus:ring-[#6366f1]/50"
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-medium text-white">Stage</h3>
                <div className="space-y-2">
                  {[
                    { id: "stage-seed", label: "Seed" },
                    { id: "stage-series-a", label: "Series A" },
                  ].map((item) => (
                    <label key={item.id} htmlFor={item.id} className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
                      <input
                        id={item.id}
                        type="checkbox"
                        className="h-4 w-4 rounded border-white/20 bg-transparent text-[#6366f1] focus:ring-[#6366f1]/50"
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <section>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {founders.map((founder) => (
                <FounderCard key={founder.id} founder={founder} />
              ))}
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
