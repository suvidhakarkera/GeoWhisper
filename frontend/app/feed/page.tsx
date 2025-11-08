'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PostCard from '@/components/PostCard';
import { postService, Post } from '@/src/services/postService';
import { Map, List, Loader2, RefreshCw, Plus, MapPin } from 'lucide-react';
import Link from 'next/link';
import FloatingActionButton from '@/components/FloatingActionButton';
import CreatePostModal from '@/components/CreatePostModal';
import MapView from '@/components/MapView';

export default function FeedPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState('');
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    // Check authentication
    const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!authToken) {
      router.push('/signin');
      return;
    }

    loadPosts();
  }, [router]);

  const loadPosts = async () => {
    try {
      setError('');
      const loc = await postService.getCurrentLocation();
      setLocation(loc);

      const nearbyPosts = await postService.getNearbyPosts({
        latitude: loc.latitude,
        longitude: loc.longitude,
        radiusMeters: 5000, // 5km radius
        limit: 50,
      });

      setPosts(nearbyPosts);
    } catch (err: any) {
      setError(err.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const handleLike = (postId: string) => {
    // TODO: Implement like functionality when backend endpoint is ready
    console.log('Like post:', postId);
  };

  const handleComment = (postId: string) => {
    // TODO: Implement comment functionality when backend endpoint is ready
    console.log('Comment on post:', postId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mx-auto mb-4" />
            <p className="text-gray-400">Loading nearby posts...</p>
          </div>
        </div>
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
                Nearby Posts
              </h1>
              <p className="text-gray-400">
                {posts.length} {posts.length === 1 ? 'post' : 'posts'} within 5km
              </p>
            </div>

            <div className="flex items-center space-x-3">
              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh posts"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              {/* View Mode Toggle */}
              <div className="flex bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-4 py-2 rounded-md transition-all flex items-center space-x-2 ${
                    viewMode === 'map'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Map className="w-4 h-4" />
                  <span className="hidden sm:inline">Map</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-md transition-all flex items-center space-x-2 ${
                    viewMode === 'list'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline">List</span>
                </button>
              </div>

              {/* Create Post Button */}
              <Link
                href="/create-post"
                className="px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-lg transition-all flex items-center space-x-2 shadow-lg shadow-cyan-500/20"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline font-semibold">Create Post</span>
              </Link>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {/* Content */}
          {posts.length === 0 ? (
            <div className="text-center py-20">
              <MapPin className="w-20 h-20 text-gray-700 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-400 mb-2">No posts nearby</h3>
              <p className="text-gray-500 mb-6">
                Be the first to share something in your area!
              </p>
              <Link
                href="/create-post"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-lg transition-all shadow-lg shadow-cyan-500/20"
              >
                <Plus className="w-5 h-5" />
                <span className="font-semibold">Create Your First Post</span>
              </Link>
            </div>
          ) : viewMode === 'map' ? (
            <div className="mb-8 rounded-2xl overflow-hidden shadow-2xl border-2 border-gray-700">
              <MapView
                posts={posts}
                userLocation={location}
                refreshTrigger={refreshTrigger}
              />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={handleLike}
                  onComment={handleComment}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton onClick={() => setIsPostModalOpen(true)} />

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        onPostCreated={() => {
          setRefreshTrigger(prev => prev + 1);
          setIsPostModalOpen(false);
          loadPosts();
        }}
        initialLocation={location}
      />

      <Footer />
    </div>
  );
}
