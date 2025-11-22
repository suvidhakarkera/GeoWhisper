'use client';

import { useEffect } from 'react';
import { locationService } from '@/services/locationService';

/**
 * Preloads user location in the background to speed up subsequent pages
 */
export default function LocationPreloader() {
  useEffect(() => {
    // Preload location as soon as possible
    const preloadLocation = async () => {
      try {
        await locationService.getCurrentLocation();
        console.log('Location preloaded successfully');
      } catch (error) {
        // Silently fail - pages will request location when needed
        console.debug('Location preload failed:', error);
      }
    };

    // Start preloading after a short delay to not block initial render
    const timer = setTimeout(preloadLocation, 100);
    return () => clearTimeout(timer);
  }, []);

  return null; // This component doesn't render anything
}
