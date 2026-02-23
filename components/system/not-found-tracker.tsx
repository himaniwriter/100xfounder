"use client";

import { useEffect } from "react";
import { trackSiteEvent } from "@/lib/client-tracking";

const TRACKED_404_KEY_PREFIX = "xf_404_logged";

export function NotFoundTracker() {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const route = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const storageKey = `${TRACKED_404_KEY_PREFIX}:${route}`;
    if (window.sessionStorage.getItem(storageKey)) {
      return;
    }

    window.sessionStorage.setItem(storageKey, "1");

    void trackSiteEvent({
      event_name: "page_not_found",
      path: window.location.pathname || "/",
      payload: {
        status_code: 404,
        full_url: window.location.href,
        route,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      },
    });
  }, []);

  return null;
}

