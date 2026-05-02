import { runAllScrapers } from "./scrapers";
import { dedupeEvents } from "./dedupe";
import { saveEvents } from "./db";
import { Source } from "./types";

export type IngestResult = {
  perSource: Record<Source, number>;
  rawTotal: number;
  dedupedTotal: number;
  durationMs: number;
  ingestedAt: string;
};

export async function ingest(): Promise<IngestResult> {
  const t0 = Date.now();
  const { events: raw, perSource } = await runAllScrapers();
  const deduped = dedupeEvents(raw);
  await saveEvents(deduped);
  return {
    perSource,
    rawTotal: raw.length,
    dedupedTotal: deduped.length,
    durationMs: Date.now() - t0,
    ingestedAt: new Date().toISOString(),
  };
}
