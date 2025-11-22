'use client';

import { memo } from 'react';
import { Post } from '@/services/postService';
import { MapPin, Heart, MessageCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface PostCardProps {
  post: Post;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
}

function PostCard({ post, onLike, onComment }: PostCardProps) {
  const formatDistance = (meters: number | undefined) => {
    if (!meters) return '';
    if (meters < 1000) {
      return `${Math.round(meters)}m away`;
    }
    return `${(meters / 1000).toFixed(1)}km away`;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 shadow-lg hover:shadow-cyan-500/20"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
            {post.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-white">{post.username}</h3>
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              <span>{formatTime(post.createdAt)}</span>
            </div>
          </div>
        </div>
        {post.distance !== undefined && (
          <div className="flex items-center space-x-1 text-cyan-400 text-sm">
            <MapPin className="w-4 h-4" />
            <span>{formatDistance(post.distance)}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <p className="text-gray-200 mb-4 leading-relaxed">{post.content}</p>

      {/* Footer - Actions */}
      <div className="flex items-center space-x-6 pt-4 border-t border-gray-700">
        <button
          onClick={() => onLike?.(post.id)}
          className="flex items-center space-x-2 text-gray-400 hover:text-red-400 transition-colors group"
        >
          <Heart className="w-5 h-5 group-hover:fill-red-400" />
          <span className="text-sm">{post.likes || 0}</span>
        </button>
        <button
          onClick={() => onComment?.(post.id)}
          className="flex items-center space-x-2 text-gray-400 hover:text-cyan-400 transition-colors group"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm">{post.commentCount || 0}</span>
        </button>
      </div>
    </motion.div>
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(PostCard, (prevProps, nextProps) => {
  return (
    prevProps.post.id === nextProps.post.id &&
    prevProps.post.likes === nextProps.post.likes &&
    prevProps.post.commentCount === nextProps.post.commentCount
  );
});
