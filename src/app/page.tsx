"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Category,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  Event,
  Source,
  SOURCE_COLORS,
  SOURCE_LABELS,
  SOURCES,
} from "@/lib/types";
import { CITIES } from "@/lib/venues";

const EventMap = dynamic(() => import("@/components/EventMap"), { ssr: false });

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "az önce";
  if (mins < 60) return `${mins} dk önce`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} saat önce`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} gün önce`;
  return new Date(iso).toLocaleDateString("tr-TR");
}

const CATEGORIES: Category[] = [
  "concert",
  "theater",
  "sport",
  "festival",
  "stand-up",
  "musical",
];

export default function HomePage() {
  const [city, setCity] = useState<keyof typeof CITIES>("İstanbul");
  const [events, setEvents] = useState<Event[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [activeSources, setActiveSources] = useState<Set<Source>>(new Set(SOURCES));
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [ingestedAt, setIngestedAt] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const center = CITIES[city];

  async function loadEvents() {
    setLoading(true);
    const res = await fetch("/api/events");
    const data = await res.json();
    setEvents(data.events);
    setIngestedAt(data.ingestedAt);
    setLoading(false);
  }

  useEffect(() => {
    loadEvents();
  }, []);

  const filtered = useMemo(() => {
    const needle = search.toLowerCase().trim();
    return events.filter((e) => {
      if (e.venue.city !== city) return false;
      if (activeCategory && e.category !== activeCategory) return false;
      if (!e.sources.some((s) => activeSources.has(s.source))) return false;
      if (needle) {
        const blob = `${e.title} ${e.venue.name}`.toLowerCase();
        if (!blob.includes(needle)) return false;
      }
      return true;
    });
  }, [events, city, activeCategory, activeSources, search]);

  function toggleSource(s: Source) {
    setActiveSources((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }

  const activeFilterCount =
    (activeCategory ? 1 : 0) +
    (search.trim() ? 1 : 0) +
    (activeSources.size < SOURCES.length ? 1 : 0);

  return (
    <div className="app">
      <button
        className="filter-btn"
        onClick={() => setDrawerOpen(true)}
        aria-label="Filtreleri aç"
      >
        ☰
        {activeFilterCount > 0 && <span className="badge">{activeFilterCount}</span>}
      </button>
      <div
        className={`drawer-overlay ${drawerOpen ? "open" : ""}`}
        onClick={() => setDrawerOpen(false)}
      />
      <aside className={`sidebar ${drawerOpen ? "open" : ""}`}>
        <div className="sidebar-handle" onClick={() => setDrawerOpen(false)} />
        <button
          className="sidebar-close"
          onClick={() => setDrawerOpen(false)}
          aria-label="Kapat"
        >
          ×
        </button>
        <h1>Etkinlik Haritası</h1>
        <p className="subtitle">Biletix · Passo · Biletinial · Bubilet</p>

        <h2>Şehir</h2>
        <select
          value={city}
          onChange={(e) => {
            setCity(e.target.value as keyof typeof CITIES);
            setSelectedId(null);
          }}
        >
          {Object.keys(CITIES).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <h2>Ara</h2>
        <input
          type="text"
          placeholder="Sanatçı veya mekan ara…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <h2>Kategori</h2>
        <div className="chips">
          <button
            className={`chip ${activeCategory === null ? "active" : ""}`}
            onClick={() => setActiveCategory(null)}
          >
            Tümü
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              className={`chip ${activeCategory === c ? "active" : ""}`}
              onClick={() => setActiveCategory(c)}
            >
              <span style={{ marginRight: 4 }}>{CATEGORY_ICONS[c]}</span>
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>

        <h2>Platformlar</h2>
        <div className="source-toggles">
          {SOURCES.map((s) => {
            const active = activeSources.has(s);
            return (
              <button
                key={s}
                className={`source-toggle ${active ? "active" : "inactive"}`}
                onClick={() => toggleSource(s)}
              >
                <span className="source-dot" style={{ background: SOURCE_COLORS[s] }} />
                {SOURCE_LABELS[s]}
              </button>
            );
          })}
        </div>

        <div className="stats">
          {ingestedAt ? (
            <div>
              Son güncelleme: <strong>{relativeTime(ingestedAt)}</strong>
            </div>
          ) : (
            <div>Henüz veri yok.</div>
          )}
        </div>

        <h2>{filtered.length} etkinlik · {city}</h2>
        <div className="event-list">
          {loading ? (
            <div className="empty">Yükleniyor…</div>
          ) : filtered.length === 0 ? (
            <div className="empty">Bu filtrelerle sonuç yok.</div>
          ) : (
            filtered.map((e) => (
              <div
                key={e.id}
                className={`event-card ${selectedId === e.id ? "selected" : ""}`}
                onClick={() => {
                  setSelectedId(e.id);
                  setDrawerOpen(false);
                }}
              >
                <div className="title">{e.title}</div>
                <div className="meta">
                  {new Date(e.date).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  · {e.venue.name}
                  {e.priceMin ? ` · ${e.priceMin}₺+` : ""}
                </div>
                <div className="sources">
                  {e.sources.map((s) => (
                    <span
                      key={s.source}
                      className="source-pill"
                      style={{ background: SOURCE_COLORS[s.source] }}
                    >
                      {SOURCE_LABELS[s.source]}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      <div className="map-wrap">
        <EventMap
          events={filtered}
          center={{ lat: center.lat, lng: center.lng }}
          zoom={center.zoom}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>
    </div>
  );
}
