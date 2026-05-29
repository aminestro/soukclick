"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { trackingConfig } from "@/config/tracking";
import { readMarketingMetadata } from "@/features/analytics/services/utm-service";
import { trackPageView } from "@/lib/tracking";

export function PixelLoader() {
  const pathname = usePathname();

  useEffect(() => {
    loadPixelsDeferred();
  }, []);

  useEffect(() => {
    const url = typeof window === "undefined" ? pathname : `${pathname}${window.location.search}`;
    trackPageView({ path: url, ...readMarketingMetadata() });
  }, [pathname]);

  return null;
}

function loadPixelsDeferred() {
  const load = () => {
    loadMetaPixel();
    loadTikTokPixel();
    loadSnapPixel();
  };

  const requestIdleCallback = window.requestIdleCallback;
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(load, { timeout: 2500 });
    return;
  }

  window.setTimeout(load, 1200);
}

function loadMetaPixel() {
  const pixelId = trackingConfig.metaPixelId;
  if (!pixelId || window.fbq) return;

  const fbq = function (...args: unknown[]) {
    (fbq.queue = fbq.queue || []).push(args);
  } as ((...args: unknown[]) => void) & { queue?: unknown[][]; loaded?: boolean; version?: string };

  window.fbq = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq("init", pixelId);

  appendScript("https://connect.facebook.net/en_US/fbevents.js");
}

function loadTikTokPixel() {
  const pixelId = trackingConfig.tiktokPixelId;
  if (!pixelId || window.ttq) return;

  const ttq = {
    track: (...args: unknown[]) => queue.push(["track", ...args]),
    page: () => queue.push(["page"]),
    load: (...args: unknown[]) => queue.push(["load", ...args]),
  };
  const queue: unknown[][] = [];
  window.ttq = ttq;
  ttq.load(pixelId);
  appendScript("https://analytics.tiktok.com/i18n/pixel/events.js");
}

function loadSnapPixel() {
  const pixelId = trackingConfig.snapPixelId;
  if (!pixelId || window.snaptr) return;

  const snaptr = function (...args: unknown[]) {
    (snaptr.queue = snaptr.queue || []).push(args);
  } as ((...args: unknown[]) => void) & { queue?: unknown[][] };

  window.snaptr = snaptr;
  snaptr("init", pixelId);
  appendScript("https://sc-static.net/scevent.min.js");
}

function appendScript(src: string) {
  const script = document.createElement("script");
  script.async = true;
  script.defer = true;
  script.src = src;
  document.head.appendChild(script);
}
