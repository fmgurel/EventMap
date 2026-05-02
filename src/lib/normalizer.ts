import { RawEvent } from "./types";

const TR_MAP: Record<string, string> = {
  ı: "i", İ: "i", ğ: "g", Ğ: "g", ü: "u", Ü: "u",
  ş: "s", Ş: "s", ö: "o", Ö: "o", ç: "c", Ç: "c",
};

const STOPWORDS = new Set([
  "konseri", "konser", "festival", "festivali", "tiyatro", "tiyatrosu",
  "musical", "muzikal", "muzikali", "stand-up", "standup", "show", "live",
  "ile", "ve", "bu", "the", "a", "an", "de", "da",
]);

const VENUE_HINTS = [
  "arena", "stadyum", "stadyumu", "stadium", "salon", "salonu",
  "park", "psm", "akkm", "merkez", "merkezi", "topuzlu", "harbiye",
  "kucukciftlik", "uniq", "hall", "performance", "jolly", "joker", "if",
  "antik",
];

export function normalizeTitle(title: string): string {
  let s = title.toLowerCase();
  s = s
    .split("")
    .map((c) => TR_MAP[c] ?? c)
    .join("");
  s = s.replace(/[^a-z0-9\s]/g, " ");
  const tokens = s
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => !STOPWORDS.has(t))
    .filter((t) => !VENUE_HINTS.includes(t))
    .filter((t) => t.length > 1);
  tokens.sort();
  return tokens.join(" ");
}

export function eventDay(iso: string): string {
  return iso.slice(0, 10);
}

const R = 6371;
export function haversineKm(
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

export function dedupeKey(e: RawEvent): string {
  return `${normalizeTitle(e.title)}|${eventDay(e.date)}|${Math.round(e.venue.lat * 100)},${Math.round(e.venue.lng * 100)}`;
}
