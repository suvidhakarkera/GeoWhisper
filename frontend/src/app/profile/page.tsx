'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
// removed framer-motion animations per request
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { User as UserIcon, CalendarDays, BarChart3, MapPinned, MessageCircle, Loader2 } from 'lucide-react';
import { getTowerLabel } from '@/utils/towerNumber';
import { useUser } from '@/contexts/UserContext';
import { postService, Post } from '@/services/postService';
import { ref, get } from 'firebase/database';
import { database } from '@/config/firebase';

interface RecentZone {
  towerId: string;
  postCount: number;
  chatCount: number;
  lastActivity: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, refreshUserProfile } = useUser();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [recentZones, setRecentZones] = useState<RecentZone[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [totalChats, setTotalChats] = useState(0);

  useEffect(() => {
    // Redirect to signup if not authenticated
    if (!authLoading && !isAuthenticated) {
      router.push('/signup');
      return;
    }

    // Load user activity when authenticated
    if (isAuthenticated && user && !isRefreshing) {
      loadUserActivity();
    }
  }, [authLoading, isAuthenticated, user]);

  const loadUserActivity = async () => {
    if (!user?.firebaseUid) return;
    try {
      setLoadingActivity(true);

      // Load posts and recent zones in parallel
      await Promise.all([
        postService.getUserPosts(user.firebaseUid).then(posts => setUserPosts(posts)).catch(err => {
          console.error('Failed to load posts:', err);
          setUserPosts([]);
        }),
        loadRecentZones(),
      ]);
    } catch (error) {
      console.error('Failed to load user activity:', error);
    } finally {
      setLoadingActivity(false);
    }
  };

  const loadRecentZones = async () => {
    if (!user?.firebaseUid || !database) return;
    
    try {
      // Get all towers (this is async and won't block the page load)
      const towersResponse = await postService.getTowers();
      const towers = towersResponse.data || [];
      
      // Map to track zone activity
      const zoneActivity = new Map<string, RecentZone>();
      let totalChatMessages = 0;
      
      // Only check first 20 towers for better performance
      const towersToCheck = towers.slice(0, 20);
      
      // Check each tower for user's posts and chats
      for (const tower of towersToCheck) {
        const towerId = tower.towerId;
        let postCount = 0;
        let chatCount = 0;
        let lastActivity = 0;
        
        // Count user's posts in this tower
        if (tower.posts && tower.posts.length > 0) {
          const userPostsInTower = tower.posts.filter(p => p.userId === user.firebaseUid);
          postCount = userPostsInTower.length;
          
          if (userPostsInTower.length > 0) {
            const latestPost = userPostsInTower.reduce((latest, current) => {
              const currentTime = current.createdAt.seconds * 1000;
              return currentTime > latest ? currentTime : latest;
            }, 0);
            lastActivity = Math.max(lastActivity, latestPost);
          }
        }
        
        // Count user's chat messages in this tower from Firebase Realtime Database
        try {
          const chatRef = ref(database, `chats/${towerId}/messages`);
          const chatSnapshot = await get(chatRef);
          
          if (chatSnapshot.exists()) {
            const messages = chatSnapshot.val();
            const userMessages = Object.values(messages).filter(
              (msg: any) => msg.userId === user.firebaseUid && !msg.isPost // Exclude post messages
            );
            chatCount = userMessages.length;
            totalChatMessages += chatCount;
            
            // Update last activity with latest chat message
            if (userMessages.length > 0) {
              const latestChat = userMessages.reduce((latest: number, msg: any) => {
                const msgTime = msg.timestamp || 0;
                return msgTime > latest ? msgTime : latest;
              }, 0);
              lastActivity = Math.max(lastActivity, latestChat);
            }
          }
        } catch (chatError) {
          console.error(`Failed to load chats for tower ${towerId}:`, chatError);
        }
        
        // If user has any activity in this zone, add it
        if (postCount > 0 || chatCount > 0) {
          zoneActivity.set(towerId, {
            towerId,
            postCount,
            chatCount,
            lastActivity,
          });
        }
      }
      
      // Convert to array and sort by last activity
      const sortedZones = Array.from(zoneActivity.values())
        .sort((a, b) => b.lastActivity - a.lastActivity)
        .slice(0, 4);
      
      setRecentZones(sortedZones);
      setTotalChats(totalChatMessages);
      
    } catch (error) {
      console.error('Failed to load recent zones:', error);
    }
  };

  // Stats from actual user data
  const stats = [
    { label: 'Posts', value: userPosts.length },
    { label: 'Zones Visited', value: recentZones.length },
    { label: 'Chats Sent', value: totalChats },
  ];

  // Format the member since date
  const getMemberSince = () => {
    if (!user?.createdAt) {
      return 'Recently';
    }
    try {
      let date: Date;
      
      // Handle different timestamp formats
      if (typeof user.createdAt === 'string') {
        // Try to parse Firestore Timestamp string format
        // Format: "Timestamp(seconds=1699564800, nanoseconds=0)"
        const timestampMatch = user.createdAt.match(/seconds=(\d+)/);
        if (timestampMatch) {
          // Convert seconds to milliseconds
          const seconds = parseInt(timestampMatch[1], 10);
          date = new Date(seconds * 1000);
        } else {
          // Try standard date parsing
          date = new Date(user.createdAt);
        }
      } else if (typeof user.createdAt === 'number') {
        // Handle numeric timestamp (milliseconds or seconds)
        date = new Date(user.createdAt > 10000000000 ? user.createdAt : user.createdAt * 1000);
      } else if (user.createdAt && typeof user.createdAt === 'object' && 'seconds' in user.createdAt) {
        // Handle Firestore Timestamp object
        date = new Date((user.createdAt as any).seconds * 1000);
      } else {
        date = new Date(user.createdAt);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Recently';
      }
      
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch (error) {
      console.error('Error parsing createdAt:', error, user.createdAt);
      return 'Recently';
    }
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="w-full px-4 sm:px-6 lg:px-8 pt-20 pb-8">
          <div className="mx-auto w-full max-w-[1200px]">
            <div className="flex items-center justify-center mb-4 sm:mb-6 md:mb-8">
              <h1 className="text-lg sm:text-xl md:text-2xl font-semibold">Profile</h1>
            </div>
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl sm:rounded-2xl border border-gray-700 p-4 sm:p-6 md:p-8 lg:p-12 shadow-2xl">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-full bg-gradient-to-br from-purple-700/50 to-indigo-700/50 border border-gray-600 animate-pulse"></div>
                <div className="mt-4 h-8 w-48 bg-gray-700 rounded animate-pulse"></div>
                <div className="mt-2 h-4 w-32 bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white w-full">
      <Navbar />

      <div className="w-full px-4 sm:px-6 lg:px-8 pt-20 pb-8">
        <div className="mx-auto w-full max-w-[1200px]">
          {/* Header */}
          <div className="flex items-center justify-center mb-4 sm:mb-6 md:mb-8">
            <h1 className="text-lg sm:text-xl md:text-2xl font-semibold">Profile</h1>
          </div>

          {/* Profile Card */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl sm:rounded-2xl border border-gray-700 p-4 sm:p-6 md:p-8 lg:p-12 shadow-2xl">
            {/* Top: avatar + activity side-by-side on desktop */}
            <div className="flex flex-col lg:grid lg:grid-cols-5 lg:gap-8 items-stretch">
              <div className="lg:col-span-3 flex items-center justify-center">
                <div className="flex flex-col items-center text-center w-full">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-full bg-gradient-to-br from-purple-700/50 to-indigo-700/50 border border-gray-600 flex items-center justify-center shadow-inner">
                    <UserIcon className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 text-purple-300" />
                  </div>
                  <h2 className="mt-3 sm:mt-4 md:mt-5 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold break-words max-w-full">{user.username}</h2>
                  <p className="mt-1 text-xs sm:text-sm text-gray-400 break-all">@{user.username.toLowerCase().replace(/\s+/g, '_')}</p>

                  <div className="mt-2 inline-flex items-center gap-2 text-gray-400 text-xs sm:text-sm">
                    <CalendarDays className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Member since {getMemberSince()}</span>
                  </div>
                </div>
              </div>

              {/* Activity on the right (2x2) */}
              <div className="mt-4 lg:mt-0 lg:col-span-2 w-full lg:self-center pr-3 lg:pr-6">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-200">Your Activity</h3>
                </div>

                <div className="flex items-center justify-between gap-3">
                  {stats.map((s) => (
                    <div
                      key={s.label}
                      className="flex-1 rounded-lg sm:rounded-xl border border-gray-700 bg-black/50 p-3 sm:p-4 md:p-5 text-center hover:border-cyan-500 transition-colors"
                    >
                      <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold">
                        {loadingActivity ? (
                          <Loader2 className="w-6 h-6 mx-auto text-gray-400 animate-spin" />
                        ) : s.value}
                      </div>
                      <div className="mt-1 text-xs text-gray-400">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

              {/* Recent Zones (placed under activity so it aligns) */}
              <div className="mt-4 lg:mt-6 w-full">
                <div className="flex items-center gap-2 mb-3">
                  <MapPinned className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-200">Recent Zones</h3>
                </div>

                {loadingActivity ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {[1, 2, 3, 4].map((idx) => (
                      <div
                        key={idx}
                        className="rounded-lg sm:rounded-xl border border-gray-700 bg-black/50 p-4 sm:p-5"
                      >
                        <div className="h-16 sm:h-20 bg-gray-800 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : recentZones.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {recentZones.map((zone) => (
                      <div
                        key={zone.towerId}
                        className="rounded-lg sm:rounded-xl border border-gray-700 bg-gradient-to-br from-gray-900 to-black p-4 sm:p-5 hover:border-cyan-500 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <MapPinned className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 flex-shrink-0" />
                          <h4 className="text-xs sm:text-sm font-semibold text-gray-200 truncate">
                              {getTowerLabel(zone.towerId)}
                            </h4>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">Posts:</span>
                            <span className="font-bold text-cyan-400">{zone.postCount}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">Chats:</span>
                            <span className="font-bold text-purple-400">{zone.chatCount}</span>
                          </div>
                          <div className="pt-2 border-t border-gray-700">
                            <p className="text-xs text-gray-500">
                              Last active: {new Date(zone.lastActivity).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg sm:rounded-xl border border-gray-700 bg-black/50 p-6 sm:p-8 text-center">
                    <MapPinned className="w-10 h-10 sm:w-12 sm:h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 text-xs sm:text-sm">No zones visited yet</p>
                    <p className="text-gray-500 text-xs mt-1">
                      Start creating posts or chatting to explore zones!
                    </p>
                  </div>
                )}
              </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}