'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import ReactMapGL, { Marker, NavigationControl, GeolocateControl, Popup } from 'react-map-gl';
import { Post } from '@/src/services/postService';
import { MapPin, Navigation, AlertCircle } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapViewProps {
  posts?: Post[];
  onMarkerClick?: (post: Post) => void;
  userLocation?: { latitude: number; longitude: number } | null;
  onLocationUpdate?: (location: { latitude: number; longitude: number }) => void;
  refreshTrigger?: number;
}

interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
}

export default function MapView({ 
  posts: initialPosts = [], 
  onMarkerClick, 
  userLocation,
  onLocationUpdate,
  refreshTrigger = 0
}: MapViewProps) {
  const mapRef = useRef<any>(null);
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [viewState, setViewState] = useState<ViewState>({
    longitude: userLocation?.longitude || -74.006,
    latitude: userLocation?.latitude || 40.7128,
    zoom: 14
  });
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Fetch nearby posts when location updates or refresh is triggered
  useEffect(() => {
    const fetchPosts = async () => {
      const currentLocation = userLocation || { 
        latitude: viewState.latitude, 
        longitude: viewState.longitude 
      };
      
      setIsLoadingPosts(true);
      try {
        const { getNearbyPosts } = await import('@/src/services/postService');
        const fetchedPosts = await getNearbyPosts(
          currentLocation.latitude,
          currentLocation.longitude,
          50 // 50km radius
        );
        setPosts(fetchedPosts);
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      } finally {
        setIsLoadingPosts(false);
      }
    };

    fetchPosts();
  }, [refreshTrigger, userLocation, viewState.latitude, viewState.longitude]);

  // Update view when user location changes
  useEffect(() => {
    if (userLocation && isMapLoaded) {
      setViewState(prev => ({
        ...prev,
        longitude: userLocation.longitude,
        latitude: userLocation.latitude
      }));
    }
  }, [userLocation, isMapLoaded]);

  const handleMarkerClick = useCallback((post: Post) => {
    setSelectedPost(post);
    if (onMarkerClick) {
      onMarkerClick(post);
    }
  }, [onMarkerClick]);

  const handleGeolocateSuccess = useCallback((e: any) => {
    const { longitude, latitude } = e.coords;
    if (onLocationUpdate) {
      onLocationUpdate({ latitude, longitude });
    }
  }, [onLocationUpdate]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatDistance = (meters: number | undefined) => {
    if (!meters && meters !== 0) return '';
    if (meters < 1000) {
      return `${Math.round(meters)}m away`;
    }
    return `${(meters / 1000).toFixed(1)}km away`;
  };

  // Mapbox token - can be public
  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 
    'pk.eyJ1IjoiZ2Vvd2hpc3BlciIsImEiOiJjbTN0ZXN0In0.placeholder';

  if (mapError) {
    return (
      <div className="w-full h-[600px] bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl flex items-center justify-center border border-gray-700">
        <div className="text-center p-8">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Map Error</h3>
          <p className="text-gray-400 max-w-md">{mapError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] rounded-xl overflow-hidden border border-gray-700 shadow-xl relative">
      <ReactMapGL
        ref={mapRef}
        {...viewState}
        onMove={(evt: any) => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        onLoad={() => setIsMapLoaded(true)}
        onError={(e: any) => {
          console.error('Map error:', e);
          setMapError('Failed to load map. Please check your internet connection.');
        }}
        attributionControl={true}
        dragRotate={false}
        touchZoomRotate={false}
      >
        {/* Navigation Controls */}
        <NavigationControl position="top-right" />

        {/* Geolocate Control */}
        <GeolocateControl
          position="top-right"
          trackUserLocation
          onGeolocate={handleGeolocateSuccess}
          showUserHeading={true}
          showAccuracyCircle={true}
        />

        {/* User Location Marker */}
        {userLocation && (
          <Marker
            longitude={userLocation.longitude}
            latitude={userLocation.latitude}
            anchor="bottom"
          >
            <div className="relative">
              {/* Pulse animation */}
              <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75" />
              {/* Main marker */}
              <div className="relative w-10 h-10 bg-blue-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                <Navigation className="w-5 h-5 text-white" />
              </div>
            </div>
          </Marker>
        )}

        {/* Post Markers */}
        {posts.map((post) => (
          <Marker
            key={post.id}
            longitude={post.longitude}
            latitude={post.latitude}
            anchor="bottom"
            onClick={(e: any) => {
              e.originalEvent.stopPropagation();
              handleMarkerClick(post);
            }}
          >
            <div className="cursor-pointer transform hover:scale-110 transition-transform">
              {/* Marker shadow */}
              <div className="absolute inset-0 bg-black/20 rounded-full blur-md translate-y-1" />
              {/* Main marker */}
              <div className="relative w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center hover:shadow-xl">
                <MapPin className="w-5 h-5 text-white" />
              </div>
            </div>
          </Marker>
        ))}

        {/* Popup for selected post */}
        {selectedPost && (
          <Popup
            longitude={selectedPost.longitude}
            latitude={selectedPost.latitude}
            anchor="bottom"
            onClose={() => setSelectedPost(null)}
            closeButton={true}
            closeOnClick={false}
            offset={20}
            className="custom-popup"
          >
            <div className="p-3 min-w-[250px]">
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {selectedPost.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">
                      {selectedPost.username}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {formatTime(selectedPost.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                {selectedPost.content}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex space-x-3 text-gray-600">
                  <span className="flex items-center space-x-1">
                    <span>❤️</span>
                    <span>{selectedPost.likes || 0}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span>💬</span>
                    <span>{selectedPost.commentCount || 0}</span>
                  </span>
                </div>
                {selectedPost.distance !== undefined && (
                  <span className="text-cyan-600 font-medium">
                    {formatDistance(selectedPost.distance)}
                  </span>
                )}
              </div>
            </div>
          </Popup>
        )}
      </ReactMapGL>

      {/* Map Attribution Overlay */}
      <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm px-2 py-1 rounded text-xs text-white">
        Powered by Mapbox
      </div>
    </div>
  );
}
