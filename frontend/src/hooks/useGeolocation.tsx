'use client';

import { useState, useEffect, useCallback } from 'react';
import { MapPin, AlertCircle, Loader2, X } from 'lucide-react';

export type LocationPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported' | 'checking';

interface GeolocationHookResult {
  location: { latitude: number; longitude: number } | null;
  error: string | null;
  permissionState: LocationPermissionState;
  isLoading: boolean;
  requestLocation: () => Promise<void>;
  clearError: () => void;
}

export function useGeolocation(): GeolocationHookResult {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<LocationPermissionState>('checking');
  const [isLoading, setIsLoading] = useState(false);

  // Check if geolocation is supported
  useEffect(() => {
    if (!navigator.geolocation) {
      setPermissionState('unsupported');
      setError('Geolocation is not supported by your browser');
      return;
    }

    // Check permission state if Permissions API is available
    if ('permissions' in navigator) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((result) => {
          setPermissionState(result.state as LocationPermissionState);
          
          // Listen for permission changes
          result.addEventListener('change', () => {
            setPermissionState(result.state as LocationPermissionState);
          });
        })
        .catch(() => {
          // Permissions API not fully supported, default to prompt
          setPermissionState('prompt');
        });
    } else {
      setPermissionState('prompt');
    }
  }, []);

  const requestLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setPermissionState('unsupported');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      });

      const newLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };

      setLocation(newLocation);
      setPermissionState('granted');
      setError(null);

      // Store in localStorage for persistence
      localStorage.setItem('lastKnownLocation', JSON.stringify(newLocation));
    } catch (err: any) {
      let errorMessage = 'Unable to retrieve your location';

      switch (err.code) {
        case err.PERMISSION_DENIED:
          errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
          setPermissionState('denied');
          break;
        case err.POSITION_UNAVAILABLE:
          errorMessage = 'Location information is unavailable. Please check your device settings.';
          break;
        case err.TIMEOUT:
          errorMessage = 'Location request timed out. Please try again.';
          break;
        default:
          errorMessage = `Error getting location: ${err.message}`;
      }

      setError(errorMessage);

      // Try to use last known location as fallback
      const lastLocation = localStorage.getItem('lastKnownLocation');
      if (lastLocation) {
        try {
          const parsed = JSON.parse(lastLocation);
          setLocation(parsed);
        } catch {
          // Invalid stored location, ignore
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-request location on mount if permission is granted
  useEffect(() => {
    if (permissionState === 'granted' && !location && !isLoading) {
      requestLocation();
    }
  }, [permissionState, location, isLoading, requestLocation]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    location,
    error,
    permissionState,
    isLoading,
    requestLocation,
    clearError
  };
}

interface LocationPermissionHandlerProps {
  onLocationGranted: (location: { latitude: number; longitude: number }) => void;
  onError?: (error: string) => void;
  children?: React.ReactNode;
  autoRequest?: boolean;
}

export function LocationPermissionHandler({
  onLocationGranted,
  onError,
  children,
  autoRequest = false
}: LocationPermissionHandlerProps) {
  const { location, error, permissionState, isLoading, requestLocation, clearError } = useGeolocation();

  // Notify parent of location
  useEffect(() => {
    if (location) {
      onLocationGranted(location);
    }
  }, [location, onLocationGranted]);

  // Notify parent of error
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  // Auto request if specified
  useEffect(() => {
    if (autoRequest && permissionState === 'prompt' && !isLoading) {
      requestLocation();
    }
  }, [autoRequest, permissionState, isLoading, requestLocation]);

  if (children) {
    return <>{children}</>;
  }

  // Default UI if no children provided
  if (permissionState === 'checking' || isLoading) {
    return (
      <div className="flex items-center justify-center p-6 bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-3" />
          <p className="text-gray-300 text-sm">Getting your location...</p>
        </div>
      </div>
    );
  }

  if (permissionState === 'unsupported') {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-400 font-semibold mb-1">Geolocation Not Supported</h3>
            <p className="text-red-300 text-sm">
              Your browser doesn't support geolocation. Please use a modern browser.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (permissionState === 'denied') {
    return (
      <div className="p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-yellow-400 font-semibold mb-2">Location Permission Denied</h3>
            <p className="text-yellow-300 text-sm mb-3">
              To use location features, please enable location access:
            </p>
            <ol className="text-yellow-300 text-sm space-y-1 list-decimal list-inside">
              <li>Click the lock icon in your browser's address bar</li>
              <li>Find "Location" in the permissions list</li>
              <li>Select "Allow"</li>
              <li>Refresh this page</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  if (permissionState === 'prompt') {
    return (
      <div className="p-6 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl">
        <div className="flex items-start space-x-3">
          <MapPin className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-cyan-400 font-semibold mb-2">Location Access Required</h3>
            <p className="text-gray-300 text-sm mb-4">
              GeoWhisper needs your location to show nearby posts and create location-based content.
            </p>
            <button
              onClick={requestLocation}
              disabled={isLoading}
              className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Getting Location...</span>
                </>
              ) : (
                <>
                  <MapPin className="w-5 h-5" />
                  <span>Enable Location</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-red-400 font-semibold mb-1">Location Error</h3>
              <p className="text-red-300 text-sm mb-3">{error}</p>
              <button
                onClick={requestLocation}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium rounded-lg transition-colors text-sm"
              >
                Try Again
              </button>
            </div>
          </div>
          <button
            onClick={clearError}
            className="p-1 hover:bg-red-500/20 rounded transition-colors"
          >
            <X className="w-5 h-5 text-red-400" />
          </button>
        </div>
      </div>
    );
  }

  // Location granted and working
  return null;
}
