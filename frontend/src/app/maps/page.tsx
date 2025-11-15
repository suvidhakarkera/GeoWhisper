'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PostCreationModal, { PostData } from '@/components/PostCreationModal';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastContext';

// Dynamic import to avoid SSR issues with Mapbox
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Loading map...</p>
      </div>
    </div>
  )
});

export default function MapsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const { isAuthenticated } = useUser();
  const router = useRouter();
  const { show } = useToast();

  // Handle location update from MapView
  const handleLocationUpdate = useCallback((location: { latitude: number; longitude: number }) => {
    setUserLocation(location);
  }, []);

  // Handle create button click
  const handleCreateClick = () => {
    if (!isAuthenticated) {
      router.push('/signin');
      return;
    }
    setIsModalOpen(true);
  };

  // Handle post submission
  const handlePostSubmit = async (postData: PostData) => {
    try {
      // TODO: Send post to backend API
      console.log('Post data:', postData);
      
      // For now, just log the data
      // In production, you would send this to your backend:
      // const response = await fetch('/api/posts', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(postData)
      // });
      
      show('Post created successfully!', 'success');
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />
      
      {/* Map Container */}
      <div className="flex-1 pt-[72px]">
        <div className="w-full h-[calc(100vh-72px)]">
          <MapView 
            onLocationUpdate={handleLocationUpdate}
          />
        </div>
      </div>

      {/* Floating Create Button removed per request */}

      {/* Post Creation Modal */}
      <PostCreationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userLocation={userLocation}
        onSubmit={handlePostSubmit}
      />
    </div>
  );
}
