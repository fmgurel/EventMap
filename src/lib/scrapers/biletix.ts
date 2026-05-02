import { chromium, type Browser, type Page } from "playwright";
import { Category, RawEvent } from "../types";
import { generateMockEvents } from "../mockData";
import { politeGet } from "./fetchUtils";
import { geocodeVenue } from "./geocode";

const SITEMAP = "https://www.biletix.com/wbtxapi/api/v1/siteMap/event";
const MAX_EVENTS = 80;
const PAGE_TIMEOUT_MS = 25000;

const TR_MONTHS: Record<string, number> = {
  ocak: 1, şubat: 2, mart: 3, nisan: 4, mayıs: 5, haziran: 6,
  temmuz: 7, ağustos: 8, eylül: 9, ekim: 10, kasım: 11, aralık: 12,
};
const EN_MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

export async function fetchBiletixEvents(): Promise<RawEvent[]> {
  try {
    const events = await scrapeReal();
    if (events.length === 0) throw new Error("Biletix returned 0 events");
    console.log(`[biletix] real scrape: ${events.length} events`);
    return events;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[biletix] real scrape failed (${msg}), falling back to mock`);
    return generateMockEvents("biletix");
  }
}

async function scrapeReal(): Promise<RawEvent[]> {
  const sitemapXml = await politeGet(SITEMAP);
  const urls = pickEventUrls(sitemapXml, MAX_EVENTS);
  if (urls.length === 0) throw new Error("No URLs in sitemap");

  const browser: Browser = await chromium.launch({ headless: true });
  try {
    const ctx = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      locale: "tr-TR",
      viewport: { width: 1280, height: 800 },
    });
    const page = await ctx.newPage();
    const venueAddressCache = new Map<string, string>();
    const events: RawEvent[] = [];

    for (let i = 0; i < urls.length; i++) {
      try {
        const event = await scrapeEvent(page, urls[i], venueAddressCache);
        if (event) events.push(event);
      } catch (err) {
        console.warn(`[biletix] event ${i} failed: ${err}`);
      }
    }
    return events;
  } finally {
    await browser.close();
  }
}

async function fetchVenueAddress(
  page: Page,
  venueUrl: string,
  cache: Map<string, string>,
): Promise<string | null> {
  if (cache.has(venueUrl)) return cache.get(venueUrl) ?? null;
  try {
    await page.goto(venueUrl, { waitUntil: "domcontentloaded", timeout: PAGE_TIMEOUT_MS });
    await page.waitForSelector("h1", { timeout: 6000 }).catch(() => {});
    await page.waitForTimeout(400);
    const address = (await page.evaluate(`(function() {
      var text = document.body.innerText || '';
      var m = text.match(/Adres\\s*\\n([^\\n]+)/);
      return m ? m[1].trim() : null;
    })()`)) as string | null;
    if (address) cache.set(venueUrl, address);
    return address;
  } catch {
    return null;
  }
}

function pickEventUrls(sitemapXml: string, limit: number): string[] {
  const urls: string[] = [];
  const re = /<loc>([^<]+)<\/loc>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(sitemapXml)) !== null) {
    const u = m[1];
    if (u.endsWith("/tr") && u.includes("/etkinlik/")) {
      urls.push(u);
      if (urls.length >= limit) break;
    }
  }
  return urls;
}

async function scrapeEvent(
  page: Page,
  url: string,
  venueAddressCache: Map<string, string>,
): Promise<RawEvent | null> {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: PAGE_TIMEOUT_MS });
  await page.waitForSelector("h1", { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(600);

  const data = await page.evaluate(`(function() {
    function text(sel) {
      var el = document.querySelector(sel);
      return el && el.textContent ? el.textContent.trim().replace(/\\s+/g, ' ') : null;
    }
    var image = null;
    var im = document.querySelector('.event-image img, figure.event-img-container img');
    if (im) image = im.getAttribute('src');
    var ogImg = document.querySelector('meta[property="og:image"]');
    if (!image && ogImg) image = ogImg.getAttribute('content');
    var venueLink = null;
    var vl = document.querySelector('a[href*="/mekan/"]');
    if (vl) venueLink = vl.href;
    return {
      title: text('h1'),
      location: text('.event-location'),
      bodyText: document.body.innerText.slice(0, 4000),
      image: image,
      venueLink: venueLink
    };
  })()`) as {
    title: string | null;
    location: string | null;
    bodyText: string;
    image: string | null;
    venueLink: string | null;
  };

  if (!data.title) {
    console.warn(`[biletix] no title at ${url}`);
    return null;
  }

  const venueAndCity = parseLocation(data.location);
  if (!venueAndCity) {
    console.warn(`[biletix] no location ("${data.location}") at ${url}`);
    return null;
  }
  const { venue, city } = venueAndCity;

  const date = extractDateFromBody(data.bodyText);
  if (!date) {
    console.warn(`[biletix] no date for "${data.title}"`);
    return null;
  }

  let address: string | null = null;
  if (data.venueLink) {
    address = await fetchVenueAddress(page, data.venueLink, venueAddressCache);
  }
  const coords = address
    ? (await geocodeVenue(address, city)) ?? (await geocodeVenue(venue, city))
    : await geocodeVenue(venue, city);
  if (!coords) {
    console.warn(`[biletix] no coords for "${venue}, ${city}" addr=${address ?? "(none)"}`);
    return null;
  }
  console.log(`[biletix] "${data.title.slice(0, 30)}" → ${coords.lat.toFixed(4)},${coords.lng.toFixed(4)} ${address ? "(addr)" : "(venue-name)"}`);

  const idMatch = url.match(/\/etkinlik\/([^/]+)\//);
  const sourceId = idMatch ? idMatch[1] : url;

  return {
    source: "biletix",
    sourceId,
    sourceUrl: url,
    title: data.title,
    category: detectCategory(data.title),
    date,
    venue: { name: venue, city, lat: coords.lat, lng: coords.lng },
    imageUrl: normalizeImageUrl(data.image, url),
    fetchedAt: new Date().toISOString(),
  };
}

function parseLocation(raw: string | null): { venue: string; city: string } | null {
  if (!raw) return null;
  const cleaned = raw.replace(/^place\s+/i, "").trim();
  const parts = cleaned.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  const venue = parts.slice(0, -1).join(", ");
  const city = parts[parts.length - 1];
  return { venue, city };
}

function extractDateFromBody(body: string): string | null {
  const trMonthGroup = "Ocak|Şubat|Mart|Nisan|Mayıs|Haziran|Temmuz|Ağustos|Eylül|Ekim|Kasım|Aralık";
  const enMonthGroup = "Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|June|July|August|September|October|November|December";

  const re = new RegExp(
    `(\\d{1,2})\\s+(${trMonthGroup}|${enMonthGroup})\\s+(\\d{4})[\\s\\S]{0,30}?(\\d{1,2}):(\\d{2})`,
    "i",
  );
  const m = body.match(re);
  if (!m) return null;
  const day = Number(m[1]);
  const monthName = m[2].toLowerCase().slice(0, 3);
  const year = Number(m[3]);
  const hour = Number(m[4]);
  const min = Number(m[5]);
  const month =
    TR_MONTHS[m[2].toLowerCase()] ??
    EN_MONTHS[monthName] ??
    null;
  if (!month) return null;
  const d = new Date(Date.UTC(year, month - 1, day, hour - 3, min));
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

function detectCategory(title: string): Category {
  const t = title.toLowerCase();
  if (/\btiyatro\b|\boyun(u)?\b|\bopera\b|\bbale\b/.test(t)) return "theater";
  if (/\bfestival\b/.test(t)) return "festival";
  if (/stand.?up|cmylmz|hasan.can|konusanlar/.test(t)) return "stand-up";
  if (/m[uü]zikal/.test(t)) return "musical";
  if (/\bfutbol\b|\bbasketbol\b|\bspor\b|s[uü]per.lig|\bderbi\b|\bmaç\b|\bvs\.|\b[a-z]{2,3}\s*-\s*[a-z]{2,3}\b/.test(t)) return "sport";
  if (/konser|konseri|tour|live|sahne/.test(t)) return "concert";
  if (/resim|heykel|sergi|atölye|workshop|atolye|boyama|seramik/.test(t)) return "other";
  return "other";
}

function normalizeImageUrl(src: string | null, baseUrl: string): string | undefined {
  if (!src) return undefined;
  if (src.startsWith("http")) return src;
  if (src.startsWith("//")) return "https:" + src;
  if (src.startsWith("/")) return new URL(src, baseUrl).toString();
  return src;
}
