type AnyObj = Record<string, unknown>;

export function extractJsonLdBlocks(html: string): unknown[] {
  const blocks: unknown[] = [];
  const re = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const raw = match[1].trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) blocks.push(...parsed);
      else blocks.push(parsed);
    } catch {
      /* skip malformed */
    }
  }
  return blocks;
}

export function findEventNode(blocks: unknown[]): AnyObj | null {
  for (const b of blocks) {
    if (!b || typeof b !== "object") continue;
    const obj = b as AnyObj;
    const type = obj["@type"];
    if (type === "Event" || (Array.isArray(type) && type.includes("Event"))) {
      return obj;
    }
    if (Array.isArray(obj["@graph"])) {
      const found = findEventNode(obj["@graph"]);
      if (found) return found;
    }
  }
  return null;
}
