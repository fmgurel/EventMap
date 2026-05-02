"use client";

import { useEffect, useRef } from "react";
import maplibregl, { Marker, Popup } from "maplibre-gl";
import { Event, SOURCE_COLORS, SOURCE_LABELS, CATEGORY_LABELS } from "@/lib/types";

type Props = {
  events: Event[];
  center: { lat: number; lng: number };
  zoom: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMoveEnd?: (bbox: [number, number, number, number]) => void;
};

const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

export default function EventMap({
  events,
  center,
  zoom,
  selectedId,
  onSelect,
  onMoveEnd,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, Marker> | null>(null);
  const popupRef = useRef<Popup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: [center.lng, center.lat],
      zoom,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;
    markersRef.current = new Map();

    map.on("moveend", () => {
      if (!onMoveEnd) return;
      const b = map.getBounds();
      onMoveEnd([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
      popupRef.current?.remove();
      popupRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({ center: [center.lng, center.lat], zoom });
  }, [center.lat, center.lng, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    const markers = markersRef.current;
    if (!map || !markers) return;

    const seen = new Set<string>();

    for (const event of events) {
      seen.add(event.id);
      if (markers.has(event.id)) continue;

      const el = document.createElement("div");
      const dominant = event.sources[0]?.source ?? "biletix";
      const color = SOURCE_COLORS[dominant];
      const count = event.sources.length;
      el.style.cssText = `
        width: ${count > 1 ? 28 : 22}px;
        height: ${count > 1 ? 28 : 22}px;
        background: ${color};
        border: 2px solid #fff;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
        color: #fff; font-size: 11px; font-weight: 700; cursor: pointer;
      `;
      if (count > 1) el.textContent = String(count);

      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        onSelect(event.id);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([event.venue.lng, event.venue.lat])
        .addTo(map);
      markers.set(event.id, marker);
    }

    for (const [id, marker] of markers) {
      if (!seen.has(id)) {
        marker.remove();
        markers.delete(id);
      }
    }
  }, [events, onSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    popupRef.current?.remove();
    popupRef.current = null;

    if (!selectedId) return;
    const event = events.find((e) => e.id === selectedId);
    if (!event) return;

    const sourcesHtml = event.sources
      .map((s) => {
        const range =
          s.priceMin && s.priceMax
            ? ` ${s.priceMin}-${s.priceMax}₺`
            : "";
        return `<a class="pop-source-link" href="${s.url}" target="_blank" rel="noopener noreferrer">
          <span style="display:flex;align-items:center;gap:6px;">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${SOURCE_COLORS[s.source]};"></span>
            ${SOURCE_LABELS[s.source]}
          </span>
          <span style="color:#475569;">${range} →</span>
        </a>`;
      })
      .join("");

    const date = new Date(event.date);
    const dateStr = date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const priceLine =
      event.priceMin && event.priceMax
        ? `<div class="pop-price">${event.priceMin}₺ — ${event.priceMax}₺</div>`
        : "";

    const html = `
      <div class="popup-card">
        <h3>${escapeHtml(event.title)}</h3>
        <div class="pop-meta">
          ${escapeHtml(CATEGORY_LABELS[event.category])} · ${escapeHtml(event.venue.name)}<br/>
          ${escapeHtml(dateStr)}
        </div>
        ${priceLine}
        <div class="pop-sources">${sourcesHtml}</div>
      </div>
    `;

    const popup = new maplibregl.Popup({
      offset: 18,
      closeButton: true,
      closeOnClick: false,
      maxWidth: "320px",
    })
      .setLngLat([event.venue.lng, event.venue.lat])
      .setHTML(html)
      .addTo(map);

    popup.on("close", () => onSelect(null));
    popupRef.current = popup;
  }, [selectedId, events, onSelect]);

  return <div ref={containerRef} className="map" />;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
