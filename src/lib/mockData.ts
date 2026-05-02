import { Category, RawEvent, Source } from "./types";
import { VENUES } from "./venues";

type Seed = {
  artist: string;
  category: Category;
  venueKey: keyof typeof VENUES;
  daysFromNow: number;
  hour?: number;
  priceMin: number;
  priceMax: number;
  titleVariants: Partial<Record<Source, string>>;
  presentOn: Source[];
};

const SEEDS: Seed[] = [
  {
    artist: "Tarkan",
    category: "concert",
    venueKey: "vw_arena",
    daysFromNow: 14,
    hour: 21,
    priceMin: 1500,
    priceMax: 6500,
    titleVariants: {
      biletix: "Tarkan İstanbul Konseri",
      passo: "TARKAN - Volkswagen Arena",
      bubilet: "Tarkan Konseri / İstanbul",
    },
    presentOn: ["biletix", "passo", "bubilet"],
  },
  {
    artist: "Sezen Aksu",
    category: "concert",
    venueKey: "harbiye",
    daysFromNow: 22,
    hour: 21,
    priceMin: 1200,
    priceMax: 5500,
    titleVariants: {
      biletix: "Sezen Aksu - Harbiye",
      biletinial: "SEZEN AKSU Açıkhava Konseri",
      passo: "Sezen Aksu / Cemil Topuzlu",
    },
    presentOn: ["biletix", "biletinial", "passo"],
  },
  {
    artist: "Mabel Matiz",
    category: "concert",
    venueKey: "kucukciftlik",
    daysFromNow: 30,
    hour: 21,
    priceMin: 950,
    priceMax: 3200,
    titleVariants: {
      biletix: "Mabel Matiz Konseri",
      bubilet: "Mabel Matiz - KüçükÇiftlik Park",
    },
    presentOn: ["biletix", "bubilet"],
  },
  {
    artist: "Ezhel",
    category: "concert",
    venueKey: "kucukciftlik",
    daysFromNow: 18,
    hour: 21,
    priceMin: 1100,
    priceMax: 4200,
    titleVariants: {
      passo: "EZHEL İSTANBUL",
      bubilet: "Ezhel - KüçükÇiftlik",
      biletinial: "Ezhel Konseri",
    },
    presentOn: ["passo", "bubilet", "biletinial"],
  },
  {
    artist: "Teoman",
    category: "concert",
    venueKey: "if_besiktas",
    daysFromNow: 7,
    hour: 22,
    priceMin: 800,
    priceMax: 1800,
    titleVariants: {
      biletix: "Teoman - IF Beşiktaş",
      bubilet: "Teoman Akustik Gece",
    },
    presentOn: ["biletix", "bubilet"],
  },
  {
    artist: "Manga",
    category: "concert",
    venueKey: "bostanci",
    daysFromNow: 11,
    hour: 21,
    priceMin: 700,
    priceMax: 2000,
    titleVariants: {
      biletinial: "MANGA Konseri",
      passo: "Manga / Bostancı",
    },
    presentOn: ["biletinial", "passo"],
  },
  {
    artist: "Mor ve Ötesi",
    category: "concert",
    venueKey: "zorlu_psm",
    daysFromNow: 25,
    hour: 21,
    priceMin: 1100,
    priceMax: 3500,
    titleVariants: {
      biletix: "Mor ve Ötesi - Zorlu PSM",
      passo: "MOR VE ÖTESİ İstanbul",
      bubilet: "Mor ve Ötesi Konseri",
    },
    presentOn: ["biletix", "passo", "bubilet"],
  },
  {
    artist: "Sertab Erener",
    category: "concert",
    venueKey: "uniq",
    daysFromNow: 40,
    hour: 21,
    priceMin: 1300,
    priceMax: 4500,
    titleVariants: {
      biletix: "Sertab Erener - UNIQ İstanbul",
      biletinial: "SERTAB ERENER Konseri",
    },
    presentOn: ["biletix", "biletinial"],
  },
  {
    artist: "Ceza",
    category: "concert",
    venueKey: "kucukciftlik",
    daysFromNow: 35,
    hour: 21,
    priceMin: 900,
    priceMax: 2800,
    titleVariants: {
      bubilet: "Ceza - KüçükÇiftlik Park",
      passo: "CEZA İstanbul",
    },
    presentOn: ["bubilet", "passo"],
  },
  {
    artist: "Galatasaray - Fenerbahçe",
    category: "sport",
    venueKey: "tt_arena",
    daysFromNow: 9,
    hour: 19,
    priceMin: 850,
    priceMax: 12000,
    titleVariants: {
      passo: "Galatasaray - Fenerbahçe Süper Lig",
      biletix: "GS - FB Derbi",
    },
    presentOn: ["passo", "biletix"],
  },
  {
    artist: "Fenerbahçe - Beşiktaş",
    category: "sport",
    venueKey: "ulker",
    daysFromNow: 16,
    hour: 19,
    priceMin: 700,
    priceMax: 9000,
    titleVariants: {
      passo: "Fenerbahçe - Beşiktaş",
    },
    presentOn: ["passo"],
  },
  {
    artist: "Hadise",
    category: "concert",
    venueKey: "ankara_arena",
    daysFromNow: 12,
    hour: 21,
    priceMin: 950,
    priceMax: 3000,
    titleVariants: {
      biletix: "Hadise - Ankara Arena",
      bubilet: "HADİSE Ankara Konseri",
      biletinial: "Hadise Konseri Ankara",
    },
    presentOn: ["biletix", "bubilet", "biletinial"],
  },
  {
    artist: "Athena",
    category: "concert",
    venueKey: "jolly_ank",
    daysFromNow: 6,
    hour: 22,
    priceMin: 600,
    priceMax: 1400,
    titleVariants: {
      biletix: "Athena - Jolly Joker Ankara",
      bubilet: "Athena Ankara",
    },
    presentOn: ["biletix", "bubilet"],
  },
  {
    artist: "Cem Yılmaz",
    category: "stand-up",
    venueKey: "congresium",
    daysFromNow: 28,
    hour: 20,
    priceMin: 1500,
    priceMax: 4000,
    titleVariants: {
      biletix: "Cem Yılmaz - CMYLMZ FIRSAT BU FIRSAT",
      passo: "CEM YILMAZ Stand-up",
    },
    presentOn: ["biletix", "passo"],
  },
  {
    artist: "Hasan Can Kaya",
    category: "stand-up",
    venueKey: "if_ank",
    daysFromNow: 19,
    hour: 21,
    priceMin: 800,
    priceMax: 2000,
    titleVariants: {
      biletinial: "Hasan Can Kaya - Konuşanlar",
      bubilet: "HASAN CAN KAYA Ankara",
    },
    presentOn: ["biletinial", "bubilet"],
  },
  {
    artist: "Zeynep Bastık",
    category: "concert",
    venueKey: "aasm",
    daysFromNow: 21,
    hour: 21,
    priceMin: 850,
    priceMax: 2500,
    titleVariants: {
      biletix: "Zeynep Bastık - AASSM İzmir",
      bubilet: "Zeynep Bastık İzmir Konseri",
    },
    presentOn: ["biletix", "bubilet"],
  },
  {
    artist: "Buray",
    category: "concert",
    venueKey: "arena_izmir",
    daysFromNow: 33,
    hour: 21,
    priceMin: 950,
    priceMax: 2800,
    titleVariants: {
      passo: "BURAY İzmir Arena",
      biletinial: "Buray Konseri İzmir",
    },
    presentOn: ["passo", "biletinial"],
  },
  {
    artist: "Aspendos Opera ve Bale Festivali",
    category: "festival",
    venueKey: "aspendos",
    daysFromNow: 50,
    hour: 21,
    priceMin: 500,
    priceMax: 2200,
    titleVariants: {
      biletix: "Aspendos Opera ve Bale Festivali",
      passo: "Aspendos Festival",
    },
    presentOn: ["biletix", "passo"],
  },
  {
    artist: "Yalın",
    category: "concert",
    venueKey: "antalya_arena",
    daysFromNow: 17,
    hour: 21,
    priceMin: 800,
    priceMax: 2200,
    titleVariants: {
      biletix: "Yalın - Antalya Konseri",
      bubilet: "YALIN Antalya",
    },
    presentOn: ["biletix", "bubilet"],
  },
  {
    artist: "Bursaspor - Sakaryaspor",
    category: "sport",
    venueKey: "bursa_stadium",
    daysFromNow: 8,
    hour: 19,
    priceMin: 250,
    priceMax: 800,
    titleVariants: {
      passo: "Bursaspor - Sakaryaspor 1.Lig",
    },
    presentOn: ["passo"],
  },
  {
    artist: "Mor Tiyatro: Hamlet",
    category: "theater",
    venueKey: "merinos_akkm",
    daysFromNow: 13,
    hour: 20,
    priceMin: 350,
    priceMax: 900,
    titleVariants: {
      biletix: "Hamlet - Devlet Tiyatroları",
      biletinial: "HAMLET Bursa",
    },
    presentOn: ["biletix", "biletinial"],
  },
  {
    artist: "Kafamda Bir Tuhaflık - Müzikal",
    category: "musical",
    venueKey: "zorlu_psm",
    daysFromNow: 24,
    hour: 20,
    priceMin: 1100,
    priceMax: 3800,
    titleVariants: {
      biletix: "Kafamda Bir Tuhaflık Müzikali",
      passo: "Kafamda Bir Tuhaflık - Zorlu PSM",
    },
    presentOn: ["biletix", "passo"],
  },
];

const PLACEHOLDER_IMG = (label: string) =>
  `https://placehold.co/600x400/1f2937/f1f5f9?text=${encodeURIComponent(label)}`;

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const baseUrl: Record<Source, string> = {
  biletix: "https://www.biletix.com/etkinlik",
  passo: "https://www.passo.com.tr/tr/etkinlik",
  biletinial: "https://biletinial.com/tr-tr",
  bubilet: "https://www.bubilet.com.tr/etkinlik",
};

export function generateMockEvents(source: Source): RawEvent[] {
  const now = Date.now();
  const out: RawEvent[] = [];

  for (const seed of SEEDS) {
    if (!seed.presentOn.includes(source)) continue;

    const venue = VENUES[seed.venueKey];
    const date = new Date(now + seed.daysFromNow * 86400000);
    date.setHours(seed.hour ?? 21, 0, 0, 0);

    const title = seed.titleVariants[source] ?? seed.artist;
    const sourceId = `${slug(seed.artist)}-${slug(venue.name)}-${seed.daysFromNow}`;
    const priceJitter = source.charCodeAt(0) % 7;
    const priceMin = seed.priceMin + priceJitter * 25;
    const priceMax = seed.priceMax - priceJitter * 50;

    out.push({
      source,
      sourceId,
      sourceUrl: `${baseUrl[source]}/${slug(seed.artist)}`,
      title,
      category: seed.category,
      date: date.toISOString(),
      venue,
      priceMin,
      priceMax,
      imageUrl: PLACEHOLDER_IMG(seed.artist),
      fetchedAt: new Date().toISOString(),
    });
  }

  return out;
}
