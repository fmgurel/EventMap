import { Category, RawEvent } from "../types";
import { generateMockEvents } from "../mockData";
import { politeGet, throttled } from "./fetchUtils";
import { extractJsonLdBlocks, findEventNode } from "./jsonld";
import { parseDistrict } from "./district";

const SITEMAP = "https://www.bubilet.com.tr/sitemap.xml";
const MAX_EVENTS = 100;
const REQUEST_SPACING_MS = 500;
const CONCURRENCY = 2;

const CITY_DISPLAY: Record<string, string> = {
  istanbul: "İstanbul",
  ankara: "Ankara",
  izmir: "İzmir",
  antalya: "Antalya",
  bursa: "Bursa",
  adana: "Adana",
  konya: "Konya",
  gaziantep: "Gaziantep",
  eskisehir: "Eskişehir",
  kocaeli: "Kocaeli",
  mersin: "Mersin",
  mugla: "Muğla",
};

export async function fetchBubiletEvents(): Promise<RawEvent[]> {
  try {
    const events = await scrapeReal();
    if (events.length === 0) throw new Error("Bubilet returned 0 events");
    console.log(`[bubilet] real scrape: ${events.length} events`);
    return events;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[bubilet] real scrape failed (${msg}), falling back to mock`);
    return generateMockEvents("bubilet");
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
    if (u.includes("/etkinlik/")) urls.push(u);
  }

  const perCity: Record<string, number> = {};
  const cap = Math.max(2, Math.ceil(limit / 4));
  const balanced: string[] = [];
  for (const u of urls) {
    const city = u.split("/")[3];
    perCity[city] = perCity[city] ?? 0;
    if (perCity[city] >= cap) continue;
    perCity[city]++;
    balanced.push(u);
    if (balanced.length >= limit) break;
  }
  return balanced;
}

function parseEvent(html: string, url: string): RawEvent | null {
  const blocks = extractJsonLdBlocks(html);
  const node = findEventNode(blocks);
  if (!node) return null;

  const title = pickString(node["name"]);
  const startDate = pickString(node["startDate"]);
  if (!title || !startDate) return null;

  const location = node["location"] as Record<string, unknown> | undefined;
  if (!location) return null;
  const venueName = pickString(location["name"]) ?? "Bilinmeyen Mekan";
  const geo = location["geo"] as Record<string, unknown> | undefined;
  const lat = pickNumber(geo?.["latitude"]);
  const lng = pickNumber(geo?.["longitude"]);
  if (lat === null || lng === null) return null;

  const address = location["address"] as Record<string, unknown> | undefined;
  const cityRaw = pickString(address?.["addressLocality"]);
  const citySlug = url.split("/")[3] ?? "";
  const city = cityRaw ?? CITY_DISPLAY[citySlug] ?? capitalize(citySlug);
  const streetAddress = pickString(address?.["streetAddress"]) ?? "";
  const district = parseDistrict(streetAddress, city);

  const offers = node["offers"] as Record<string, unknown> | undefined;
  const priceMin = pickNumber(offers?.["lowPrice"] ?? offers?.["price"]);
  const priceMax = pickNumber(offers?.["highPrice"] ?? offers?.["price"]);

  const imageUrl = pickFirstString(node["image"]);
  const slug = url.split("/").slice(-1)[0] ?? title;

  return {
    source: "bubilet",
    sourceId: slug,
    sourceUrl: url,
    title,
    category: detectCategory(title, slug),
    date: new Date(startDate).toISOString(),
    venue: { name: venueName, city, district, lat, lng },
    priceMin: priceMin ?? undefined,
    priceMax: priceMax ?? undefined,
    imageUrl: imageUrl ?? undefined,
    fetchedAt: new Date().toISOString(),
  };
}

function detectCategory(title: string, slug: string): Category {
  const t = `${title} ${slug}`.toLowerCase();
  if (/tiyatro|oyun(u)?|hamlet|monolog/.test(t)) return "theater";
  if (/festival/.test(t)) return "festival";
  if (/stand.?up|cmylmz|hasan.can|konusanlar/.test(t)) return "stand-up";
  if (/muzikal|m[uü]zikal/.test(t)) return "musical";
  if (/futbol|basket|spor|s[uü]per.lig|derbi/.test(t)) return "sport";
  return "concert";
}

function pickString(v: unknown): string | null {
  if (typeof v === "string" && v.trim().length > 0) return v.trim();
  if (Array.isArray(v) && typeof v[0] === "string") return v[0].trim();
  return null;
}

function pickFirstString(v: unknown): string | null {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return null;
}

function pickNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}
