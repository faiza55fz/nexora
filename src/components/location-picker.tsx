"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
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
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) {
      return;
    }

    const defaultCenter: [number, number] = [
      latitude ?? 13.9299,
      longitude ?? 75.5681,
    ];

    const map = L.map(mapRef.current).setView(
      defaultCenter,
      latitude !== null && longitude !== null ? 16 : 13,
    );

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      },
    ).addTo(map);

    mapInstanceRef.current = map;

    const setMarker = (lat: number, lng: number) => {
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.circleMarker(
          [lat, lng],
          {
            radius: 9,
            weight: 3,
            fillOpacity: 1,
          },
        ).addTo(map);
      }

      onLocationChange(lat, lng);
    };

    if (latitude !== null && longitude !== null) {
      setMarker(latitude, longitude);
    }

    map.on("click", (event) => {
      setMarker(event.latlng.lat, event.latlng.lng);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        const map = mapInstanceRef.current;

        if (!map) {
          return;
        }

        map.setView([lat, lng], 17);

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.circleMarker(
            [lat, lng],
            {
              radius: 9,
              weight: 3,
              fillOpacity: 1,
            },
          ).addTo(map);
        }

        onLocationChange(lat, lng);
      },
      () => {
        alert(
          "Unable to access your location. Please select your location manually on the map.",
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  };

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-line">
      <div
        ref={mapRef}
        className="h-[320px] w-full"
      />

      <div className="flex flex-col gap-3 bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">
            Choose your exact delivery location
          </p>

          <p className="mt-1 text-xs text-muted">
            Click anywhere on the map to place the delivery pin.
          </p>

          {latitude !== null && longitude !== null ? (
            <p className="mt-1 text-[11px] text-muted">
              Location selected
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={useCurrentLocation}
          className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold"
        >
          Use my current location
        </button>
      </div>
    </div>
  );
}