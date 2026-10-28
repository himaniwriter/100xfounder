import { ImageResponse } from "next/og";
import type { LaunchProduct } from "@prisma/client";
import { isDatabaseConfigured } from "@/lib/db-config";
import { ensureLaunchOutreachSchema } from "@/lib/db-bootstrap";
import type { DigestPayload, SpotlightPayload } from "@/lib/launch/instagram";
import { digestSlide, HEIGHT, spotlightSlide, WIDTH } from "@/lib/launch/slides";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function loadSpotlight(id: string) {
  return prisma.founderSpotlight.findFirst({
    where: { id, status: "published", consentWebsite: true },
    include: { product: true },
  });
}

export async function GET(request: Request) {
  if (!isDatabaseConfigured()) {
    return new Response("Unavailable", { status: 503 });
  }
  await ensureLaunchOutreachSchema();
  const { searchParams } = new URL(request.url);
  const slide = Math.max(Number.parseInt(searchParams.get("slide") || "0", 10) || 0, 0);
  const itemId = searchParams.get("item");
  const spotlightId = searchParams.get("spotlight");

  let element: React.ReactElement | null = null;

  if (spotlightId) {
    const spotlight = await loadSpotlight(spotlightId);
    if (spotlight) element = spotlightSlide(spotlight, Math.min(slide, 3));
  } else if (itemId) {
    const item = await prisma.instagramQueueItem.findUnique({ where: { id: itemId } });
    if (item?.kind === "daily_digest") {
      const payload = item.payload as DigestPayload;
      const rows = await prisma.launchProduct.findMany({ where: { id: { in: payload.productIds } } });
      const products = payload.productIds
        .map((id) => rows.find((row) => row.id === id))
        .filter((row): row is LaunchProduct => Boolean(row));
      if (products.length > 0) element = digestSlide(products, payload.dayLabel, Math.min(slide, products.length + 1));
    } else if (item?.kind === "spotlight") {
      const spotlight = await loadSpotlight((item.payload as SpotlightPayload).spotlightId);
      if (spotlight) element = spotlightSlide(spotlight, Math.min(slide, 3));
    }
  }

  if (!element) {
    return new Response("Not found", { status: 404 });
  }

  return new ImageResponse(element, {
    width: WIDTH,
    height: HEIGHT,
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
