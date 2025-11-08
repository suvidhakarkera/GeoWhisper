'use client';

import dynamic from 'next/dynamic';
import { Post } from '@/src/services/postService';

interface MapViewWrapperProps {
  posts?: Post[];
  onMarkerClick?: (post: Post) => void;
  userLocation?: { latitude: number; longitude: number } | null;
  onLocationUpdate?: (location: { latitude: number; longitude: number }) => void;
  refreshTrigger?: number;
}

// Dynamically import MapView with no SSR
const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] rounded-xl overflow-hidden border border-gray-700 shadow-xl bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mb-4"></div>
        <p className="text-gray-400">Loading map...</p>
      </div>
    </div>
  ),
});

export default function MapViewWrapper(props: MapViewWrapperProps) {
  return <MapView {...props} />;
}
