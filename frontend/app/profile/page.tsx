'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { User as UserIcon, CalendarDays, BarChart3, MapPinned } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    
    if (!authToken) {
      // Redirect to signup if not authenticated
      router.push('/signup');
      return;
    }

    // Load user data from storage
    const storedUsername = localStorage.getItem('username') || sessionStorage.getItem('username') || 'Anonymous User';
    const storedEmail = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail') || '';
    
    setUsername(storedUsername);
    setEmail(storedEmail);
    setIsLoading(false);
  }, [router]);

  // Static placeholders for now – wire up to backend later
  const stats = [
    { label: 'Posts', value: 0 },
    { label: 'Zones Visited', value: 0 },
    { label: 'Reactions', value: 0 },
    { label: 'Hot Zones Found', value: 0 },
  ];

  // Placeholder skeleton items for recent zones
  const recentSkeleton = Array.from({ length: 3 });

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
          className="mx-auto w-full max-w-3xl"
        >
          {/* Header */}
          <div className="flex items-center justify-center mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl font-semibold">Profile</h1>
          </div>

          {/* Profile Card */}
          <div className="bg-linear-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700 p-6 sm:p-8 shadow-2xl">
            {/* Avatar + name */}
            <div className="flex flex-col items-center text-center">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-linear-to-br from-purple-700/50 to-indigo-700/50 border border-gray-600 flex items-center justify-center shadow-inner">
                <UserIcon className="w-14 h-14 sm:w-16 sm:h-16 text-purple-300" />
              </div>
              <h2 className="mt-5 text-2xl sm:text-3xl font-bold">{username}</h2>
              <p className="mt-1 text-sm text-gray-400">@{username.toLowerCase().replace(/\s+/g, '_')}</p>

              <div className="mt-2 inline-flex items-center gap-2 text-gray-400 text-xs sm:text-sm">
                <CalendarDays className="w-4 h-4" />
                <span>Member since {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
              </div>
            </div>

            {/* Activity */}
            <div className="mt-8">
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
                    <div className="text-3xl font-extrabold">{s.value}</div>
                    <div className="mt-1 text-xs text-gray-400">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Zones */}
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-3">
                <MapPinned className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-gray-200">Recent Zones</h3>
              </div>

              {/* Skeleton list: backend-ready container */}
              <div className="space-y-3">
                {recentSkeleton.map((_, idx) => (
                  <div
                    key={idx}
                    className="w-full rounded-xl border border-gray-700 bg-black/50 p-4 flex items-center gap-3"
                  >
                    <div className="w-9 h-9 rounded-full bg-gray-700/60 " />
                    <div className="flex-1">
                      <div className="h-3 w-40 sm:w-56 bg-gray-700/60 rounded " />
                      <div className="h-3 w-24 sm:w-32 bg-gray-700/40 rounded mt-2 " />
                    </div>
                    <div className="h-3 w-10 bg-gray-700/50 rounded hidden sm:block " />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
