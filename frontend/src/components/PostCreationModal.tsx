'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Loader2, Image as ImageIcon, Send, Camera } from 'lucide-react';

interface PostCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLocation: { latitude: number; longitude: number } | null;
  onSubmit: (post: PostData) => void;
}

export interface PostData {
  content: string;
  location: {
    latitude: number;
    longitude: number;
  };
  image?: File;
  timestamp: number;
}

export default function PostCreationModal({
  isOpen,
  onClose,
  userLocation,
  onSubmit
}: PostCreationModalProps) {
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const maxChars = 500;

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setContent('');
      setImage(null);
      setImagePreview(null);
      setError(null);
    }
  }, [isOpen]);

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    console.log('Image selected:', {
      hasFile: !!file,
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size,
      inputType: e.target.accept,
      isCamera: e.target === cameraInputRef.current
    });
    
    if (!file) {
      console.warn('No file selected');
      return;
    }

    // Validate file type - be more lenient with camera captures
    // Some mobile cameras may not set the correct MIME type immediately
    if (file.type && !file.type.startsWith('image/')) {
      const error = `Invalid file type: ${file.type}. Please select an image.`;
      console.error(error);
      setError(error);
      return;
    }

    // If type is empty (some cameras), check file extension
    if (!file.type || file.type === '') {
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!validExtensions.includes(fileExtension)) {
        const error = `Unsupported file format: ${fileExtension}`;
        console.error(error);
        setError(error);
        return;
      }
      
      console.log('File type empty, but extension valid:', fileExtension);
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      const error = `Image too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Max size is 5MB.`;
      console.error(error);
      setError(error);
      return;
    }

    console.log('Image validation passed, setting image');
    setImage(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      console.log('Image preview created');
      setImagePreview(reader.result as string);
    };
    reader.onerror = () => {
      console.error('Failed to read image file');
      setError('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  // Remove image
  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submitted:', {
      hasContent: !!content.trim(),
      hasLocation: !!userLocation,
      hasImage: !!image,
      imageDetails: image ? {
        name: image.name,
        type: image.type,
        size: image.size
      } : null
    });
    
    if (!content.trim()) {
      setError('Please enter some content');
      return;
    }

    if (!userLocation) {
      setError('Location not available. Please enable location access.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const postData: PostData = {
        content: content.trim(),
        location: userLocation,
        timestamp: Date.now()
      };

      if (image) {
        console.log('Attaching image to post:', {
          name: image.name,
          type: image.type,
          size: image.size
        });
        postData.image = image;
      }

      console.log('Calling onSubmit with postData');
      await onSubmit(postData);
      console.log('Post submitted successfully');
      onClose();
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to create post. Please try again.';
      console.error('Post creation error:', {
        error: err,
        message: errorMessage,
        stack: err?.stack
      });
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden z-[100000]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <h2 className="text-2xl font-bold text-white">Create Post</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Location Info */}
            {userLocation && (
              <div className="flex items-center gap-2 px-3 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                <MapPin className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span className="text-sm text-gray-300">
                  Location captured: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                </span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Content Textarea */}
            <div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's happening in your area?"
                maxLength={maxChars}
                disabled={isSubmitting}
                className="w-full h-32 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors resize-none"
              />
              <div className="flex justify-end mt-1">
                <span className={`text-sm ${content.length > maxChars * 0.9 ? 'text-red-400' : 'text-gray-500'}`}>
                  {content.length} / {maxChars}
                </span>
              </div>
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg border border-gray-700"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={isSubmitting}
                  className="absolute top-2 right-2 p-2 bg-black/80 hover:bg-black rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-2">
                {/* Hidden file inputs */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={isSubmitting || !!image}
                  className="hidden"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageChange}
                  disabled={isSubmitting || !!image}
                  className="hidden"
                />

                {/* Camera Button - Mobile Only */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isSubmitting || !!image}
                  className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed md:hidden"
                  title="Take photo"
                >
                  <Camera className="w-5 h-5 text-gray-400" />
                </button>

                {/* Gallery Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting || !!image}
                  className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Choose from gallery"
                >
                  <ImageIcon className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !content.trim() || !userLocation}
                className="flex items-center gap-2 px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-semibold transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Posting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Post</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
