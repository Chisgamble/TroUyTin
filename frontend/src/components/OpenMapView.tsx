import { useEffect, useRef } from "react";
import maplibregl from "@openmapvn/openmapvn-gl";
import "@openmapvn/openmapvn-gl/dist/maplibre-gl.css";
import type { RoomListing } from "../types";

type MapMarker = {
  id: number | string;
  latitude: number;
  longitude: number;
  title: string;
};

type OpenMapViewProps = {
  rooms: RoomListing[];
  selectedId?: number | string | null;
  onSelectRoom?: (id: number | string) => void;
};

const HCMC_CENTER: [number, number] = [106.7009, 10.7769];

function toMarkers(rooms: RoomListing[]): MapMarker[] {
  return rooms
    .filter((r) => r.latitude && r.longitude)
    .map((r) => ({
      id: r.id,
      latitude: r.latitude,
      longitude: r.longitude,
      title: r.title,
    }));
}

export default function OpenMapView({
  rooms,
  selectedId,
  onSelectRoom,
}: OpenMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = new maplibregl.Map({
      container: containerRef.current,
      style: "https://tiles.openmap.vn/styles/day-v1/style.json",
      center: HCMC_CENTER,
      zoom: 12,
    });

    mapRef.current.addControl(new maplibregl.NavigationControl(), "top-right");

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const markers = toMarkers(rooms);

    markers.forEach((room) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = `openmap-marker${selectedId === room.id ? " openmap-marker--active" : ""}`;
      el.title = room.title;
      el.setAttribute("aria-label", room.title);

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectRoom?.(room.id);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([room.longitude, room.latitude])
        .addTo(map);

      markersRef.current.push(marker);
    });

    if (markers.length === 1) {
      map.flyTo({
        center: [markers[0].longitude, markers[0].latitude],
        zoom: 14,
      });
    } else if (markers.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      markers.forEach((m) => bounds.extend([m.longitude, m.latitude]));
      map.fitBounds(bounds, { padding: 60, maxZoom: 15 });
    }
  }, [rooms, selectedId, onSelectRoom]);

  useEffect(() => {
    if (selectedId == null || !mapRef.current) return;
    const room = rooms.find((r) => r.id === selectedId);
    if (room?.latitude && room?.longitude) {
      mapRef.current.flyTo({
        center: [room.longitude, room.latitude],
        zoom: 15,
      });
    }
  }, [selectedId, rooms]);

  return <div ref={containerRef} className="openmap-container" />;
}
