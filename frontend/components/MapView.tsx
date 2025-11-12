'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Map, { Marker, Popup } from 'react-map-gl';
import { MapPin, Loader2, AlertCircle, X } from 'lucide-react';
import { postService, Tower } from '@/src/services/postService';
import { TowerIcon } from './TowerIcon';
import { motion, AnimatePresence } from 'framer-motion';
import TowerChat from './TowerChat';
import { useUser } from '@/contexts/UserContext';
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
  const { user, isAuthenticated } = useUser();
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [towers, setTowers] = useState<Tower[]>([]);
  const [selectedTower, setSelectedTower] = useState<Tower | null>(null);
  const [towersLoading, setTowersLoading] = useState(false);
  const mapRef = useRef<any>(null);

  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

  // Fetch towers on component mount
  useEffect(() => {
    const fetchTowers = async () => {
      setTowersLoading(true);
      try {
        const response = await postService.getTowers();
        if (response.success && response.data) {
          setTowers(response.data);
        }
      } catch (error) {
        console.error('Error fetching towers:', error);
      } finally {
        setTowersLoading(false);
      }
    };

    fetchTowers();
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
        onClick={() => setSelectedTower(null)}
      >
        {/* Tower Markers */}
        {towers.map((tower) => (
          <Marker
            key={tower.towerId}
            longitude={tower.longitude}
            latitude={tower.latitude}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedTower(tower);
            }}
          >
            <div className="cursor-pointer transform transition-all hover:scale-110">
              <TowerIcon className="w-10 h-10 text-slate-300 drop-shadow-2xl" size={40} />
            </div>
          </Marker>
        ))}

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

      {/* Loading Indicator */}
      {towersLoading && (
        <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-lg border border-cyan-500/20 rounded-lg p-3 text-white flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading towers...</span>
        </div>
      )}

      {/* Location Info Card */}
      {userLocation && (
        <div className="absolute top-2 left-2 md:top-4 md:left-4 bg-black/80 backdrop-blur-lg border border-cyan-500/20 rounded-lg p-1.5 md:p-4 text-white max-w-[130px] md:max-w-none">
          <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2">
            <MapPin className="w-2.5 h-2.5 md:w-4 md:h-4 text-cyan-400" />
            <span className="font-semibold text-[10px] md:text-sm">Your Location</span>
          </div>
          <div className="text-[8px] md:text-xs text-gray-400 space-y-0.5 md:space-y-1">
            <div>Lat: {userLocation.latitude.toFixed(4)}</div>
            <div>Lng: {userLocation.longitude.toFixed(4)}</div>
            <div>Accuracy: ±{Math.round(userLocation.accuracy)}m</div>
            {towers.length > 0 && (
              <div className="pt-1 md:pt-2 border-t border-gray-700 mt-1 md:mt-2">
                <div className="text-cyan-400 font-semibold">{towers.length} towers</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tower Side Panel - Slides in from right */}
      <AnimatePresence>
        {selectedTower && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
            className="fixed top-[72px] md:top-0 right-0 bottom-0 w-full md:w-[400px] bg-gray-900 border-l border-gray-800 shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-gray-900 text-white p-3 md:p-4 flex items-center justify-between border-b border-gray-800 flex-shrink-0">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg md:text-xl truncate">Tower {selectedTower.towerId}</h3>
                <p className="text-sm text-gray-400">Real-time chat</p>
              </div>
              <button
                onClick={() => setSelectedTower(null)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0 ml-2"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            {/* Chat Content */}
            <div className="flex-1 overflow-hidden">
              {isAuthenticated && user ? (
                <TowerChat
                  towerId={selectedTower.towerId}
                  currentUserId={user.firebaseUid}
                  currentUsername={user.username}
                  isModerator={false}
                  postCount={selectedTower.postCount || 0}
                />
              ) : (
                <div className="h-full flex items-center justify-center p-8">
                  <div className="text-center max-w-sm">
                    <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MapPin className="w-8 h-8 text-cyan-400" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Sign in to Chat</h3>
                    <p className="text-gray-400 text-sm">
                      You need to be signed in to send messages and chat with others in this tower.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
