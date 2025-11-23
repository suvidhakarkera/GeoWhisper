'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, MessageCircle, Users, Loader2, Navigation, AlertCircle, LogIn, Send } from 'lucide-react';
import { locationService, UserLocation, NearbyTower } from '@/services/locationService';
import { getTowerLabel } from '@/utils/towerNumber';
import dynamic from 'next/dynamic';

// Lazy load heavy components
const TowerChat = dynamic(() => import('@/components/TowerChat'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-cyan-400"/></div>
});

const MiniMap = dynamic(() => import('@/components/MiniMap'), { 
  ssr: false, 
  loading: () => <div className="w-full h-24 bg-gray-900 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-cyan-400"/></div> 
});

const PostCreationModal = dynamic(() => import('@/components/PostCreationModal'), {
  ssr: false
});

import { useUser } from '@/contexts/UserContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { postService } from '@/services/postService';
import { useToast } from '@/components/ToastContext';

// Import PostData type
import type { PostData } from '@/components/PostCreationModal';

export default function NearbyPage() {
  const router = useRouter();
  const { user, isAuthenticated, isModerator } = useUser();
  const { show } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Getting your location...');
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [currentTower, setCurrentTower] = useState<NearbyTower | null>(null);
  const [nearbyTowers, setNearbyTowers] = useState<NearbyTower[]>([]);
  const [selectedTowerId, setSelectedTowerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const chatPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get user location and find towers
    initLocation();
  }, []);

  const initLocation = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get current location
      setLoadingMessage('Getting your location...');
      const location = await locationService.getCurrentLocation();
      setUserLocation(location);

      // Fetch all towers once and process locally
      setLoadingMessage('Finding nearby towers...');
      const allTowers = await locationService.getAllTowers();
      
      // Calculate distances for all towers
      const towersWithDistance = allTowers.map(tower => ({
        ...tower,
        distance: locationService.calculateDistance(
          location.latitude,
          location.longitude,
          tower.latitude,
          tower.longitude
        )
      }));

      // Find tower user is currently in (within 500m)
      const currentUserTower = towersWithDistance.find(t => t.distance <= 500) || null;
      setCurrentTower(currentUserTower);
      
      if (currentUserTower) {
        setSelectedTowerId(currentUserTower.towerId);
      }

      // Get nearby towers within 500m (excluding current tower)
      const nearbyTowersList = towersWithDistance
        .filter(t => t.distance <= 500 && t.towerId !== currentUserTower?.towerId)
        .sort((a, b) => a.distance - b.distance);
      
      setNearbyTowers(nearbyTowersList);

    } catch (err: any) {
      setError(err.message || 'Failed to get location');
    } finally {
      setLoading(false);
    }
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m away`;
    }
    return `${(meters / 1000).toFixed(1)}km away`;
  };

  // Scroll to chat panel (useful on mobile)
  const scrollToChatPanel = () => {
    setTimeout(() => {
      chatPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Handle opening chat for a tower
  const handleOpenChat = (towerId: string) => {
    if (!isAuthenticated) {
      router.push('/signin');
      return;
    }
    setSelectedTowerId(towerId);
    scrollToChatPanel();
  };

  // Handle create post button click
  const handleCreateClick = () => {
    if (!isAuthenticated) {
      router.push('/signin');
      return;
    }
    
    // Debug: Check auth state
    console.log('Opening post modal. Auth state:', {
      isAuthenticated,
      user,
      firebaseUid: localStorage.getItem('firebaseUid') || sessionStorage.getItem('firebaseUid'),
      userId: localStorage.getItem('userId') || sessionStorage.getItem('userId'),
      username: localStorage.getItem('username') || sessionStorage.getItem('username')
    });
    
    setIsModalOpen(true);
  };

  // Handle post submission
  const handlePostSubmit = async (postData: PostData) => {
    try {
      // Validate post data
      if (!postData.location) {
        throw new Error('Location is required to create a post');
      }
      
      if (!postData.content || postData.content.trim().length === 0) {
        throw new Error('Post content cannot be empty');
      }
      
      console.log('Creating post with data:', {
        content: postData.content,
        latitude: postData.location.latitude,
        longitude: postData.location.longitude,
        hasImage: !!postData.image,
        imageDetails: postData.image ? {
          name: postData.image.name,
          type: postData.image.type,
          size: postData.image.size
        } : null
      });
      
      const images = postData.image ? [postData.image] : undefined;
      
      console.log('Calling postService.createPost');
      const result = await postService.createPost({
        content: postData.content,
        latitude: postData.location.latitude,
        longitude: postData.location.longitude,
      }, images);
      
      console.log('Post created successfully:', result);

      // Refresh the nearby towers after creating a post
      await initLocation();

      show('Post created successfully!', 'success');
    } catch (error: any) {
      console.error('Error creating post:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      show(error.message || 'Failed to create post. Please try again.', 'error');
      throw error;
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-gray-900 rounded-lg p-6 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Location Error</h2>
            <p className="text-gray-400 mb-4">{error}</p>
            <button
              onClick={initLocation}
              className="px-6 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-full transition-all hover:ring-2 hover:ring-blue-400 border border-gray-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      {/* Header */}
  <div className="bg-gray-900 border-b border-gray-800 p-4 pt-24">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Nearby Towers</h1>
            {userLocation && (
              <p className="text-sm text-gray-400 mt-1">
                <Navigation className="inline w-4 h-4 mr-1" />
                {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
                {userLocation.accuracy && ` (±${Math.round(userLocation.accuracy)}m)`}
              </p>
            )}
          </div>
          <button
            onClick={initLocation}
            disabled={loading}
            className="px-4 py-2 bg-black/20 backdrop-blur-lg border-2 border-gray-600 text-white hover:border-blue-400 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Refresh'
            )}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 min-h-[calc(100vh-96px)] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-400 text-lg">{loadingMessage}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Compact Local Actions (Nearby Towers list removed to reduce visual clutter) */}
          <div className="max-h-[calc(100vh-14rem)] overflow-auto">
            <div className="mb-6 mt-6 bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-100 mb-2">Local Actions</h2>
              {userLocation && (
                <div className="mb-3">
                  <MiniMap center={{ lat: userLocation.latitude, lng: userLocation.longitude }} />
                </div>
              )}

              <p className="text-sm text-gray-400 mb-4">{nearbyTowers.length} towers within 500m</p>

              <div className="space-y-4 mt-3">
                <button
                  onClick={handleCreateClick}
                  disabled={!userLocation}
                  className="w-full px-4 py-3 bg-black/20 backdrop-blur-lg border-2 border-gray-600 text-white hover:border-blue-400 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all overflow-hidden group"
                >
                  {isAuthenticated ? (
                    <>
                      <Send className="w-5 h-5" />
                      Create Post at Current Location
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      Sign in to Create Post
                    </>
                  )}
                </button>

                <button
                  onClick={() => router.push('/maps')}
                  aria-label="Open full map"
                  className="w-full px-4 py-3 bg-black/20 backdrop-blur-lg border-2 border-gray-600 text-white hover:border-blue-400 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all overflow-hidden group"
                >
                  <MapPin className="w-5 h-5" />
                  Open Map
                </button>

                
              </div>
            </div>
          </div>

          {/* Chat Panel */}
          <div ref={chatPanelRef} className="lg:sticky lg:top-24 lg:h-[calc(100vh-14rem)] overflow-auto">
            {selectedTowerId ? (
              <div className="bg-gray-900 rounded-lg h-full flex flex-col">
                  <div className="p-4 border-b border-gray-800">
                  <h2 className="text-xl font-bold">{getTowerLabel(selectedTowerId || undefined)}</h2>
                  <p className="text-sm text-gray-400">Real-time chat</p>
                </div>
                <div className="flex-1 overflow-hidden">
                  {isAuthenticated && user ? (
                    <TowerChat
                      towerId={selectedTowerId}
                      currentUserId={user.firebaseUid}
                      currentUsername={user.username}
                      isModerator={isModerator}
                      isCurrentTower={currentTower?.towerId === selectedTowerId}
                      postCount={
                        currentTower?.towerId === selectedTowerId
                          ? currentTower.postCount
                          : nearbyTowers.find(t => t.towerId === selectedTowerId)?.postCount || 0
                      }
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center p-8">
                      <div className="text-center max-w-sm">
                        <LogIn className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-2">Sign in to Chat</h3>
                        <p className="text-gray-400 mb-6">
                          You need to be signed in to send messages and chat with others in this tower.
                        </p>
                        <button
                          onClick={() => router.push('/signin')}
                          className="px-6 py-3 bg-gray-900 hover:bg-gray-800 rounded-full font-semibold transition-all hover:ring-2 hover:ring-blue-400 border border-gray-700"
                        >
                          Sign In
                        </button>
                        <p className="text-sm text-gray-500 mt-4">
                          Don't have an account?{' '}
                          <button
                            onClick={() => router.push('/signup')}
                            className="text-blue-400 hover:text-blue-300 underline"
                          >
                            Sign up
                          </button>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-900 rounded-lg h-full flex items-center justify-center p-8">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-400">Select a tower to start chatting</p>
                  {!isAuthenticated && (
                    <p className="text-sm text-gray-500 mt-4">
                      <LogIn className="inline w-4 h-4 mr-1" />
                      Sign in required to chat
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          </div>
        )}
      </div>

      {/* Post Creation Modal */}
      <PostCreationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userLocation={userLocation ? { latitude: userLocation.latitude, longitude: userLocation.longitude } : null}
        onSubmit={handlePostSubmit}
      />

      <Footer />
    </div>
  );
}
