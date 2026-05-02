import { chromium, type Browser } from "playwright";
import { Category, RawEvent } from "../types";
import { generateMockEvents } from "../mockData";
import { geocodeVenue } from "./geocode";

const API_URL = "https://ticketingweb.passo.com.tr/api/passoweb/allevents";
const PRIME_URL = "https://www.passo.com.tr/";
const MAX_EVENTS = 100;

type PassoEvent = {
  id: number;
  date: string;
  endDate?: string;
  name: string;
  venueID: number;
  venueName: string;
  seoUrl?: string;
  homePageImagePath?: string;
};

export async function fetchPassoEvents(): Promise<RawEvent[]> {
  try {
    const events = await scrapeReal();
    if (events.length === 0) throw new Error("Passo returned 0 events");
    console.log(`[passo] real scrape: ${events.length} events`);
    return events;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[passo] real scrape failed (${msg}), falling back to mock`);
    return generateMockEvents("passo");
  }
}

async function scrapeReal(): Promise<RawEvent[]> {
  const browser: Browser = await chromium.launch({ headless: true });
  let raw: PassoEvent[] = [];
  try {
    const ctx = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      locale: "tr-TR",
    });
    const page = await ctx.newPage();
    await page.goto(PRIME_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(1500);

    const response = (await page.evaluate(
      async ({ url, size }) => {
        const r = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ LanguageId: 118, from: 0, size }),
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return await r.json();
      },
      { url: API_URL, size: MAX_EVENTS },
    )) as { valueList?: PassoEvent[] };

    raw = response.valueList ?? [];
  } finally {
    await browser.close();
  }

  const events: RawEvent[] = [];
  for (const e of raw) {
    const mapped = await mapEvent(e);
    if (mapped) events.push(mapped);
  }
  return events;
}

async function mapEvent(e: PassoEvent): Promise<RawEvent | null> {
  if (!e.name || !e.date || !e.venueName) return null;

  const { venue, city } = parseVenue(e.venueName);
  const coords = await geocodeVenue(venue, city);
  if (!coords) return null;

  const url = e.seoUrl
    ? `https://www.passo.com.tr/tr/etkinlik/${e.seoUrl}`
    : `https://www.passo.com.tr/tr/`;

  return {
    source: "passo",
    sourceId: String(e.id),
    sourceUrl: url,
    title: e.name,
    category: detectCategory(e.name),
    date: new Date(e.date).toISOString(),
    venue: { name: venue, city, lat: coords.lat, lng: coords.lng },
    imageUrl: imageUrl(e.homePageImagePath),
    fetchedAt: new Date().toISOString(),
  };
}

function parseVenue(raw: string): { venue: string; city: string } {
  const sep = raw.lastIndexOf(" - ");
  if (sep > 0) {
    const venue = raw.slice(0, sep).trim();
    const city = raw.slice(sep + 3).trim();
    if (city.length > 0 && city.length < 30) return { venue, city };
  }
  return { venue: raw.trim(), city: "İstanbul" };
}

function detectCategory(name: string): Category {
  const n = name.toLowerCase();
  if (/festival/.test(n)) return "festival";
  if (/tiyatro|oyun(u)?/.test(n)) return "theater";
  if (/stand.?up|cmylmz|hasan can|konusanlar/.test(n)) return "stand-up";
  if (/m[uü]zikal|opera|bale/.test(n)) return "musical";
  if (/futbol|basket|spor|s[uü]per.lig|derbi|maç|fb |gs |bjk |ts /.test(n)) return "sport";
  return "concert";
}

function imageUrl(p: string | undefined): string | undefined {
  if (!p) return undefined;
  if (p.startsWith("http")) return p;
  return `https://image.passo.com.tr/api/r/tr/p/eventimg/${p}`;
}
