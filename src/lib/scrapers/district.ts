const TR_NORMALIZE: Record<string, string> = {
  ı: "i", İ: "İ", ğ: "g", Ğ: "G", ü: "u", Ü: "U",
  ş: "s", Ş: "S", ö: "o", Ö: "O", ç: "c", Ç: "C",
};

function titleCase(s: string): string {
  if (!s) return s;
  return s
    .toLowerCase()
    .split(" ")
    .map((w) => (w.length > 0 ? w[0].toLocaleUpperCase("tr-TR") + w.slice(1) : w))
    .join(" ");
}

const ISTANBUL_DISTRICTS = new Set([
  "Adalar", "Arnavutköy", "Ataşehir", "Avcılar", "Bağcılar", "Bahçelievler",
  "Bakırköy", "Başakşehir", "Bayrampaşa", "Beşiktaş", "Beykoz", "Beylikdüzü",
  "Beyoğlu", "Büyükçekmece", "Çatalca", "Çekmeköy", "Esenler", "Esenyurt",
  "Eyüpsultan", "Fatih", "Gaziosmanpaşa", "Güngören", "Kadıköy", "Kağıthane",
  "Kartal", "Küçükçekmece", "Maltepe", "Pendik", "Sancaktepe", "Sarıyer",
  "Silivri", "Sultanbeyli", "Sultangazi", "Şile", "Şişli", "Tuzla",
  "Ümraniye", "Üsküdar", "Zeytinburnu",
]);

const ANKARA_DISTRICTS = new Set([
  "Akyurt", "Altındağ", "Ayaş", "Bala", "Beypazarı", "Çamlıdere",
  "Çankaya", "Çubuk", "Elmadağ", "Etimesgut", "Evren", "Gölbaşı",
  "Güdül", "Haymana", "Kalecik", "Kazan", "Keçiören", "Kızılcahamam",
  "Mamak", "Nallıhan", "Polatlı", "Pursaklar", "Sincan", "Şereflikoçhisar",
  "Yenimahalle",
]);

const IZMIR_DISTRICTS = new Set([
  "Aliağa", "Balçova", "Bayındır", "Bayraklı", "Bergama", "Beydağ",
  "Bornova", "Buca", "Çeşme", "Çiğli", "Dikili", "Foça", "Gaziemir",
  "Güzelbahçe", "Karabağlar", "Karaburun", "Karşıyaka", "Kemalpaşa",
  "Kınık", "Kiraz", "Konak", "Menderes", "Menemen", "Narlıdere",
  "Ödemiş", "Seferihisar", "Selçuk", "Tire", "Torbalı", "Urla",
]);

const KNOWN_DISTRICTS: Record<string, Set<string>> = {
  İstanbul: ISTANBUL_DISTRICTS,
  Ankara: ANKARA_DISTRICTS,
  İzmir: IZMIR_DISTRICTS,
};

export function parseDistrict(addressText: string | null | undefined, city: string): string | undefined {
  if (!addressText) return undefined;
  const cityKnown = KNOWN_DISTRICTS[city];
  if (!cityKnown) return undefined;

  const slashMatch = addressText.match(/([A-Za-zÇĞİıÖŞÜçğıöşü\s]+)\s*\/\s*[A-Za-zÇĞİıÖŞÜçğıöşü]+/);
  if (slashMatch) {
    const candidate = titleCase(slashMatch[1].trim());
    const matched = lookupDistrict(candidate, cityKnown);
    if (matched) return matched;
  }

  for (const district of cityKnown) {
    const re = new RegExp(`\\b${escapeRegex(district)}\\b`, "i");
    if (re.test(addressText)) return district;
  }

  return undefined;
}

function lookupDistrict(candidate: string, set: Set<string>): string | undefined {
  if (set.has(candidate)) return candidate;
  const upper = candidate.toLocaleUpperCase("tr-TR");
  for (const d of set) {
    if (d.toLocaleUpperCase("tr-TR") === upper) return d;
  }
  return undefined;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const ALL_KNOWN_DISTRICTS = KNOWN_DISTRICTS;
