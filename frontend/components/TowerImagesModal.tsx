'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Image as ImageIcon, User, Calendar } from 'lucide-react';
import { postService, TowerPost } from '@/services/postService';

interface TowerImagesModalProps {
  towerId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function TowerImagesModal({ towerId, isOpen, onClose }: TowerImagesModalProps) {
  const [posts, setPosts] = useState<TowerPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ url: string; post: TowerPost } | null>(null);

  useEffect(() => {
    if (isOpen && towerId) {
      fetchTowerImages();
    }
  }, [isOpen, towerId]);

  const fetchTowerImages = async () => {
    setLoading(true);
    setError(null);
    try {
      const postsWithImages = await postService.getTowerImages(towerId);
      setPosts(postsWithImages);
    } catch (err: any) {
      setError(err.message || 'Failed to load images');
      console.error('Error fetching tower images:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown date';
    
    let date: Date;
    if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Tower Gallery
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500 dark:text-red-400">{error}</p>
              <button
                onClick={fetchTowerImages}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No images have been posted in this tower yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map((post) => (
                post.images && post.images.map((imageUrl, index) => (
                  <div
                    key={`${post.id}-${index}`}
                    className="group relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-all"
                    onClick={() => setSelectedImage({ url: imageUrl, post })}
                  >
                    <img
                      src={imageUrl}
                      alt={`Post by ${post.username}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Overlay with post info */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                        <div className="flex items-center gap-2 text-sm mb-1">
                          <User className="w-4 h-4" />
                          <span className="font-medium">{post.username}</span>
                        </div>
                        {post.content && (
                          <p className="text-xs line-clamp-2 mb-1">{post.content}</p>
                        )}
                        <div className="flex items-center gap-1 text-xs opacity-90">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(post.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ))}
            </div>
          )}
        </div>

        {/* Footer with count */}
        {!loading && !error && posts.length > 0 && (
          <div className="p-4 border-t dark:border-gray-700 text-center text-sm text-gray-600 dark:text-gray-400">
            {posts.reduce((total, post) => total + (post.images?.length || 0), 0)} images from {posts.length} posts
          </div>
        )}
      </div>

      {/* Full-size image viewer */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[60] bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <div className="max-w-5xl max-h-[90vh] flex flex-col items-center">
            <img
              src={selectedImage.url}
              alt={`Post by ${selectedImage.post.username}`}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white max-w-2xl">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-5 h-5" />
                <span className="font-medium">{selectedImage.post.username}</span>
                <span className="text-sm opacity-75">•</span>
                <span className="text-sm opacity-75">{formatDate(selectedImage.post.createdAt)}</span>
              </div>
              {selectedImage.post.content && (
                <p className="text-sm">{selectedImage.post.content}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
