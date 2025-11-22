/**
 * Performance configuration for GeoWhisper
 * Centralized settings for optimizing loading times and user experience
 */

export const PERFORMANCE_CONFIG = {
  // Data fetching limits
  NEARBY_POSTS_RADIUS_METERS: 500, // Reduced from 5000m for faster loading
  NEARBY_POSTS_LIMIT: 20, // Limit initial posts loaded
  NEARBY_TOWERS_RADIUS_METERS: 2000, // 2km radius for towers
  MAX_POSTS_PER_TOWER: 200, // Reduced from 1000
  
  // Map settings
  DEFAULT_MAP_ZOOM: 14, // Default zoom level
  ANIMATION_DURATION_MS: 1500, // Map animation duration
  
  // Cache settings
  TOWERS_CACHE_TTL_MS: 2 * 60 * 1000, // 2 minutes
  
  // Component lazy loading delays
  LOCATION_PRELOAD_DELAY_MS: 100,
  
  // Hot zones
  HOT_ZONES_COUNT: 5, // Top N hot zones to highlight
  HOT_ZONES_RADIUS_METERS: 2000, // Range to calculate hot zones
  
  // Current tower definition
  CURRENT_TOWER_RADIUS_METERS: 500, // Distance to be considered "in" a tower
};

export default PERFORMANCE_CONFIG;
