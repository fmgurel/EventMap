import fs from "node:fs/promises";
import path from "node:path";
import { Event } from "./types";

const DATA_FILE = path.join(process.cwd(), "data", "events.json");

type Store = {
  events: Event[];
  ingestedAt: string | null;
};

async function readStore(): Promise<Store> {
  try {
    const buf = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(buf) as Store;
  } catch {
    return { events: [], ingestedAt: null };
  }
}

async function writeStore(store: Store): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf8");
}

export async function saveEvents(events: Event[]): Promise<void> {
  await writeStore({ events, ingestedAt: new Date().toISOString() });
}

export type EventQuery = {
  bbox?: { minLng: number; minLat: number; maxLng: number; maxLat: number };
  near?: { lat: number; lng: number; radiusKm: number };
  category?: string;
  source?: string;
  from?: string;
  to?: string;
  q?: string;
};

const R = 6371;
function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

export async function queryEvents(q: EventQuery): Promise<{
  events: Event[];
  ingestedAt: string | null;
}> {
  const { events, ingestedAt } = await readStore();
  const needle = q.q?.toLowerCase().trim();

  const filtered = events.filter((e) => {
    if (q.bbox) {
      const { minLng, minLat, maxLng, maxLat } = q.bbox;
      if (
        e.venue.lng < minLng ||
        e.venue.lng > maxLng ||
        e.venue.lat < minLat ||
        e.venue.lat > maxLat
      ) {
        return false;
      }
    }
    if (q.near) {
      const d = haversineKm(e.venue, q.near);
      if (d > q.near.radiusKm) return false;
    }
    if (q.category && e.category !== q.category) return false;
    if (q.source && !e.sources.some((s) => s.source === q.source)) return false;
    if (q.from && e.date < q.from) return false;
    if (q.to && e.date > q.to) return false;
    if (needle && !e.title.toLowerCase().includes(needle) &&
      !e.venue.name.toLowerCase().includes(needle)) {
      return false;
    }
    return true;
  });

  filtered.sort((a, b) => (a.date < b.date ? -1 : 1));
  return { events: filtered, ingestedAt };
}

export async function getStoreInfo(): Promise<{ count: number; ingestedAt: string | null }> {
  const { events, ingestedAt } = await readStore();
  return { count: events.length, ingestedAt };
}
