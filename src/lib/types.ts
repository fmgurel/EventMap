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
