'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { User as UserIcon, Calendar, MapPin, Clock, Search } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { postService, Post } from '@/src/services/postService';

export default function MyPostsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useUser();
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  useEffect(() => {
    // Redirect to signup if not authenticated
    if (!authLoading && !isAuthenticated) {
      router.push('/signup');
      return;
    }

    // Load user's posts
    if (isAuthenticated && user) {
      loadUserPosts();
    }
  }, [authLoading, isAuthenticated, router, user]);

  const loadUserPosts = async () => {
    try {
      setLoadingPosts(true);
      
      if (!user?.firebaseUid) {
        console.error('User ID not available');
        setLoadingPosts(false);
        return;
      }

      // Fetch user's posts directly using the dedicated endpoint
      const myPosts = await postService.getUserPosts(user.firebaseUid);
      setUserPosts(myPosts);
    } catch (error) {
      console.error('Failed to load user posts:', error);
      setUserPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  // Format the member since date
  const getMemberSince = () => {
    if (!user?.createdAt) {
      return 'Jan 2023';
    }
    try {
      const date = new Date(user.createdAt);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return 'Jan 2023';
    }
  };

  const formatTimeDetailed = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Filter and sort posts
  const filteredPosts = userPosts
    .filter(post => 
      post.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

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

      <div className="px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        <div className="mx-auto w-full max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-100">My Posts</h1>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-4 mb-6 shadow-lg">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
                className="px-4 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
              >
                <option value="newest" className="text-xs sm:text-base">Newest First</option>
                <option value="oldest" className="text-xs sm:text-base">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Post History Header */}
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-100 mb-1">Post History</h2>
            <p className="text-gray-400 text-sm">
              Showing {filteredPosts.length} of {userPosts.length} posts
            </p>
          </div>

          {/* Posts Grid - 3 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingPosts ? (
              // Loading skeleton
              Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 animate-pulse"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-gray-700 rounded"></div>
                      <div className="h-4 bg-gray-700 rounded w-20"></div>
                    </div>
                    <div className="h-3 bg-gray-700 rounded w-32"></div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="h-3 bg-gray-700 rounded"></div>
                    <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                    <div className="h-3 bg-gray-700 rounded w-24"></div>
                    <div className="h-3 bg-gray-700 rounded w-20"></div>
                  </div>
                </div>
              ))
            ) : filteredPosts.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-400">
                  {searchQuery ? 'No posts found matching your search' : 'No posts yet'}
                </p>
              </div>
            ) : (
              filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 shadow-lg hover:shadow-cyan-500/20"
                >
                  {/* Post Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2 text-cyan-400">
                      <MapPin className="w-5 h-5" />
                      <span className="font-semibold">
                        Tower
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>{formatTimeDetailed(post.createdAt).split(',')[0]}</span>
                    </div>
                  </div>

                  {/* Post Content */}
                  <p className="text-gray-200 leading-relaxed mb-4 line-clamp-3">
                    {post.content}
                  </p>

                  {/* Post Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>{formatTimeDetailed(post.createdAt).split(',')[0]}</span>
                    </div>
                    <div className="text-gray-400 text-sm">
                      {formatTimeDetailed(post.createdAt).split(',')[1]?.trim()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
