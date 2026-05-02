import { RawEvent, Source } from "../types";
import { fetchBiletixEvents } from "./biletix";
import { fetchPassoEvents } from "./passo";
import { fetchBiletinialEvents } from "./biletinial";
import { fetchBubiletEvents } from "./bubilet";

const REGISTRY: Record<Source, () => Promise<RawEvent[]>> = {
  biletix: fetchBiletixEvents,
  passo: fetchPassoEvents,
  biletinial: fetchBiletinialEvents,
  bubilet: fetchBubiletEvents,
};

export async function runAllScrapers(): Promise<{
  events: RawEvent[];
  perSource: Record<Source, number>;
  errors: Record<Source, string | null>;
}> {
  const perSource = { biletix: 0, passo: 0, biletinial: 0, bubilet: 0 } as Record<Source, number>;
  const errors = { biletix: null, passo: null, biletinial: null, bubilet: null } as Record<
    Source,
    string | null
  >;

  const results = await Promise.allSettled(
    (Object.keys(REGISTRY) as Source[]).map(async (s) => {
      const events = await REGISTRY[s]();
      return { source: s, events };
    }),
  );

  const events: RawEvent[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") {
      events.push(...r.value.events);
      perSource[r.value.source] = r.value.events.length;
    } else {
      const reason = r.reason instanceof Error ? r.reason.message : String(r.reason);
      console.error("Scraper failed:", reason);
    }
  }

  return { events, perSource, errors };
}
