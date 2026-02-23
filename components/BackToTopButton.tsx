"use client";

import { useEffect, useState } from "react";

export function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="glass-ghost-btn glass-ghost-btn-compact fixed bottom-5 right-5 z-[65] px-3"
      aria-label="Back to top"
    >
      <span aria-hidden="true">↑</span>
      <span className="hidden sm:inline">Top</span>
    </button>
  );
}

