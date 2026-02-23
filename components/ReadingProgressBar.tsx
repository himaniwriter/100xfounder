"use client";

import { useEffect, useState } from "react";

export function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const root = document.documentElement;
      const total = root.scrollHeight - window.innerHeight;
      const scrolled = Math.max(0, window.scrollY);
      const next = total > 0 ? Math.min(100, (scrolled / total) * 100) : 0;
      setProgress(next);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed left-0 right-0 top-0 z-[70] h-[3px]">
      <div
        className="h-full bg-indigo-500/95 transition-[width] duration-150"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

