import { NextRequest, NextResponse } from "next/server";
import { EventQuery, queryEvents } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q: EventQuery = {};

  const bbox = sp.get("bbox");
  if (bbox) {
    const [minLng, minLat, maxLng, maxLat] = bbox.split(",").map(Number);
    if ([minLng, minLat, maxLng, maxLat].every((n) => Number.isFinite(n))) {
      q.bbox = { minLng, minLat, maxLng, maxLat };
    }
  }

  const latStr = sp.get("lat");
  const lngStr = sp.get("lng");
  const radiusStr = sp.get("radius");
  if (latStr && lngStr && radiusStr) {
    const lat = Number(latStr);
    const lng = Number(lngStr);
    const radius = Number(radiusStr);
    if (Number.isFinite(lat) && Number.isFinite(lng) && Number.isFinite(radius)) {
      q.near = { lat, lng, radiusKm: radius };
    }
  }

  q.category = sp.get("category") ?? undefined;
  q.source = sp.get("source") ?? undefined;
  q.from = sp.get("from") ?? undefined;
  q.to = sp.get("to") ?? undefined;
  q.q = sp.get("q") ?? undefined;

  const { events, ingestedAt } = await queryEvents(q);
  return NextResponse.json({ events, ingestedAt, count: events.length });
}
