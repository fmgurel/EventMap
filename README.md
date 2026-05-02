# Event Map — Türkiye Etkinlik Agregatörü (Demo)

Biletix, Passo, Biletinial ve Bubilet etkinliklerini tek haritada gösteren bir Next.js demo uygulaması. Cimri/Akakçe mantığının etkinliklere uygulanmış hali — mimari gerçek, scraperlar mock veri üretiyor.

## Mimari

```
[ Mock Scrapers ] ──► [ Normalizer ] ──► [ Dedupe ] ──► [ JSON Store ]
   biletix.ts                                                │
   passo.ts                                                  ▼
   biletinial.ts                                    [ /api/events ]
   bubilet.ts                                                │
                                                             ▼
                                                  [ MapLibre Frontend ]
```

- **Scraper'lar** (`src/lib/scrapers/`): Her platform için bir modül, `() => Promise<RawEvent[]>` arayüzü. Şu an `mockData.ts`'den üretiyor; gerçek scraping için bu modüllerin içini Playwright ile değiştirmek yeterli.
- **Normalizer** (`src/lib/normalizer.ts`): Türkçe karakter eşleme, durak kelimeleri (`konser`, `festivali` vs.) atma, mekan ipuçlarını çıkarma, başlığı tokenize edip sıralama. Aynı etkinliği farklı platformlarda eşleştirebilmek için.
- **Dedupe** (`src/lib/dedupe.ts`): Aynı gün + ≤300m mesafede + Jaccard token benzerliği ≥0.5 olan etkinlikleri tek `Event`'e birleştirir, kaynakları `sources[]` olarak tutar.
- **DB** (`src/lib/db.ts`): `data/events.json` dosyası — gerçek projede PostgreSQL/PostGIS'e geçilir, arayüz aynı kalır.
- **API**:
  - `GET /api/events?bbox=&lat=&lng=&radius=&category=&source=&from=&to=&q=`
  - `POST /api/ingest` — tüm scraperları çalıştır + dedupe + kaydet
  - `GET /api/ingest` — store özeti
- **Frontend** (`src/app/page.tsx` + `src/components/EventMap.tsx`): MapLibre GL JS, OpenFreeMap stilleri (API key gerekmez). Sidebar'da şehir, kategori, platform, arama filtreleri.

## Çalıştırma

```bash
npm install
npm run dev
```

Tarayıcıda `http://localhost:3000` aç. **"Verileri Yenile (Mock)"** butonuna tıkla — 4 platformdan ham etkinlikler toplanır, normalize/tekilleştirilir, haritada görünür.

CLI'dan ingest çalıştırmak için:
```bash
npm run ingest
```

## Gerçek scraping'e geçiş

**Bubilet zaten gerçek veri çekiyor** — `src/lib/scrapers/bubilet.ts` referans implementasyon olarak kullanılabilir. Yaklaşım:

1. **Sitemap.xml** üzerinden etkinlik URL'lerini al (`/etkinlik/` filtresi). HTML parsing yerine sitemap = stabil ve hızlı discovery.
2. Her etkinlik sayfasını `politeGet` ile çek (User-Agent, retry, 600ms aralık, 1 concurrent — site'ı sıkıştırmamak için).
3. Sayfadaki `<script type="application/ld+json">` bloklarını çıkar; `@type: "Event"` olanı bul.
4. Schema.org Event'inden `name`, `startDate`, `location.geo.{latitude,longitude}`, `offers.{lowPrice,highPrice}`, `image` alanlarını `RawEvent`'e map'le.
5. Hata olursa otomatik mock'a düş (demo her koşulda çalışsın).

**Neden JSON-LD?** Site SEO için Google Rich Results yayınladığından bu format kararlı (CSS selector'lar gibi sık kırılmaz). Üstelik **lat/lng zaten içinde** — ayrı geocoding gerekmez.

Diğer 3 platform için aynı şablon: önce sitemap.xml'i kontrol et, JSON-LD/microdata var mı bak. Yoksa Playwright ile DOM scrape gerekebilir (daha kırılgan).

```ts
export async function fetchBiletixEvents(): Promise<RawEvent[]> {
  try { return await scrapeReal(); }
  catch { return generateMockEvents("biletix"); }   // her zaman geri çekilebilir
}
```

### ⚠ Yasal not

Bu repo **eğitim amaçlıdır**. Türkiye'deki bilet platformlarının çoğunun ToS'u programatik erişimi açıkça yasaklamaz ama etmezler de — gri alan. Üretime almadan önce:
- **Affiliate / partner programlarını araştır** (Biletix'in var). Resmi feed = legal + çok daha hızlı + kararlı.
- robots.txt'e mutlak uy.
- Rate limit'e saygı (bu kodda 600ms/istek, 1 concurrent).
- IP'yi banlatma — backoff ekle, döngüye girersen dur.

Pipeline (normalizer + dedupe + DB) gerçek scraping'e geçişte **hiç değişmez**. Production altyapısı için sıralı adımlar:
- BullMQ (Redis) ile worker queue + zamanlanmış cron ingest
- PostgreSQL + PostGIS (`ST_DWithin` ile mesafe sorgusu, koordinat indeksi)
- Affiliate program / resmi feed varsa scraping yerine onları kullan

## Veri modeli

```ts
type RawEvent = {           // tek platformdan tek satır
  source, sourceId, sourceUrl,
  title, category, date,
  venue: { name, city, lat, lng },
  priceMin?, priceMax?, imageUrl?,
};

type Event = {              // dedupe sonrası, çok kaynaklı
  id, title, category, date, venue,
  priceMin?, priceMax?, imageUrl?,
  sources: EventListing[];  // her platformdaki link + fiyat
};
```

## Notlar

- Harita stili: [OpenFreeMap](https://openfreemap.org/) — ücretsiz, açık kaynak vector tile'lar.
- Tüm Türkçe karakterler ve şehir adları doğru render edilir.
- Filtreler ve şehir seçimi tamamen client-side (hızlı), API yalnızca veri kaynağı.
- Mock veride bilinçli olarak bazı etkinlikler birden fazla platformda görünür (Tarkan, Sezen Aksu, Mor ve Ötesi, Hadise…) — dedupe'un çalıştığını harita marker'larındaki sayıdan görebilirsin (≥2 kaynak varsa daire büyür ve içine sayı yazar).
