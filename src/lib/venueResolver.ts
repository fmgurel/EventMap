import { RawEvent } from "./types";
import { geocodeVenue, knownVenueLookup, reverseGeocode } from "./scrapers/geocode";
import { parseDistrict } from "./scrapers/district";

type Resolved = { lat: number; lng: number; district?: string };

const KNOWN_CITIES = ["İstanbul", "Ankara", "İzmir", "Antalya", "Bursa"];

const CITY_BBOX: Record<string, { minLat: number; maxLat: number; minLng: number; maxLng: number }> = {
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

export async function canonicalizeVenuePositions(
  events: RawEvent[],
): Promise<RawEvent[]> {
  const venueMap = new Map<string, Resolved | null>();

  for (const e of events) {
    const key = `${e.venue.name}|${e.venue.city}`;
    if (venueMap.has(key)) continue;
    venueMap.set(key, await resolveVenue(e.venue.name, e.venue.city));
  }

  const out: RawEvent[] = [];
  for (const e of events) {
    const key = `${e.venue.name}|${e.venue.city}`;
    const resolved = venueMap.get(key);
    if (!resolved) continue;

    let district = e.venue.district ?? resolved.district;
    if (!district && KNOWN_CITIES.includes(e.venue.city)) {
      const rev = await reverseGeocode(resolved.lat, resolved.lng);
      district = rev?.district ?? undefined;
    }

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

  return out;
}

async function resolveVenue(venue: string, city: string): Promise<Resolved | null> {
  const known = knownVenueLookup(venue, city);
  if (known) return known;

  const result = await geocodeVenue(venue, city);
  if (!result) return null;
  if (!inCityBbox(result.lat, result.lng, city)) return null;

  return result;
}
