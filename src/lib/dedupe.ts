import { Event, EventListing, RawEvent } from "./types";
import { dedupeKey, haversineKm, normalizeTitle, eventDay } from "./normalizer";

export function dedupeEvents(raw: RawEvent[]): Event[] {
  const buckets = new Map<string, RawEvent[]>();

  for (const e of raw) {
    const key = dedupeKey(e);
    const existing = buckets.get(key);
    if (existing) {
      existing.push(e);
      continue;
    }

    let merged = false;
    const day = eventDay(e.date);
    const norm = normalizeTitle(e.title);
    for (const [otherKey, group] of buckets) {
      const sample = group[0];
      if (eventDay(sample.date) !== day) continue;
      if (haversineKm(sample.venue, e.venue) > 0.3) continue;
      const sampleNorm = normalizeTitle(sample.title);
      if (titleSimilar(norm, sampleNorm)) {
        group.push(e);
        merged = true;
        break;
      }
    }
    if (!merged) buckets.set(key, [e]);
  }

  return [...buckets.values()].map((group) => mergeGroup(group));
}

function titleSimilar(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  const aTokens = new Set(a.split(" "));
  const bTokens = new Set(b.split(" "));
  const intersection = [...aTokens].filter((t) => bTokens.has(t)).length;
  const union = new Set([...aTokens, ...bTokens]).size;
  return union > 0 && intersection / union >= 0.5;
}

function mergeGroup(group: RawEvent[]): Event {
  const canonical =
    [...group].sort((a, b) => (a.title.length < b.title.length ? -1 : 1))[0] ?? group[0];

  const sources: EventListing[] = group.map((g) => ({
    source: g.source,
    url: g.sourceUrl,
    title: g.title,
    priceMin: g.priceMin,
    priceMax: g.priceMax,
  }));

  const allMins = group.map((g) => g.priceMin).filter((v): v is number => typeof v === "number");
  const allMaxs = group.map((g) => g.priceMax).filter((v): v is number => typeof v === "number");

  return {
    id: dedupeKey(canonical),
    title: canonical.title,
    category: canonical.category,
    date: canonical.date,
    venue: canonical.venue,
    priceMin: allMins.length ? Math.min(...allMins) : undefined,
    priceMax: allMaxs.length ? Math.max(...allMaxs) : undefined,
    imageUrl: canonical.imageUrl,
    sources,
  };
}
