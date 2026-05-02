import fs from "node:fs/promises";
import path from "node:path";

type GeoCache = Record<string, { lat: number; lng: number } | null>;

const CACHE_FILE = path.join(process.cwd(), "data", "geocode-cache.json");
let cache: GeoCache | null = null;
let lastRequest = 0;

async function loadCache(): Promise<GeoCache> {
  if (cache) return cache;
  try {
    const buf = await fs.readFile(CACHE_FILE, "utf8");
    cache = JSON.parse(buf) as GeoCache;
  } catch {
    cache = {};
  }
  return cache;
}

async function saveCache(): Promise<void> {
  if (!cache) return;
  await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true });
  await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2), "utf8");
}

const KNOWN_VENUES: Record<string, { lat: number; lng: number }> = {
  "volkswagen arena|istanbul": { lat: 41.0935, lng: 29.0157 },
  "zorlu psm|istanbul": { lat: 41.0681, lng: 29.0151 },
  "harbiye cemil topuzlu|istanbul": { lat: 41.0463, lng: 28.9874 },
  "kucukciftlik park|istanbul": { lat: 41.0476, lng: 28.9938 },
  "uniq istanbul|istanbul": { lat: 41.0793, lng: 29.0289 },
  "if performance hall|istanbul": { lat: 41.0426, lng: 29.0085 },
  "bostanci gosteri merkezi|istanbul": { lat: 40.956, lng: 29.0961 },
  "turk telekom stadyumu|istanbul": { lat: 41.1029, lng: 28.9923 },
  "ulker stadyumu|istanbul": { lat: 40.9874, lng: 29.0386 },
  "ankara arena|ankara": { lat: 39.9523, lng: 32.8597 },
  "ato congresium|ankara": { lat: 39.9106, lng: 32.7806 },
  "jolly joker|ankara": { lat: 39.9078, lng: 32.8569 },
  "ahmed adnan saygun|izmir": { lat: 38.4192, lng: 27.1287 },
  "izmir arena|izmir": { lat: 38.4505, lng: 27.1728 },
  "merinos akkm|bursa": { lat: 40.2002, lng: 29.0508 },
  "aspendos antik tiyatrosu|antalya": { lat: 36.9389, lng: 31.1722 },
};

const TR_NORMALIZE: Record<string, string> = {
  ı: "i", İ: "i", ğ: "g", Ğ: "g", ü: "u", Ü: "u",
  ş: "s", Ş: "s", ö: "o", Ö: "o", ç: "c", Ç: "c",
};

function norm(s: string): string {
  return s
    .split("")
    .map((c) => TR_NORMALIZE[c] ?? c)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function knownVenueLookup(venue: string, city: string): { lat: number; lng: number } | null {
  const venueN = norm(venue);
  const cityN = norm(city);
  for (const [key, coords] of Object.entries(KNOWN_VENUES)) {
    const [vk, ck] = key.split("|");
    if (cityN === ck && venueN.includes(vk)) return coords;
  }
  return null;
}

async function nominatim(query: string): Promise<{ lat: number; lng: number } | null> {
  const now = Date.now();
  const wait = Math.max(0, lastRequest + 1100 - now);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequest = Date.now();

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=tr`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "EventMapDemo/0.1 (https://example.com/bot)",
        "Accept-Language": "tr,en",
      },
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data[0]) return null;
    const lat = Number(data[0].lat);
    const lng = Number(data[0].lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    clearTimeout(timer);
    return null;
  }
}

const CITY_FALLBACK: Record<string, { lat: number; lng: number }> = {
  istanbul: { lat: 41.0082, lng: 28.9784 },
  ankara: { lat: 39.9334, lng: 32.8597 },
  izmir: { lat: 38.4237, lng: 27.1428 },
  antalya: { lat: 36.8969, lng: 30.7133 },
  bursa: { lat: 40.1885, lng: 29.061 },
  adana: { lat: 37.0, lng: 35.3213 },
  konya: { lat: 37.8746, lng: 32.4932 },
  gaziantep: { lat: 37.0662, lng: 37.3833 },
  eskisehir: { lat: 39.7767, lng: 30.5206 },
  kocaeli: { lat: 40.8533, lng: 29.8815 },
  mersin: { lat: 36.8121, lng: 34.6415 },
  mugla: { lat: 37.2154, lng: 28.3636 },
  diyarbakir: { lat: 37.9144, lng: 40.2306 },
  hatay: { lat: 36.4, lng: 36.3492 },
  erzurum: { lat: 39.9043, lng: 41.2679 },
};

function cityCenter(city: string): { lat: number; lng: number } | null {
  return CITY_FALLBACK[norm(city)] ?? null;
}

export async function geocodeVenue(
  venue: string,
  city: string,
): Promise<{ lat: number; lng: number } | null> {
  const known = knownVenueLookup(venue, city);
  if (known) return known;

  const cache = await loadCache();
  const key = `${norm(venue)}|${norm(city)}`;
  if (key in cache && cache[key]) return cache[key];

  let result =
    (await nominatim(`${venue}, ${city}, Türkiye`)) ??
    (await nominatim(`${venue}, ${city}`));

  if (!result) {
    const lastWord = venue.split(/[,\s]+/).filter(Boolean).pop();
    if (lastWord && lastWord.length > 3) {
      result = await nominatim(`${lastWord}, ${city}`);
    }
  }

  if (!result) {
    const fallback = cityCenter(city);
    if (fallback) {
      const jitterLat = (Math.random() - 0.5) * 0.04;
      const jitterLng = (Math.random() - 0.5) * 0.05;
      result = { lat: fallback.lat + jitterLat, lng: fallback.lng + jitterLng };
    }
  }

  cache[key] = result;
  await saveCache();
  return result;
}
