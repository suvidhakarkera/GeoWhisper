'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
// removed framer-motion animations per request
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { User as UserIcon, CalendarDays, BarChart3, MapPinned } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, refreshUserProfile } = useUser();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Redirect to signup if not authenticated
    if (!authLoading && !isAuthenticated) {
      router.push('/signup');
      return;
    }

    // Refresh user profile data from backend on mount
    if (isAuthenticated && user) {
      setIsRefreshing(true);
      refreshUserProfile().finally(() => setIsRefreshing(false));
    }
  }, [authLoading, isAuthenticated, router]);

  // Stats from user data
  const stats = [
    { label: 'Posts', value: user?.totalPosts || 0 },
    { label: 'Zones Visited', value: user?.zonesVisited || 0 },
    { label: 'Reactions', value: user?.totalReactions || 0 },
    { label: 'Hot Zones Found', value: 0 }, // Placeholder for future implementation
  ];

  // Placeholder skeleton items for recent zones (4 boxes)
  const recentSkeleton = Array.from({ length: 4 });

  // Format the member since date
  const getMemberSince = () => {
    if (!user?.createdAt) {
      return new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    try {
      // Parse the createdAt timestamp
      const date = new Date(user.createdAt);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
  };

  // Show loading state while checking auth
  if (authLoading || !user) {
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
  <div className="mx-auto w-full max-w-[1200px]">
          {/* Header */}
          <div className="flex items-center justify-center mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl font-semibold">Profile</h1>
          </div>

          {/* Profile Card */}
          <div className="bg-linear-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700 p-10 sm:p-12 shadow-2xl">
            {/* Top: avatar + activity side-by-side on desktop */}
            <div className="lg:grid lg:grid-cols-5 lg:gap-8 items-start">
              <div className="lg:col-span-3 flex items-center justify-center gap-8">
                <div className="flex flex-col items-center text-center">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 lg:w-40 lg:h-40 rounded-full bg-linear-to-br from-purple-700/50 to-indigo-700/50 border border-gray-600 flex items-center justify-center shadow-inner">
                    <UserIcon className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 text-purple-300" />
                  </div>
                  <h2 className="mt-5 text-2xl sm:text-3xl lg:text-4xl font-bold">{user.username}</h2>
                  <p className="mt-1 text-sm text-gray-400">@{user.username.toLowerCase().replace(/\s+/g, '_')}</p>

                  <div className="mt-2 inline-flex items-center gap-2 text-gray-400 text-xs sm:text-sm">
                    <CalendarDays className="w-4 h-4" />
                    <span>Member since {getMemberSince()}</span>
                  </div>
                </div>
              </div>

              {/* Activity on the right (2x2) */}
              <div className="mt-6 lg:mt-0 lg:col-span-2">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-gray-200">Your Activity</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {stats.map((s) => (
                    <div
                      key={s.label}
                      className="rounded-xl border border-gray-700 bg-black/50 p-5 text-center hover:border-cyan-500 transition-colors"
                    >
                      <div className="text-2xl lg:text-3xl font-extrabold">{s.value}</div>
                      <div className="mt-1 text-xs text-gray-400">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

              {/* Recent Zones (placed under activity so it aligns) */}
              <div className="mt-6 lg:mt-6 lg:col-span-2">
                <div className="flex items-center gap-2 mb-3">
                  <MapPinned className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-gray-200">Recent Zones</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {recentSkeleton.map((_, idx) => (
                    <div
                      key={idx}
                      className="w-full rounded-xl border border-gray-700 bg-black/50 p-5 flex flex-col sm:flex-row items-center gap-4 min-h-28"
                    >
                      
                      
                    </div>
                  ))}
                </div>
              </div>
          </div>
  </div>
      </div>

      <Footer />
    </div>
  );
}