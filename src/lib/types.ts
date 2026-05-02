export type Source = "biletix" | "passo" | "biletinial" | "bubilet";

export type Category =
  | "concert"
  | "theater"
  | "sport"
  | "festival"
  | "stand-up"
  | "musical"
  | "other";

export type Venue = {
  name: string;
  city: string;
  lat: number;
  lng: number;
};

export type RawEvent = {
  source: Source;
  sourceId: string;
  sourceUrl: string;
  title: string;
  category: Category;
  date: string;
  venue: Venue;
  priceMin?: number;
  priceMax?: number;
  imageUrl?: string;
  fetchedAt: string;
};

export type EventListing = {
  source: Source;
  url: string;
  title: string;
  priceMin?: number;
  priceMax?: number;
};

export type Event = {
  id: string;
  title: string;
  category: Category;
  date: string;
  venue: Venue;
  priceMin?: number;
  priceMax?: number;
  imageUrl?: string;
  sources: EventListing[];
};

export const SOURCES: Source[] = ["biletix", "passo", "biletinial", "bubilet"];

export const SOURCE_LABELS: Record<Source, string> = {
  biletix: "Biletix",
  passo: "Passo",
  biletinial: "Biletinial",
  bubilet: "Bubilet",
};

export const SOURCE_COLORS: Record<Source, string> = {
  biletix: "#e60023",
  passo: "#ff6900",
  biletinial: "#00897b",
  bubilet: "#5e35b1",
};

export const CATEGORY_LABELS: Record<Category, string> = {
  concert: "Konser",
  theater: "Tiyatro",
  sport: "Spor",
  festival: "Festival",
  "stand-up": "Stand-up",
  musical: "Müzikal",
  other: "Diğer",
};

export const CATEGORY_COLORS: Record<Category, string> = {
  concert: "#ef4444",
  theater: "#a855f7",
  sport: "#22c55e",
  festival: "#f97316",
  "stand-up": "#eab308",
  musical: "#3b82f6",
  other: "#94a3b8",
};

export const CATEGORY_ICONS: Record<Category, string> = {
  concert: "♪",
  theater: "♦",
  sport: "●",
  festival: "✦",
  "stand-up": "!",
  musical: "♫",
  other: "•",
};
