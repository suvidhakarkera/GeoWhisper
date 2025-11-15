'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Image as ImageIcon, User, Calendar } from 'lucide-react';
import { ref, onValue, off } from 'firebase/database';
import { database } from '@/config/firebase';
import { ChatMessage } from '@/services/chatService';

interface TowerImagesModalProps {
  towerId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface MessageWithImage extends ChatMessage {
  image: string; // Make image required for this interface
}

export default function TowerImagesModal({ towerId, isOpen, onClose }: TowerImagesModalProps) {
  const [messages, setMessages] = useState<MessageWithImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ url: string; message: MessageWithImage } | null>(null);

  useEffect(() => {
    if (!isOpen || !towerId || !database) return;

    console.log('🎯 Fetching chat images for tower:', towerId);
    setLoading(true);
    setError(null);

    const messagesRef = ref(database, `chats/${towerId}/messages`);

    const unsubscribe = onValue(
      messagesRef,
      (snapshot) => {
        const messagesWithImages: MessageWithImage[] = [];

        snapshot.forEach((childSnapshot) => {
          const msg = childSnapshot.val();
          
          // Only include messages that have images
          if (msg.image) {
            messagesWithImages.push({
              id: childSnapshot.key!,
              messageId: childSnapshot.key!,
              userId: msg.userId,
              username: msg.username,
              message: msg.message,
              timestamp: msg.timestamp,
              createdAt: msg.createdAt,
              image: msg.image,
              isPost: msg.isPost,
              postId: msg.postId,
            });
          }
        });

        // Sort by timestamp (newest first)
        messagesWithImages.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        
        console.log('📦 Found messages with images:', messagesWithImages.length);
        setMessages(messagesWithImages);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('❌ Error fetching chat images:', err);
        setError('Failed to load images from chat');
        setLoading(false);
      }
    );

    // Cleanup listener when modal closes
    return () => {
      off(messagesRef);
      unsubscribe();
    };
  }, [isOpen, towerId]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown date';
    
    let date: Date;
    if (typeof timestamp === 'number') {
      // Firebase Realtime Database timestamp (milliseconds)
      date = new Date(timestamp);
    } else if (timestamp.seconds) {
      // Firestore timestamp
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
      hour: '2-digit',
      minute: '2-digit',
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
            <div className="text-center py-12 px-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
                <ImageIcon className="w-8 h-8 text-red-500 dark:text-red-400" />
              </div>
              <p className="text-red-600 dark:text-red-400 font-medium mb-2">Unable to load images</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">{error}</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                No images have been shared in this chat yet.
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Share an image in the chat to see it appear here!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className="group relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-all"
                  onClick={() => setSelectedImage({ url: msg.image, message: msg })}
                >
                  <img
                    src={msg.image}
                    alt={`Image by ${msg.username}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Overlay with message info */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                      <div className="flex items-center gap-2 text-sm mb-1">
                        <User className="w-4 h-4" />
                        <span className="font-medium">{msg.username}</span>
                      </div>
                      {msg.message && (
                        <p className="text-xs line-clamp-2 mb-1">{msg.message}</p>
                      )}
                      <div className="flex items-center gap-1 text-xs opacity-90">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(msg.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with count */}
        {!loading && !error && messages.length > 0 && (
          <div className="p-4 border-t dark:border-gray-700 text-center text-sm text-gray-600 dark:text-gray-400">
            {messages.length} image{messages.length !== 1 ? 's' : ''} shared in chat
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
              alt={`Image by ${selectedImage.message.username}`}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white max-w-2xl">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-5 h-5" />
                <span className="font-medium">{selectedImage.message.username}</span>
                <span className="text-sm opacity-75">•</span>
                <span className="text-sm opacity-75">{formatDate(selectedImage.message.timestamp)}</span>
              </div>
              {selectedImage.message.message && (
                <p className="text-sm">{selectedImage.message.message}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
