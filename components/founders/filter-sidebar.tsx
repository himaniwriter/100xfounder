"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { cleanLabel } from "@/lib/founders/filter-utils";

type FilterSidebarProps = {
  options: {
    industries: string[];
    locations: string[];
    stages: string[];
  };
  selectedIndustries: string[];
  selectedLocations: string[];
  selectedStages: string[];
};

function setListParam(params: URLSearchParams, key: string, values: string[]) {
  params.delete(key);
  values.forEach((value) => params.append(key, value));
}

function filterBySearch(values: string[], query: string): string[] {
  if (!query) {
    return values;
  }

  const lower = query.toLowerCase();
  return values.filter((value) => cleanLabel(value).toLowerCase().includes(lower));
}

type PillGroupProps = {
  title: string;
  values: string[];
  selected: string[];
  onToggle: (value: string) => void;
};

function PillGroup({ title, values, selected, onToggle }: PillGroupProps) {
  return (
    <details open className="group rounded-xl border border-white/15 bg-white/[0.02]">
      <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-300">
          {title}
        </span>
        <ChevronDown className="h-4 w-4 text-zinc-500 transition-transform group-open:rotate-180" />
      </summary>

      <div className="flex flex-wrap gap-2 border-t border-white/15 p-3">
        {values.length > 0 ? (
          values.map((value) => {
            const active = selected.includes(value);
            const label = cleanLabel(value);

            return (
              <button
                key={`${title}-${value}`}
                type="button"
                onClick={() => onToggle(value)}
                title={cleanLabel(value)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs transition-all",
                  active
                    ? "border-indigo-400/60 bg-indigo-500/15 text-indigo-200 shadow-[0_0_14px_rgba(99,102,241,0.32)]"
                    : "border-white/15 bg-white/5 text-zinc-300 hover:border-white/30 hover:text-white",
                )}
              >
                {label}
              </button>
            );
          })
        ) : (
          <p className="text-xs text-zinc-500">No matches.</p>
        )}
      </div>
    </details>
  );
}

export function FilterSidebar({
  options,
  selectedIndustries,
  selectedLocations,
  selectedStages,
}: FilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState("");
  const [industries, setIndustries] = useState<string[]>(selectedIndustries);
  const [locations, setLocations] = useState<string[]>(selectedLocations);
  const [stages, setStages] = useState<string[]>(selectedStages);

  const filtered = useMemo(
    () => ({
      industries: filterBySearch(options.industries, query),
      locations: filterBySearch(options.locations, query),
      stages: filterBySearch(options.stages, query),
    }),
    [options.industries, options.locations, options.stages, query],
  );

  const toggleValue = (
    current: string[],
    value: string,
    setter: (value: string[]) => void,
  ) => {
    setter(
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  };

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    setListParam(params, "industry", industries);
    setListParam(params, "location", locations);
    setListParam(params, "stage", stages);

    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  };

  const clearFilters = () => {
    setIndustries([]);
    setLocations([]);
    setStages([]);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("industry");
    params.delete("location");
    params.delete("stage");

    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  };

  return (
    <aside className="h-fit w-full rounded-2xl border border-white/15 bg-white/[0.03] p-4 backdrop-blur-[40px] lg:sticky lg:top-24 lg:w-[280px] lg:min-w-[280px]">
      <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-300">
        Control Center
      </h2>

      <div className="mt-4">
        <label className="mb-2 block text-xs uppercase tracking-wide text-zinc-500">
          Search Filters
        </label>
        <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-black/35 px-3 py-2">
          <Search className="h-4 w-4 text-zinc-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Type to filter..."
            className="w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <PillGroup
          title="Industry"
          values={filtered.industries}
          selected={industries}
          onToggle={(value) => toggleValue(industries, value, setIndustries)}
        />
        <PillGroup
          title="Location"
          values={filtered.locations}
          selected={locations}
          onToggle={(value) => toggleValue(locations, value, setLocations)}
        />
        <PillGroup
          title="Funding Stage"
          values={filtered.stages}
          selected={stages}
          onToggle={(value) => toggleValue(stages, value, setStages)}
        />
      </div>

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={applyFilters}
          className="inline-flex flex-1 items-center justify-center rounded-lg bg-[#6366f1] px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-[#5558ea]"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={clearFilters}
          className="inline-flex flex-1 items-center justify-center rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-zinc-300 transition-colors hover:border-white/30 hover:text-white"
        >
          Reset
        </button>
      </div>
    </aside>
  );
}
