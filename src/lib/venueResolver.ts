import fs from "node:fs/promises";
import path from "node:path";
import { RawEvent } from "./types";
import { geocodeVenue, knownVenueLookup, reverseGeocode } from "./scrapers/geocode";

type VenueEntry = {
  name: string;
  city: string;
  district?: string;
  lat: number;
  lng: number;
  count?: number;
};

type VenueDict = Record<string, VenueEntry>;

const VENUES_FILE = path.join(process.cwd(), "data", "venues.json");

const KNOWN_CITIES = ["İstanbul", "Ankara", "İzmir", "Antalya", "Bursa"];

const CITY_BBOX: Record<
  string,
  { minLat: number; maxLat: number; minLng: number; maxLng: number }
> = {
  İstanbul: { minLat: 40.80, maxLat: 41.30, minLng: 28.50, maxLng: 29.55 },
  Ankara: { minLat: 39.78, maxLat: 40.10, minLng: 32.45, maxLng: 33.10 },
  İzmir: { minLat: 38.20, maxLat: 38.65, minLng: 26.85, maxLng: 27.40 },
  Antalya: { minLat: 36.78, maxLat: 37.10, minLng: 30.45, maxLng: 31.30 },
  Bursa: { minLat: 40.10, maxLat: 40.30, minLng: 28.85, maxLng: 29.30 },
};

function inCityBbox(lat: number, lng: number, city: string): boolean {
  const b = CITY_BBOX[city];
  if (!b) return true;
  return lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng;
}

function makeKey(name: string, city: string): string {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/ı/g, "i")
      .replace(/ş/g, "s")
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  return `${norm(name)}|${norm(city)}`;
}

async function loadVenues(): Promise<VenueDict> {
  try {
    const buf = await fs.readFile(VENUES_FILE, "utf8");
    return JSON.parse(buf) as VenueDict;
  } catch {
    return {};
  }
}

async function saveVenues(venues: VenueDict): Promise<void> {
  const sorted: VenueDict = {};
  const keys = Object.keys(venues).sort((a, b) => (venues[b].count ?? 0) - (venues[a].count ?? 0));
  for (const k of keys) sorted[k] = venues[k];
  await fs.mkdir(path.dirname(VENUES_FILE), { recursive: true });
  await fs.writeFile(VENUES_FILE, JSON.stringify(sorted, null, 2), "utf8");
}

export async function canonicalizeVenuePositions(events: RawEvent[]): Promise<RawEvent[]> {
  const venues = await loadVenues();
  let added = 0;
  let dropped = 0;

  for (const v of Object.values(venues)) v.count = 0;

  const out: RawEvent[] = [];

  for (const e of events) {
    const key = makeKey(e.venue.name, e.venue.city);

    if (key in venues) {
      const v = venues[key];
      v.count = (v.count ?? 0) + 1;
      out.push({
        ...e,
        venue: {
          ...e.venue,
          lat: v.lat,
          lng: v.lng,
          district: v.district ?? e.venue.district,
        },
      });
      continue;
    }

    const resolved = await resolveVenue(e.venue.name, e.venue.city);
    if (!resolved) {
      dropped++;
      continue;
    }

    let district = resolved.district ?? e.venue.district;
    if (!district && KNOWN_CITIES.includes(e.venue.city)) {
      const rev = await reverseGeocode(resolved.lat, resolved.lng);
      district = rev?.district ?? undefined;
    }

    venues[key] = {
      name: e.venue.name,
      city: e.venue.city,
      district,
      lat: resolved.lat,
      lng: resolved.lng,
      count: 1,
    };
    added++;

    out.push({
      ...e,
      venue: {
        ...e.venue,
        lat: resolved.lat,
        lng: resolved.lng,
        district,
      },
    });
  }

  await saveVenues(venues);
  console.log(
    `[venues] ${Object.keys(venues).length} total in venues.json (${added} new, ${dropped} dropped this run)`,
  );

  return out;
}

async function resolveVenue(
  venue: string,
  city: string,
): Promise<{ lat: number; lng: number; district?: string } | null> {
  const known = knownVenueLookup(venue, city);
  if (known) return known;

  const result = await geocodeVenue(venue, city);
  if (!result) return null;
  if (!inCityBbox(result.lat, result.lng, city)) return null;

  return result;
}
