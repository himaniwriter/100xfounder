import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { FounderCard } from "@/components/founder-card";
import {
  getFounderDirectory,
  getFounderFilterOptions,
  splitRecentlyFunded,
} from "@/lib/founders/store";

function readParam(value: string | string[] | undefined): string[] {
  if (!value) {
    return [];
  }

  const raw = Array.isArray(value) ? value.join(",") : value;

  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

type FoundersPageProps = {
  searchParams?: {
    industry?: string | string[];
    location?: string | string[];
    stage?: string | string[];
  };
};

export default async function FoundersPage({ searchParams }: FoundersPageProps) {
  const selectedIndustries = readParam(searchParams?.industry);
  const selectedLocations = readParam(searchParams?.location);
  const selectedStages = readParam(searchParams?.stage);

  const [founders, filterOptions] = await Promise.all([
    getFounderDirectory({
      industry: selectedIndustries,
      location: selectedLocations,
      stage: selectedStages,
    }),
    getFounderFilterOptions(),
  ]);
  const { recent, rest } = splitRecentlyFunded(founders, 18);

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />

      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              Founder Directory
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Profiles sourced from the uploaded group-company PDF and enriched with
              YC founder links.
            </p>
          </div>
          <p className="text-sm text-zinc-500">{founders.length} profiles</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="hidden h-fit rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md lg:sticky lg:top-24 lg:block">
            <h2 className="text-sm font-medium uppercase tracking-[0.12em] text-zinc-300">
              Filters
            </h2>

            <form className="mt-6 space-y-6" method="GET">
              <div>
                <h3 className="mb-3 text-sm font-medium text-white">Industry</h3>
                <div className="space-y-2">
                  {filterOptions.industries.map((industry) => {
                    const id = `industry-${industry}`;
                    const checked = selectedIndustries.includes(industry);

                    return (
                      <label
                        key={id}
                        htmlFor={id}
                        className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300"
                      >
                        <input
                          id={id}
                          name="industry"
                          value={industry}
                          defaultChecked={checked}
                          type="checkbox"
                          className="h-4 w-4 rounded border-white/20 bg-transparent text-[#6366f1] focus:ring-[#6366f1]/50"
                        />
                        {industry}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-medium text-white">Location</h3>
                <div className="space-y-2">
                  {filterOptions.locations.map((location) => {
                    const id = `location-${location}`;
                    const checked = selectedLocations.includes(location);

                    return (
                      <label
                        key={id}
                        htmlFor={id}
                        className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300"
                      >
                        <input
                          id={id}
                          name="location"
                          value={location}
                          defaultChecked={checked}
                          type="checkbox"
                          className="h-4 w-4 rounded border-white/20 bg-transparent text-[#6366f1] focus:ring-[#6366f1]/50"
                        />
                        {location}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-medium text-white">Stage</h3>
                <div className="space-y-2">
                  {filterOptions.stages.map((stage) => {
                    const id = `stage-${stage}`;
                    const checked = selectedStages.includes(stage);

                    return (
                      <label
                        key={id}
                        htmlFor={id}
                        className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300"
                      >
                        <input
                          id={id}
                          name="stage"
                          value={stage}
                          defaultChecked={checked}
                          type="checkbox"
                          className="h-4 w-4 rounded border-white/20 bg-transparent text-[#6366f1] focus:ring-[#6366f1]/50"
                        />
                        {stage}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center rounded-md bg-[#6366f1] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#5558ea]"
                >
                  Apply
                </button>
                <a
                  href="/founders"
                  className="inline-flex items-center rounded-md border border-white/10 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:text-white"
                >
                  Reset
                </a>
              </div>
            </form>
          </aside>

          <section>
            {recent.length > 0 ? (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-medium text-white">Recently Funded (Priority)</h2>
                  <span className="text-xs text-zinc-500">{recent.length} records</span>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {recent.map((founder) => (
                    <FounderCard key={founder.id} founder={founder} />
                  ))}
                </div>
              </>
            ) : null}

            <div className={recent.length > 0 ? "mt-8" : ""}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-medium text-white">All Other Records</h2>
                <span className="text-xs text-zinc-500">{rest.length} records</span>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {rest.map((founder) => (
                  <FounderCard key={founder.id} founder={founder} />
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
