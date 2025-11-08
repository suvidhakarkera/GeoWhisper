'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Map, { Marker, Popup } from 'react-map-gl';
import { MapPin, Loader2, AlertCircle, X } from 'lucide-react';
import { postService, Tower, TowerPost } from '@/src/services/postService';
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

  // Format timestamp for display
  const formatTimestamp = (timestamp: { seconds: number; nanos: number }) => {
    const date = new Date(timestamp.seconds * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

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
            <div className="cursor-pointer transform transition-transform hover:scale-110">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 bg-cyan-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                  {tower.postCount}
                </div>
              </div>
            </div>
          </Marker>
        ))}

        {/* Selected Tower Popup */}
        {selectedTower && (
          <Popup
            longitude={selectedTower.longitude}
            latitude={selectedTower.latitude}
            anchor="bottom"
            onClose={() => setSelectedTower(null)}
            closeOnClick={false}
            maxWidth="400px"
          >
            <div className="max-h-96 overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-3 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">Tower {selectedTower.towerId}</h3>
                  <p className="text-sm text-gray-600">{selectedTower.postCount} posts</p>
                </div>
                <button
                  onClick={() => setSelectedTower(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-3 space-y-3">
                {selectedTower.posts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-cyan-400 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {post.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{post.username}</p>
                          <p className="text-xs text-gray-500">{formatTimestamp(post.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 text-sm mb-2">{post.content}</p>
                    
                    {post.images && post.images.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        {post.images.map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`Post image ${idx + 1}`}
                            className="w-full h-24 object-cover rounded"
                          />
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        ❤️ {post.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        💬 {post.commentCount}
                      </span>
                      {post.imageCount > 0 && (
                        <span className="flex items-center gap-1">
                          📷 {post.imageCount}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Popup>
        )}

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
        <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-lg border border-cyan-500/20 rounded-lg p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold">Your Location</span>
          </div>
          <div className="text-xs text-gray-400 space-y-1">
            <div>Lat: {userLocation.latitude.toFixed(6)}</div>
            <div>Lng: {userLocation.longitude.toFixed(6)}</div>
            <div>Accuracy: ±{Math.round(userLocation.accuracy)}m</div>
            {towers.length > 0 && (
              <div className="pt-2 border-t border-gray-700 mt-2">
                <div className="text-cyan-400 font-semibold">{towers.length} towers found</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
