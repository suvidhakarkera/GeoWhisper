'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, MessageCircle, Users, Loader2, Navigation, AlertCircle, LogIn, Send } from 'lucide-react';
import { locationService, UserLocation, NearbyTower } from '@/services/locationService';
import TowerChat from '@/components/TowerChat';
import { useUser } from '@/contexts/UserContext';
import Navbar from '@/components/Navbar';
import PostCreationModal, { PostData } from '@/components/PostCreationModal';
import { postService } from '@/src/services/postService';

export default function NearbyPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useUser();
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Getting your location...');
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [currentTower, setCurrentTower] = useState<NearbyTower | null>(null);
  const [nearbyTowers, setNearbyTowers] = useState<NearbyTower[]>([]);
  const [selectedTowerId, setSelectedTowerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

      // Find tower user is currently in (within 50m)
      const currentUserTower = towersWithDistance.find(t => t.distance <= 50) || null;
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
        hasImage: !!postData.image
      });
      
      const images = postData.image ? [postData.image] : undefined;
      
      const result = await postService.createPost({
        content: postData.content,
        latitude: postData.location.latitude,
        longitude: postData.location.longitude,
      }, images);
      
      console.log('Post created successfully:', result);
      
      // Refresh the nearby towers after creating a post
      await initLocation();
      
      alert('Post created successfully!');
    } catch (error: any) {
      console.error('Error creating post:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      alert(error.message || 'Failed to create post. Please try again.');
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-lg">{loadingMessage}</p>
          <p className="text-gray-600 text-sm mt-2">This may take a few seconds...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-900 rounded-lg p-6 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Location Error</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={initLocation}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 p-4 pt-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Nearby Towers</h1>
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
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tower List */}
          <div>
            {/* Current Tower */}
            {currentTower ? (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  You are in a tower!
                </h2>
                <div
                  onClick={() => setSelectedTowerId(currentTower.towerId)}
                  className={`bg-gradient-to-br from-green-900/50 to-gray-900 border-2 border-green-600 rounded-lg p-4 cursor-pointer hover:from-green-800/50 transition-all ${
                    selectedTowerId === currentTower.towerId ? 'ring-2 ring-green-400' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-lg">Tower {currentTower.towerId}</h3>
                      <p className="text-sm text-gray-400">
                        <Users className="inline w-4 h-4 mr-1" />
                        {currentTower.postCount} posts
                      </p>
                    </div>
                    <span className="text-xs bg-green-600 px-2 py-1 rounded">
                      {formatDistance(currentTower.distance)}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isAuthenticated) {
                        router.push('/signin');
                        return;
                      }
                      setSelectedTowerId(currentTower.towerId);
                    }}
                    className="w-full mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    {isAuthenticated ? (
                      <>
                        <MessageCircle className="w-4 h-4" />
                        Chat in this tower
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        Sign in to chat
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-6 bg-gray-900 border border-gray-800 rounded-lg p-4">
                <p className="text-gray-400 text-center">
                  <MapPin className="inline w-5 h-5 mr-2" />
                  You're not in any tower (no posts within 50m)
                </p>
                <p className="text-sm text-gray-500 text-center mt-2">
                  Create a post to start a new tower here!
                </p>
              </div>
            )}

            {/* Nearby Towers */}
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Nearby Towers ({nearbyTowers.length})
            </h2>

            {nearbyTowers.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center">
                <p className="text-gray-400">No towers nearby</p>
                <p className="text-sm text-gray-500 mt-2">
                  Be the first to post in this area!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {nearbyTowers.map((tower) => (
                  <div
                    key={tower.towerId}
                    onClick={() => setSelectedTowerId(tower.towerId)}
                    className={`bg-gray-900 border border-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-800 transition-colors ${
                      selectedTowerId === tower.towerId ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">Tower {tower.towerId}</h3>
                        <p className="text-sm text-gray-400 mt-1">
                          <Users className="inline w-4 h-4 mr-1" />
                          {tower.postCount} posts
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs bg-gray-700 px-2 py-1 rounded block mb-2">
                          {formatDistance(tower.distance)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isAuthenticated) {
                              router.push('/signin');
                              return;
                            }
                            setSelectedTowerId(tower.towerId);
                          }}
                          className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                        >
                          {isAuthenticated ? (
                            <>
                              <MessageCircle className="w-4 h-4" />
                              Chat
                            </>
                          ) : (
                            <>
                              <LogIn className="w-4 h-4" />
                              Sign in
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 space-y-3">
              <button
                onClick={handleCreateClick}
                disabled={!userLocation}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
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
                className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <MapPin className="w-5 h-5" />
                View Map
              </button>
            </div>
          </div>

          {/* Chat Panel */}
          <div className="lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
            {selectedTowerId ? (
              <div className="bg-gray-900 rounded-lg h-full flex flex-col">
                <div className="p-4 border-b border-gray-800">
                  <h2 className="text-xl font-bold">Tower {selectedTowerId}</h2>
                  <p className="text-sm text-gray-400">Real-time chat</p>
                </div>
                <div className="flex-1 overflow-hidden">
                  {isAuthenticated && user ? (
                    <TowerChat
                      towerId={selectedTowerId}
                      currentUserId={user.firebaseUid}
                      currentUsername={user.username}
                      isModerator={false}
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
                          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
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
      </div>

      {/* Post Creation Modal */}
      <PostCreationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userLocation={userLocation ? { latitude: userLocation.latitude, longitude: userLocation.longitude } : null}
        onSubmit={handlePostSubmit}
      />
    </div>
  );
}
