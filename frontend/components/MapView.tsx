'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Map, { Marker, Layer, Source } from 'react-map-gl';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import * as turf from '@turf/turf';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapViewProps {
  onLocationUpdate?: (location: { latitude: number; longitude: number }) => void;
  onPostClick?: (postId: string) => void;
  onChatAccessChange?: (hasAccess: boolean) => void;
}

interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export default function MapView({ onLocationUpdate, onPostClick, onChatAccessChange }: MapViewProps) {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const mapRef = useRef<any>(null);
  // static grid: we won't update hex grid on map pan/zoom so it stays fixed

  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
  const RADIUS_METERS = 500;
  const CELL_SIDE_KM = 0.5; // hex cell size (0.5 km = 500 m)
  const TOWER_RANGE_METERS = 500; // tower radar range (meters)

  // Create a circle around user location (500m radius)
  const createRadiusCircle = useCallback((center: [number, number]) => {
    const circle = turf.circle(center, RADIUS_METERS / 1000, { steps: 64, units: 'kilometers' });
    return circle;
  }, []);

  // Handle geolocation success
  const handleLocationSuccess = useCallback((position: GeolocationPosition) => {
    const { latitude, longitude, accuracy } = position.coords;
    const newLocation = { latitude, longitude, accuracy };
    
    setUserLocation(newLocation);
    setLoading(false);
    setError(null);
    setPermissionStatus('granted');
    
    if (onLocationUpdate) {
      onLocationUpdate(newLocation);
    }

    // Fly to user location
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [longitude, latitude],
        zoom: 15,
        duration: 2000
      });
    }
  }, [onLocationUpdate]);

  // Handle geolocation error
  const handleLocationError = useCallback((error: GeolocationPositionError) => {
    setLoading(false);
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        setError('Location permission denied. Please enable location access in your browser settings.');
        setPermissionStatus('denied');
        break;
      case error.POSITION_UNAVAILABLE:
        setError('Location information unavailable. Please check your device settings.');
        break;
      case error.TIMEOUT:
        setError('Location request timed out. Please try again.');
        break;
      default:
        setError('An error occurred while getting your location.');
    }
  }, []);

  // Request user location
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      handleLocationSuccess,
      handleLocationError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, [handleLocationSuccess, handleLocationError]);

  // Watch user location for real-time updates
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      handleLocationSuccess,
      handleLocationError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [handleLocationSuccess, handleLocationError]);

  // Check permission status on mount
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setPermissionStatus(result.state as 'prompt' | 'granted' | 'denied');
        
        result.addEventListener('change', () => {
          setPermissionStatus(result.state as 'prompt' | 'granted' | 'denied');
        });
      }).catch(() => {
        // Permission API not supported, proceed with geolocation
        requestLocation();
      });
    }
  }, [requestLocation]);

  // Compute derived geo data BEFORE any early returns so hooks order is stable

  // Generate a static, globally-snapped hex grid once and persist it so it doesn't shift.
  // We'll compute the grid once when a userLocation becomes available and keep it in state.
  const GRID_COVER_KM = 10; // reduced coverage for faster rendering
  const [staticHexData, setStaticHexData] = useState<any | null>(null);

  useEffect(() => {
    if (!userLocation || staticHexData) return;

    try {
      // Create a buffered bbox around the user to cover GRID_COVER_KM
      const center = [userLocation.longitude, userLocation.latitude] as [number, number];
      const buffered = turf.buffer(turf.point(center as any), GRID_COVER_KM, { units: 'kilometers' });
      const rawBbox = turf.bbox(buffered as any) as [number, number, number, number];

      // Snap bbox to global anchor based on cell side approximated in degrees.
      // Approximate 1 degree ≈ 111.32 km
      const degPerKm = 1 / 111.32;
      const snapDeg = CELL_SIDE_KM * degPerKm; // degrees that roughly correspond to CELL_SIDE_KM

      const minLon = Math.floor(rawBbox[0] / snapDeg) * snapDeg;
      const minLat = Math.floor(rawBbox[1] / snapDeg) * snapDeg;
      const widthDeg = rawBbox[2] - rawBbox[0];
      const heightDeg = rawBbox[3] - rawBbox[1];
      const nx = Math.ceil(widthDeg / snapDeg);
      const ny = Math.ceil(heightDeg / snapDeg);

      const maxLon = minLon + nx * snapDeg;
      const maxLat = minLat + ny * snapDeg;
      const snappedBbox: [number, number, number, number] = [minLon, minLat, maxLon, maxLat];

      const hex = turf.hexGrid(snappedBbox as any, CELL_SIDE_KM, { units: 'kilometers' }) as any;
      const hexes = hex.features || [];

      const hexFeatureCollection = turf.featureCollection(hexes as any);
      const centroids = (hexes as any).map((h: any) => turf.centroid(h));

      setStaticHexData({ hexFeatureCollection, centroids });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to create static hex grid', e);
    }
  }, [userLocation, staticHexData]);

  const hexData = staticHexData;

  // Determine the nearest tower centroid to the user and whether it's within tower range.
  const { hasChatAccess, nearestTowerIndex } = useMemo(() => {
    if (!hexData || !userLocation) return { hasChatAccess: false, nearestTowerIndex: null };

    const userPt = [userLocation.longitude, userLocation.latitude] as any;
    let minDist = Infinity;
    let minIdx: number | null = null;

    (hexData.centroids || []).forEach((c: any, i: number) => {
      const centroidPos = c.geometry.coordinates as any;
      const distMeters = turf.distance(userPt, centroidPos, { units: 'kilometers' }) * 1000;
      if (distMeters < minDist) {
        minDist = distMeters;
        minIdx = i;
      }
    });

    const has = minDist <= TOWER_RANGE_METERS;
    return { hasChatAccess: has, nearestTowerIndex: minIdx };
  }, [hexData, userLocation]);

  // Notify parent about chat access changes (optional callback)
  useEffect(() => {
    if (typeof onChatAccessChange === 'function') {
      onChatAccessChange(hasChatAccess);
    }
  }, [hasChatAccess, onChatAccessChange]);

  // Render loading state
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Getting your location...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 p-6">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Location Access Required</h3>
          <p className="text-gray-400 mb-6">{error}</p>
          {permissionStatus === 'denied' ? (
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4 text-sm text-gray-300">
              <p className="font-semibold mb-2">To enable location:</p>
              <ol className="text-left space-y-1 ml-4 list-decimal">
                <li>Click the location icon in your browser's address bar</li>
                <li>Select "Always allow" for location access</li>
                <li>Refresh the page</li>
              </ol>
            </div>
          ) : (
            <button
              onClick={requestLocation}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  // Render map
  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 p-6">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Mapbox Token Missing</h3>
          <p className="text-gray-400">
            Please add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to your .env.local file
          </p>
        </div>
      </div>
    );
  }


  return (
    <div className="w-full h-full relative">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: userLocation?.longitude || 0,
          latitude: userLocation?.latitude || 0,
          zoom: 15
        }}
        
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        {/* removed: 500m radius circle (user requested it gone) */}

        {/* Hex grid (lines hidden for performance) */}
        {hexData && (
          <Source id="hexgrid" type="geojson" data={hexData.hexFeatureCollection}>
            <Layer
              id="hex-outline"
              type="line"
              layout={{ 'line-join': 'round', 'line-cap': 'round' }}
              paint={{
                'line-color': '#94a3b8',
                'line-width': 1,
                'line-opacity': 0
              }}
            />
          </Source>
        )}
        {userLocation && hexData?.centroids?.map((c: any, idx: number) => {
          const [lon, lat] = c.geometry.coordinates as [number, number];
          const active = idx === nearestTowerIndex;

          const containerClass = `w-8 h-8 rounded-full flex items-center justify-center shadow-md ${active ? 'ring-2 ring-green-400 border-green-400' : 'opacity-70 border-white'} border-2 bg-transparent`;

          return (
            <Marker key={`tower-${idx}`} longitude={lon} latitude={lat} anchor="center">
              <div className={containerClass}>
                {/* Use project logo if available; fall back to MapPin icon */}
                <img src="/logo.svg" alt="tower" className={`w-6 h-6 ${active ? '' : 'filter grayscale'}`} />
              </div>
            </Marker>
          );
        })}

        {/* User Location Marker */}
        {userLocation && (
          <Marker
            longitude={userLocation.longitude}
            latitude={userLocation.latitude}
            anchor="center"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-400 rounded-full w-6 h-6 animate-ping opacity-75"></div>
              <div className="relative bg-cyan-500 rounded-full w-6 h-6 border-4 border-white shadow-lg"></div>
            </div>
          </Marker>
        )}
      </Map>

      {hasChatAccess && (
        <div className="absolute bottom-4 right-4 bg-green-600 text-white rounded-lg px-3 py-2 flex items-center gap-2 shadow-lg">
          <div className="w-2 h-2 bg-white rounded-full" />
          <div className="text-sm font-semibold">Chat Enabled</div>
        </div>
      )}

      {/* Location Info Card */}
      {userLocation && (
        <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-lg border border-cyan-500/20 rounded-lg p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold">Your Location</span>
          </div>
          <div className="text-xs text-gray-400 space-y-1">
            <div>Lat: {userLocation.latitude.toFixed(6)}</div>
            <div>Lng: {userLocation.longitude.toFixed(6)}</div>
            <div>{RADIUS_METERS}m radius zone</div>
            <div>Accuracy: ±{Math.round(userLocation.accuracy)}m</div>
          </div>
        </div>
      )}

      </div>
  );
}
