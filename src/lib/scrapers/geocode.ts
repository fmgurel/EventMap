import fs from "node:fs/promises";
import path from "node:path";

type GeoCacheEntry = { lat: number; lng: number; district?: string } | { district?: string } | null;
type GeoCache = Record<string, GeoCacheEntry>;

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

const KNOWN_VENUES: Record<string, { lat: number; lng: number; district?: string }> = {
  "volkswagen arena|istanbul": { lat: 41.0935, lng: 29.0157 },
  "zorlu psm|istanbul": { lat: 41.0681, lng: 29.0151 },
  "harbiye cemil topuzlu|istanbul": { lat: 41.0463, lng: 28.9874 },
  "kucukciftlik park|istanbul": { lat: 41.0476, lng: 28.9938 },
  "uniq istanbul|istanbul": { lat: 41.0793, lng: 29.0289 },
  "if performance hall|istanbul": { lat: 41.0426, lng: 29.0085 },
  "bostanci gosteri merkezi|istanbul": { lat: 40.956, lng: 29.0961 },
  "turk telekom stadyumu|istanbul": { lat: 41.1029, lng: 28.9923 },
  "ulker stadyumu|istanbul": { lat: 40.9874, lng: 29.0386 },
  "ataky marina arena|istanbul": { lat: 40.9737, lng: 28.8351 },
  "atakoy marina arena|istanbul": { lat: 40.9737, lng: 28.8351 },
  "bakirkoy butik sahne|istanbul": { lat: 40.9836, lng: 28.8761 },
  "babylon|istanbul": { lat: 41.0294, lng: 28.9744 },
  "besiktas tupras stadyumu|istanbul": { lat: 41.0392, lng: 29.0034 },
  "bjk tupras stadyumu|istanbul": { lat: 41.0392, lng: 29.0034 },
  "salon iksv|istanbul": { lat: 41.0303, lng: 28.9737 },
  "festival park yenikapi|istanbul": { lat: 40.9999, lng: 28.948 },
  "tersane istanbul|istanbul": { lat: 41.0301, lng: 28.9712 },
  "kadikoy sureyya operasi|istanbul": { lat: 40.9893, lng: 29.0269 },
  "uskudar sahne hane|istanbul": { lat: 41.0237, lng: 29.0192 },
  "kartal sanat tiyatrosu|istanbul": { lat: 40.9106, lng: 29.193 },
  "trump sahne|istanbul": { lat: 41.069, lng: 29.014 },
  "bonus parkorman|istanbul": { lat: 41.1098, lng: 29.0163 },
  "istanbul kongre merkezi|istanbul": { lat: 41.0461, lng: 28.9817 },
  "istanbul dolphinarium|istanbul": { lat: 40.9742, lng: 28.8226 },
  "lifepark|istanbul": { lat: 41.1574, lng: 28.9181 },
  "asa khai jazz|istanbul": { lat: 41.0344, lng: 28.9772 },
  "blind istanbul|istanbul": { lat: 41.0306, lng: 28.978 },
  "ayi pub|istanbul": { lat: 40.9893, lng: 29.0244 },
  "bagdarbasi kultur merkezi|istanbul": { lat: 41.0269, lng: 29.029 },
  "alternaif tiyatro|istanbul": { lat: 41.029, lng: 28.984 },
  "torium|istanbul": { lat: 40.991, lng: 28.7155 },
  "park of istanbul|istanbul": { lat: 41.0528, lng: 29.0294 },
  "ataturk olimpiyat|istanbul": { lat: 41.0744, lng: 28.7669 },
  "watergarden|istanbul": { lat: 40.9911, lng: 29.1314, district: "Ataşehir" },
  "duru tiyatro|istanbul": { lat: 40.9911, lng: 29.1314, district: "Ataşehir" },
  "caddebostan kultur|istanbul": { lat: 40.9651, lng: 29.0689, district: "Kadıköy" },
  "besiktas kultur merkezi|istanbul": { lat: 41.0426, lng: 29.0085, district: "Beşiktaş" },
  "beylikduzu ataturk kultur|istanbul": { lat: 40.9971, lng: 28.6386, district: "Beylikdüzü" },
  "buyukcekmece kulturpark|istanbul": { lat: 41.0205, lng: 28.5938, district: "Büyükçekmece" },
  "buyukcekmece kemal sunal|istanbul": { lat: 41.0205, lng: 28.5938, district: "Büyükçekmece" },
  "maximum uniq|istanbul": { lat: 41.1153, lng: 29.0201, district: "Sarıyer" },
  "kanyon|istanbul": { lat: 41.0782, lng: 29.0114, district: "Şişli" },
  "jj pub kanyon|istanbul": { lat: 41.0782, lng: 29.0114, district: "Şişli" },
  "swissotel bosphorus|istanbul": { lat: 41.045, lng: 29.0009, district: "Beşiktaş" },
  "kadikoy egitim sahnesi|istanbul": { lat: 40.9905, lng: 29.0273, district: "Kadıköy" },
  "paribu art|istanbul": { lat: 41.0344, lng: 28.9779, district: "Beyoğlu" },
  "torium sahne|istanbul": { lat: 40.9911, lng: 28.7155, district: "Esenyurt" },
  "isonem park|istanbul": { lat: 41.0017, lng: 29.0588, district: "Üsküdar" },
  "festival park|istanbul": { lat: 40.9999, lng: 28.948, district: "Fatih" },
  "beyaz baron|istanbul": { lat: 40.9893, lng: 29.0269, district: "Kadıköy" },
  "kucukciftlik|istanbul": { lat: 41.0476, lng: 28.9938, district: "Şişli" },
  "tim show center|istanbul": { lat: 41.063, lng: 28.9857, district: "Şişli" },
  "tim maslak|istanbul": { lat: 41.111, lng: 29.026, district: "Sarıyer" },

  "ankara arena|ankara": { lat: 39.9523, lng: 32.8597 },
  "ato congresium|ankara": { lat: 39.9106, lng: 32.7806 },
  "jolly joker|ankara": { lat: 39.9078, lng: 32.8569 },
  "actor studio panora|ankara": { lat: 39.8731, lng: 32.8083 },
  "bilkent odeon|ankara": { lat: 39.8703, lng: 32.7464 },
  "if performance hall|ankara": { lat: 39.891, lng: 32.8552 },

  "ahmed adnan saygun|izmir": { lat: 38.4192, lng: 27.1287 },
  "izmir arena|izmir": { lat: 38.4505, lng: 27.1728 },
  "bostanli suat taser|izmir": { lat: 38.4744, lng: 27.107 },
  "bornova asik veysel|izmir": { lat: 38.4661, lng: 27.218 },
  "alsancak tarihi havagazi|izmir": { lat: 38.4421, lng: 27.144 },
  "aziz vukolos|izmir": { lat: 38.4216, lng: 27.1483 },

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

export function knownVenueLookup(
  venue: string,
  city: string,
): { lat: number; lng: number; district?: string } | null {
  const venueN = norm(venue);
  const cityN = norm(city);
  for (const [key, coords] of Object.entries(KNOWN_VENUES)) {
    const [vk, ck] = key.split("|");
    if (cityN === ck && venueN.includes(vk)) return coords;
  }
  return null;
}

type CityBox = { minLat: number; maxLat: number; minLng: number; maxLng: number };

const CITY_BOX: Record<string, CityBox> = {
  istanbul: { minLat: 40.80, maxLat: 41.30, minLng: 28.50, maxLng: 29.55 },
  ankara: { minLat: 39.78, maxLat: 40.10, minLng: 32.45, maxLng: 33.10 },
  izmir: { minLat: 38.20, maxLat: 38.65, minLng: 26.85, maxLng: 27.40 },
  antalya: { minLat: 36.78, maxLat: 37.10, minLng: 30.45, maxLng: 31.30 },
  bursa: { minLat: 40.10, maxLat: 40.30, minLng: 28.85, maxLng: 29.30 },
  adana: { minLat: 36.95, maxLat: 37.10, minLng: 35.20, maxLng: 35.45 },
  konya: { minLat: 37.78, maxLat: 38.05, minLng: 32.30, maxLng: 32.75 },
  gaziantep: { minLat: 36.95, maxLat: 37.20, minLng: 37.20, maxLng: 37.55 },
  eskisehir: { minLat: 39.65, maxLat: 39.85, minLng: 30.30, maxLng: 30.75 },
  kocaeli: { minLat: 40.70, maxLat: 40.90, minLng: 29.70, maxLng: 30.20 },
  mersin: { minLat: 36.70, maxLat: 36.90, minLng: 34.40, maxLng: 34.85 },
  mugla: { minLat: 36.90, maxLat: 37.45, minLng: 27.40, maxLng: 28.80 },
};

function withinCity(lat: number, lng: number, city: string): boolean {
  const box = CITY_BOX[norm(city)];
  if (!box) return true;
  return lat >= box.minLat && lat <= box.maxLat && lng >= box.minLng && lng <= box.maxLng;
}

async function mapbox(
  query: string,
  city?: string,
): Promise<{ lat: number; lng: number; district?: string } | null> {
  const token = process.env.MAPBOX_TOKEN;
  if (!token) return null;

  const now = Date.now();
  const wait = Math.max(0, lastRequest + 100 - now);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequest = Date.now();

  const proximity = city ? cityCenter(city) : null;
  const proximityParam = proximity
    ? `&proximity=${proximity.lng.toFixed(4)},${proximity.lat.toFixed(4)}`
    : "";
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
    `?access_token=${token}&country=tr&language=tr&limit=5${proximityParam}` +
    `&types=poi,address,place,locality,neighborhood`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      features?: Array<{
        center?: [number, number];
        place_type?: string[];
        text?: string;
        context?: Array<{ id?: string; text?: string }>;
      }>;
    };
    const features = data.features ?? [];
    for (const f of features) {
      const c = f.center;
      if (!c) continue;
      const [lng, lat] = c;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      if (city && !withinCity(lat, lng, city)) continue;
      const district = districtFromContext(f);
      return { lat, lng, district };
    }
    return null;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

function districtFromContext(feature: {
  place_type?: string[];
  text?: string;
  context?: Array<{ id?: string; text?: string }>;
}): string | undefined {
  if (feature.place_type?.includes("place") && feature.text) return feature.text;
  const placeCtx = feature.context?.find((c) => c.id?.startsWith("place."));
  if (placeCtx?.text) return placeCtx.text;
  const localityCtx = feature.context?.find((c) => c.id?.startsWith("locality."));
  return localityCtx?.text;
}

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<{ district?: string } | null> {
  const token = process.env.MAPBOX_TOKEN;
  if (!token) return null;

  const cache = await loadCache();
  const key = `rev|${lat.toFixed(4)}|${lng.toFixed(4)}`;
  if (key in cache) {
    const cached = cache[key];
    if (cached && "district" in cached) return cached as { district?: string };
  }

  const now = Date.now();
  const wait = Math.max(0, lastRequest + 100 - now);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequest = Date.now();

  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json` +
    `?access_token=${token}&country=tr&language=tr&types=place,locality,neighborhood&limit=1`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      features?: Array<{
        place_type?: string[];
        text?: string;
        context?: Array<{ id?: string; text?: string }>;
      }>;
    };
    const f = data.features?.[0];
    if (!f) return null;
    const district = districtFromContext(f);
    const result = { district };
    cache[key] = result as unknown as { lat: number; lng: number };
    await saveCache();
    return result;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

const CITY_FALLBACK: Record<string, { lat: number; lng: number }> = {
  istanbul: { lat: 41.05, lng: 28.99 },
  ankara: { lat: 39.92, lng: 32.85 },
  izmir: { lat: 38.42, lng: 27.14 },
  antalya: { lat: 36.89, lng: 30.71 },
  bursa: { lat: 40.18, lng: 29.06 },
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
): Promise<{ lat: number; lng: number; district?: string } | null> {
  const known = knownVenueLookup(venue, city);
  if (known) return known;

  const cache = await loadCache();
  const key = `${norm(venue)}|${norm(city)}`;
  if (key in cache) {
    const cached = cache[key];
    if (cached && "lat" in cached) return cached;
    if (cached === null) return null;
  }

  let result =
    (await mapbox(`${venue}, ${city}`, city)) ??
    (await mapbox(`${venue} ${city}`, city));

  if (!result) {
    const lastTwo = venue
      .split(/[,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(-2)
      .join(", ");
    if (lastTwo && lastTwo !== venue) {
      result = await mapbox(`${lastTwo}, ${city}`, city);
    }
  }

  if (result && !withinCity(result.lat, result.lng, city)) {
    result = null;
  }

  cache[key] = result;
  await saveCache();
  return result;
}
