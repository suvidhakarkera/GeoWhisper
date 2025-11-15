import { API_BASE_URL } from '@/config/api';

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

export interface NearbyTower {
  towerId: string;
  latitude: number;
  longitude: number;
  postCount: number;
  distance: number; // in meters
}

class LocationService {
  private watchId: number | null = null;
  private currentLocation: UserLocation | null = null;

  /**
   * Get user's current location (one-time)
   */
  async getCurrentLocation(): Promise<UserLocation> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: UserLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };
          this.currentLocation = location;
          resolve(location);
        },
        (error) => {
          let message = 'Unable to get your location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location permission denied. Please enable location access in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              message = 'Location request timed out.';
              break;
          }
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }

  /**
   * Watch user's location continuously
   */
  watchLocation(
    onLocationUpdate: (location: UserLocation) => void,
    onError?: (error: string) => void
  ): void {
    if (!navigator.geolocation) {
      onError?.('Geolocation is not supported by your browser');
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location: UserLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };
        this.currentLocation = location;
        onLocationUpdate(location);
      },
      (error) => {
        let message = 'Unable to watch location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location unavailable';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out';
            break;
        }
        onError?.(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 1000,
      }
    );
  }

  /**
   * Stop watching location
   */
  stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * Get the cached current location (no API call)
   */
  getCachedLocation(): UserLocation | null {
    return this.currentLocation;
  }

  /**
   * Calculate distance between two points (Haversine formula)
   * Returns distance in meters
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Find the tower that the user is currently in
   * Returns the tower if user is within `currentTowerRadiusMeters` of any tower center
   * NOTE: previous implementation used 50m which was inconsistent with UI pages
   * that expect the "current tower" radius to be 500m. Use 500m for parity.
   */
  async findUserTower(
    userLocation: UserLocation
  ): Promise<NearbyTower | null> {
    try {
      // Fetch all towers
      const response = await fetch(`${API_BASE_URL}/api/posts/towers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clusterRadiusMeters: 50,
          maxPosts: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch towers');
      }

      const result = await response.json();
      const towers = result.data || [];

      // Find towers within 500m (matches Nearby page and other UI expectations)
      const nearbyTowers: NearbyTower[] = towers
        .map((tower: any) => {
          const distance = this.calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            tower.latitude,
            tower.longitude
          );
          return {
            towerId: tower.towerId,
            latitude: tower.latitude,
            longitude: tower.longitude,
            postCount: tower.postCount,
            distance,
          };
        })
        .filter((tower: NearbyTower) => tower.distance <= 500)
        .sort((a: NearbyTower, b: NearbyTower) => a.distance - b.distance);

      // Return the closest tower, or null if none within range
      return nearbyTowers.length > 0 ? nearbyTowers[0] : null;
    } catch (error) {
      console.error('Error finding user tower:', error);
      return null;
    }
  }

  /**
   * Get towers within a specific radius of user location
   */
  async getTowersNearUser(
    userLocation: UserLocation,
    radiusMeters: number = 500
  ): Promise<NearbyTower[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/towers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clusterRadiusMeters: 50,
          maxPosts: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch towers');
      }

      const result = await response.json();
      const towers = result.data || [];

      // Calculate distance for each tower and filter by radius
      const nearbyTowers: NearbyTower[] = towers
        .map((tower: any) => {
          const distance = this.calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            tower.latitude,
            tower.longitude
          );
          return {
            towerId: tower.towerId,
            latitude: tower.latitude,
            longitude: tower.longitude,
            postCount: tower.postCount,
            distance,
          };
        })
        .filter((tower: NearbyTower) => tower.distance <= radiusMeters)
        .sort((a: NearbyTower, b: NearbyTower) => a.distance - b.distance);

      return nearbyTowers;
    } catch (error) {
      console.error('Error getting nearby towers:', error);
      return [];
    }
  }

  /**
   * Get all towers (optimized - fetch once)
   */
  async getAllTowers(): Promise<Array<{ towerId: string; latitude: number; longitude: number; postCount: number }>> {
    try {
      // Use a short-lived session cache to avoid fetching the full towers list repeatedly
      const cacheKey = 'gw_allTowers_cache_v1';
      const cacheTTLms = 10 * 60 * 1000; // 10 minutes

      try {
        const raw = sessionStorage.getItem(cacheKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.ts && Date.now() - parsed.ts < cacheTTLms && Array.isArray(parsed.data)) {
            return parsed.data;
          }
        }
      } catch (e) {
        // Ignore parsing errors and fall through to fetching
        console.warn('Failed to read towers cache:', e);
      }

      const response = await fetch(`${API_BASE_URL}/api/posts/towers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clusterRadiusMeters: 50,
          maxPosts: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch towers');
      }

      const result = await response.json();
      const data = result.data || [];

      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data }));
      } catch (e) {
        // Ignore storage errors
      }

      return data;
    } catch (error) {
      console.error('Error fetching all towers:', error);
      return [];
    }
  }

  /**
   * Check location permission status
   */
  async checkLocationPermission(): Promise<'granted' | 'denied' | 'prompt'> {
    if (!navigator.permissions) {
      return 'prompt';
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      return result.state as 'granted' | 'denied' | 'prompt';
    } catch (error) {
      return 'prompt';
    }
  }
}

export const locationService = new LocationService();
