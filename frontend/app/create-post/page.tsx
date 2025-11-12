'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { postService } from '@/src/services/postService';
import { locationService, UserLocation } from '@/services/locationService';
import { MapPin, Send, Loader2, AlertCircle, Navigation, CheckCircle } from 'lucide-react';
import { getTowerLabel } from '@/src/utils/towerNumber';

export default function CreatePostPage() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);
  const [error, setError] = useState('');
  const [isInTower, setIsInTower] = useState(false);
  const [towerInfo, setTowerInfo] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication
    const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!authToken) {
      router.push('/signin');
      return;
    }

    // Get user's current location
    setLocationLoading(true);
    locationService
      .getCurrentLocation()
      .then(async (loc) => {
        setLocation(loc);
        
        // Check if user is in a tower
        const tower = await locationService.findUserTower(loc);
        if (tower) {
          setIsInTower(true);
          setTowerInfo(`${getTowerLabel(tower.towerId)} (${Math.round(tower.distance)}m away, ${tower.postCount} posts)`);
        } else {
          setIsInTower(false);
          setTowerInfo('Your post will create a new tower here!');
        }
        
        setLocationLoading(false);
      })
      .catch((err) => {
        setError('Unable to get your location. Please enable location services.');
        setLocationLoading(false);
      });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!location) {
      setError('Location not available. Please enable location services.');
      return;
    }

    if (content.trim().length === 0) {
      setError('Please enter some content for your post.');
      return;
    }

    setLoading(true);

    try {
      await postService.createPost({
        content: content.trim(),
        latitude: location.latitude,
        longitude: location.longitude,
      });

      // Success - redirect to feed
      router.push('/feed');
    } catch (err: any) {
      setError(err.message || 'Failed to create post. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="min-h-screen px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mx-auto w-full max-w-2xl"
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
              Create a Post
            </h1>
            <p className="text-gray-400">
              Share what's happening around you with the community
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start space-x-3"
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </motion.div>
          )}

          {/* Location Status */}
          <div className="mb-6 space-y-3">
            <div className="p-4 bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl">
              <div className="flex items-center space-x-3">
                <Navigation className={`w-5 h-5 ${location ? 'text-cyan-400' : 'text-gray-500'}`} />
                <div className="flex-1">
                  {locationLoading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                      <span className="text-gray-400 text-sm">Getting your location...</span>
                    </div>
                  ) : location ? (
                    <div>
                      <p className="text-sm font-medium text-gray-300 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        Location captured
                      </p>
                      <p className="text-xs text-gray-500 font-mono mt-1">
                        {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                        {location.accuracy && ` (±${Math.round(location.accuracy)}m)`}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-red-400">Location unavailable</p>
                  )}
                </div>
              </div>
            </div>

            {/* Tower Status */}
            {!locationLoading && towerInfo && (
              <div className={`p-4 rounded-xl border ${
                isInTower 
                  ? 'bg-green-900/20 border-green-700/50' 
                  : 'bg-blue-900/20 border-blue-700/50'
              }`}>
                <div className="flex items-center space-x-3">
                  <MapPin className={`w-5 h-5 ${isInTower ? 'text-green-400' : 'text-blue-400'}`} />
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${isInTower ? 'text-green-400' : 'text-blue-400'}`}>
                      {isInTower ? 'Posting to existing tower' : 'Creating new tower'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{towerInfo}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Post Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-2">
                What's on your mind?
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-3 bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all resize-none"
                rows={6}
                maxLength={500}
                placeholder="Share something interesting happening around you..."
                disabled={loading || !location}
                required
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500">
                  Your post will be visible to people in your area
                </p>
                <p className="text-sm text-gray-400">
                  {content.length}/500
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !location || content.trim().length === 0}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Post to GeoWhisper</span>
                </>
              )}
            </button>
          </form>

          {/* Tips */}
          <div className="mt-8 p-6 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl">
            <h3 className="font-semibold text-cyan-400 mb-3">Tips for great posts:</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start space-x-2">
                <span className="text-cyan-400 mt-1">•</span>
                <span>Be respectful and authentic</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-cyan-400 mt-1">•</span>
                <span>Share interesting local insights or events</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-cyan-400 mt-1">•</span>
                <span>Your exact location remains private</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-cyan-400 mt-1">•</span>
                <span>Posts are visible to people within a 5km radius</span>
              </li>
            </ul>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
