const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

export function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-zA-Z]+);/g, (m, name) => NAMED_ENTITIES[name] ?? m);
}

export function extractItemprop(html: string, prop: string): string | null {
  return extractAllItemprop(html, prop)[0] ?? null;
}

export function extractAllItemprop(html: string, prop: string): string[] {
  const out: string[] = [];
  const patterns = [
    new RegExp(
      `<meta\\b[^>]*\\bitemprop=["']${prop}["'][^>]*\\bcontent=["']([^"']*)["']`,
      "gi",
    ),
    new RegExp(
      `<meta\\b[^>]*\\bcontent=["']([^"']*)["'][^>]*\\bitemprop=["']${prop}["']`,
      "gi",
    ),
    new RegExp(
      `<time\\b[^>]*\\bitemprop=["']${prop}["'][^>]*\\bcontent=["']([^"']*)["']`,
      "gi",
    ),
  ];
  const seen = new Set<string>();
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      const value = decodeEntities(m[1]).trim();
      const key = `${m.index}:${value}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(value);
      }
    }
  }
  return out;
}

export function extractMeta(html: string, attr: "property" | "name", value: string): string | null {
  const re = new RegExp(
    `<meta\\b[^>]*\\b${attr}=["']${value}["'][^>]*\\bcontent=["']([^"']*)["']`,
    "i",
  );
  const m = html.match(re);
  return m ? decodeEntities(m[1]).trim() : null;
}
