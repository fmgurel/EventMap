import fs from "node:fs/promises";
import path from "node:path";
import type { Event } from "../src/lib/types";

type VenueEntry = {
  name: string;
  city: string;
  district?: string;
  lat: number;
  lng: number;
  count: number;
};

const VENUES_FILE = path.join("data", "venues.json");
const EVENTS_FILE = path.join("data", "events.json");

async function main() {
  const eventsBuf = await fs.readFile(EVENTS_FILE, "utf8");
  const data = JSON.parse(eventsBuf) as { events: Event[] };

  let existing: Record<string, VenueEntry> = {};
  try {
    const existingBuf = await fs.readFile(VENUES_FILE, "utf8");
    existing = JSON.parse(existingBuf) as Record<string, VenueEntry>;
  } catch {}

  const merged: Record<string, VenueEntry> = { ...existing };
  let added = 0;
  let updated = 0;

  for (const e of data.events) {
    const key = makeKey(e.venue.name, e.venue.city);
    if (key in merged) {
      merged[key].count++;
      continue;
    }
    merged[key] = {
      name: e.venue.name,
      city: e.venue.city,
      district: e.venue.district,
      lat: e.venue.lat,
      lng: e.venue.lng,
      count: 1,
    };
    added++;
  }

  for (const v of Object.values(merged)) v.count = 0;
  for (const e of data.events) {
    const key = makeKey(e.venue.name, e.venue.city);
    if (key in merged) merged[key].count++;
  }

  const sorted: Record<string, VenueEntry> = {};
  const keys = Object.keys(merged).sort((a, b) => merged[b].count - merged[a].count);
  for (const k of keys) sorted[k] = merged[k];

  await fs.writeFile(VENUES_FILE, JSON.stringify(sorted, null, 2), "utf8");
  console.log(
    `venues.json: ${Object.keys(sorted).length} total venues (${added} new, ${updated} existing)`,
  );
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

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
