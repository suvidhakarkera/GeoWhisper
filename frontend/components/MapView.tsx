'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Map, { Marker, Popup, Layer, Source } from 'react-map-gl';
import { MapPin, Loader2, AlertCircle, X, Navigation } from 'lucide-react';
import { locationService } from '@/services/locationService';
import { TowerIcon } from './TowerIcon';
import { motion, AnimatePresence } from 'framer-motion';
import TowerChat from './TowerChat';
import { getTowerLabel } from '@/utils/towerNumber';
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
// Minimal Tower type used by this component (matches locationService.getAllTowers())
interface Tower {
  towerId: string;
  latitude: number;
  longitude: number;
  postCount: number;
  // older towers may include posts, but MapView only needs the above
  posts?: any[];
  engagementScore?: number; // For hot zones calculation (based on postCount)
  hotZoneRank?: number; // 1-5 for top 5, 0 for others
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
  const [hotZones, setHotZones] = useState<string[]>([]); // Top 5 hot zone tower IDs
  const mapRef = useRef<any>(null);
  const [userInteracted, setUserInteracted] = useState(false);

  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

  // Helper function to calculate distance between two points in meters
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  // Determine if selected tower is the user's current tower (within 500m)
  const isCurrentTower = useMemo(() => {
    if (!selectedTower || !userLocation) return false;
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      selectedTower.latitude,
      selectedTower.longitude
    );
    return distance <= 500;
  }, [selectedTower, userLocation]);

  // Fetch towers on component mount
  useEffect(() => {
    const fetchTowers = async () => {
      setTowersLoading(true);
      try {
        const data = await locationService.getAllTowers();
        if (Array.isArray(data)) {
          setTowers(data);
        }
      } catch (error) {
        console.error('Error fetching towers:', error);
      } finally {
        setTowersLoading(false);
      }
    };

    fetchTowers();
  }, []);

  // Calculate engagement and identify hot zones
  useEffect(() => {
    const calculateHotZones = async () => {
      if (towers.length === 0 || !userLocation) return;

      // Filter towers within 5km of user location
      const towersWithinRange = towers.map((tower) => {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          tower.latitude,
          tower.longitude
        );
        
        return {
          ...tower,
          distanceFromUser: distance,
        };
      }).filter(tower => tower.distanceFromUser <= 5000); // 5km = 5000 meters

      // Calculate engagement score based on postCount only
      // In future, can add chat message count when permissions are configured
      const towersWithEngagement = towersWithinRange.map((tower) => {
        // Use postCount as the primary engagement metric
        const engagementScore = tower.postCount;

        return {
          ...tower,
          engagementScore,
        };
      });

      // Sort by engagement score (descending) and get top 5 from within range
      const sortedTowers = [...towersWithEngagement].sort(
        (a, b) => (b.engagementScore || 0) - (a.engagementScore || 0)
      );

      const top5 = sortedTowers.slice(0, 5);
      const hotZoneIds = top5.map(t => t.towerId);

      // Assign ranking to ALL towers (only those within range will have rank > 0)
      const rankedTowers = towers.map(tower => {
        const rank = hotZoneIds.indexOf(tower.towerId);
        return {
          ...tower,
          hotZoneRank: rank >= 0 ? rank + 1 : 0,
        };
      });

      setTowers(rankedTowers);
      setHotZones(hotZoneIds);
    };

    calculateHotZones();
  }, [towers.length, userLocation]); // Recalculate when tower count or user location changes

  // Create GeoJSON for heatmap circles (top 5 towers only)
  const heatmapGeoJSON = useMemo(() => {
    const features = towers
      .filter(tower => tower.hotZoneRank && tower.hotZoneRank <= 5)
      .map(tower => {
        const rank = tower.hotZoneRank || 0;
        // Different radius based on rank (in meters)
        const radius = rank === 1 ? 600 : rank === 2 ? 500 : rank === 3 ? 400 : rank === 4 ? 350 : 300;
        
        return {
          type: 'Feature' as const,
          properties: {
            rank,
            radius,
          },
          geometry: {
            type: 'Point' as const,
            coordinates: [tower.longitude, tower.latitude]
          }
        };
      });

    return {
      type: 'FeatureCollection' as const,
      features
    };
  }, [towers]);

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

    // Fly to user location only if user hasn't manually interacted with the map
    if (mapRef.current && !userInteracted) {
      mapRef.current.flyTo({
        center: [longitude, latitude],
        zoom: 15,
        duration: 2000
      });
    }
  }, [onLocationUpdate, userInteracted]);

  // Handle marker clicks: prevent opening the side panel for the user's current tower
  const handleMarkerClick = useCallback((e: any, tower: Tower) => {
    e.originalEvent.stopPropagation();
    // Always open the side panel when a marker is clicked, including the current tower
    setSelectedTower(tower);
  }, [userLocation]);

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
        onMove={() => {
          // mark that the user moved the map so we don't auto-recenter
          setUserInteracted(true);
        }}
      >
        {/* Heatmap circles for top 5 towers */}
        <Source id="heatmap-source" type="geojson" data={heatmapGeoJSON}>
          {/* Rank 1 - Brightest blue glow */}
          <Layer
            id="heatmap-1"
            type="circle"
            filter={['==', ['get', 'rank'], 1]}
            paint={{
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                10, 30,
                15, 80,
                18, 150
              ],
              'circle-color': '#3b82f6', // blue-500
              'circle-opacity': 0.4,
              'circle-blur': 1.5
            }}
          />
          {/* Rank 2 - Cyan glow */}
          <Layer
            id="heatmap-2"
            type="circle"
            filter={['==', ['get', 'rank'], 2]}
            paint={{
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                10, 25,
                15, 70,
                18, 130
              ],
              'circle-color': '#06b6d4', // cyan-500
              'circle-opacity': 0.35,
              'circle-blur': 1.5
            }}
          />
          {/* Rank 3 - Teal glow */}
          <Layer
            id="heatmap-3"
            type="circle"
            filter={['==', ['get', 'rank'], 3]}
            paint={{
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                10, 20,
                15, 60,
                18, 110
              ],
              'circle-color': '#14b8a6', // teal-500
              'circle-opacity': 0.3,
              'circle-blur': 1.5
            }}
          />
          {/* Rank 4 - Slate glow */}
          <Layer
            id="heatmap-4"
            type="circle"
            filter={['==', ['get', 'rank'], 4]}
            paint={{
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                10, 18,
                15, 55,
                18, 100
              ],
              'circle-color': '#64748b', // slate-500
              'circle-opacity': 0.28,
              'circle-blur': 1.5
            }}
          />
          {/* Rank 5 - Light slate glow */}
          <Layer
            id="heatmap-5"
            type="circle"
            filter={['==', ['get', 'rank'], 5]}
            paint={{
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                10, 15,
                15, 50,
                18, 90
              ],
              'circle-color': '#94a3b8', // slate-400
              'circle-opacity': 0.25,
              'circle-blur': 1.5
            }}
          />
        </Source>

        {/* Tower Markers */}
          {towers.map((tower) => {
          const isHotZone = tower.hotZoneRank && tower.hotZoneRank > 0;
          const rank = tower.hotZoneRank || 0;
          
          // Different animation speeds and glow colors based on rank
          const getHotZoneStyle = (rank: number) => {
            switch(rank) {
              case 1: // #1 hottest - fastest pulse, brightest glow
                return {
                  pulseSpeed: '0.8s',
                  glowColor: 'rgba(59, 130, 246, 0.8)', // blue-500
                  ringColor: 'rgba(59, 130, 246, 0.6)',
                  iconColor: 'text-blue-400',
                  scale: 1.3,
                  badgeColor: '#3b82f6' // blue-500
                };
              case 2: // #2 - fast pulse, bright glow
                return {
                  pulseSpeed: '1.1s',
                  glowColor: 'rgba(6, 182, 212, 0.7)', // cyan-500
                  ringColor: 'rgba(6, 182, 212, 0.5)',
                  iconColor: 'text-cyan-500',
                  scale: 1.25,
                  badgeColor: '#06b6d4' // cyan-500
                };
              case 3: // #3 - medium pulse
                return {
                  pulseSpeed: '1.4s',
                  glowColor: 'rgba(20, 184, 166, 0.6)', // teal-500
                  ringColor: 'rgba(20, 184, 166, 0.4)',
                  iconColor: 'text-teal-400',
                  scale: 1.2,
                  badgeColor: '#14b8a6' // teal-500
                };
              case 4: // #4 - slower pulse
                return {
                  pulseSpeed: '1.7s',
                  glowColor: 'rgba(100, 116, 139, 0.5)', // slate-500
                  ringColor: 'rgba(100, 116, 139, 0.3)',
                  iconColor: 'text-slate-400',
                  scale: 1.15,
                  badgeColor: '#64748b' // slate-500
                };
              case 5: // #5 - slowest pulse
                return {
                  pulseSpeed: '2s',
                  glowColor: 'rgba(148, 163, 184, 0.4)', // slate-400
                  ringColor: 'rgba(148, 163, 184, 0.2)',
                  iconColor: 'text-slate-500',
                  scale: 1.1,
                  badgeColor: '#94a3b8' // slate-400
                };
              default:
                return null;
            }
          };

          const hotZoneStyle = isHotZone ? getHotZoneStyle(rank) : null;

          return (
          <Marker
            key={tower.towerId}
            longitude={tower.longitude}
            latitude={tower.latitude}
            anchor="center"
            onClick={(e) => handleMarkerClick(e, tower)}
          >
            <div className="relative cursor-pointer transform transition-all hover:scale-110 flex items-center justify-center">
              {/* Pulsing ring effect for hot zones - similar to user location */}
              {isHotZone && hotZoneStyle && (
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
                  <span 
                    className="absolute inline-flex rounded-full opacity-75 animate-ping" 
                    style={{ 
                      width: 40, 
                      height: 40,
                      backgroundColor: hotZoneStyle.glowColor
                    }} 
                  />
                </div>
              )}
              
              {/* Tower Icon with conditional coloring and floating animation */}
              <div
                style={isHotZone && hotZoneStyle ? {
                  animation: `float ${hotZoneStyle.pulseSpeed} ease-in-out infinite`,
                } : {}}
              >
                <TowerIcon 
                  className={`w-10 h-10 ${hotZoneStyle ? hotZoneStyle.iconColor : 'text-white'} drop-shadow-2xl transition-colors duration-300`}
                  size={40} 
                />
              </div>
              
              {/* Hot Zone Rank Badge - Only show for ranks 1, 2, 3 */}
              {isHotZone && rank > 0 && rank <= 3 && hotZoneStyle && (
                <div 
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold pointer-events-none shadow-lg bg-gray-700 border-2"
                  style={{
                    borderColor: hotZoneStyle.badgeColor,
                    boxShadow: `0 0 12px ${hotZoneStyle.badgeColor}80, 0 2px 8px rgba(0,0,0,0.5)`
                  }}
                >
                  {rank}
                </div>
              )}
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
              {/* Make the user location marker non-interactive so it doesn't block tower marker clicks underneath */}
              <div className="relative pointer-events-none w-0 h-0">
                {/* Centered pulsing effect - uses flex centering so pulse grows evenly */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
                  <span className="absolute inline-flex rounded-full bg-[rgba(96,165,250,0.6)] opacity-80 animate-ping" style={{ width: 24, height: 24 }} />
                  <span className="relative inline-flex rounded-full bg-blue-500 w-6 h-6 border-4 border-white shadow-lg" />
                </div>
              </div>
          </Marker>
        )}
      </Map>

      {/* Loading Indicator - Enhanced */}
      {towersLoading && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute top-4 right-4 bg-gradient-to-r from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-4 text-white shadow-2xl"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
              <div className="absolute inset-0 w-5 h-5 rounded-full bg-cyan-400/20 animate-ping"></div>
            </div>
            <div>
              <div className="text-sm font-semibold text-cyan-400">Loading Towers</div>
              <div className="text-xs text-gray-400 mt-0.5">Fetching chat zones...</div>
            </div>
          </div>
          {/* Progress bar animation */}
          <div className="mt-3 h-1 bg-gray-700/50 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
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

      {/* Recenter (relocate) icon - bottom-right */}
      {userLocation && (
        <div className="fixed right-4 bottom-4 z-50">
          <button
            onClick={() => {
              if (mapRef.current && userLocation) {
                setUserInteracted(false);
                mapRef.current.flyTo({ center: [userLocation.longitude, userLocation.latitude], zoom: 15, duration: 800 });
              }
            }}
            title="Center map"
            aria-label="Center map"
            className="w-12 h-12 rounded-full bg-black/80 border border-gray-700 flex items-center justify-center text-white hover:bg-gray-800 transition-all shadow-lg"
          >
            <Navigation className="w-5 h-5" />
          </button>
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
                <h3 className="font-bold text-lg md:text-xl truncate">{getTowerLabel(selectedTower.towerId)}</h3>
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
                  isCurrentTower={isCurrentTower}
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
