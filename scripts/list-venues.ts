import fs from "node:fs/promises";
import type { Event } from "../src/lib/types";

async function main() {
  const buf = await fs.readFile("data/events.json", "utf8");
  const data = JSON.parse(buf) as { events: Event[] };
  const venues = new Map<string, { name: string; city: string; count: number; lat: number; lng: number }>();
  for (const e of data.events) {
    const key = `${e.venue.name}|${e.venue.city}`;
    const existing = venues.get(key);
    if (existing) existing.count++;
    else venues.set(key, { name: e.venue.name, city: e.venue.city, count: 1, lat: e.venue.lat, lng: e.venue.lng });
  }
  const arr = [...venues.values()].sort((a, b) => b.count - a.count);
  console.log(`TOTAL UNIQUE VENUES: ${arr.length}`);
  console.log(`TOP 60:`);
  for (const v of arr.slice(0, 60)) {
    console.log(`  ${String(v.count).padStart(3)} × ${v.city.padEnd(10)} / ${v.lat.toFixed(3)},${v.lng.toFixed(3)}  ${v.name}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
