"use client";

import { useEffect, useRef, useState } from "react";
import { LocateFixed } from "lucide-react";
import "leaflet/dist/leaflet.css";

type LocationPickerProps = {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (
    latitude: number,
    longitude: number,
  ) => void;
};

export default function LocationPicker({
  latitude,
  longitude,
  onLocationChange,
}: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadMap() {
      if (!mapRef.current || mapInstanceRef.current) {
        return;
      }

      const L = await import("leaflet");

      if (cancelled || !mapRef.current) {
        return;
      }

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
            "&copy; OpenStreetMap contributors",
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
        setLocationError("");
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

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationError(
        "Location is not supported by this browser.",
      );
      return;
    }

    setLocating(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentLatitude =
          position.coords.latitude;

        const currentLongitude =
          position.coords.longitude;

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView(
            [currentLatitude, currentLongitude],
            17,
          );
        }

        if (markerRef.current) {
          markerRef.current.setLatLng([
            currentLatitude,
            currentLongitude,
          ]);
        }

        onLocationChange(
          currentLatitude,
          currentLongitude,
        );

        setLocating(false);
      },
      (error) => {
        console.error(
          "Getting current location failed:",
          error,
        );

        if (error.code === 1) {
          setLocationError(
            "Location permission was denied. Please allow location access in your browser.",
          );
        } else if (error.code === 2) {
          setLocationError(
            "Your current location could not be determined.",
          );
        } else {
          setLocationError(
            "Unable to get your current location. Please try again.",
          );
        }

        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line">
      {/* Use current location */}
      <div className="border-b border-line bg-white p-3">
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={locating}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand/30 bg-brand-soft px-4 py-3 text-sm font-semibold text-brand transition hover:border-brand hover:bg-brand/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LocateFixed
            size={18}
            className={
              locating
                ? "animate-pulse"
                : undefined
            }
          />

          {locating
            ? "Getting your location..."
            : "Use my current location"}
        </button>

        {locationError ? (
          <p className="mt-2 text-center text-xs text-red-600">
            {locationError}
          </p>
        ) : null}
      </div>

      {/* Map */}
      <div
        ref={mapRef}
        className="h-[300px] w-full"
      />

      {/* Map instructions */}
      <div className="border-t border-line bg-surface-2 px-4 py-3 text-sm text-muted">
        📍 Click on the map to select your exact
        delivery location.
      </div>
    </div>
  );
}