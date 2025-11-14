'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useState, useEffect, useCallback } from 'react';
import { Post } from '@/services/postService';
import { MapPin } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom marker icons using SVG
const userIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAzMiA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTYgNDhDMTYgNDggMzIgMjggMzIgMTZDMzIgNy4xNjM0NCAyNC44MzY2IDAgMTYgMEM3LjE2MzQ0IDAgMCA3LjE2MzQ0IDAgMTZDMCAyOCAxNiA0OCAxNiA0OFoiIGZpbGw9IiMzQjgyRjYiLz48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSI4IiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==',
  iconSize: [32, 48],
  iconAnchor: [16, 48],
  popupAnchor: [0, -48]
});

const postIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAzMiA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTYgNDhDMTYgNDggMzIgMjggMzIgMTZDMzIgNy4xNjM0NCAyNC44MzY2IDAgMTYgMEM3LjE2MzQ0IDAgMCA3LjE2MzQ0IDAgMTZDMCAyOCAxNiA0OCAxNiA0OFoiIGZpbGw9IiNFRjQ0NDQiLz48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSI4IiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==',
  iconSize: [32, 48],
  iconAnchor: [16, 48],
  popupAnchor: [0, -48]
});

const defaultCenter: [number, number] = [40.7128, -74.006];

interface PostsMapProps {
  posts: Post[];
  onMarkerClick?: (post: Post) => void;
  center?: { lat: number; lng: number };
}

// Component to handle map center updates
function MapCenterUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);

  return null;
}

export default function PostsMap({ posts, onMarkerClick, center }: PostsMapProps) {
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    center ? [center.lat, center.lng] : defaultCenter
  );

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: [number, number] = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          setCurrentLocation(location);
          if (!center) {
            setMapCenter(location);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, [center]);

  useEffect(() => {
    if (center) {
      setMapCenter([center.lat, center.lng]);
    }
  }, [center]);

  const handleMarkerClick = useCallback((post: Post) => {
    if (onMarkerClick) {
      onMarkerClick(post);
    }
  }, [onMarkerClick]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="w-full h-[600px] rounded-xl overflow-hidden border border-gray-700 shadow-xl">
      <MapContainer
        {...({
          center: mapCenter,
          zoom: 14,
          className: 'w-full h-full',
          zoomControl: true,
        } as any)}
      >
        {/* OpenStreetMap Tiles */}
        <TileLayer {...({ attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" } as any)} />

        {/* Update map center when it changes */}
        <MapCenterUpdater center={mapCenter} />

        {/* User location marker - Blue */}
        {currentLocation && (
          <Marker {...({ position: currentLocation, icon: userIcon } as any)}>
            <Popup>
              <div className="text-sm">
                <strong>Your Location</strong>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Post markers - Red */}
        {posts.map((post) => (
          <Marker
            key={post.id}
            {...({ position: [post.latitude, post.longitude], icon: postIcon, eventHandlers: { click: () => handleMarkerClick(post) } } as any)}
          >
            <Popup {...({ maxWidth: 300 } as any)}>
              <div className="p-2">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900 text-sm">{post.username}</h3>
                </div>
                <p className="text-gray-700 text-sm mb-2">{post.content}</p>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>{formatTime(post.createdAt)}</span>
                  {post.distance !== undefined && (
                    <span>
                      {post.distance < 1000
                        ? `${Math.round(post.distance)}m away`
                        : `${(post.distance / 1000).toFixed(1)}km away`}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex space-x-3 text-xs text-gray-600">
                  <span>❤️ {post.likes || 0}</span>
                  <span>💬 {post.commentCount || 0}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
