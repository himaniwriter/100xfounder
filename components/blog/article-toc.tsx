"use client";

import { useEffect, useMemo, useState } from "react";
import type { BlogHeading } from "@/lib/blog/types";

type ArticleTocProps = {
  headings: BlogHeading[];
  mode?: "desktop" | "mobile";
};

const SCROLL_OFFSET = 80;

function scrollToHeading(id: string) {
  const el = document.getElementById(id);
  if (!el) {
    return;
  }

  const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
  window.scrollTo({ top, behavior: "smooth" });
  window.history.replaceState(null, "", `#${id}`);
}

function getLevelPadding(level: BlogHeading["level"]): string {
  if (level === 4) {
    return "pl-5";
  }
  if (level === 3) {
    return "pl-3";
  }
  return "";
}

export function ArticleToc({ headings, mode = "desktop" }: ArticleTocProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  const normalizedHeadings = useMemo(
    () => headings.filter((heading) => heading.id && heading.text),
    [headings],
  );

  useEffect(() => {
    if (typeof window === "undefined" || !window.location.hash) {
      return;
    }

    const id = window.location.hash.replace("#", "");
    const timer = window.setTimeout(() => {
      const el = document.getElementById(id);
      if (!el) {
        return;
      }
      window.scrollTo({
        top: el.offsetTop - SCROLL_OFFSET,
        behavior: "smooth",
      });
      setActiveId(id);
    }, 500);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (normalizedHeadings.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
    );

    normalizedHeadings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) {
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, [normalizedHeadings]);

  if (normalizedHeadings.length === 0) {
    return null;
  }

  const list = (
    <ul className="mt-3 space-y-2">
      {normalizedHeadings.map((heading) => {
        const isActive = activeId === heading.id;
        return (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              onClick={(event) => {
                event.preventDefault();
                scrollToHeading(heading.id);
                if (mode === "mobile") {
                  setIsOpen(false);
                }
              }}
              className={[
                "block border-l-2 border-transparent text-sm transition-colors",
                getLevelPadding(heading.level),
                heading.level >= 3 ? "text-xs text-zinc-400 hover:text-white" : "text-sm text-zinc-300 hover:text-white",
                isActive ? "border-indigo-400 font-semibold text-indigo-200" : "",
              ]
                .join(" ")
                .trim()}
            >
              {heading.text}
            </a>
          </li>
        );
      })}
    </ul>
  );

  if (mode === "mobile") {
    return (
      <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md lg:hidden">
        <button
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          className="flex w-full items-center justify-between text-left text-sm font-medium text-zinc-200"
        >
          <span>Table of Contents</span>
          <span aria-hidden="true" className="text-xs text-zinc-400">
            {isOpen ? "▲" : "▼"}
          </span>
        </button>
        {isOpen ? list : null}
      </div>
    );
  }

  return (
    <div className="sticky top-24 rounded-xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md">
      <p className="text-xs uppercase tracking-wide text-zinc-500">Table of Contents</p>
      {list}
    </div>
  );
}

