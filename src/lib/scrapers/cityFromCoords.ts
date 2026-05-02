type Box = { name: string; minLat: number; maxLat: number; minLng: number; maxLng: number };

const BOXES: Box[] = [
  { name: "İstanbul", minLat: 40.80, maxLat: 41.30, minLng: 28.50, maxLng: 29.55 },
  { name: "Ankara", minLat: 39.80, maxLat: 40.10, minLng: 32.50, maxLng: 33.10 },
  { name: "İzmir", minLat: 38.20, maxLat: 38.65, minLng: 26.85, maxLng: 27.40 },
  { name: "Antalya", minLat: 36.78, maxLat: 37.10, minLng: 30.50, maxLng: 31.30 },
  { name: "Bursa", minLat: 40.10, maxLat: 40.30, minLng: 28.85, maxLng: 29.30 },
  { name: "Adana", minLat: 36.95, maxLat: 37.10, minLng: 35.20, maxLng: 35.45 },
  { name: "Konya", minLat: 37.78, maxLat: 38.05, minLng: 32.30, maxLng: 32.75 },
  { name: "Gaziantep", minLat: 36.95, maxLat: 37.20, minLng: 37.20, maxLng: 37.55 },
  { name: "Eskişehir", minLat: 39.65, maxLat: 39.85, minLng: 30.30, maxLng: 30.75 },
  { name: "Kocaeli", minLat: 40.70, maxLat: 40.90, minLng: 29.70, maxLng: 30.20 },
  { name: "Mersin", minLat: 36.70, maxLat: 36.90, minLng: 34.40, maxLng: 34.85 },
  { name: "Muğla", minLat: 36.90, maxLat: 37.45, minLng: 27.40, maxLng: 28.80 },
];

export function cityFromCoords(lat: number, lng: number): string {
  for (const b of BOXES) {
    if (lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng) {
      return b.name;
    }
  }
  return "Diğer";
}
