import { Venue } from "./types";

export const VENUES: Record<string, Venue> = {
  vw_arena: { name: "Volkswagen Arena", city: "İstanbul", lat: 41.0935, lng: 29.0157 },
  zorlu_psm: { name: "Zorlu PSM", city: "İstanbul", lat: 41.0681, lng: 29.0151 },
  harbiye: { name: "Harbiye Cemil Topuzlu Açıkhava", city: "İstanbul", lat: 41.0463, lng: 28.9874 },
  kucukciftlik: { name: "KüçükÇiftlik Park", city: "İstanbul", lat: 41.0476, lng: 28.9938 },
  uniq: { name: "UNIQ İstanbul", city: "İstanbul", lat: 41.0793, lng: 29.0289 },
  if_besiktas: { name: "IF Performance Hall Beşiktaş", city: "İstanbul", lat: 41.0426, lng: 29.0085 },
  bostanci: { name: "Bostancı Gösteri Merkezi", city: "İstanbul", lat: 40.9560, lng: 29.0961 },
  tt_arena: { name: "Türk Telekom Stadyumu", city: "İstanbul", lat: 41.1029, lng: 28.9923 },
  ulker: { name: "Ülker Stadyumu", city: "İstanbul", lat: 40.9874, lng: 29.0386 },

  ankara_arena: { name: "Ankara Arena", city: "Ankara", lat: 39.9523, lng: 32.8597 },
  congresium: { name: "ATO Congresium", city: "Ankara", lat: 39.9106, lng: 32.7806 },
  jolly_ank: { name: "Jolly Joker Ankara", city: "Ankara", lat: 39.9078, lng: 32.8569 },
  if_ank: { name: "IF Performance Hall Ankara", city: "Ankara", lat: 39.8910, lng: 32.8552 },

  aasm: { name: "Ahmed Adnan Saygun Sanat Merkezi", city: "İzmir", lat: 38.4192, lng: 27.1287 },
  arena_izmir: { name: "İzmir Arena", city: "İzmir", lat: 38.4505, lng: 27.1728 },
  konak_meydan: { name: "Gündoğdu Meydanı", city: "İzmir", lat: 38.4373, lng: 27.1372 },

  aspendos: { name: "Aspendos Antik Tiyatrosu", city: "Antalya", lat: 36.9389, lng: 31.1722 },
  antalya_arena: { name: "Antalya Spor Salonu", city: "Antalya", lat: 36.9081, lng: 30.6956 },

  bursa_stadium: { name: "Bursa Atatürk Stadyumu", city: "Bursa", lat: 40.2096, lng: 28.9839 },
  merinos_akkm: { name: "Merinos AKKM", city: "Bursa", lat: 40.2002, lng: 29.0508 },
};

export const CITIES: Record<string, { lat: number; lng: number; zoom: number }> = {
  İstanbul: { lat: 41.0082, lng: 28.9784, zoom: 11 },
  Ankara: { lat: 39.9334, lng: 32.8597, zoom: 11 },
  İzmir: { lat: 38.4237, lng: 27.1428, zoom: 11 },
  Antalya: { lat: 36.8969, lng: 30.7133, zoom: 11 },
  Bursa: { lat: 40.1885, lng: 29.0610, zoom: 11 },
};
