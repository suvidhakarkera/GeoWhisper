'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useRouter } from 'next/navigation';

const markerIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMzQiIHZpZXdCb3g9IjAgMCAyNCAzNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMzRDMTIgMzQgMjQgMjQgMjQgMTZDMTYgMCA4IDAgOCAxNkM4IDI0IDEyIDM0IDEyIDM0WiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==',
  iconSize: [24, 34],
  iconAnchor: [12, 34],
});

function CenterUpdater({ center }: { center?: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 15);
    }
  }, [center, map]);
  return null;
}

interface MiniMapProps {
  center?: { lat: number; lng: number } | null;
  className?: string;
}

export default function MiniMap({ center, className }: MiniMapProps) {
  const router = useRouter();
  const mapRef = useRef<any>(null);

  const clickHandler = () => {
    router.push('/maps');
  };

  const centerCoords: [number, number] | undefined = center ? [center.lat, center.lng] : undefined;

  return (
    <div className={`${className || ''} rounded-lg overflow-hidden border border-gray-800 cursor-pointer`} onClick={clickHandler}>
      <MapContainer
        {...({
          center: centerCoords || [0, 0],
          zoom: center ? 15 : 2,
          style: { height: 160, width: '100%' },
          whenCreated: (mapInstance: any) => { mapRef.current = mapInstance; },
          attributionControl: false,
          zoomControl: false,
          dragging: !!center,
          doubleClickZoom: false,
          scrollWheelZoom: false,
        } as any)}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {centerCoords && (
          <>
            <CenterUpdater center={centerCoords} />
            <Marker {...({ position: centerCoords, icon: markerIcon } as any)} />
          </>
        )}
      </MapContainer>
    </div>
  );
}
