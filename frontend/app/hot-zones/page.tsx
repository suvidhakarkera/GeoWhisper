'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MapView from '@/components/MapViewWrapper';
import CreatePostModal from '@/components/CreatePostModal';
import FloatingActionButton from '@/components/FloatingActionButton';
import { Flame, Activity } from 'lucide-react';

export default function HotZonesPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    // Check if user is authenticated
    const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    
    if (!authToken) {
      // Redirect to signup if not authenticated
      router.push('/signup');
      return;
    }

    setIsLoading(false);
  }, [router]);

  const handlePostCreated = () => {
    setRefreshTrigger(prev => prev + 1);
    setIsPostModalOpen(false);
  };

  // Placeholder skeleton zones - will be populated by backend
  const skeletonZones = Array.from({ length: 5 });

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="min-h-screen px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mx-auto w-full max-w-7xl"
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 flex items-center gap-3">
              <Flame className="w-8 h-8 text-orange-500" />
              Hot Zones
            </h1>
            <p className="text-gray-400 text-sm sm:text-base">
              Discover trending locations with high activity in your area
            </p>
          </div>

          {/* Mapbox Map View */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="mb-6"
          >
            <div className="rounded-2xl overflow-hidden shadow-2xl border-2 border-gray-700">
              <MapView refreshTrigger={refreshTrigger} />
            </div>
          </motion.div>

          {/* Info Section */}
          <div className="text-center mt-8 text-gray-400">
            <p className="mb-4">Click on markers to view posts or use the + button to create a new post</p>
            <div className="flex items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Your Location</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-red-500 to-pink-500"></div>
                <span>Posts</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton onClick={() => setIsPostModalOpen(true)} />

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        onPostCreated={handlePostCreated}
      />

      <Footer />
    </div>
  );
}
