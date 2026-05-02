const UA = "Mozilla/5.0 (compatible; EventMapDemo/0.1; +https://example.com/bot)";

export type FetchOptions = {
  retries?: number;
  timeoutMs?: number;
};

export async function politeGet(
  url: string,
  opts: FetchOptions = {},
): Promise<string> {
  const { retries = 2, timeoutMs = 15000 } = opts;
  let lastErr: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": UA,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "tr-TR,tr;q=0.9",
        },
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return await res.text();
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      if (attempt < retries) {
        await delay(500 * (attempt + 1));
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

export function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function* throttled<T, R>(
  items: T[],
  concurrency: number,
  spacingMs: number,
  worker: (item: T, index: number) => Promise<R>,
): AsyncGenerator<R, void, void> {
  let nextIndex = 0;
  let lastStart = 0;

  async function next(): Promise<{ done: true } | { done: false; value: R }> {
    const i = nextIndex++;
    if (i >= items.length) return { done: true };
    const wait = Math.max(0, lastStart + spacingMs - Date.now());
    if (wait > 0) await delay(wait);
    lastStart = Date.now();
    const value = await worker(items[i], i);
    return { done: false, value };
  }

  const inFlight: Promise<{ done: true } | { done: false; value: R }>[] = [];
  for (let i = 0; i < concurrency; i++) inFlight.push(next());

  while (inFlight.length > 0) {
    const settled = await Promise.race(
      inFlight.map((p, idx) => p.then((r) => ({ idx, r }))),
    );
    inFlight.splice(settled.idx, 1);
    if (!settled.r.done) {
      yield settled.r.value;
      inFlight.push(next());
    }
  }
}
