'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, MapPin, AlertCircle } from 'lucide-react';
import { postService } from '@/src/services/postService';
import { useGeolocation } from '@/src/hooks/useGeolocation';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onPostCreated?: () => void;
  initialLocation?: { latitude: number; longitude: number } | null;
}

export default function CreatePostModal({
  isOpen,
  onClose,
  onSuccess,
  onPostCreated,
  initialLocation
}: CreatePostModalProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState(initialLocation);

  const {
    location: geoLocation,
    error: geoError,
    permissionState,
    isLoading: isLoadingLocation,
    requestLocation
  } = useGeolocation();

  // Update location when geolocation changes
  useEffect(() => {
    if (geoLocation) {
      setLocation(geoLocation);
    }
  }, [geoLocation]);

  // Use initial location if provided
  useEffect(() => {
    if (initialLocation) {
      setLocation(initialLocation);
    }
  }, [initialLocation]);

  // Auto-request location when modal opens
  useEffect(() => {
    if (isOpen && !location && permissionState === 'granted') {
      requestLocation();
    }
  }, [isOpen, location, permissionState, requestLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!content.trim()) {
      setError('Please enter some content for your post');
      return;
    }

    if (content.trim().length > 500) {
      setError('Post content must be 500 characters or less');
      return;
    }

    if (!location) {
      setError('Location is required to create a post');
      return;
    }

    setIsSubmitting(true);

    try {
      await postService.createPost({
        content: content.trim(),
        latitude: location.latitude,
        longitude: location.longitude
      });

      // Success!
      setContent('');
      setError(null);
      
      if (onSuccess) {
        onSuccess();
      }
      
      if (onPostCreated) {
        onPostCreated();
      }
      
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setContent('');
      setError(null);
      onClose();
    }
  };

  const characterCount = content.length;
  const isOverLimit = characterCount > 500;
  const characterPercentage = (characterCount / 500) * 100;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Create Post
                </h2>
                <button
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Error Alert */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start space-x-3"
                  >
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-red-400 text-sm flex-1">{error}</p>
                  </motion.div>
                )}

                {/* Location Status */}
                <div className="p-4 bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <MapPin className={`w-5 h-5 ${location ? 'text-cyan-400' : 'text-gray-500'}`} />
                    <div className="flex-1">
                      {isLoadingLocation ? (
                        <div className="flex items-center space-x-2">
                          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                          <span className="text-gray-400 text-sm">Getting your location...</span>
                        </div>
                      ) : location ? (
                        <div>
                          <p className="text-sm text-gray-300 font-medium">Location captured</p>
                          <p className="text-xs text-gray-500 font-mono">
                            {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                          </p>
                        </div>
                      ) : permissionState === 'denied' ? (
                        <div>
                          <p className="text-sm text-red-400 font-medium">Location access denied</p>
                          <button
                            type="button"
                            onClick={requestLocation}
                            className="text-xs text-cyan-400 hover:text-cyan-300 mt-1"
                          >
                            Request again
                          </button>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm text-gray-400">Location not available</p>
                          <button
                            type="button"
                            onClick={requestLocation}
                            className="text-xs text-cyan-400 hover:text-cyan-300 mt-1"
                          >
                            Enable location
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Text Area */}
                <div className="space-y-2">
                  <label htmlFor="post-content" className="block text-sm font-medium text-gray-300">
                    What's happening around you?
                  </label>
                  <textarea
                    id="post-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Share something interesting happening in your area..."
                    disabled={isSubmitting || !location}
                    className={`w-full px-4 py-3 bg-gray-800 border ${
                      isOverLimit ? 'border-red-500' : 'border-gray-600'
                    } rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${
                      isOverLimit ? 'focus:ring-red-500' : 'focus:ring-cyan-500'
                    } focus:border-transparent transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed`}
                    rows={6}
                    maxLength={550}
                    required
                  />

                  {/* Character Counter */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(characterPercentage, 100)}%` }}
                          className={`h-full ${
                            isOverLimit
                              ? 'bg-red-500'
                              : characterPercentage > 80
                              ? 'bg-yellow-500'
                              : 'bg-cyan-500'
                          }`}
                        />
                      </div>
                    </div>
                    <span
                      className={`ml-3 text-sm font-medium ${
                        isOverLimit
                          ? 'text-red-400'
                          : characterPercentage > 80
                          ? 'text-yellow-400'
                          : 'text-gray-400'
                      }`}
                    >
                      {characterCount}/500
                    </span>
                  </div>

                  {/* Helper Text */}
                  <p className="text-xs text-gray-500">
                    Your post will be visible to people within a 5km radius
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !location || !content.trim() || isOverLimit}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/20"
                >
                  {isSubmitting ? (
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
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
