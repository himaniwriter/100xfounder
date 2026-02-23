"use client";

import { useEffect, useRef, useState } from "react";

export function FeaturedWidgetAttention() {
  const [readPercent, setReadPercent] = useState(0);
  const hasTriggered = useRef(false);
  const animationInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const animationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopAttentionAnimation = () => {
    const widget = document.getElementById("featured-widget");
    if (widget) {
      widget.classList.remove("widget-attention");
    }

    if (animationTimeout.current) {
      clearTimeout(animationTimeout.current);
      animationTimeout.current = null;
    }

    if (animationInterval.current) {
      clearInterval(animationInterval.current);
      animationInterval.current = null;
    }
  };

  const startAttentionAnimation = () => {
    const widget = document.getElementById("featured-widget");
    if (!widget) {
      return;
    }

    const runCycle = () => {
      widget.classList.add("widget-attention");
      animationTimeout.current = setTimeout(() => {
        widget.classList.remove("widget-attention");
      }, 1200);
    };

    runCycle();

    animationInterval.current = setInterval(() => {
      runCycle();
    }, 5000);
  };

  useEffect(() => {
    const handleScroll = () => {
      const articleEl = document.getElementById("article-content");
      if (!articleEl) {
        return;
      }

      const articleTop = articleEl.getBoundingClientRect().top + window.scrollY;
      const articleHeight = articleEl.offsetHeight;
      const scrolled = window.scrollY + window.innerHeight - articleTop;
      const percentage = (scrolled / Math.max(articleHeight, 1)) * 100;
      setReadPercent(Math.min(100, Math.max(0, percentage)));
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (readPercent >= 50 && readPercent <= 80) {
      if (!hasTriggered.current) {
        hasTriggered.current = true;
        startAttentionAnimation();
      }
      return;
    }

    stopAttentionAnimation();
    hasTriggered.current = false;
  }, [readPercent]);

  useEffect(
    () => () => {
      stopAttentionAnimation();
    },
    [],
  );

  return null;
}

