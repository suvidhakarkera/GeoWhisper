'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Map, { Marker, Popup } from 'react-map-gl';
import { MapPin, Loader2, AlertCircle, X, Send, Camera, Image as ImageIcon, Reply } from 'lucide-react';
import { postService, Tower, TowerPost } from '@/src/services/postService';
import { TowerIcon } from './TowerIcon';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [messageText, setMessageText] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [replyingTo, setReplyingTo] = useState<TowerPost | null>(null);
  const mapRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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

  // Handle image selection from gallery
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedImages(prev => [...prev, ...files].slice(0, 4)); // Max 4 images
  };

  // Handle camera capture
  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  // Handle gallery click
  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  // Remove selected image
  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Handle send message
  const handleSendMessage = async () => {
    if (!messageText.trim() && selectedImages.length === 0) return;
    
    // TODO: Implement actual post creation with reply support
    console.log('Sending message:', messageText, 'Images:', selectedImages);
    if (replyingTo) {
      console.log('Reply to:', replyingTo.id, 'by', replyingTo.username);
    }
    
    // Clear inputs
    setMessageText('');
    setSelectedImages([]);
    setReplyingTo(null);
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
            className="fixed top-[72px] md:top-0 right-0 bottom-0 w-full md:w-[400px] bg-gray-900 border-l border-gray-800 shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gray-900 text-white p-3 md:p-6 flex items-center justify-between border-b border-gray-800">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg md:text-2xl truncate">Tower {selectedTower.towerId}</h3>
                <p className="text-sm md:text-base text-gray-400">{selectedTower.postCount} posts</p>
              </div>
              <button
                onClick={() => setSelectedTower(null)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0 ml-2"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            {/* Posts content - scrollable */}
            <div className="h-[calc(100%-60px-80px)] md:h-[calc(100%-96px-90px)] overflow-y-auto p-3 md:p-6 space-y-3 md:space-y-3.5 scrollbar-hide">
              {selectedTower.posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-gray-800 rounded-xl p-3 md:p-3.5 border border-gray-700 hover:border-cyan-500 transition-all relative"
                >
                  {/* Comment icon at top right */}
                  <div className="absolute top-3 md:top-3.5 right-3 md:right-3.5">
                    <span className="flex items-center gap-1 md:gap-1.5 hover:text-cyan-400 transition-colors cursor-pointer text-gray-400">
                      <span className="text-base md:text-lg">💬</span>
                      <span className="font-medium text-xs md:text-sm">{post.commentCount}</span>
                    </span>
                  </div>

                  <div className="flex items-start justify-between mb-2 md:mb-2.5 pr-12 md:pr-14">
                    <div className="flex items-center gap-2 md:gap-2.5 min-w-0">
                      <div className="w-8 h-8 md:w-9 md:h-9 bg-cyan-500 rounded-full flex items-center justify-center text-white text-xs md:text-sm font-bold flex-shrink-0">
                        {post.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-white text-sm md:text-sm truncate">{post.username}</p>
                        <p className="text-[10px] md:text-xs text-gray-500">{formatTimestamp(post.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-300 text-sm md:text-sm mb-2 md:mb-2.5 leading-relaxed break-words">{post.content}</p>
                  
                  {post.images && post.images.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-2 md:mb-2.5">
                      {post.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Post image ${idx + 1}`}
                          className="w-full h-24 md:h-28 object-cover rounded-lg border border-gray-700"
                        />
                      ))}
                    </div>
                  )}
                  
                  {post.imageCount > 0 && (
                    <div className="flex items-center gap-1 md:gap-1.5 text-cyan-400 text-xs md:text-sm pt-2 md:pt-2.5 border-t border-gray-700">
                      <span className="text-base">📷</span>
                      <span className="font-medium">{post.imageCount}</span>
                    </div>
                  )}

                  {/* Reply Button */}
                  <div className="pt-2 md:pt-2.5 border-t border-gray-700 mt-2 md:mt-2.5">
                    <button
                      onClick={() => setReplyingTo(post)}
                      className="flex items-center gap-1.5 text-gray-400 hover:text-cyan-400 transition-colors text-xs md:text-sm"
                    >
                      <Reply className="w-4 h-4" />
                      <span>Reply</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area - Fixed at bottom */}
            <div className="absolute bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800">
              {/* Reply Banner */}
              {replyingTo && (
                <div className="p-2 md:p-3 border-b border-gray-800 bg-gray-800/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Reply className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs md:text-sm text-gray-300">
                      Replying to <span className="text-cyan-400 font-semibold">@{replyingTo.username}</span>
                    </span>
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="p-1 hover:bg-gray-700 rounded transition-colors"
                    title="Cancel reply"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              )}

              {/* Image Preview */}
              {selectedImages.length > 0 && (
                <div className="p-2 md:p-3 border-b border-gray-800 flex gap-2 overflow-x-auto">
                  {selectedImages.map((img, idx) => (
                    <div key={idx} className="relative flex-shrink-0">
                      <img
                        src={URL.createObjectURL(img)}
                        alt={`Selected ${idx + 1}`}
                        className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg border border-gray-700"
                      />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute -top-1 -right-1 p-2 bg-black/80 hover:bg-black rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input Controls */}
              <div className="p-2 md:p-3 flex items-end gap-2">
                {/* Hidden file inputs */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageSelect}
                  className="hidden"
                />

                {/* Camera button */}
                <button
                  onClick={handleCameraClick}
                  className="flex-shrink-0 p-1.5 md:p-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400 rounded-lg transition-colors"
                  title="Take photo"
                >
                  <Camera className="w-4 h-4 md:w-5 md:h-5" />
                </button>

                {/* Gallery button */}
                <button
                  onClick={handleGalleryClick}
                  className="flex-shrink-0 p-1.5 md:p-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400 rounded-lg transition-colors"
                  title="Choose from gallery"
                >
                  <ImageIcon className="w-4 h-4 md:w-5 md:h-5" />
                </button>

                {/* Text input */}
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-2 md:px-4 py-2 md:py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm md:text-base text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                />

                {/* Send button */}
                <button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() && selectedImages.length === 0}
                  className="flex-shrink-0 p-1.5 md:p-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors"
                  title="Send"
                >
                  <Send className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
