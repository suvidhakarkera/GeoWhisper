'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Flame, Activity } from 'lucide-react';

export default function HotZonesPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

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

          {/* Trend Detector Card - First Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="mb-6"
          >
            <div className="bg-gradient-to-br from-red-900/30 to-orange-900/30 border-2 border-red-500/50 rounded-2xl p-6 sm:p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Flame className="w-6 h-6 text-red-400" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  Trend Detector Active
                </h2>
              </div>
              <p className="text-gray-300 text-sm sm:text-base">
                Analyzing activity across campus... Found <span className="text-red-400 font-semibold">5 hot zones</span> with high engagement!
              </p>
            </div>
          </motion.div>

          {/* Hot Zones Grid - Backend-ready cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {skeletonZones.map((_, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
                className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700 p-6 shadow-xl hover:border-cyan-500 transition-all hover:shadow-cyan-500/20"
              >
                {/* Zone Icon Placeholder */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-gray-700/50 animate-pulse" />
                  <div className="px-3 py-1 rounded-full bg-gray-700/50 animate-pulse w-16 h-6" />
                </div>

                {/* Zone Title Placeholder */}
                <div className="mb-3">
                  <div className="h-6 w-3/4 bg-gray-700/60 rounded animate-pulse mb-2" />
                  <div className="h-4 w-1/2 bg-gray-700/40 rounded animate-pulse" />
                </div>

                {/* Zone Description Placeholder */}
                <div className="space-y-2 mb-4">
                  <div className="h-3 w-full bg-gray-700/40 rounded animate-pulse" />
                  <div className="h-3 w-5/6 bg-gray-700/40 rounded animate-pulse" />
                </div>

                {/* Zone Stats Placeholder */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                  <div className="flex items-center gap-4">
                    <div className="h-4 w-16 bg-gray-700/50 rounded animate-pulse" />
                    <div className="h-4 w-20 bg-gray-700/50 rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-16 bg-gray-700/50 rounded animate-pulse" />
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Hot zones data will be loaded from backend</p>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
