import { Category, RawEvent } from "../types";
import { generateMockEvents } from "../mockData";
import { politeGet, throttled } from "./fetchUtils";
import { extractItemprop, extractAllItemprop, extractMeta, decodeEntities } from "./microdata";
import { cityFromCoords } from "./cityFromCoords";

const CITY_BBOX: Record<string, { minLat: number; maxLat: number; minLng: number; maxLng: number }> = {
  İstanbul: { minLat: 40.80, maxLat: 41.30, minLng: 28.50, maxLng: 29.55 },
  Ankara: { minLat: 39.78, maxLat: 40.10, minLng: 32.45, maxLng: 33.10 },
  İzmir: { minLat: 38.20, maxLat: 38.65, minLng: 26.85, maxLng: 27.40 },
  Antalya: { minLat: 36.78, maxLat: 37.10, minLng: 30.45, maxLng: 31.30 },
  Bursa: { minLat: 40.10, maxLat: 40.30, minLng: 28.85, maxLng: 29.30 },
};

function isInCityBbox(lat: number, lng: number, city: string): boolean {
  const b = CITY_BBOX[city];
  if (!b) return true;
  return lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng;
}

const SITEMAP = "https://biletinial.com/sitemap-event";
const MAX_EVENTS = 80;
const REQUEST_SPACING_MS = 500;
const CONCURRENCY = 2;

const URL_CATEGORY: Record<string, Category> = {
  muzik: "concert",
  tiyatro: "theater",
  "opera-bale": "musical",
  spor: "sport",
  etkinlik: "festival",
};

export async function fetchBiletinialEvents(): Promise<RawEvent[]> {
  try {
    const events = await scrapeReal();
    if (events.length === 0) throw new Error("Biletinial returned 0 events");
    console.log(`[biletinial] real scrape: ${events.length} events`);
    return events;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[biletinial] real scrape failed (${msg}), falling back to mock`);
    return generateMockEvents("biletinial");
  }
}

async function scrapeReal(): Promise<RawEvent[]> {
  const sitemapXml = await politeGet(SITEMAP);
  const urls = pickEventUrls(sitemapXml, MAX_EVENTS);

  const out: RawEvent[] = [];
  for await (const result of throttled(urls, CONCURRENCY, REQUEST_SPACING_MS, async (url) => {
    try {
      const html = await politeGet(url);
      return parseEvent(html, url);
    } catch {
      return null;
    }
  })) {
    if (result) out.push(result);
  }
  return out;
}

function pickEventUrls(sitemapXml: string, limit: number): string[] {
  const urls: string[] = [];
  const re = /<loc>([^<]+)<\/loc>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(sitemapXml)) !== null) {
    const u = m[1];
    const seg = u.split("/")[4];
    if (seg && URL_CATEGORY[seg]) urls.push(u);
  }

  const targets: Record<string, number> = {
    muzik: Math.ceil(limit * 0.4),
    tiyatro: Math.ceil(limit * 0.3),
    spor: Math.ceil(limit * 0.15),
    etkinlik: Math.ceil(limit * 0.1),
    "opera-bale": Math.ceil(limit * 0.05),
  };
  const taken: Record<string, number> = {};
  const balanced: string[] = [];
  for (const u of urls) {
    const cat = u.split("/")[4];
    taken[cat] = taken[cat] ?? 0;
    if (taken[cat] >= (targets[cat] ?? 0)) continue;
    taken[cat]++;
    balanced.push(u);
    if (balanced.length >= limit) break;
  }
  return balanced;
}

function parseEvent(html: string, url: string): RawEvent | null {
  const titleRaw =
    extractMeta(html, "property", "og:title") ??
    extractItemprop(html, "name");
  if (!titleRaw) return null;

  const startDate = extractItemprop(html, "startDate");
  if (!startDate) return null;

  const latStr = extractItemprop(html, "latitude");
  const lngStr = extractItemprop(html, "longitude");
  let lat = latStr ? Number(latStr) : NaN;
  let lng = lngStr ? Number(lngStr) : NaN;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) < 1 && Math.abs(lng) < 1) return null;
  if (lat < 35 || lat > 43 || lng < 25 || lng > 45) return null;
  const addrCity = extractItemprop(html, "addressLocality") ?? "";
  const cityHint = /İstanbul/i.test(addrCity) ? "İstanbul"
    : /Ankara/i.test(addrCity) ? "Ankara"
    : /İzmir/i.test(addrCity) ? "İzmir"
    : /Bursa/i.test(addrCity) ? "Bursa"
    : /Antalya/i.test(addrCity) ? "Antalya"
    : null;
  if (cityHint) {
    const inBox = isInCityBbox(lat, lng, cityHint);
    if (!inBox) return null;
  }

  const names = extractAllItemprop(html, "name");
  const venueName =
    names.find((n) => n !== titleRaw && n.length < 100) ??
    extractItemprop(html, "addressLocality") ??
    "Bilinmeyen Mekan";

  const priceStr = extractItemprop(html, "price");
  const price = priceStr ? Number(priceStr) : NaN;
  const priceMin = Number.isFinite(price) ? price : undefined;

  const imageUrl =
    extractMeta(html, "property", "og:image") ??
    extractItemprop(html, "image") ??
    undefined;

  const segments = url.split("/");
  const catSeg = segments[4];
  const category = URL_CATEGORY[catSeg] ?? detectCategoryFromTitle(titleRaw);
  const slug = segments[5] ?? titleRaw;

  const title = cleanTitle(titleRaw);

  return {
    source: "biletinial",
    sourceId: slug,
    sourceUrl: url,
    title,
    category,
    date: parseBiletinialDate(startDate),
    venue: { name: venueName, city: cityFromCoords(lat, lng), lat, lng },
    priceMin,
    priceMax: priceMin,
    imageUrl,
    fetchedAt: new Date().toISOString(),
  };
}

function cleanTitle(raw: string): string {
  return decodeEntities(raw)
    .replace(/\s+Biletleri?\s*$/i, "")
    .replace(/\s+Bilet\s*$/i, "")
    .trim();
}

function parseBiletinialDate(input: string): string {
  const d = new Date(input);
  if (!isNaN(d.getTime())) return d.toISOString();
  return new Date().toISOString();
}

function detectCategoryFromTitle(title: string): Category {
  const t = title.toLowerCase();
  if (/tiyatro|oyun(u)?/.test(t)) return "theater";
  if (/festival/.test(t)) return "festival";
  if (/stand.?up|konusanlar/.test(t)) return "stand-up";
  if (/m[uü]zikal|opera|bale/.test(t)) return "musical";
  if (/futbol|basket|spor|s[uü]per.lig|derbi|mac|maç/.test(t)) return "sport";
  return "concert";
}
