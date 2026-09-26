"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

type LocationPickerProps = {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (latitude: number, longitude: number) => void;
};

export default function LocationPicker({
  latitude,
  longitude,
  onLocationChange,
}: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadMap() {
      if (!mapRef.current || mapInstanceRef.current) {
        return;
      }

      // Leaflet is loaded only in the browser
      const L = await import("leaflet");

      if (cancelled || !mapRef.current) return;

      const defaultLat = latitude ?? 15.3647;
      const defaultLng = longitude ?? 75.1240;

      const map = L.map(mapRef.current).setView(
        [defaultLat, defaultLng],
        15,
      );

      mapInstanceRef.current = map;

      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            '&copy; OpenStreetMap contributors',
        },
      ).addTo(map);

      const marker = L.marker([
        defaultLat,
        defaultLng,
      ]).addTo(map);

      markerRef.current = marker;

      map.on("click", (event: any) => {
        const { lat, lng } = event.latlng;

        marker.setLatLng([lat, lng]);

        onLocationChange(lat, lng);
      });
    }

    loadMap();

    return () => {
      cancelled = true;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (
      !mapInstanceRef.current ||
      latitude === null ||
      longitude === null
    ) {
      return;
    }

    mapInstanceRef.current.setView(
      [latitude, longitude],
      15,
    );

    if (markerRef.current) {
      markerRef.current.setLatLng([
        latitude,
        longitude,
      ]);
    }
  }, [latitude, longitude]);

  return (
    <div className="overflow-hidden rounded-2xl border border-line">
      <div
        ref={mapRef}
        className="h-[300px] w-full"
      />

      <div className="border-t border-line bg-surface-2 px-4 py-3 text-sm text-muted">
        📍 Click on the map to select your exact delivery
        location.
      </div>
    </div>
  );
}